package com.pbms.modules.operation.service;

import com.pbms.modules.finance.service.PricingCalculatorService;
import com.pbms.modules.infrastructure.domain.Floor;
import com.pbms.modules.infrastructure.domain.RfidCard;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.operation.domain.ParkingSession;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.dto.LiveParkingSessionDTO;
import com.pbms.modules.operation.dto.WalkInLookupRequest;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
//Kiểm tra logic tra cứu phiên gửi xe bằng biển số + RFID và tính tổng phí tạm tính chính xác.
class ParkingSessionTrackingServiceTest {

    @Mock ParkingSessionRepository parkingSessionRepository;
    @Mock PricingCalculatorService pricingCalculatorService;

    @InjectMocks ParkingSessionTrackingService trackingService;

    @Test
    void walkInLookupRequiresMatchingPlateAndRfidAndReturnsLiveBill() {
        VehicleType type = VehicleType.builder()
                .typeName("CAR")
                .matrixWidth(2)
                .matrixHeight(4)
                .build();
        type.setId(2L);
        Floor floor = Floor.builder().floorName("B1").floorLevel(-1).capacity(100).build();
        Zone zone = Zone.builder().floor(floor).vehicleType(type).zoneName("Walk-in A").build();
        Slot slot = Slot.builder().zone(zone).slotName("A05").status("OCCUPIED").build();
        RfidCard card = RfidCard.builder().cardCode("RFID-001").status("IN_USE").build();
        ParkingSession session = ParkingSession.builder()
                .plate("51H123.45")
                .vehicleType(type)
                .rfidCard(card)
                .slot(slot)
                .timeIn(LocalDateTime.now().minusMinutes(90))
                .penaltyFee(new BigDecimal("10000.00"))
                .status("ACTIVE")
                .build();
        session.setId(99L);

        WalkInLookupRequest request = new WalkInLookupRequest();
        request.setPlateNumber("51h 123.45");
        request.setRfidCardCode("RFID-001");

        when(parkingSessionRepository
                .findByPlateIgnoreCaseAndRfidCard_CardCodeAndStatusAndReservationIsNull(
                        "51H123.45", "RFID-001", "ACTIVE"))
                .thenReturn(Optional.of(session));
        when(pricingCalculatorService.calculateTotalFee(any(), any(), any()))
                .thenReturn(new BigDecimal("20000.00"));

        LiveParkingSessionDTO result = trackingService.lookupWalkIn(request);

        assertThat(result.getSessionType()).isEqualTo("WALK_IN");
        assertThat(result.getLocation().getAllocatedSlot()).isEqualTo("A05");
        assertThat(result.getBillingSummary().getTotalEstimatedFee())
                .isEqualByComparingTo("30000.00");
        assertThat(result.getBillingSummary().getPenaltyDetails()).hasSize(1);
        verify(parkingSessionRepository)
                .findByPlateIgnoreCaseAndRfidCard_CardCodeAndStatusAndReservationIsNull(
                        "51H123.45", "RFID-001", "ACTIVE");
    }
}
