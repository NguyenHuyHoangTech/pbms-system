const fs = require('fs');
const file = 'pbms-be/src/main/java/com/pbms/modules/operation/controller/GateConsoleController.java';
let content = fs.readFileSync(file, 'utf8');

// add imports if needed
content = content.replace(
    'import com.pbms.modules.operation.service.ZoneRoutingService;',
    'import com.pbms.modules.operation.service.ZoneRoutingService;\nimport com.pbms.modules.operation.service.ReservationService;\nimport com.pbms.modules.operation.service.ReservationConflictScheduler;\nimport com.pbms.modules.operation.dto.ReservationDTO;'
);

content = content.replace(
    'private final ZoneRoutingService zoneRoutingService;',
    'private final ZoneRoutingService zoneRoutingService;\n    private final ReservationService reservationService;\n    private final ReservationConflictScheduler reservationConflictScheduler;'
);

const newEndpoint = `
    @PostMapping("/reservations/{id}/resolve-zone")
    public ResponseEntity<ApiResponse<ReservationDTO>> resolveReservationZone(
            @PathVariable Long id,
            @RequestParam Long newZoneId) {
        try {
            ReservationDTO dto = reservationService.resolveZone(id, newZoneId, reservationConflictScheduler);
            return ResponseEntity.ok(ApiResponse.success(dto, "Reservation zone resolved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
`;

content = content.replace(/\n}\s*$/, newEndpoint);
fs.writeFileSync(file, content);
console.log('Successfully added resolve zone API to GateConsoleController');
