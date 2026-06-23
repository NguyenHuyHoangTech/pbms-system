package com.pbms.modules.operation.service;

import com.pbms.modules.operation.dto.ParkingSessionDTO;
import com.pbms.modules.operation.entity.ParkingSession;
import com.pbms.modules.operation.entity.Slot;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import com.pbms.modules.operation.repository.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ParkingSessionService {

    private final ParkingSessionRepository sessionRepository;
    private final SlotRepository slotRepository;

    @Transactional
    public ParkingSession checkIn(ParkingSessionDTO dto) {
        // Find an empty slot
        Slot slot = slotRepository.findAll().stream()
                .filter(s -> "EMPTY".equals(s.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No empty slots available"));

        slot.setStatus("OCCUPIED");
        slotRepository.save(slot);

        ParkingSession session = new ParkingSession();
        session.setPlateNumber(dto.getPlateNumber());
        session.setGateInId(dto.getGateId());
        session.setAllocatedSlot(slot);
        session.setStatus("ACTIVE");

        return sessionRepository.save(session);
    }

    @Transactional
    public ParkingSession checkOut(Long sessionId) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new RuntimeException("Session is already completed");
        }

        session.setTimeOut(LocalDateTime.now());
        session.setStatus("COMPLETED");
        session.setTotalFee(new BigDecimal("50000.00")); // Dummy fee
        // Set mock checkout staff id (staff@pbms.com -> 3L)
        session.setCheckoutStaffId(3L);

        if (session.getAllocatedSlot() != null) {
            Slot slot = session.getAllocatedSlot();
            slot.setStatus("EMPTY");
            slotRepository.save(slot);
        }

        return sessionRepository.save(session);
    }
}
