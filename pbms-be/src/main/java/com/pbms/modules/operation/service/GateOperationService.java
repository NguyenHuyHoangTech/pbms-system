package com.pbms.modules.operation.service;

import com.pbms.modules.finance.service.PricingCalculatorService;
import com.pbms.modules.infrastructure.domain.Gate;
import com.pbms.modules.infrastructure.domain.RfidCard;
import com.pbms.modules.infrastructure.repository.GateRepository;
import com.pbms.modules.infrastructure.repository.RfidCardRepository;
import com.pbms.modules.operation.domain.*;
import com.pbms.modules.operation.dto.CheckInRequestDTO;
import com.pbms.modules.operation.dto.CheckOutRequestDTO;
import com.pbms.modules.operation.dto.GateResponseDTO;
import com.pbms.modules.operation.repository.MonthlyTicketRepository;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import com.pbms.modules.operation.repository.ReservationRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import com.pbms.modules.operation.repository.VehicleRepository;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.domain.Slot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GateOperationService {

    private final ParkingSessionRepository sessionRepository;
    private final VehicleRepository vehicleRepository;
    private final ZoneRoutingService zoneRoutingService;
    private final RfidCardRepository rfidCardRepository;
    private final GateRepository gateRepository;
    private final MonthlyTicketRepository monthlyTicketRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final PricingCalculatorService pricingCalculatorService;
    private final ReservationRepository reservationRepository;
    private final ZoneRepository zoneRepository;
    private final SlotRepository slotRepository;
    private final SimpMessagingTemplate messagingTemplate;

    //UC-401: Xử lý xe vào bãi. Nếu xe có booking hợp lệ thì chuyển booking sang IN_PARKING và giữ đúng slot đã đặt.
    @Transactional
    public GateResponseDTO processCheckIn(CheckInRequestDTO request) {
        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new IllegalArgumentException("Gate not found"));

        // Notify Staff UI immediately that a scan occurred
        messagingTemplate.convertAndSend("/topic/gates/" + gate.getId() + "/scans", request);


        if (!"IN".equals(gate.getGateType()) && !"IN_OUT".equals(gate.getGateType())) {
            return GateResponseDTO.builder()
                    .status("ERROR")
                    .message("Invalid gate type for check-in")
                    .build();
        }

        RfidCard card = rfidCardRepository.findByCardCode(request.getRfid())
                .orElseThrow(() -> new IllegalArgumentException("Invalid RFID card"));

        if (!"AVAILABLE".equals(card.getStatus())) {
            return GateResponseDTO.builder()
                    .status("ERROR")
                    .message("Card is not available (Status: " + card.getStatus() + ")")
                    .build();
        }

        String normalizedPlate = normalizePlate(request.getPlateNumber());
        if (sessionRepository.findByPlateAndStatus(normalizedPlate, "ACTIVE").isPresent()) {
            throw new IllegalStateException("Vehicle already has an active parking session");
        }

        VehicleType type = vehicleTypeRepository.findByTypeName(request.getVehicleType())
                .orElseThrow(() -> new IllegalArgumentException("Invalid vehicle type"));

        // Check Blacklist
        vehicleRepository.findByPlateNumber(normalizedPlate).ifPresent(v -> {
            if (Boolean.TRUE.equals(v.getIsBlacklisted())) {
                throw new IllegalStateException("Vehicle is blacklisted: " + v.getBlacklistReason());
            }
        });

        LocalDateTime now = com.pbms.common.utils.TimeProvider.now();
        Reservation matchedReservation = reservationRepository
                .findForCheckIn(normalizedPlate, ReservationStatus.PAID)
                .stream()
                .filter(reservation -> !now.isBefore(reservation.getExpectedEntryTime())
                        && !now.isAfter(reservation.getExpectedEntryTime()
                                .plusMinutes(reservation.getExpectedDurationMinutes())))
                .findFirst()
                .orElse(null);

        Slot reservedSlot = null;
        if (matchedReservation != null) {
            if (!matchedReservation.getVehicle().getVehicleType().getId().equals(type.getId())) {
                throw new IllegalStateException("Vehicle type does not match the paid reservation");
            }
            reservedSlot = slotRepository.findByIdForUpdate(matchedReservation.getSlot().getId())
                    .orElseThrow(() -> new IllegalStateException("Reserved slot not found"));
            if ("DISABLED".equals(reservedSlot.getStatus())
                    || "MAINTENANCE".equals(reservedSlot.getStatus())) {
                throw new IllegalStateException("Reserved slot is unavailable");
            }
            if ("OCCUPIED".equals(reservedSlot.getStatus())
                    && !normalizedPlate.equalsIgnoreCase(reservedSlot.getCurrentPlate())) {
                throw new IllegalStateException("Reserved slot is physically occupied; staff relocation is required");
            }
        }

        // Create Session
        ParkingSession session = ParkingSession.builder()
                .gateIn(gate)
                .plate(normalizedPlate)
                .vehicleType(type)
                .rfidCard(card)
                .reservation(matchedReservation)
                .slot(reservedSlot)
                .timeIn(now)
                .picInFace(request.getImageBase64())
                .status("ACTIVE")
                .build();

        // Mark card as IN_USE
        card.setStatus("IN_USE");
        card.setAssignedPlate(normalizedPlate);
        rfidCardRepository.save(card);

        session = sessionRepository.save(session);
        
        // Find suggested zone
        Zone suggestedZone;
        if (matchedReservation != null) {
            matchedReservation.setStatus(ReservationStatus.IN_PARKING);
            matchedReservation.setIsOverstaying(false);
            reservationRepository.save(matchedReservation);
            reservedSlot.setStatus("OCCUPIED");
            reservedSlot.setCurrentPlate(normalizedPlate);
            slotRepository.save(reservedSlot);
            suggestedZone = reservedSlot.getZone();
        } else {
            suggestedZone = zoneRoutingService.suggestZone(type);
        }

        GateResponseDTO response = GateResponseDTO.builder()
                .sessionId(session.getId())
                .plateNumber(session.getPlate())
                .status("SUCCESS")
                .message("Check-in successful")
                .suggestedZoneId(suggestedZone != null ? suggestedZone.getId() : null)
                .suggestedZoneName(suggestedZone != null ? suggestedZone.getZoneName() : null)
                .build();

        return response;
    }

    //UC-401: Xử lý xe ra bãi. Nếu xe đi theo booking thì kết thúc booking và tính phí phát sinh nếu ra quá giờ.
    @Transactional
    public GateResponseDTO processCheckOut(CheckOutRequestDTO request) {
        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new IllegalArgumentException("Gate not found"));

        // Notify Staff UI immediately that a scan occurred
        messagingTemplate.convertAndSend("/topic/gates/" + gate.getId() + "/scans", request);


        if (!"OUT".equals(gate.getGateType()) && !"IN_OUT".equals(gate.getGateType())) {
            return GateResponseDTO.builder()
                    .status("ERROR")
                    .message("Invalid gate type for check-out")
                    .build();
        }

        ParkingSession session = sessionRepository.findByRfidCard_CardCodeAndStatus(request.getRfid(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("No active session found for this card"));

        String normalizedPlate = normalizePlate(request.getPlateNumber());
        if (!session.getPlate().equals(normalizedPlate)) {
            return GateResponseDTO.builder()
                    .sessionId(session.getId())
                    .plateNumber(request.getPlateNumber())
                    .status("WARNING")
                    .message("Plate number mismatch! Expected: " + session.getPlate() + ", Actual: " + request.getPlateNumber())
                    .build();
        }

        session.setGateOut(gate);
        session.setTimeOut(com.pbms.common.utils.TimeProvider.now());
        session.setPlateOut(normalizedPlate);
        session.setPicOutFace(request.getImageBase64());

        // Check Monthly Ticket
        boolean isMonthlyCovered = false;
        MonthlyTicket monthlyTicket = monthlyTicketRepository.findByPlateAndStatus(session.getPlate(), "ACTIVE").orElse(null);
        if (monthlyTicket != null && monthlyTicket.getValidUntil().isAfter(com.pbms.common.utils.TimeProvider.now())) {
            if (monthlyTicket.getVehicleType().getId().equals(session.getVehicleType().getId())) {
                isMonthlyCovered = true;
            }
        }

        BigDecimal fee = BigDecimal.ZERO;
        if (session.getReservation() != null) {
            LocalDateTime reservedEnd = session.getReservation().getExpectedEntryTime()
                    .plusMinutes(session.getReservation().getExpectedDurationMinutes());
            if (session.getTimeOut().isAfter(reservedEnd)) {
                fee = pricingCalculatorService.calculateTotalFee(
                        session.getVehicleType().getId(),
                        reservedEnd,
                        session.getTimeOut()
                );
            }
        } else if (!isMonthlyCovered) {
            fee = pricingCalculatorService.calculateTotalFee(
                    session.getVehicleType().getId(),
                    session.getTimeIn(),
                    session.getTimeOut()
            );
        }

        session.setTotalFee(fee);
        session.setStatus("COMPLETED");

        RfidCard card = session.getRfidCard();
        card.setStatus("AVAILABLE");
        card.setAssignedPlate(null);
        rfidCardRepository.save(card);

        sessionRepository.save(session);

        if (session.getSlot() != null) {
            Slot slot = session.getSlot();
            slot.setStatus("AVAILABLE");
            slot.setCurrentPlate(null);
            slotRepository.save(slot);
        }

        if (session.getReservation() != null) {
            Reservation reservation = session.getReservation();
            reservation.setStatus(ReservationStatus.COMPLETED);
            reservation.setIsOverstaying(false);
            reservationRepository.save(reservation);
        }

        GateResponseDTO response = GateResponseDTO.builder()
                .sessionId(session.getId())
                .plateNumber(session.getPlateOut())
                .status("SUCCESS")
                .message("Check-out successful")
                .checkoutFee(fee)
                .build();

        return response;
    }

    private String normalizePlate(String plate) {
        if (plate == null || plate.isBlank()) {
            throw new IllegalArgumentException("Plate number is required");
        }
        return plate.trim().toUpperCase().replace(" ", "");
    }
}
