package com.pbms.modules.incident.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneTrendDTO {
    private String timeWindow;
    private Long zoneId;
    private String zoneName;
    private BigDecimal occupancyPct;
}

