package com.pbms.modules.operation.service;

import com.pbms.modules.infrastructure.domain.RoutingRule;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.RoutingRuleRepository;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
/*
Tính tỷ lệ lấp đầy của từng khu vực và đề xuất Zone phù hợp
 */
public class ZoneRoutingService {

    private final ZoneRepository zoneRepository;
    private final SlotRepository slotRepository;
    private final ReservationRepository reservationRepository;
    private final RoutingRuleRepository routingRuleRepository;

    /**
     * Calculates the real-time occupancy percentage of a zone.
     * Formula: (Occupied + Pending Reservations) / (Total - Disabled/Maintenance) * 100
     */
    public BigDecimal calculateZoneOccupancy(Long zoneId) {
        long totalSlots = slotRepository.countByZoneId(zoneId);
        if (totalSlots == 0) return BigDecimal.ZERO;

        long disabledSlots = slotRepository.countByZoneIdAndStatus(zoneId, "DISABLED");
        long effectiveCapacity = totalSlots - disabledSlots;
        
        if (effectiveCapacity <= 0) return BigDecimal.valueOf(100); // Fully disabled

        long occupiedSlots = slotRepository.countByZoneIdAndStatus(zoneId, "OCCUPIED");
        long pendingReservations = reservationRepository.countBySlot_Zone_IdAndStatusIn(
                zoneId,
                java.util.Set.of(ReservationStatus.PAID)
        );

        long effectiveLoad = occupiedSlots + pendingReservations;

        return BigDecimal.valueOf(effectiveLoad)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(effectiveCapacity), 2, RoundingMode.HALF_UP);
    }

    /**
     * Suggests the best zone for a given vehicle type based on the sliding threshold algorithm.
     */
    public Zone suggestZone(VehicleType vehicleType) {
        // 1. Get all active zones for this vehicle type, sorted alphabetically (manager fallback)
        List<Zone> zones = zoneRepository.findAll().stream()
                .filter(z -> z.getVehicleType().getId().equals(vehicleType.getId()) && "ACTIVE".equals(z.getStatus()))
                .sorted(Comparator.comparing(Zone::getZoneName))
                .collect(Collectors.toList());

        if (zones.isEmpty()) {
            log.warn("No active zones found for vehicle type: {}", vehicleType.getTypeName());
            return null;
        }

        // 2. We start the routing chain with the first zone (alphabetical order)
        Zone currentZone = zones.get(0);
        LocalTime now = LocalTime.now();
        
        while (currentZone != null) {
            BigDecimal occupancy = calculateZoneOccupancy(currentZone.getId());
            
            List<RoutingRule> rules = routingRuleRepository.findAllByZoneIdAndIsActiveTrue(currentZone.getId());
            
            // Find the matching rule for current time
            RoutingRule matchedRule = null;
            RoutingRule defaultRule = null;
            
            for (RoutingRule r : rules) {
                if (r.getIsDefault()) {
                    defaultRule = r;
                } else if (r.getStartTime() != null && r.getEndTime() != null) {
                    if (!now.isBefore(r.getStartTime()) && !now.isAfter(r.getEndTime())) {
                        matchedRule = r;
                        break; // found matching timeframe
                    }
                }
            }
            
            RoutingRule ruleToUse = matchedRule != null ? matchedRule : defaultRule;
            
            if (ruleToUse != null) {
                if (occupancy.compareTo(BigDecimal.valueOf(ruleToUse.getFillThresholdPct())) >= 0) {
                    // Threshold exceeded, slide to the next zone
                    log.info("Zone {} exceeded threshold ({} >= {}). Sliding to {}", 
                            currentZone.getZoneName(), occupancy, ruleToUse.getFillThresholdPct(), 
                            ruleToUse.getSuggestedZone() != null ? ruleToUse.getSuggestedZone().getZoneName() : "NULL");
                    
                    currentZone = ruleToUse.getSuggestedZone();
                    // Prevent infinite loop if misconfigured
                    if (currentZone != null && !zones.contains(currentZone)) {
                        break;
                    }
                } else {
                    // Below threshold, we can use this zone
                    return currentZone;
                }
            } else {
                // No routing rule for this zone. 
                // We just check if it's full (100%). If not, use it.
                if (occupancy.compareTo(BigDecimal.valueOf(100)) < 0) {
                    return currentZone;
                } else {
                    // It's 100% full, and no rule to cascade. Stop chain.
                    break;
                }
            }
        }

        // 3. Fallback Mechanism (Vét/100%): All zones in the chain are either full or exceeded thresholds.
        // We iterate again and return the first one that has ANY available slots (< 100%).
        log.warn("All zones exceeded routing thresholds for vehicle type {}. Falling back to absolute capacity check.", vehicleType.getTypeName());
        for (Zone z : zones) {
            BigDecimal occ = calculateZoneOccupancy(z.getId());
            if (occ.compareTo(BigDecimal.valueOf(100)) < 0) {
                return z;
            }
        }

        // Absolutely full
        return null;
    }
}
