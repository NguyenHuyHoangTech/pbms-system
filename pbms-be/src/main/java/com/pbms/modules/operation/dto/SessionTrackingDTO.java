package com.pbms.modules.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
//Chứa thời gian vào và tổng thời gian đã gửi.
public class SessionTrackingDTO {
    private LocalDateTime checkInTime;
    private LocalDateTime lastCalculatedTime;
    private long durationMinutes;
}
