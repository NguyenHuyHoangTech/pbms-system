package com.pbms.modules.identity.service;

import com.pbms.modules.identity.domain.StaffWorkSession;
import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.repository.UserRepository;
import com.pbms.modules.infrastructure.domain.Gate;
import com.pbms.modules.infrastructure.repository.GateRepository;
import com.pbms.modules.operation.domain.ParkingSession;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import com.pbms.modules.operation.repository.StaffWorkSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WorkSessionService {

    private final StaffWorkSessionRepository workSessionRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final ParkingSessionRepository parkingSessionRepository;

    @Transactional
    public StaffWorkSession startSession(String email, Long gateId) {
        User staff = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Nhân viên không tồn tại"));

        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new IllegalArgumentException("Cổng không tồn tại: " + gateId));

        // Close any existing active session for this staff
        Optional<StaffWorkSession> existing = workSessionRepository
                .findByStaffIdAndStatus(staff.getId(), "ACTIVE");
        existing.ifPresent(s -> {
            s.setStatus("COMPLETED");
            s.setLogoutTime(com.pbms.common.utils.TimeProvider.now());
            workSessionRepository.save(s);
        });

        StaffWorkSession session = StaffWorkSession.builder()
                .staff(staff)
                .gate(gate)
                .loginTime(com.pbms.common.utils.TimeProvider.now())
                .status("ACTIVE")
                .build();

        return workSessionRepository.save(session);
    }

    @Transactional
    public Map<String, Object> endSession(String email, BigDecimal declaredCash) {
        User staff = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Nhân viên không tồn tại"));

        StaffWorkSession session = workSessionRepository
                .findByStaffIdAndStatus(staff.getId(), "ACTIVE")
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy ca trực đang mở"));

        session.setStatus("COMPLETED");
        session.setLogoutTime(com.pbms.common.utils.TimeProvider.now());
        workSessionRepository.save(session);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("staffName", staff.getFullName());
        result.put("gateName", session.getGate().getGateName());
        result.put("loginTime", session.getLoginTime());
        result.put("logoutTime", session.getLogoutTime());
        result.put("declaredCash", declaredCash);
        result.put("message", "Đã đóng ca trực thành công");
        return result;
    }

    public Map<String, Object> getPreviewSettlement(String email) {
        User staff = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Nhân viên không tồn tại"));

        Optional<StaffWorkSession> sessionOpt = workSessionRepository
                .findByStaffIdAndStatus(staff.getId(), "ACTIVE");

        if (sessionOpt.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("hasActiveSession", false);
            return empty;
        }

        StaffWorkSession session = sessionOpt.get();

        // Tính tổng doanh thu trong ca
        List<ParkingSession> completedSessions = parkingSessionRepository
                .findByGateInIdAndTimeOutBetween(
                        session.getGate().getId(),
                        session.getLoginTime(),
                        com.pbms.common.utils.TimeProvider.now()
                );

        BigDecimal totalRevenue = completedSessions.stream()
                .map(ps -> ps.getTotalFee() != null ? ps.getTotalFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> preview = new HashMap<>();
        preview.put("hasActiveSession", true);
        preview.put("sessionId", session.getId());
        preview.put("staffName", staff.getFullName());
        preview.put("gateName", session.getGate().getGateName());
        preview.put("loginTime", session.getLoginTime());
        preview.put("totalTransactions", completedSessions.size());
        preview.put("totalRevenue", totalRevenue);
        return preview;
    }
}
