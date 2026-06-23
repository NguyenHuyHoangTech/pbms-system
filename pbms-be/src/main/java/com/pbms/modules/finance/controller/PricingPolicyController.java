package com.pbms.modules.finance.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.finance.dto.PricingPolicyDTO;
import com.pbms.modules.finance.service.PricingConfigurationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manager/pricing")
public class PricingPolicyController {

    private final PricingConfigurationService pricingConfigurationService;

    public PricingPolicyController(PricingConfigurationService pricingConfigurationService) {
        this.pricingConfigurationService = pricingConfigurationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<PricingPolicyDTO>>> getAllPolicies() {
        return ResponseEntity.ok(ApiResponse.success(pricingConfigurationService.getAllPolicies(), "Lấy dữ liệu thành công"));
    }

    @PostMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PricingPolicyDTO>> savePolicy(@RequestBody PricingPolicyDTO dto) {
        try {
            System.out.println("====== RECEIVED PAYLOAD ======");
            System.out.println("VehicleTypeId: " + dto.getVehicleTypeId());
            System.out.println("Shifts count: " + (dto.getShifts() != null ? dto.getShifts().size() : "null"));
            System.out.println("==============================");
            PricingPolicyDTO saved = pricingConfigurationService.savePolicy(dto);
            System.out.println("====== SAVED SUCCESSFULLY ======");
            return ResponseEntity.ok(ApiResponse.success(saved, "Lưu cấu hình bảng giá thành công"));
        } catch (Exception e) {
            System.out.println("====== ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
