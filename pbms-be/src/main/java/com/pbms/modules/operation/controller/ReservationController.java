package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.CreateReservationRequest;
import com.pbms.modules.operation.dto.PreviewPriceRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    //UC-401: Lấy danh sách booking của user hiện tại. Nếu là admin/manager thì xem được toàn bộ.
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationDTO>>> getReservations(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.getReservations(
                        authentication.getName(),
                        hasElevatedAccess(authentication)
                ),
                "Fetched reservations successfully"
        ));
    }

    //UC-401: API tạo đặt chỗ mới. Nhận thông tin xe, khu vực/slot, thời gian dự kiến rồi gọi service xử lý booking.
    @PostMapping
    public ResponseEntity<ApiResponse<ReservationDTO>> createReservation(
            Authentication authentication,
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationDTO created = reservationService.createReservation(authentication.getName(), request);
        ApiResponse<ReservationDTO> response = ApiResponse.success(created, "Reservation created successfully");
        response.setCode(HttpStatus.CREATED.value());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //UC-401: Tính thử giá đặt chỗ trước khi customer confirm booking.
    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<BigDecimal>> previewReservationPrice(
            @Valid @RequestBody PreviewPriceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.previewPrice(
                        request.getVehicleTypeId(),
                        request.getExpectedDurationMinutes(),
                        request.getExpectedEntryTime()
                ),
                "Calculated reservation price successfully"
        ));
    }

    //UC-407: Nhận yêu cầu hủy booking từ khách hàng.
    @PatchMapping("/{reservationId}/cancel")
    public ResponseEntity<ApiResponse<ReservationDTO>> cancelReservation(
            @PathVariable Long reservationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.cancelReservation(
                        reservationId,
                        authentication.getName(),
                        hasElevatedAccess(authentication)
                ),
                "Reservation cancellation recorded successfully"
        ));
    }

    //UC-401: Check user có quyền cao không, ví dụ ROLE_MANAGER, ROLE_ADMIN.
    private boolean hasElevatedAccess(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_MANAGER")
                        || authority.getAuthority().equals("ROLE_ADMIN"));
    }
}
