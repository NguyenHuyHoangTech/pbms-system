package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.pbms.modules.operation.dto.CheckInRequestDTO;
import com.pbms.modules.operation.dto.CheckOutRequestDTO;
import com.pbms.modules.operation.dto.GateResponseDTO;
import com.pbms.modules.operation.service.GateOperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/operation/gates")
@RequiredArgsConstructor
public class GateConsoleController {

    private final GateOperationService gateOperationService;

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<GateResponseDTO>> processCheckIn(@RequestBody CheckInRequestDTO request) {
        try {
            GateResponseDTO response = gateOperationService.processCheckIn(request);
            if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, response.getMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/check-out")
    public ResponseEntity<ApiResponse<GateResponseDTO>> processCheckOut(@RequestBody CheckOutRequestDTO request) {
        try {
            GateResponseDTO response = gateOperationService.processCheckOut(request);
            if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, response.getMessage()));
            }
            if ("WARNING".equals(response.getStatus())) {
                return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
