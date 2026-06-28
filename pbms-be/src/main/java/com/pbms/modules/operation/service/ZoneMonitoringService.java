package com.pbms.modules.operation.service;

import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.infrastructure.service.WebSocketEventPublisher;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class ZoneMonitoringService {

    private final SlotRepository slotRepository;
    private final ZoneRepository zoneRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final WebSocketEventPublisher eventPublisher;

    public ZoneMonitoringService(SlotRepository slotRepository, ZoneRepository zoneRepository, ParkingSessionRepository parkingSessionRepository, WebSocketEventPublisher eventPublisher) {
        this.slotRepository = slotRepository;
        this.zoneRepository = zoneRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void processSensorEvent(String sensorId, String status) {
        // In a real system, sensorId might be mapped to a Slot. For this demo, let's assume sensorId == slot.id
        Long slotId = Long.parseLong(sensorId);
        Slot slot = slotRepository.findById(slotId).orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        
        slot.setStatus(status);
        slotRepository.save(slot);

        Zone zone = slot.getZone();
        
        // Broadcast the real-time slot update to the Grid Map
        Map<String, Object> slotPayload = new HashMap<>();
        slotPayload.put("slotId", slot.getId());
        slotPayload.put("zoneId", zone.getId());
        slotPayload.put("status", slot.getStatus());
        eventPublisher.broadcastEvent("/topic/slots/status", "SLOT_UPDATED", slotPayload);

        // Algorithm: Dynamic Zone Monitoring for MONTHLY zones
        if ("OCCUPIED".equals(status) && "MONTHLY".equals(zone.getFunctionType())) {
            long occupiedMonthlySlots = slotRepository.countByZoneIdAndStatus(zone.getId(), "OCCUPIED");
            long activeMonthlyCars = parkingSessionRepository.countActiveMonthlyCarsByVehicleType(zone.getVehicleType().getId());
            
            if (occupiedMonthlySlots > activeMonthlyCars) {
                // Alert! Violation detected
                Map<String, Object> alertPayload = new HashMap<>();
                alertPayload.put("zoneId", zone.getId());
                alertPayload.put("zoneName", zone.getZoneName());
                alertPayload.put("message", "High occupancy alert for zone: " + zone.getZoneName() + ". Please check it out!");
                
                eventPublisher.broadcastCriticalEvent("/topic/incidents/alerts", "ZONE_VIOLATION", alertPayload);
            }
        }
    }
}

