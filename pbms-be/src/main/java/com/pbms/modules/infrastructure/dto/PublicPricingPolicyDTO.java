package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
//Thông tin chính sách giá theo loại xe.
public class PublicPricingPolicyDTO {
    private Long policyId;
    private String policyName;
    private Long vehicleTypeId;
    private String vehicleTypeName;
    private Integer globalBaseMinutes;
    private BigDecimal globalBaseFee;
    private BigDecimal maxParkingCap;
    private List<PublicPricingShiftDTO> shifts;
}
