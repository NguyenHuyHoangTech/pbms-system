const fs = require('fs');
const file = 'pbms-be/src/main/java/com/pbms/modules/operation/service/ReservationService.java';
let content = fs.readFileSync(file, 'utf8');

// we will just append the method to the end of the class
const newMethod = `

    @org.springframework.transaction.annotation.Transactional
    public ReservationDTO resolveZone(Long reservationId, Long newZoneId, ReservationConflictScheduler scheduler) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
                
        if (!"PENDING".equals(reservation.getStatus())) {
            throw new IllegalStateException("Reservation is not PENDING");
        }

        Zone newZone = zoneRepository.findById(newZoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found"));

        if (!newZone.getVehicleType().getId().equals(reservation.getVehicle().getVehicleType().getId())) {
            throw new IllegalArgumentException("Zone vehicle type does not match reservation vehicle type");
        }

        reservation.setZone(newZone);
        reservationRepository.save(reservation);
        
        // Remove from notified list so scheduler can check it again if needed
        if (scheduler != null) {
            scheduler.removeNotificationFlag(reservationId);
        }

        return convertToDTO(reservation);
    }
}
`;

content = content.replace(/\n}\s*$/, newMethod);
fs.writeFileSync(file, content);
console.log('Successfully added resolveZone to ReservationService');
