package com.pbms.modules.incident.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class IncidentTicketDTO {
    private Long id;
    private String plateNumber;
    private String issueType;
    private String priority;
    private String description;
    private String status;
    private BigDecimal fineAmount;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private String uploadedDocUrl;
    private String expectedZoneName;
    private String actualZoneName;
    
    // For legacy IncidentTicketService compatibility
    private String type;
    private int phase;
    private String plate;
    private String rfid;
    private String time;
    private String uploadedCardUrl;
    private BigDecimal baseFee;
}
