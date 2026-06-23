package com.pbms.modules.operation.service;

import com.pbms.common.exception.BusinessException;
import com.pbms.common.utils.TimeProvider;
import com.pbms.modules.finance.service.PricingCalculatorService;
import com.pbms.modules.operation.domain.ParkingSession;
import com.pbms.modules.operation.dto.LiveParkingSessionDTO;
import com.pbms.modules.operation.dto.PenaltyDetailDTO;
import com.pbms.modules.operation.dto.SessionBillingDTO;
import com.pbms.modules.operation.dto.SessionLocationDTO;
import com.pbms.modules.operation.dto.SessionTrackingDTO;
import com.pbms.modules.operation.dto.WalkInLookupRequest;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
//Tra cứu phiên xe và tính phí real-time.
public class ParkingSessionTrackingService {

    private final ParkingSessionRepository parkingSessionRepository;
    private final PricingCalculatorService pricingCalculatorService;

    //Tra cứu xe vãng lai bằng biển số và RFID.
    @Transactional(readOnly = true)
    public LiveParkingSessionDTO lookupWalkIn(WalkInLookupRequest request) {
        ParkingSession session = parkingSessionRepository
                .findByPlateIgnoreCaseAndRfidCard_CardCodeAndStatusAndReservationIsNull(
                        normalizePlate(request.getPlateNumber()),
                        request.getRfidCardCode().trim(),
                        "ACTIVE"
                )
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,
                        "No active parking session matches the plate number and RFID card"));
        return toLiveDTO(session, TimeProvider.now());
    }

    //Lấy các phiên booking đang hoạt động của user.
    @Transactional(readOnly = true)
    public List<LiveParkingSessionDTO> getMyActiveBookingSessions(String email) {
        LocalDateTime now = TimeProvider.now();
        return parkingSessionRepository
                .findByReservation_Vehicle_User_EmailAndStatusOrderByTimeInDesc(email, "ACTIVE")
                .stream()
                .map(session -> toLiveDTO(session, now))
                .toList();
    }

    //Chuyển session thành DTO trả về Frontend.
    private LiveParkingSessionDTO toLiveDTO(ParkingSession session, LocalDateTime now) {
        BigDecimal parkingFee = calculateLiveParkingFee(session, now);
        BigDecimal penaltyFee = session.getPenaltyFee() == null
                ? BigDecimal.ZERO : session.getPenaltyFee();
        List<PenaltyDetailDTO> penalties = penaltyFee.signum() == 0
                ? List.of()
                : List.of(PenaltyDetailDTO.builder()
                        .violationType("ACCUMULATED_PENALTY")
                        .feeAmount(penaltyFee)
                        .description("Accumulated parking violation penalties")
                        .build());

        return LiveParkingSessionDTO.builder()
                .sessionId(session.getId())
                .status(session.getStatus())
                .sessionType(session.getReservation() == null ? "WALK_IN" : "PRE_BOOKING")
                .plateNumber(session.getPlate())
                .vehicleType(session.getVehicleType() == null
                        ? null : session.getVehicleType().getTypeName())
                .rfidCardCode(session.getRfidCard() == null
                        ? null : session.getRfidCard().getCardCode())
                .location(toLocation(session))
                .tracking(SessionTrackingDTO.builder()
                        .checkInTime(session.getTimeIn())
                        .lastCalculatedTime(now)
                        .durationMinutes(Math.max(0, Duration.between(session.getTimeIn(), now).toMinutes()))
                        .build())
                .billingSummary(SessionBillingDTO.builder()
                        .accumulatedParkingFee(parkingFee)
                        .totalPenaltyFee(penaltyFee)
                        .totalEstimatedFee(parkingFee.add(penaltyFee))
                        .currency("VND")
                        .penaltyDetails(penalties)
                        .build())
                .build();
    }

    //Tính phí gửi xe tạm thời theo thời gian thực.
    private BigDecimal calculateLiveParkingFee(ParkingSession session, LocalDateTime now) {
        LocalDateTime chargeFrom = session.getTimeIn();
        if (session.getReservation() != null) {
            chargeFrom = session.getReservation().getExpectedEntryTime()
                    .plusMinutes(session.getReservation().getExpectedDurationMinutes());
            if (!now.isAfter(chargeFrom)) {
                return BigDecimal.ZERO;
            }
        }
        return pricingCalculatorService.calculateTotalFee(
                session.getVehicleType().getId(),
                chargeFrom,
                now
        );
    }

    //Lấy thông tin tầng, zone và slot.
    private SessionLocationDTO toLocation(ParkingSession session) {
        if (session.getSlot() == null) {
            return SessionLocationDTO.builder().build();
        }
        return SessionLocationDTO.builder()
                .floor(session.getSlot().getZone().getFloor().getFloorName())
                .zoneName(session.getSlot().getZone().getZoneName())
                .allocatedSlot(session.getSlot().getSlotName())
                .build();
    }

    //Chuẩn hóa biển số xe.
    private String normalizePlate(String plate) {
        return plate.trim().toUpperCase().replace(" ", "");
    }
}
