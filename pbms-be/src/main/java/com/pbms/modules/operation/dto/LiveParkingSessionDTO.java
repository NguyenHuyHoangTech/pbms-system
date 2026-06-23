package com.pbms.modules.operation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
//Trả thông tin phiên gửi xe hiện tại.
public class LiveParkingSessionDTO {
    private Long sessionId;
    private String status;
    private String sessionType;
    private String plateNumber;
    private String vehicleType;
    private String rfidCardCode;
    private SessionLocationDTO location;
    private SessionTrackingDTO tracking;
    private SessionBillingDTO billingSummary;
}
