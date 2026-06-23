package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.domain.MonthlyTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonthlyTicketRepository extends JpaRepository<MonthlyTicket, Long> {
    Optional<MonthlyTicket> findByPlateAndStatus(String plate, String status);
    Optional<MonthlyTicket> findByRfidCard_CardCodeAndStatus(String cardCode, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM MonthlyTicket m JOIN ParkingSession p ON m.plate = p.plate WHERE m.status = 'ACTIVE' AND p.status = 'ACTIVE'")
    long countActiveMonthlyTicketsInside();
}
