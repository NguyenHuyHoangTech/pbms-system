const fs = require('fs');

// Fix ReservationService.java
const rsFile = 'pbms-be/src/main/java/com/pbms/modules/operation/service/ReservationService.java';
let rsContent = fs.readFileSync(rsFile, 'utf8');
rsContent = rsContent.replace('convertToDTO(reservation)', 'mapToDTO(reservation)');
fs.writeFileSync(rsFile, rsContent);

// Fix ReservationConflictScheduler.java
const rcsFile = 'pbms-be/src/main/java/com/pbms/modules/operation/service/ReservationConflictScheduler.java';
let rcsContent = fs.readFileSync(rcsFile, 'utf8');
rcsContent = rcsContent.replace(
    'String configVal = systemConfigService.getConfigByKey("RESERVATION_EARLY_ARRIVAL_WINDOW_MINUTES");',
    'String configVal = systemConfigService.getConfigByKey("RESERVATION_EARLY_ARRIVAL_WINDOW_MINUTES").getConfigValue();'
);
rcsContent = rcsContent.replace(
    'if (status.getAvailableSlots() <= 0) {',
    'if (status.getAvailable() <= 0) {'
);
fs.writeFileSync(rcsFile, rcsContent);

console.log('Fixed compilation errors');
