package com.pbms.modules.infrastructure.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.dto.CustomerSlotDTO;
import com.pbms.modules.infrastructure.dto.SlotAvailabilityDTO;
import com.pbms.modules.infrastructure.service.CustomerSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/slots")
@RequiredArgsConstructor
public class CustomerSlotController {

    private final CustomerSlotService customerSlotService;

    //UC-401: API lấy danh sách slot customer có thể chọn theo tầng và loại xe.
    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerSlotDTO>>> getSlots(
            @RequestParam Long floorId,
            @RequestParam Long vehicleTypeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerSlotService.getSlots(floorId, vehicleTypeId),
                "Fetched bookable slots successfully"
        ));
    }

    //UC-401: API kiểm tra một slot có còn đặt được trong khoảng thời gian customer chọn không.
    @GetMapping("/{slotId}/availability")
    public ResponseEntity<ApiResponse<SlotAvailabilityDTO>> checkAvailability(
            @PathVariable Long slotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime expectedEntryTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime expectedEndTime
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerSlotService.checkAvailability(slotId, expectedEntryTime, expectedEndTime),
                "Checked slot availability successfully"
        ));
    }
}
