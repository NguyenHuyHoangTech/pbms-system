package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerSlotDTO {
    private Long slotId;
    private String slotName;
    private String status;
    private Long zoneId;
    private String zoneName;
    private Long floorId;
    private String floorName;
    private Long vehicleTypeId;
    private String vehicleTypeName;
}
