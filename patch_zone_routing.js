const fs = require('fs');
const file = 'pbms-be/src/main/java/com/pbms/modules/operation/service/ZoneRoutingService.java';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import com.pbms.modules.operation.repository.ParkingSessionRepository;')) {
    content = content.replace(
        'import com.pbms.modules.operation.repository.ReservationRepository;',
        'import com.pbms.modules.operation.repository.ReservationRepository;\nimport com.pbms.modules.operation.repository.ParkingSessionRepository;'
    );
}

if (!content.includes('private final ParkingSessionRepository parkingSessionRepository;')) {
    content = content.replace(
        'private final ReservationRepository reservationRepository;',
        'private final ReservationRepository reservationRepository;\n    private final ParkingSessionRepository parkingSessionRepository;'
    );
}

if (!content.includes('long activeSessionsWithoutSlot')) {
    // 1. calculateZoneOccupancy
    const oldCalc = `
        long disabledSlots = slotRepository.countByZoneIdAndStatus(zoneId, "DISABLED");
        long effectiveCapacity = totalSlots - disabledSlots;
        
        if (effectiveCapacity <= 0) return BigDecimal.valueOf(100); // Fully disabled

        long occupiedSlots = slotRepository.countByZoneIdAndStatus(zoneId, "OCCUPIED");
`;
    const newCalc = `
        long disabledSlots = slotRepository.countByZoneIdAndStatus(zoneId, "DISABLED");
        long effectiveCapacity = totalSlots - disabledSlots;
        
        if (effectiveCapacity <= 0) return BigDecimal.valueOf(100); // Fully disabled

        long occupiedSlots = slotRepository.countByZoneIdAndStatus(zoneId, "OCCUPIED");
        Zone z = zoneRepository.findById(zoneId).orElse(null);
        long activeSessionsWithoutSlot = z != null ? parkingSessionRepository.countBySuggestedZoneNameAndStatusAndSlotIsNull(z.getZoneName(), "ACTIVE") : 0;
        occupiedSlots += activeSessionsWithoutSlot;
`;
    content = content.replace(oldCalc, newCalc);

    // 2. getRoutingStatus
    const oldGet = `
        for (Zone z : allZonesToDisplay) {
            long totalSlots = slotRepository.countByZoneId(z.getId());
            long disabledSlots = slotRepository.countByZoneIdAndStatus(z.getId(), "DISABLED");
            long effectiveCapacity = totalSlots - disabledSlots;
            long occupiedSlots = slotRepository.countByZoneIdAndStatus(z.getId(), "OCCUPIED");
            
            int windowMinutes = 30;
`;
    const newGet = `
        for (Zone z : allZonesToDisplay) {
            long totalSlots = slotRepository.countByZoneId(z.getId());
            long disabledSlots = slotRepository.countByZoneIdAndStatus(z.getId(), "DISABLED");
            long effectiveCapacity = totalSlots - disabledSlots;
            long occupiedSlots = slotRepository.countByZoneIdAndStatus(z.getId(), "OCCUPIED");
            long activeSessionsWithoutSlot = parkingSessionRepository.countBySuggestedZoneNameAndStatusAndSlotIsNull(z.getZoneName(), "ACTIVE");
            occupiedSlots += activeSessionsWithoutSlot;
            
            int windowMinutes = 30;
`;
    content = content.replace(oldGet, newGet);
}

fs.writeFileSync(file, content);
console.log('Successfully patched ZoneRoutingService!');
