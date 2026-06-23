package com.pbms.modules.operation.service;

import com.pbms.modules.finance.service.PricingCalculatorService;
import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.repository.UserRepository;
import com.pbms.modules.infrastructure.domain.Floor;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.infrastructure.service.CustomerSlotService;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.domain.Vehicle;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.dto.CreateReservationRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.repository.ReservationRepository;
import com.pbms.modules.operation.repository.VehicleRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock ReservationRepository reservationRepository;
    @Mock VehicleRepository vehicleRepository;
    @Mock VehicleTypeRepository vehicleTypeRepository;
    @Mock UserRepository userRepository;
    @Mock ZoneRepository zoneRepository;
    @Mock SlotRepository slotRepository;
    @Mock CustomerSlotService customerSlotService;
    @Mock PricingCalculatorService pricingCalculatorService;
    @Mock BookingPolicyService bookingPolicyService;
    @Mock ReservationScheduler reservationScheduler;

    @InjectMocks ReservationService reservationService;

    @Test
    void createsPaidReservationAndAssignsAvailableSlotFromZone() {
        User customer = User.builder().email("customer@pbms.test").role("CUSTOMER").status("ACTIVE").build();
        customer.setId(10L);
        VehicleType vehicleType = VehicleType.builder()
                .typeName("CAR")
                .matrixWidth(2)
                .matrixHeight(4)
                .build();
        vehicleType.setId(2L);
        Floor floor = Floor.builder().floorName("B1").floorLevel(-1).capacity(100).build();
        floor.setId(3L);
        Zone zone = Zone.builder()
                .floor(floor)
                .vehicleType(vehicleType)
                .zoneName("Booking Zone")
                .functionType("WALK_IN")
                .status("ACTIVE")
                .build();
        zone.setId(4L);
        Slot slot = Slot.builder().zone(zone).slotName("P-12").status("AVAILABLE").build();
        slot.setId(5L);

        CreateReservationRequest request = new CreateReservationRequest();
        request.setVehicleTypeId(vehicleType.getId());
        request.setPlateNumber("51h 123.45");
        request.setZoneId(zone.getId());
        request.setExpectedEntryTime(LocalDateTime.now().plusHours(2));
        request.setExpectedDurationMinutes(120);

        when(bookingPolicyService.getInt(BookingPolicyService.PREP_TIME_MINS)).thenReturn(30);
        when(bookingPolicyService.getInt(BookingPolicyService.MAX_ADVANCE_HOURS)).thenReturn(24);
        when(bookingPolicyService.getInt(BookingPolicyService.MAX_DURATION_HOURS)).thenReturn(12);
        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(vehicleTypeRepository.findById(vehicleType.getId())).thenReturn(Optional.of(vehicleType));
        when(vehicleRepository.findByPlateNumber("51H123.45")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
            Vehicle vehicle = invocation.getArgument(0);
            vehicle.setId(20L);
            return vehicle;
        });
        when(reservationRepository.findByVehicle_PlateNumberAndStatusIn(anyString(), any()))
                .thenReturn(List.of());
        when(zoneRepository.findById(zone.getId())).thenReturn(Optional.of(zone));
        when(slotRepository.findAvailableByZoneForUpdate(anyLong(), any())).thenReturn(List.of(slot));
        when(reservationRepository.findBySlot_IdAndStatusIn(anyLong(), any())).thenReturn(List.of());
        when(pricingCalculatorService.calculateTotalFee(anyLong(), any(), any()))
                .thenReturn(new BigDecimal("50000.00"));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            reservation.setId(30L);
            reservation.setCreatedAt(LocalDateTime.now());
            return reservation;
        });

        ReservationDTO result = reservationService.createReservation(customer.getEmail(), request);

        assertThat(result.getStatus()).isEqualTo(ReservationStatus.PAID);
        assertThat(result.getSlotId()).isEqualTo(slot.getId());
        assertThat(result.getPlateNumber()).isEqualTo("51H123.45");
        assertThat(result.getReservationFee()).isEqualByComparingTo("50000.00");
        verify(reservationScheduler).schedule(any(Reservation.class));
    }
}
