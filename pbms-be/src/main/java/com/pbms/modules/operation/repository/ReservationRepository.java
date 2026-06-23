package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @EntityGraph(attributePaths = {"vehicle", "vehicle.user", "vehicle.vehicleType", "slot", "slot.zone", "slot.zone.floor"})
    List<Reservation> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"vehicle", "vehicle.user", "vehicle.vehicleType", "slot", "slot.zone", "slot.zone.floor"})
    List<Reservation> findAllByVehicle_User_EmailOrderByCreatedAtDesc(String email);

    long countBySlot_Zone_IdAndStatusIn(Long zoneId, Collection<String> statuses);

    List<Reservation> findByVehicle_PlateNumberAndStatus(String plateNumber, String status);
    List<Reservation> findByVehicle_PlateNumberAndStatusIn(String plateNumber, Collection<String> statuses);
    List<Reservation> findBySlot_IdAndStatusIn(Long slotId, Collection<String> statuses);
    List<Reservation> findByStatus(String status);

    //Lấy và Khóa booking khi cập nhật để tránh hai request xử lý cùng lúc.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r " +
            "join fetch r.vehicle v left join fetch v.user " +
            "join fetch r.slot s join fetch s.zone z " +
            "where r.id = :id")
    Optional<Reservation> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r " +
            "join fetch r.vehicle v left join fetch v.user " +
            "join fetch r.slot s join fetch s.zone z " +
            "where upper(v.plateNumber) = upper(:plate) and r.status = :status " +
            "order by r.expectedEntryTime")
    List<Reservation> findForCheckIn(@Param("plate") String plate, @Param("status") String status);

    //Lấy booking theo danh sách trạng thái.
    @EntityGraph(attributePaths = {"vehicle", "vehicle.user", "vehicle.vehicleType", "slot", "slot.zone", "slot.zone.floor"})
    List<Reservation> findByStatusIn(Collection<String> statuses);
}
