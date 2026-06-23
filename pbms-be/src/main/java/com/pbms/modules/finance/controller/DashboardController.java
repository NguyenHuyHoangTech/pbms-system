package com.pbms.modules.finance.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.finance.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueOverview(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        Map<String, Object> data = dashboardService.getRevenueOverview(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy dữ liệu doanh thu thành công"));
    }

    @GetMapping("/operational")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOperationalOverview() {
        
        Map<String, Object> data = dashboardService.getOperationalOverview();
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy dữ liệu vận hành thành công"));
    }
}
