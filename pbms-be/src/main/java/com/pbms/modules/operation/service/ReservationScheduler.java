package com.pbms.modules.operation.service;

import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservationScheduler {

    private final TaskScheduler taskScheduler;
    private final ReservationRepository reservationRepository;
    private final ReservationLifecycleService lifecycleService;
    private final BookingPolicyService bookingPolicyService;

    //UC-402: Lên lịch chuẩn bị slot và kết thúc booking.
    public void schedule(Reservation reservation) {
        int prepMinutes = bookingPolicyService.getInt(BookingPolicyService.PREP_TIME_MINS);
        Instant now = Instant.now();
        Instant prepareAt = reservation.getExpectedEntryTime()
                .minusMinutes(prepMinutes)
                .atZone(ZoneId.systemDefault())
                .toInstant();
        Instant closeAt = reservation.getExpectedEntryTime()
                .plusMinutes(reservation.getExpectedDurationMinutes())
                .atZone(ZoneId.systemDefault())
                .toInstant();

        taskScheduler.schedule(
                () -> lifecycleService.prepareSlot(reservation.getId()),
                prepareAt.isBefore(now) ? now : prepareAt
        );
        taskScheduler.schedule(
                () -> lifecycleService.closeReservationWindow(reservation.getId()),
                closeAt.isBefore(now) ? now : closeAt
        );
    }

    //UC-402: Khôi phục lịch booking khi server khởi động lại.
    @EventListener(ApplicationReadyEvent.class)
    public void restoreScheduledTasks() {
        reservationRepository.findByStatusIn(Set.of(
                        ReservationStatus.PAID,
                        ReservationStatus.IN_PARKING
                ))
                .forEach(this::schedule);
    }
}
