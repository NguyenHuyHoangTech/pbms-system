package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.operation.dto.LiveParkingSessionDTO;
import com.pbms.modules.operation.dto.WalkInLookupRequest;
import com.pbms.modules.operation.service.ParkingSessionTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user/parking")
@RequiredArgsConstructor
public class ParkingSessionController {

    private final ParkingSessionTrackingService trackingService;

    //API tra cứu phiên xe vãng lai.
    @PostMapping("/lookup-walkin")
    public ResponseEntity<ApiResponse<LiveParkingSessionDTO>> lookupWalkIn(
            @Valid @RequestBody WalkInLookupRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                trackingService.lookupWalkIn(request),
                "Fetched active walk-in session successfully"
        ));
    }

    //API lấy các phiên booking đang hoạt động.
    @GetMapping("/booking-active")
    public ResponseEntity<ApiResponse<List<LiveParkingSessionDTO>>> getMyActiveBookingSessions(
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                trackingService.getMyActiveBookingSessions(authentication.getName()),
                "Fetched active pre-booking sessions successfully"
        ));
    }
}
