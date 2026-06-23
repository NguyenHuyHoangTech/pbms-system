package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.domain.ParkingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    
    @Query("SELECT COUNT(ps) FROM ParkingSession ps WHERE ps.status = 'ACTIVE' AND ps.vehicleType.id = :vehicleTypeId " +
           "AND ps.plate IN (SELECT mt.plate FROM MonthlyTicket mt WHERE mt.status = 'ACTIVE' AND mt.validUntil > CURRENT_TIMESTAMP)")
    long countActiveMonthlyCarsByVehicleType(@Param("vehicleTypeId") Long vehicleTypeId);
    
    Optional<ParkingSession> findByRfidCard_CardCodeAndStatus(String cardCode, String status);
    Optional<ParkingSession> findByPlateAndStatus(String plate, String status);

    //UC-406: Tìm phiên xe vãng lai theo biển số + RFID + trạng thái, không phân biệt hoa thường.
    @EntityGraph(attributePaths = {
            "vehicleType", "rfidCard", "slot", "slot.zone", "slot.zone.floor",
            "reservation", "reservation.vehicle", "reservation.vehicle.user"
    })
    Optional<ParkingSession> findByPlateIgnoreCaseAndRfidCard_CardCodeAndStatusAndReservationIsNull(
            String plate,
            String cardCode,
            String status
    );

    //UC-406: Lấy các phiên booking của user theo email và trạng thái, sắp xếp phiên mới nhất trước.
    @EntityGraph(attributePaths = {
            "vehicleType", "rfidCard", "slot", "slot.zone", "slot.zone.floor",
            "reservation", "reservation.vehicle", "reservation.vehicle.user"
    })
    List<ParkingSession> findByReservation_Vehicle_User_EmailAndStatusOrderByTimeInDesc(
            String email,
            String status
    );
    List<ParkingSession> findByStatus(String status);
    List<ParkingSession> findByPlateOrderByTimeInDesc(String plate);
    List<ParkingSession> findByGateInIdAndTimeOutBetween(Long gateId, LocalDateTime start, LocalDateTime end);
}
