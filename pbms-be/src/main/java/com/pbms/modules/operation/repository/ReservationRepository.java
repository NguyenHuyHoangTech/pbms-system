package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findAllByOrderByCreatedAtDesc();
    long countByZoneIdAndStatus(Long zoneId, String status);
    List<Reservation> findByVehicle_PlateNumberAndStatus(String plateNumber, String status);
    List<Reservation> findByStatus(String status);
    //Khóa booking khi cập nhật để tránh hai request xử lý cùng lúc.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r " +
            "join fetch r.vehicle v left join fetch v.user " +
            "join fetch r.slot s join fetch s.zone z " +
            "where r.id = :id")
    Optional<Reservation> findByIdForUpdate(@Param("id") Long id);
    //Lấy booking theo danh sách trạng thái.
    @EntityGraph(attributePaths = {"vehicle", "vehicle.user", "vehicle.vehicleType", "slot", "slot.zone", "slot.zone.floor"})
    List<Reservation> findByStatusIn(Collection<String> statuses);
}
