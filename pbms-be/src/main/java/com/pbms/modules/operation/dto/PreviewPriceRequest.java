package com.pbms.modules.operation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PreviewPriceRequest {
    @NotNull(message = "Vehicle type is required")
    private Long vehicleTypeId;
    @NotNull(message = "Expected duration is required")
    @Min(value = 1, message = "Expected duration must be positive")
    private Integer expectedDurationMinutes;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expectedEntryTime;
}
