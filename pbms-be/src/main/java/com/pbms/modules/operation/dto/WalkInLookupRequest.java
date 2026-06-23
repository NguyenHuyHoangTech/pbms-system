package com.pbms.modules.operation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
//Nhận biển số và mã RFID để tra cứu.
public class WalkInLookupRequest {
    @NotBlank(message = "Plate number is required")
    @Pattern(regexp = "[A-Za-z0-9.\\- ]{5,20}", message = "Invalid plate number format")
    private String plateNumber;

    @NotBlank(message = "RFID card code is required")
    private String rfidCardCode;
}
