package com.pbms.modules.operation.service;

import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.repository.ReservationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationLifecycleServiceTest {

    @Mock ReservationRepository reservationRepository;
    @Mock SlotRepository slotRepository;
    @Mock SimpMessagingTemplate messagingTemplate;

    @InjectMocks ReservationLifecycleService lifecycleService;

    //UC-402: Kiểm tra no-show và giải phóng slot đúng.
    @Test
    void closesPaidReservationAsNoShowAndReleasesReservedSlot() {
        Slot slot = Slot.builder().slotName("P-12").status("RESERVED").build();
        slot.setId(5L);
        Reservation reservation = Reservation.builder()
                .slot(slot)
                .status(ReservationStatus.PAID)
                .build();
        reservation.setId(9L);
        when(reservationRepository.findByIdForUpdate(9L)).thenReturn(Optional.of(reservation));

        lifecycleService.closeReservationWindow(9L);

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.COMPLETED_UNUSED);
        assertThat(reservation.getRefundStatus()).isEqualTo("NO_REFUND");
        assertThat(slot.getStatus()).isEqualTo("AVAILABLE");
        verify(slotRepository).save(slot);
        verify(reservationRepository).save(reservation);
    }
}
