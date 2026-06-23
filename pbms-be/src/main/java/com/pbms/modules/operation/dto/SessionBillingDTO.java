package com.pbms.modules.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
//Chứa phí gửi, phí phạt và tổng phí tạm tính.
public class SessionBillingDTO {
    private BigDecimal accumulatedParkingFee;
    private BigDecimal totalPenaltyFee;
    private BigDecimal totalEstimatedFee;
    private String currency;
    private List<PenaltyDetailDTO> penaltyDetails;
}
