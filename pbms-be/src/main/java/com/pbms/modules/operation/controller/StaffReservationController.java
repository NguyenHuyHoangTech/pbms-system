package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.ReassignReservationRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operation/reservations")
@RequiredArgsConstructor
//Cung cấp API đổi slot và quản lý booking.
public class StaffReservationController {

    private final ReservationService reservationService;

    //Lấy danh sách booking theo quyền của người dùng.
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

    //Hủy booking và xử lý chính sách hoàn tiền.
    @PutMapping("/{reservationId}/cancel")
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

    //Cho Staff/Manager đổi booking sang slot khác.
    @PatchMapping("/{reservationId}/reassign-slot")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReservationDTO>> reassignSlot(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReassignReservationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.reassignSlot(reservationId, request.getNewSlotId()),
                "Reservation slot reassigned successfully"
        ));
    }

    //Kiểm tra người dùng có quyền Staff, Manager hoặc Admin.
    private boolean hasElevatedAccess(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_STAFF")
                        || authority.getAuthority().equals("ROLE_MANAGER")
                        || authority.getAuthority().equals("ROLE_ADMIN"));
    }
}
