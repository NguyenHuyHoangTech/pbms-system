package com.pbms.modules.operation.service;

import com.pbms.modules.system.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingPolicyService {

    public static final String PREP_TIME_MINS = "BOOKING_PREP_TIME_MINS";
    public static final String MAX_ADVANCE_HOURS = "BOOKING_MAX_ADVANCE_HOURS";
    public static final String MAX_DURATION_HOURS = "BOOKING_MAX_DURATION_HOURS";

    // Mặc định nếu DB chưa có config: 30 phút chuẩn bị, đặt trước tối đa 24h, thời lượng tối đa 12h.
    private static final Map<String, Integer> DEFAULTS = Map.of(
            PREP_TIME_MINS, 30,
            MAX_ADVANCE_HOURS, 24,
            MAX_DURATION_HOURS, 12
    );

    private final SystemConfigRepository systemConfigRepository;

    //UC-401: Lấy rule đặt chỗ từ DB, ví dụ đặt trước tối thiểu bao lâu, được đặt xa tối đa bao lâu.
    public int getInt(String key) {
        return systemConfigRepository.findByConfigKey(key)
                .map(cfg -> {
                    try {
                        return Integer.parseInt(cfg.getConfigValue());
                    } catch (NumberFormatException ex) {
                        throw new IllegalStateException("System config must be an integer: " + key);
                    }
                })
                .orElseGet(() -> DEFAULTS.getOrDefault(key, 0));
    }
}
