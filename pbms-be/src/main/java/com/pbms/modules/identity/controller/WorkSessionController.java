package com.pbms.modules.identity.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.identity.domain.StaffWorkSession;
import com.pbms.modules.identity.service.WorkSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/work-sessions")
@RequiredArgsConstructor
public class WorkSessionController {

    private final WorkSessionService workSessionService;

    /**
     * POST /api/v1/work-sessions/start
     * Body: { "gateId": 1 }
     * Staff bấm Mở ca trực
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startSession(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        try {
            String email = authentication.getName();
            Long gateId = Long.valueOf(body.get("gateId").toString());
            StaffWorkSession session = workSessionService.startSession(email, gateId);

            Map<String, Object> result = Map.of(
                    "sessionId", session.getId(),
                    "gateId", session.getGate().getId(),
                    "gateName", session.getGate().getGateName(),
                    "gateType", session.getGate().getGateType(),
                    "loginTime", session.getLoginTime(),
                    "status", session.getStatus()
            );
            return ResponseEntity.ok(ApiResponse.success(result, "Đã mở ca trực thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi mở ca: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/v1/work-sessions/end
     * Body: { "declaredCash": 500000 }
     * Staff bấm Đóng ca trực
     */
    @PutMapping("/end")
    public ResponseEntity<ApiResponse<Map<String, Object>>> endSession(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        try {
            String email = authentication.getName();
            BigDecimal declaredCash = body.get("declaredCash") != null
                    ? new BigDecimal(body.get("declaredCash").toString())
                    : BigDecimal.ZERO;
            Map<String, Object> result = workSessionService.endSession(email, declaredCash);
            return ResponseEntity.ok(ApiResponse.success(result, "Đã đóng ca trực thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi đóng ca: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/work-sessions/current/preview-settlement
     * Preview doanh thu trước khi đóng ca
     */
    @GetMapping("/current/preview-settlement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> previewSettlement(Authentication authentication) {
        try {
            String email = authentication.getName();
            Map<String, Object> preview = workSessionService.getPreviewSettlement(email);
            return ResponseEntity.ok(ApiResponse.success(preview, "Fetched preview settlement"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi lấy thông tin ca: " + e.getMessage()));
        }
    }
}
