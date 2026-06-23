package com.pbms.modules.infrastructure.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.operation.service.ZoneOccupancyTracker;
import com.pbms.modules.operation.service.ZoneRoutingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/infrastructure/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotRepository slotRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ZoneRoutingService zoneRoutingService;
    private final ZoneOccupancyTracker zoneOccupancyTracker;

    @PostMapping("/iot-update")
    public ResponseEntity<ApiResponse<String>> iotUpdate(@RequestBody IotUpdateRequest request) {
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        if (!"EMPTY".equals(request.getStatus()) && !"OCCUPIED".equals(request.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Invalid status"));
        }

        slot.setStatus(request.getStatus());
        slotRepository.save(slot);

        // Update high-water mark for the zone
        java.math.BigDecimal currentOccupancy = zoneRoutingService.calculateZoneOccupancy(slot.getZone().getId());
        zoneOccupancyTracker.updateOccupancy(slot.getZone().getId(), currentOccupancy);

        // Broadcast to WebSocket
        messagingTemplate.convertAndSend("/topic/map-updates", slot);

        return ResponseEntity.ok(ApiResponse.success("Slot updated", "Success"));
    }

    @Data
    public static class IotUpdateRequest {
        private Long slotId;
        private String status;
    }
}
