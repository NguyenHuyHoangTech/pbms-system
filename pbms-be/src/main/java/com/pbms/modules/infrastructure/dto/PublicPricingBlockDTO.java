package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
//Chi tiết mức phí theo từng block thời gian.
public class PublicPricingBlockDTO {
    private Integer blockOrder;
    private Integer durationMinutes;
    private BigDecimal fee;
}
