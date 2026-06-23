package com.pbms.modules.operation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
//Nhận ID slot mới khi đổi vị trí.
public class ReassignReservationRequest {
    @NotNull(message = "New slot is required")
    private Long newSlotId;
}
