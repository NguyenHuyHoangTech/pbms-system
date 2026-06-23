package com.pbms.modules.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
//Chi tiết từng khoản phí phạt.
public class PenaltyDetailDTO {
    private String violationType;
    private BigDecimal feeAmount;
    private String description;
}
