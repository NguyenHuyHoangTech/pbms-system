package com.pbms.modules.operation.job;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
public class MonthlyTicketJob {

    /**
     * Chạy vào 00:00:00 mỗi ngày để quét và cập nhật trạng thái Vé tháng hết hạn.
     * Cron format: Second, Minute, Hour, Day of month, Month, Day of week
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void deactivateExpiredMonthlyTickets() {
        log.info("Starting Daily Job: Deactivate Expired Monthly Tickets at {}", com.pbms.common.utils.TimeProvider.now());
        // TODO: Call monthlyTicketRepository.updateStatusToExpiredForPastValidUntil()
        log.info("Finished Daily Job: Expired Tickets Processing.");
    }
}
