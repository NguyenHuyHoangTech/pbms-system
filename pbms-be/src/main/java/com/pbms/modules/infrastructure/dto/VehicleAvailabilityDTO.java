package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleAvailabilityDTO {
    private Long vehicleTypeId;
    private String type;
    private String label;
    private long total;
    private long available;
    private String statusIndicator;
}
