package com.pbms.modules.operation.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.infrastructure.dto.config.VehicleTypeDTO;
import com.pbms.modules.operation.service.VehicleTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operation/vehicle-types")
@PreAuthorize("hasRole('MANAGER')")
public class VehicleTypeController {

    private final VehicleTypeService service;

    public VehicleTypeController(VehicleTypeService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<VehicleTypeDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllVehicleTypes(), "Fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleTypeDTO>> create(@RequestBody VehicleTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(service.createVehicleType(dto), "Created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleTypeDTO>> update(@PathVariable Long id, @RequestBody VehicleTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(service.updateVehicleType(id, dto), "Vehicle type updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.deleteVehicleType(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted successfully"));
    }
}

