package com.pbms.modules.finance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> getRevenueOverview(String startDate, String endDate) {
        String query = """
            SELECT 
                SUM(amount) as totalRevenue,
                COUNT(id) as totalTransactions
            FROM transactions 
            WHERE status = 'SUCCESS' 
              AND created_at >= ? AND created_at <= ?
        """;
        Map<String, Object> overview = jdbcTemplate.queryForMap(query, startDate, endDate);
        
        String dailyQuery = """
            SELECT 
                CAST(created_at AS DATE) as date,
                SUM(amount) as revenue
            FROM transactions
            WHERE status = 'SUCCESS'
              AND created_at >= ? AND created_at <= ?
            GROUP BY CAST(created_at AS DATE)
            ORDER BY date
        """;
        List<Map<String, Object>> dailyRevenue = jdbcTemplate.queryForList(dailyQuery, startDate, endDate);
        
        String byVehicleQuery = """
            SELECT 
                COALESCE(vt.type_name, 'UNKNOWN') as name, 
                SUM(t.amount) as value 
            FROM transactions t
            LEFT JOIN parking_sessions ps ON t.parking_session_id = ps.id
            LEFT JOIN monthly_tickets mt ON t.monthly_ticket_id = mt.id
            LEFT JOIN vehicle_types vt ON ps.vehicle_type_id = vt.id OR mt.vehicle_type_id = vt.id
            WHERE t.status = 'SUCCESS' AND t.created_at >= ? AND t.created_at <= ? 
            GROUP BY COALESCE(vt.type_name, 'UNKNOWN')
        """;
        List<Map<String, Object>> byVehicle = jdbcTemplate.queryForList(byVehicleQuery, startDate, endDate);

        String bySourceQuery = """
            SELECT 
                CASE 
                    WHEN mt.id IS NOT NULL THEN 'MONTHLY_PASS'
                    WHEN ps.id IS NOT NULL AND ps.reservation_id IS NOT NULL THEN 'PRE_BOOKING'
                    WHEN ps.id IS NOT NULL THEN 'WALK_IN'
                    ELSE 'OTHER'
                END as name, 
                SUM(t.amount) as value 
            FROM transactions t
            LEFT JOIN parking_sessions ps ON t.parking_session_id = ps.id
            LEFT JOIN monthly_tickets mt ON t.monthly_ticket_id = mt.id
            WHERE t.status = 'SUCCESS' AND t.created_at >= ? AND t.created_at <= ? 
            GROUP BY 
                CASE 
                    WHEN mt.id IS NOT NULL THEN 'MONTHLY_PASS'
                    WHEN ps.id IS NOT NULL AND ps.reservation_id IS NOT NULL THEN 'PRE_BOOKING'
                    WHEN ps.id IS NOT NULL THEN 'WALK_IN'
                    ELSE 'OTHER'
                END
        """;
        List<Map<String, Object>> bySource = jdbcTemplate.queryForList(bySourceQuery, startDate, endDate);

        String byPaymentQuery = """
            SELECT 
                payment_method as name, 
                SUM(amount) as value 
            FROM transactions 
            WHERE status = 'SUCCESS' AND created_at >= ? AND created_at <= ? 
            GROUP BY payment_method
        """;
        List<Map<String, Object>> byPayment = jdbcTemplate.queryForList(byPaymentQuery, startDate, endDate);

        return Map.of(
            "overview", overview,
            "dailyRevenue", dailyRevenue,
            "byVehicle", byVehicle,
            "bySource", bySource,
            "byPayment", byPayment
        );
    }

    public Map<String, Object> getOperationalOverview() {
        String activeSessionsQuery = """
            SELECT COUNT(id) as activeCount 
            FROM parking_sessions 
            WHERE status IN ('ACTIVE', 'BOOKED')
        """;
        Integer activeCount = jdbcTemplate.queryForObject(activeSessionsQuery, Integer.class);

        String violationQuery = """
            SELECT COUNT(id) as violationCount 
            FROM incident_tickets 
            WHERE status = 'PENDING'
        """;
        Integer violationCount = jdbcTemplate.queryForObject(violationQuery, Integer.class);

        String typeQuery = """
            SELECT vehicle_type, COUNT(id) as count
            FROM parking_sessions
            WHERE status IN ('ACTIVE', 'BOOKED')
            GROUP BY vehicle_type
        """;
        List<Map<String, Object>> byVehicleType = jdbcTemplate.queryForList(typeQuery);

        return Map.of(
            "activeSessions", activeCount != null ? activeCount : 0,
            "pendingViolations", violationCount != null ? violationCount : 0,
            "byVehicleType", byVehicleType
        );
    }
}
