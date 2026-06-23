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

        VehicleType type = vehicleTypeRepository.findByTypeName(request.getVehicleType())
                .orElseThrow(() -> new IllegalArgumentException("Invalid vehicle type"));

        // Check Blacklist
        vehicleRepository.findByPlateNumber(request.getPlateNumber()).ifPresent(v -> {
            if (Boolean.TRUE.equals(v.getIsBlacklisted())) {
                throw new IllegalStateException("Vehicle is blacklisted: " + v.getBlacklistReason());
            }
        });

        // Create Session
        ParkingSession session = ParkingSession.builder()
                .gateIn(gate)
                .plate(request.getPlateNumber())
                .vehicleType(type)
                .rfidCard(card)
                .timeIn(com.pbms.common.utils.TimeProvider.now())
                .picInFace(request.getImageBase64())
                .status("ACTIVE")
                .build();

        // Mark card as IN_USE
        card.setStatus("IN_USE");
        card.setAssignedPlate(request.getPlateNumber());
        rfidCardRepository.save(card);

        session = sessionRepository.save(session);
        
        // Find suggested zone
        Zone suggestedZone = null;
        List<Reservation> reservations = reservationRepository.findByVehicle_PlateNumberAndStatus(request.getPlateNumber(), "PENDING");
        if (!reservations.isEmpty()) {
            Reservation res = reservations.get(0);
            res.setStatus("ACTIVE");
            reservationRepository.save(res);
            suggestedZone = res.getZone();
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

        if (!session.getPlate().equals(request.getPlateNumber())) {
            return GateResponseDTO.builder()
                    .sessionId(session.getId())
                    .plateNumber(request.getPlateNumber())
                    .status("WARNING")
                    .message("Plate number mismatch! Expected: " + session.getPlate() + ", Actual: " + request.getPlateNumber())
                    .build();
        }

        session.setGateOut(gate);
        session.setTimeOut(com.pbms.common.utils.TimeProvider.now());
        session.setPlateOut(request.getPlateNumber());
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
        if (!isMonthlyCovered) {
            fee = pricingCalculatorService.calculateTotalFee(session.getVehicleType().getId(), session.getTimeIn(), session.getTimeOut());
        }

        session.setTotalFee(fee);
        session.setStatus("COMPLETED");

        RfidCard card = session.getRfidCard();
        card.setStatus("AVAILABLE");
        card.setAssignedPlate(null);
        rfidCardRepository.save(card);

        sessionRepository.save(session);

        // Complete Reservation if exists
        List<Reservation> activeRes = reservationRepository.findByVehicle_PlateNumberAndStatus(request.getPlateNumber(), "ACTIVE");
        if (!activeRes.isEmpty()) {
            Reservation res = activeRes.get(0);
            res.setStatus("COMPLETED");
            reservationRepository.save(res);
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
}
