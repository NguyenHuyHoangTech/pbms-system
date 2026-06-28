package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.VehicleDTO;
import com.pbms.modules.operation.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/operation/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getAllVehicles() {
        return ResponseEntity.ok(ApiResponse.success(
                vehicleService.getAllVehicles(),
                "Check out the list of useful products."
        ));
    }

    @PostMapping("/{id}/blacklist")
    public ResponseEntity<ApiResponse<VehicleDTO>> blacklistVehicle(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.get("reason");
            VehicleDTO dto = vehicleService.setBlacklist(id, reason);
            return ResponseEntity.ok(ApiResponse.success(dto, "Sign in to the list"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/unblacklist")
    public ResponseEntity<ApiResponse<VehicleDTO>> unblacklistVehicle(@PathVariable Long id) {
        try {
            VehicleDTO dto = vehicleService.removeBlacklist(id);
            return ResponseEntity.ok(ApiResponse.success(dto, "Success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }
}

