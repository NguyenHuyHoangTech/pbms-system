package com.pbms.modules.operation.service;

import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.incident.service.ZoneTrendService;
import com.pbms.modules.operation.dto.IotSlotUpdateRequest;
import com.pbms.modules.operation.repository.MonthlyTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class IotIntegrationService {

    private final SlotRepository slotRepository;
    private final ZoneRepository zoneRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ZoneTrendService zoneTrendService;
    private final ZoneRoutingService zoneRoutingService;
    private final MonthlyTicketRepository monthlyTicketRepository;

    @Transactional
    public void updateSlotStatus(IotSlotUpdateRequest request) {
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        slot.setStatus(request.getStatus()); // OCCUPIED, AVAILABLE
        slotRepository.save(slot);

        Zone zone = slot.getZone();

        // 1. Push Map Update to Staff
        messagingTemplate.convertAndSend("/topic/map-updates", request);

        // 2. Push Zone Capacity Update to Manager
        messagingTemplate.convertAndSend("/topic/zone-capacity", 
                "Zone " + zone.getZoneName() + " capacity updated");

        // 3. Record Trend for peak capacity
        zoneTrendService.recordZoneTrend(zone.getId(), zoneRoutingService.calculateZoneOccupancy(zone.getId()));

        // 4. Zone Violation Check for Monthly Zone
        if ("MONTHLY".equals(zone.getFunctionType()) && "OCCUPIED".equals(request.getStatus())) {
            long monthlyCarsInside = monthlyTicketRepository.countActiveMonthlyTicketsInside();
            long occupiedMonthlySlots = slotRepository.countByZoneIdAndStatus(zone.getId(), "OCCUPIED");

            if (occupiedMonthlySlots > monthlyCarsInside) {
                log.warn("ZONE VIOLATION DETECTED in Zone {}! Occupied: {}, Monthly Inside: {}", 
                        zone.getZoneName(), occupiedMonthlySlots, monthlyCarsInside);
                
                String alertMsg = String.format("Phát hiện đỗ sai Zone: Khu vé tháng %s đang có %d xe đỗ, nhưng chỉ có %d xe vé tháng trong bãi. Vui lòng đối chiếu và xử lý vi phạm!", 
                        zone.getZoneName(), occupiedMonthlySlots, monthlyCarsInside);

                messagingTemplate.convertAndSend("/topic/alerts", alertMsg);
            }
        }
    }
}
