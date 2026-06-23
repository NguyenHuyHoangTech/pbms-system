package com.pbms.modules.infrastructure.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
//Data response FE
public class ParkingLotSummaryDTO {
    private String parkingLotName;
    private String address;
    private String hotline;
    private String operatingHours;
    private String rules;
    private List<String> servedVehicleTypes;
    private List<PublicPricingPolicyDTO> pricing;
    private List<VehicleAvailabilityDTO> availability;
}
