package com.pbms.modules.operation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateReservationRequest {
    @NotNull(message = "Vehicle type is required")
    private Long vehicleTypeId;

    @NotBlank(message = "Plate number is required")
    @Pattern(regexp = "[A-Za-z0-9.\\- ]{5,20}", message = "Invalid plate number format")
    private String plateNumber;

    private Long slotId;
    private Long zoneId;

    @NotNull(message = "Expected entry time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expectedEntryTime;

    @NotNull(message = "Expected duration is required")
    @Min(value = 1, message = "Expected duration must be positive")
    private Integer expectedDurationMinutes;

    @AssertTrue(message = "Either slotId or zoneId is required")
    public boolean isParkingLocationSelected() {
        return slotId != null || zoneId != null;
    }
}
