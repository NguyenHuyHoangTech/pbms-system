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

    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyTicketDTO>>> getAllTickets() {
        return ResponseEntity.ok(ApiResponse.success(
                monthlyTicketService.getAllTickets(),
                "Read the list and learn more"
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> createTicket(@RequestBody java.util.Map<String, Object> payload) {
        try {
            MonthlyTicketDTO dto = monthlyTicketService.createTicket(payload);
            return ResponseEntity.ok(ApiResponse.success(dto, "Success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> renewTicket(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {
        try {
            int duration = payload.get("duration") != null ? Integer.parseInt(payload.get("duration").toString()) : 1;
            MonthlyTicketDTO dto = monthlyTicketService.renewTicket(id, duration);
            return ResponseEntity.ok(ApiResponse.success(dto, "Cheap and cheap"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign-rfid")
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> assignRfidCard(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload,
            @org.springframework.beans.factory.annotation.Autowired com.pbms.modules.infrastructure.repository.RfidCardRepository rfidCardRepository) {
        try {
            String rfidCode = payload.get("rfidCode");
            if (rfidCode == null || rfidCode.isBlank()) {
                throw new IllegalArgumentException("rfidCode is required");
            }
            MonthlyTicketDTO dto = monthlyTicketService.assignRfidCard(id, rfidCode, rfidCardRepository);
            return ResponseEntity.ok(ApiResponse.success(dto, "RFID technology for smart devices"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "RFID:" + e.getMessage()));
        }
    }
    @PutMapping("/{id}/plate")
    public ResponseEntity<ApiResponse<MonthlyTicketDTO>> updatePlate(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String newPlate = payload.get("plate");
            if (newPlate == null || newPlate.isBlank()) {
                throw new IllegalArgumentException("Plate is required");
            }
            MonthlyTicketDTO dto = monthlyTicketService.updateTicketPlate(id, newPlate);
            return ResponseEntity.ok(ApiResponse.success(dto, "Plate updated successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(500, "Error: " + e.getMessage()));
        }
    }
}

