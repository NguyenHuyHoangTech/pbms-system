package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
@Builder
//Thông tin bảng giá theo ca ngày/đêm.
public class PublicPricingShiftDTO {
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<PublicPricingBlockDTO> blocks;
}
