package com.pbms.modules.operation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
//Chứa tầng, zone và slot đang đỗ.
public class SessionLocationDTO {
    private String floor;
    private String zoneName;
    private String allocatedSlot;
}
