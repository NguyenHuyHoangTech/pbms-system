package com.pbms.modules.identity.job;

import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class UnverifiedUserCleanupJob {

    private final UserRepository userRepository;

    /**
     * Chạy vào 02:00:00 mỗi ngày để dọn dẹp các tài khoản chưa verify OTP sau 24h.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupUnverifiedUsers() {
        log.info("Starting Daily Job: Cleanup Unverified Users at {}", com.pbms.common.utils.TimeProvider.now());
        
        LocalDateTime cutoffTime = com.pbms.common.utils.TimeProvider.now().minusHours(24);
        // Note: Using findAll for simplicity. In production, add a custom query to UserRepository:
        // @Query("SELECT u FROM User u WHERE u.isVerified = false AND u.createdAt < :cutoffTime")
        List<User> unverifiedUsers = userRepository.findAll().stream()
                .filter(u -> !u.getIsVerified() && u.getCreatedAt() != null && u.getCreatedAt().isBefore(cutoffTime))
                .toList();

        if (!unverifiedUsers.isEmpty()) {
            userRepository.deleteAll(unverifiedUsers);
            log.info("Deleted {} unverified users created before {}", unverifiedUsers.size(), cutoffTime);
        } else {
            log.info("No unverified users to clean up.");
        }
        
        log.info("Finished Daily Job: Cleanup Unverified Users.");
    }
}
