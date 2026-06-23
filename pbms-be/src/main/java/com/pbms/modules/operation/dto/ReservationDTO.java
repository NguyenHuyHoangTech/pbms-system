package com.pbms.modules.operation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservationDTO {
    private Long id;
    private Long customerId;
    private String plateNumber;
    private String vehicleType;
    private Long zoneId;
    private String zoneName;
    private Long slotId;
    private String slotName;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expectedEntryTime;
    
    private Integer expectedDurationMinutes;
    private LocalDateTime expectedEndTime;
    private String status;
    private BigDecimal reservationFee;
    private String qrCode;
    private String refundStatus;
    private BigDecimal refundAmount;
    private Boolean overstaying;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
