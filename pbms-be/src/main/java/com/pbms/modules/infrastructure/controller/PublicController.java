package com.pbms.modules.infrastructure.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.service.ZoneService;
import com.pbms.modules.system.domain.BuildingProfile;
import com.pbms.modules.system.service.BuildingProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final ZoneService zoneService;
    private final BuildingProfileService buildingProfileService;

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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParkingStatus() {
        // Calculate total available slots by vehicle category
        List<Map<String, Object>> statusList = new ArrayList<>();
        
        // Mock data logic for vehicle categories since we don't have direct vehicle types access here easily
        // In reality, this should aggregate slots based on the zones' vehicle categories
        Map<String, Object> carMap = new HashMap<>();
        carMap.put("type", "CAR");
        carMap.put("label", "Ô TÔ");
        carMap.put("available", 45); // Should calculate from Zones

        Map<String, Object> motoMap = new HashMap<>();
        motoMap.put("type", "MOTORBIKE");
        motoMap.put("label", "XE MÁY");
        motoMap.put("available", 210);

        Map<String, Object> ebikeMap = new HashMap<>();
        ebikeMap.put("type", "EBIKE");
        ebikeMap.put("label", "XE ĐẠP ĐIỆN");
        ebikeMap.put("available", 15);

        statusList.add(carMap);
        statusList.add(motoMap);
        statusList.add(ebikeMap);

        return ResponseEntity.ok(ApiResponse.success(statusList, "Lấy trạng thái bãi xe thành công"));
    public ResponseEntity<ApiResponse<List<VehicleAvailabilityDTO>>> getParkingStatus() {
        return ResponseEntity.ok(ApiResponse.success(
                publicParkingService.getAvailability(),
                "Fetched live parking availability successfully"
        ));
    }
    }
}
