package com.pbms.modules.operation.service;

import com.pbms.modules.finance.domain.PricingPolicy;
import com.pbms.modules.finance.repository.PricingPolicyRepository;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.Vehicle;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.dto.CreateReservationRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.repository.ReservationRepository;
import com.pbms.modules.operation.repository.VehicleRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ZoneRepository zoneRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final ZoneRoutingService zoneRoutingService;

    @Transactional(readOnly = true)
    public List<ReservationDTO> getAllReservations() {
        return reservationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BigDecimal previewPrice(Long vehicleTypeId, Integer durationMinutes) {
        PricingPolicy policy = pricingPolicyRepository.findByVehicleTypeIdAndStatus(vehicleTypeId, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("Chưa có bảng giá cho loại xe này"));

        int blocks = (int) Math.ceil((double) durationMinutes / policy.getGlobalBaseMins());
        BigDecimal total = policy.getGlobalBaseFee().multiply(BigDecimal.valueOf(blocks));

        if (total.compareTo(policy.getMaxParkingCap()) > 0) {
            return policy.getMaxParkingCap();
        }
        return total;
    }

    @Transactional
    public ReservationDTO createReservation(CreateReservationRequest request) {
        // 1. Get or Create Vehicle
        Vehicle vehicle = vehicleRepository.findByPlateNumber(request.getPlateNumber())
                .orElseGet(() -> {
                    VehicleType type = vehicleTypeRepository.findById(request.getVehicleTypeId())
                            .orElseThrow(() -> new RuntimeException("Loại xe không hợp lệ"));
                    Vehicle newVehicle = Vehicle.builder()
                            .vehicleType(type)
                            .plateNumber(request.getPlateNumber())
                            .build();
                    return vehicleRepository.save(newVehicle);
                });

        // Check if there's an active or pending reservation for this vehicle
        List<Reservation> existing = reservationRepository.findByVehicle_PlateNumberAndStatus(request.getPlateNumber(), "PENDING");
        if (!existing.isEmpty()) {
            throw new IllegalStateException("Xe của bạn đã có một đặt chỗ đang chờ.");
        }

        // 2. Calculate Price dynamically
        BigDecimal fee = previewPrice(request.getVehicleTypeId(), request.getExpectedDurationMinutes());

        // 3. Find Zone and Check Capacity
        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new RuntimeException("Khu vực không tồn tại"));
                
        BigDecimal occupancy = zoneRoutingService.calculateZoneOccupancy(zone.getId());
        if (occupancy.compareTo(BigDecimal.valueOf(100)) >= 0) {
            throw new IllegalStateException("Khu vực này hiện đã được đặt kín chỗ.");
        }

        // 4. Create Reservation
        Reservation reservation = Reservation.builder()
                .vehicle(vehicle)
                .zone(zone)
                .expectedEntryTime(request.getExpectedEntryTime())
                .expectedDurationMinutes(request.getExpectedDurationMinutes())
                .status("PENDING") // PENDING means paid but hasn't entered
                .reservationFee(fee)
                .qrCode("QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();
        
        if (reservation.getCreatedAt() == null) {
            reservation.setCreatedAt(com.pbms.common.utils.TimeProvider.now());
        }

        reservation = reservationRepository.save(reservation);

        return mapToDTO(reservation);
    }

    // Cronjob running every 1 minute to check for NO-SHOW reservations
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void handleNoShowReservations() {
        List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING");
        LocalDateTime now = com.pbms.common.utils.TimeProvider.now();

        for (Reservation res : pendingReservations) {
            LocalDateTime expireTime = res.getExpectedEntryTime().plusMinutes(res.getExpectedDurationMinutes());
            if (now.isAfter(expireTime)) {
                log.info("Reservation {} marked as COMPLETED_UNUSED (No-show, expired at {})", res.getId(), expireTime);
                res.setStatus("COMPLETED_UNUSED");
                reservationRepository.save(res);
            }
        }
    }

    private ReservationDTO mapToDTO(Reservation reservation) {
        return ReservationDTO.builder()
                .id(reservation.getId())
                .plateNumber(reservation.getVehicle().getPlateNumber())
                .vehicleType(reservation.getVehicle().getVehicleType().getTypeName())
                .zoneName(reservation.getZone() != null ? reservation.getZone().getZoneName() : "N/A")
                .slotName("N/A") // Slots are assigned dynamically by IoT
                .expectedEntryTime(reservation.getExpectedEntryTime())
                .expectedDurationMinutes(reservation.getExpectedDurationMinutes())
                .status(reservation.getStatus())
                .reservationFee(reservation.getReservationFee())
                .qrCode(reservation.getQrCode())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
