package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.CreateReservationRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationDTO>>> getAllReservations() {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getAllReservations(), "Fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationDTO>> createReservation(@RequestBody CreateReservationRequest request) {
        try {
            ReservationDTO dto = reservationService.createReservation(request);
            return ResponseEntity.ok(ApiResponse.success(dto, "Reservation created successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(500, "Lỗi hệ thống: " + e.getMessage()));
        }
    public ResponseEntity<ApiResponse<ReservationDTO>> createReservation(
            Authentication authentication,
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationDTO created = reservationService.createReservation(authentication.getName(), request);
        ApiResponse<ReservationDTO> response = ApiResponse.success(created, "Reservation created successfully");
        response.setCode(HttpStatus.CREATED.value());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<java.math.BigDecimal>> previewReservationPrice(@RequestBody java.util.Map<String, Object> requestBody) {
        try {
            Long vehicleTypeId = Long.valueOf(requestBody.get("vehicleTypeId").toString());
            Integer expectedDurationMinutes = Integer.valueOf(requestBody.get("expectedDurationMinutes").toString());
            
            java.math.BigDecimal fee = reservationService.previewPrice(vehicleTypeId, expectedDurationMinutes);
            return ResponseEntity.ok(ApiResponse.success(fee, "Tính phí tạm tính thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lỗi tính phí: " + e.getMessage()));
        }
    }
}
