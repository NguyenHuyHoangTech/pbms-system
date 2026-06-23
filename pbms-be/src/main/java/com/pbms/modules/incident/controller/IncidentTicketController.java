package com.pbms.modules.incident.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.incident.domain.IncidentTicket;
import com.pbms.modules.incident.dto.IncidentTicketRequest;
import com.pbms.modules.incident.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentTicketController {

    private final IncidentService incidentService;

    @PostMapping
    public ResponseEntity<ApiResponse<IncidentTicket>> createIncident(@RequestBody IncidentTicketRequest request) {
        try {
            IncidentTicket ticket = incidentService.createIncident(request);
            return ResponseEntity.ok(ApiResponse.success(ticket, "Incident created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi tạo incident: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<com.pbms.modules.incident.dto.IncidentTicketDTO>>> getAllIncidents() {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getAllIncidents(), "Fetched successfully"));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<com.pbms.modules.incident.dto.IncidentTicketDTO>> resolveIncident(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> requestBody) {
        try {
            String resolutionNotes = requestBody.get("resolutionNotes");
            com.pbms.modules.incident.dto.IncidentTicketDTO dto = incidentService.resolveIncident(id, resolutionNotes);
            return ResponseEntity.ok(ApiResponse.success(dto, "Incident resolved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi xử lý incident: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/process-phase1")
    public ResponseEntity<ApiResponse<com.pbms.modules.incident.dto.IncidentTicketDTO>> processPhase1(@PathVariable Long id) {
        try {
            com.pbms.modules.incident.dto.IncidentTicketDTO dto = incidentService.processPhase1(id);
            return ResponseEntity.ok(ApiResponse.success(dto, "Chuyển sang giai đoạn 2 thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi xử lý phase 1: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<com.pbms.modules.incident.dto.IncidentTicketDTO>> rejectIncident(
            @PathVariable Long id,
            @RequestParam String reason) {
        try {
            com.pbms.modules.incident.dto.IncidentTicketDTO dto = incidentService.rejectIncident(id, reason);
            return ResponseEntity.ok(ApiResponse.success(dto, "Đã từ chối xử lý sự cố"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi từ chối incident: " + e.getMessage()));
        }
    }

    @PostMapping("/lost-card")
    public ResponseEntity<ApiResponse<com.pbms.modules.incident.dto.IncidentTicketDTO>> reportLostCard(
            @RequestBody java.util.Map<String, Object> requestBody) {
        try {
            String plate = (String) requestBody.get("plate");
            java.math.BigDecimal fee = requestBody.get("fee") != null 
                    ? new java.math.BigDecimal(requestBody.get("fee").toString()) 
                    : null;
            com.pbms.modules.incident.dto.IncidentTicketDTO dto = incidentService.createLostCardIncident(plate, fee);
            return ResponseEntity.ok(ApiResponse.success(dto, "Báo mất thẻ thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi báo mất thẻ: " + e.getMessage()));
        }
    }

    @PostMapping("/adjust-fee")
    public ResponseEntity<ApiResponse<com.pbms.modules.incident.dto.IncidentTicketDTO>> adjustFee(
            @RequestBody java.util.Map<String, Object> requestBody) {
        try {
            String plate = (String) requestBody.get("plate");
            java.math.BigDecimal liveFee = new java.math.BigDecimal(requestBody.get("liveFee").toString());
            String reason = (String) requestBody.get("reason");
            com.pbms.modules.incident.dto.IncidentTicketDTO dto = incidentService.adjustFeeIncident(plate, liveFee, reason);
            return ResponseEntity.ok(ApiResponse.success(dto, "Điều chỉnh phí thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi điều chỉnh phí: " + e.getMessage()));
        }
    }
}
