package com.pbms.modules.operation.service;

import com.pbms.common.utils.TimeProvider;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.service.CustomerSlotService;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationLifecycleService {

    private final ReservationRepository reservationRepository;
    private final SlotRepository slotRepository;
    private final SimpMessagingTemplate messagingTemplate;

    //UC-402: Chuyển slot trống sang RESERVED; cảnh báo nếu đang bị chiếm.
    @Transactional
    public void prepareSlot(Long reservationId) {
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId).orElse(null);
        if (reservation == null || !ReservationStatus.PAID.equals(reservation.getStatus())) {
            return;
        }

        Slot slot = slotRepository.findByIdForUpdate(reservation.getSlot().getId()).orElse(null);
        if (slot == null) {
            return;
        }
        if (CustomerSlotService.PHYSICALLY_AVAILABLE.contains(slot.getStatus())) {
            slot.setStatus("RESERVED");
            slotRepository.save(slot);
            return;
        }
        if (!"RESERVED".equals(slot.getStatus())) {
            messagingTemplate.convertAndSend("/topic/reservations/alerts", (Object) Map.of(
                    "reservationId", reservationId,
                    "slotId", slot.getId(),
                    "slotName", slot.getSlotName(),
                    "status", slot.getStatus(),
                    "message", "Reserved slot is physically occupied; staff relocation is required"
            ));
        }
    }

    /*
    UC-402: Xử lý no-show (Khách đã đặt nhưng không đến)
    hoặc đánh dấu xe overstay (Khách đã vào bãi nhưng chưa ra đúng giờ).
     */
    @Transactional
    public void closeReservationWindow(Long reservationId) {
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId).orElse(null);
        if (reservation == null) {
            return;
        }

        if (ReservationStatus.PAID.equals(reservation.getStatus())) {
            reservation.setStatus(ReservationStatus.COMPLETED_UNUSED);
            reservation.setRefundStatus("NO_REFUND");
            releaseSlot(reservation.getSlot());
            reservationRepository.save(reservation);
            log.info("Reservation {} closed as no-show at {}", reservationId, TimeProvider.now());
        } else if (ReservationStatus.IN_PARKING.equals(reservation.getStatus())) {
            messagingTemplate.convertAndSend("/topic/reservations/alerts", (Object) Map.of(
                    "reservationId", reservationId,
                    "slotId", reservation.getSlot().getId(),
                    "status", "OVERSTAYING",
                    "message", "Pre-booked vehicle is overstaying"
            ));
        }
    }

    //UC-402: Trả slot về AVAILABLE
    private void releaseSlot(Slot slot) {
        if ("RESERVED".equals(slot.getStatus())) {
            slot.setStatus("AVAILABLE");
            slot.setCurrentPlate(null);
            slotRepository.save(slot);
        }
    }
}
