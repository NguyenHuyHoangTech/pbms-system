package com.pbms.modules.operation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class ZoneOccupancyTracker {

    private final StringRedisTemplate redisTemplate;
    
    private static final String REDIS_PREFIX = "pbms:high-water-mark:zone:";

    /**
     * Updates the peak occupancy if the current occupancy is higher than the stored one.
     */
    public void updateOccupancy(Long zoneId, BigDecimal currentOccupancy) {
        String key = REDIS_PREFIX + zoneId;
        String storedValue = redisTemplate.opsForValue().get(key);
        
        if (storedValue == null) {
            redisTemplate.opsForValue().set(key, currentOccupancy.toString());
            log.debug("Initialized peak occupancy for zone {} to {}", zoneId, currentOccupancy);
        } else {
            BigDecimal peakOccupancy = new BigDecimal(storedValue);
            if (currentOccupancy.compareTo(peakOccupancy) > 0) {
                redisTemplate.opsForValue().set(key, currentOccupancy.toString());
                log.debug("Updated peak occupancy for zone {} to {}", zoneId, currentOccupancy);
            }
        }
    }

    /**
     * Retrieves and resets the peak occupancy for a zone.
     * Called by the hourly scheduled job.
     */
    public BigDecimal getAndResetPeakOccupancy(Long zoneId, BigDecimal currentOccupancy) {
        String key = REDIS_PREFIX + zoneId;
        String storedValue = redisTemplate.opsForValue().get(key);
        
        // Reset to current occupancy for the new hour
        redisTemplate.opsForValue().set(key, currentOccupancy.toString());
        
        if (storedValue == null) {
            return currentOccupancy;
        }
        
        return new BigDecimal(storedValue);
    }
}
