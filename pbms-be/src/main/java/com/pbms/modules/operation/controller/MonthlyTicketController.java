package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.MonthlyTicketDTO;
import com.pbms.modules.operation.service.MonthlyTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operation/monthly-tickets")
@RequiredArgsConstructor
public class MonthlyTicketController {

    private final MonthlyTicketService monthlyTicketService;

    // UC-404: Lấy danh sách vé tháng
    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyTicketDTO>>> getAllTickets() {
        return ResponseEntity.ok(ApiResponse.success(
                monthlyTicketService.getAllTickets(),
                "Lấy danh sách vé tháng thành công"
        ));
    }

    // UC-404: Đăng ký vé tháng mới (popup form)
    @PostMapping
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> createTicket(@RequestBody java.util.Map<String, Object> payload) {
        try {
            MonthlyTicketDTO dto = monthlyTicketService.createTicket(payload);
            return ResponseEntity.ok(ApiResponse.success(dto, "Đăng ký vé tháng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi đăng ký vé tháng: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> renewTicket(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {
        try {
            int duration = payload.get("duration") != null ? Integer.parseInt(payload.get("duration").toString()) : 1;
            MonthlyTicketDTO dto = monthlyTicketService.renewTicket(id, duration);
            return ResponseEntity.ok(ApiResponse.success(dto, "Gia hạn vé tháng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi gia hạn vé tháng: " + e.getMessage()));
        }
    }
}
