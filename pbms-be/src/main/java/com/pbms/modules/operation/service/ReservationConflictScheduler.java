package com.pbms.modules.operation.service;

import com.pbms.modules.system.service.SystemConfigService;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.dto.ZoneRoutingStatusDTO;
import com.pbms.modules.operation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationConflictScheduler {

    private final ReservationRepository reservationRepository;
    private final ZoneRoutingService zoneRoutingService;
    private final SystemConfigService systemConfigService;
    private final SimpMessagingTemplate messagingTemplate;

    // Track notified reservations and their state ("CONFLICT" or "RESERVED")
    private final Map<Long, String> notifiedReservations = new ConcurrentHashMap<>();

    @EventListener(com.pbms.common.event.TimeFastForwardedEvent.class)
    public void onTimeFastForwarded(com.pbms.common.event.TimeFastForwardedEvent event) {
        detectZoneConflicts();
        expireUnusedReservations();
    }

    @Transactional
    @Scheduled(cron = "0 * * * * *") // Run every minute
    public void detectZoneConflicts() {
        try {
            int windowMinutes = 30; // default
            try {
                String configVal = systemConfigService.getConfigByKey("RESERVATION_EARLY_MINS").getConfigValue();
                if (configVal != null) {
                    windowMinutes = Integer.parseInt(configVal);
                }
            } catch (Exception e) {
                log.warn("Could not read RESERVATION_EARLY_MINS, using default 30", e);
            }

            LocalDateTime now = com.pbms.common.utils.TimeProvider.now();
            LocalDateTime windowEnd = now.plusMinutes(windowMinutes).plusMinutes(1); // Add 1 min padding for seconds precision

            log.info("detectZoneConflicts: now={}, windowEnd={}, windowMinutes={}", now, windowEnd, windowMinutes);

            List<Reservation> upcomingReservations = reservationRepository.findUpcomingReservations("PENDING", now, windowEnd);
            
            log.info("detectZoneConflicts: Found {} upcoming reservations", upcomingReservations.size());

            for (Reservation r : upcomingReservations) {
                Long zoneId = r.getZone().getId();
                Long floorId = r.getZone().getFloor().getId();
                Long vehicleTypeId = r.getVehicle().getVehicleType().getId();

                List<ZoneRoutingStatusDTO> statuses = zoneRoutingService.getRoutingStatus(vehicleTypeId, "BOOK", floorId);
                
                boolean isFull = false;
                for (ZoneRoutingStatusDTO status : statuses) {
                    if (status.getZoneId().equals(zoneId)) {
                        if (status.getAvailable() <= 0) {
                            isFull = true;
                        }
                        break;
                    }
                }

                String currentState = notifiedReservations.get(r.getId());

                if (isFull) {
                    if (!"CONFLICT".equals(currentState)) {
                        log.warn("Reservation {} is approaching but Zone {} is FULL!", r.getId(), r.getZone().getZoneName());
                        notifiedReservations.put(r.getId(), "CONFLICT");

                        String destination = "/topic/staff/notifications";
                        String message = String.format("{\"type\":\"ZONE_CONFLICT\", \"reservationId\":%d, \"zoneName\":\"%s\", \"customer\":\"%s\", \"plate\":\"%s\", \"vehicleTypeId\":%d, \"message\":\"Zone is FULL for upcoming reservation. Please resolve!\"}",
                                r.getId(),
                                r.getZone().getZoneName(),
                                r.getVehicle().getUser() != null ? r.getVehicle().getUser().getFullName() : "Guest",
                                r.getVehicle().getPlateNumber(),
                                vehicleTypeId
                        );
                        messagingTemplate.convertAndSend(destination, message);
                    }
                } else {
                    if (!"RESERVED".equals(currentState)) {
                        log.info("Reservation {} virtual slot reserved in Zone {}", r.getId(), r.getZone().getZoneName());
                        notifiedReservations.put(r.getId(), "RESERVED");

                        String destination = "/topic/staff/notifications";
                        String message = String.format("{\"type\":\"ZONE_RESERVED\", \"reservationId\":%d, \"zoneName\":\"%s\", \"customer\":\"%s\", \"plate\":\"%s\", \"vehicleTypeId\":%d, \"message\":\"Virtual slot reserved successfully.\"}",
                                r.getId(),
                                r.getZone().getZoneName(),
                                r.getVehicle().getUser() != null ? r.getVehicle().getUser().getFullName() : "Guest",
                                r.getVehicle().getPlateNumber(),
                                vehicleTypeId
                        );
                        messagingTemplate.convertAndSend(destination, message);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in ReservationConflictScheduler", e);
        }
    }

    @Transactional
    public void attemptResolveConflict(Long reservationId) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        if (!"PENDING".equals(r.getStatus())) {
            throw new IllegalStateException("Reservation is not PENDING");
        }

        Long zoneId = r.getZone().getId();
        Long floorId = r.getZone().getFloor().getId();
        Long vehicleTypeId = r.getVehicle().getVehicleType().getId();

        List<ZoneRoutingStatusDTO> statuses = zoneRoutingService.getRoutingStatus(vehicleTypeId, "BOOK", floorId);
        
        boolean isFull = false;
        for (ZoneRoutingStatusDTO status : statuses) {
            if (status.getZoneId().equals(zoneId)) {
                if (status.getAvailable() <= 0) {
                    isFull = true;
                }
                break;
            }
        }

        if (isFull) {
            throw new IllegalStateException("Zone is still full!");
        }

        // Successfully resolved
        notifiedReservations.put(r.getId(), "RESERVED");
        String destination = "/topic/staff/notifications";
        String message = String.format("{\"type\":\"ZONE_RESERVED\", \"reservationId\":%d, \"zoneName\":\"%s\", \"customer\":\"%s\", \"plate\":\"%s\", \"vehicleTypeId\":%d, \"message\":\"Virtual slot reserved successfully.\"}",
                r.getId(),
                r.getZone().getZoneName(),
                r.getVehicle().getUser() != null ? r.getVehicle().getUser().getFullName() : "Guest",
                r.getVehicle().getPlateNumber(),
                vehicleTypeId
        );
        messagingTemplate.convertAndSend(destination, message);
    }

    public void removeNotificationFlag(Long reservationId) {
        notifiedReservations.remove(reservationId);
    }

    @Transactional
    @Scheduled(cron = "0 * * * * *")
    public void expireUnusedReservations() {
        try {
            LocalDateTime now = com.pbms.common.utils.TimeProvider.now();
            List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING");
            
            for (Reservation r : pendingReservations) {
                if (r.getExpectedEntryTime() != null) {
                    int duration = r.getExpectedDurationMinutes() != null ? r.getExpectedDurationMinutes() : 120;
                    LocalDateTime expireTime = r.getExpectedEntryTime().plusMinutes(duration);
                    if (now.isAfter(expireTime)) {
                        log.info("Reservation {} has expired without arrival, marking as COMPLETED_UNUSED", r.getId());
                        r.setStatus("COMPLETED_UNUSED");
                        reservationRepository.save(r);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in expireUnusedReservations", e);
        }
    }
}
