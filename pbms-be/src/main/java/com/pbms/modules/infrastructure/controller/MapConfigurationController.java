package com.pbms.modules.infrastructure.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.dto.config.MapConfigDTO;
import com.pbms.modules.infrastructure.service.MapConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/infrastructure/map")
@RequiredArgsConstructor
public class MapConfigurationController {

    private final MapConfigurationService mapConfigurationService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<MapConfigDTO>> getMapConfig() {
        return ResponseEntity.ok(ApiResponse.success(
                mapConfigurationService.getMapConfiguration(),
                "Lấy cấu hình sơ đồ bãi đỗ thành công"
        ));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<String>> saveMapConfig(@RequestBody MapConfigDTO mapConfigDTO) {
        try {
            mapConfigurationService.saveMapConfiguration(mapConfigDTO);
            return ResponseEntity.ok(ApiResponse.success("Lưu cấu hình thành công", "Cấu hình sơ đồ bãi đỗ đã được lưu."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
