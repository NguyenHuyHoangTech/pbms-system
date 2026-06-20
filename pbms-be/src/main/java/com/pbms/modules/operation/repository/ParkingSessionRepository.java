package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.entity.ParkingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    List<ParkingSession> findByCheckoutStaffIdAndTimeOutBetween(Long checkoutStaffId, LocalDateTime start, LocalDateTime end);
}
