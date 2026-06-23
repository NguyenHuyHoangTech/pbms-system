package com.pbms.modules.infrastructure.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.dto.ParkingLotSummaryDTO;
import com.pbms.modules.infrastructure.dto.PublicPricingPolicyDTO;
import com.pbms.modules.infrastructure.dto.VehicleAvailabilityDTO;
import com.pbms.modules.infrastructure.service.PublicParkingService;
import com.pbms.modules.system.domain.BuildingProfile;
import com.pbms.modules.system.service.BuildingProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final BuildingProfileService buildingProfileService;
    private final PublicParkingService publicParkingService;

    //Lấy tổng quan bãi xe
    @GetMapping("/parking-lot/summary")
    public ResponseEntity<ApiResponse<ParkingLotSummaryDTO>> getParkingLotSummary() {
        return ResponseEntity.ok(ApiResponse.success(
                publicParkingService.getSummary(),
                "Fetched public parking lot summary successfully"
        ));
    }

    //Lấy thông tin bãi xe
    @GetMapping("/building-profile")
    public ResponseEntity<ApiResponse<BuildingProfile>> getBuildingProfile() {
        return ResponseEntity.ok(ApiResponse.success(
                buildingProfileService.getProfile(),
                "Fetched building profile successfully"
        ));
    }

    //UC-403: Lấy số lượng chỗ đỗ còn trống theo từng loại xe (GREEN/RED)
    @GetMapping("/parking-status")
    public ResponseEntity<ApiResponse<List<VehicleAvailabilityDTO>>> getParkingStatus() {
        return ResponseEntity.ok(ApiResponse.success(
                publicParkingService.getAvailability(),
                "Fetched live parking availability successfully"
        ));
    }

    //UC-405: Xem bảng giá
    @GetMapping("/pricing")
    public ResponseEntity<ApiResponse<List<PublicPricingPolicyDTO>>> getPublicPricing() {
        return ResponseEntity.ok(ApiResponse.success(
                publicParkingService.getActivePricing(),
                "Fetched active pricing successfully"
        ));
    }
}
