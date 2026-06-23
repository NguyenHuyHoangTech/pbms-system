package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SlotAvailabilityDTO {
    private Long slotId;
    private String slotName;
    private String physicalStatus;
    private boolean available;
    private String message;
}
