package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findAllByOrderByCreatedAtDesc();
    long countByZoneIdAndStatus(Long zoneId, String status);
    List<Reservation> findByVehicle_PlateNumberAndStatus(String plateNumber, String status);
    List<Reservation> findByStatus(String status);
}
