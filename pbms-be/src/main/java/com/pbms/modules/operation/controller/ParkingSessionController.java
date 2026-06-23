package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.domain.ParkingSession;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/parking-sessions")
@RequiredArgsConstructor
public class ParkingSessionController {

    private final ParkingSessionRepository parkingSessionRepository;

    /**
     * GET /api/v1/parking-sessions/my-active
     * Khách hàng xem xe đang đỗ qua biển số (truyền qua query param)
     */
    @GetMapping("/my-active")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyActiveSession(
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) String rfid) {

        ParkingSession session = null;

        if (plate != null && !plate.isBlank()) {
            session = parkingSessionRepository.findByPlateAndStatus(plate.trim().toUpperCase(), "ACTIVE").orElse(null);
        } else if (rfid != null && !rfid.isBlank()) {
            session = parkingSessionRepository.findByRfidCard_CardCodeAndStatus(rfid.trim(), "ACTIVE").orElse(null);
        }

        if (session == null) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("found", false);
            empty.put("message", "Không tìm thấy phiên đỗ xe đang hoạt động");
            return ResponseEntity.ok(ApiResponse.success(empty, "Không có xe đang đỗ"));
        }

        Map<String, Object> result = toSessionMap(session);
        result.put("found", true);
        return ResponseEntity.ok(ApiResponse.success(result, "Tìm thấy phiên đỗ xe"));
    }

    /**
     * GET /api/v1/parking-sessions/history?plate=...
     * Lịch sử đỗ xe theo biển số
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHistory(
            @RequestParam String plate) {

        List<Map<String, Object>> history = parkingSessionRepository
                .findByPlateOrderByTimeInDesc(plate.trim().toUpperCase())
                .stream()
                .map(this::toSessionMap)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(history, "Fetched parking history"));
    }

    private Map<String, Object> toSessionMap(ParkingSession ps) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", ps.getId());
        map.put("plate", ps.getPlate());
        map.put("vehicleType", ps.getVehicleType() != null ? ps.getVehicleType().getTypeName() : null);
        map.put("rfid", ps.getRfidCard() != null ? ps.getRfidCard().getCardCode() : null);
        map.put("timeIn", ps.getTimeIn());
        map.put("timeOut", ps.getTimeOut());
        map.put("gateInName", ps.getGateIn() != null ? ps.getGateIn().getGateName() : null);
        map.put("gateOutName", ps.getGateOut() != null ? ps.getGateOut().getGateName() : null);
        map.put("totalFee", ps.getTotalFee());
        map.put("status", ps.getStatus());
        return map;
    }
}
