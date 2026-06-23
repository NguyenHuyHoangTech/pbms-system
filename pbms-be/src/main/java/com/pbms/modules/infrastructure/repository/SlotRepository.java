package com.pbms.modules.infrastructure.repository;

import com.pbms.modules.infrastructure.domain.Slot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    long countByZoneIdAndStatus(Long zoneId, String status);
    long countByZoneId(Long zoneId);
    List<Slot> findByZoneId(Long zoneId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"zone", "zone.floor", "zone.vehicleType"})
    @Query("select s from Slot s where s.id = :id")
    Optional<Slot> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"zone", "zone.floor", "zone.vehicleType"})
    @Query("select s from Slot s where s.zone.id = :zoneId and s.status in :statuses order by s.id")
    List<Slot> findAvailableByZoneForUpdate(
            @Param("zoneId") Long zoneId,
            @Param("statuses") Collection<String> statuses
    );

    @EntityGraph(attributePaths = {"zone", "zone.floor", "zone.vehicleType"})
    @Query("select s from Slot s where s.zone.floor.id = :floorId " +
            "and s.zone.vehicleType.id = :vehicleTypeId and s.zone.status = 'ACTIVE' " +
            "order by s.zone.zoneName, s.slotName")
    List<Slot> findCustomerSlots(
            @Param("floorId") Long floorId,
            @Param("vehicleTypeId") Long vehicleTypeId
    );

    //UC-403: Xem sức chứa và trạng thái slot real-time
    @Query("select s.zone.vehicleType.id as vehicleTypeId, " +
            "s.zone.vehicleType.typeName as vehicleType, count(s.id) as totalSlots, " +
            "sum(case when s.status in ('AVAILABLE', 'EMPTY') then 1 else 0 end) as availableSlots " +
            "from Slot s where s.zone.status = 'ACTIVE' " +
            "group by s.zone.vehicleType.id, s.zone.vehicleType.typeName " +
            "order by s.zone.vehicleType.typeName")
    List<VehicleAvailabilityView> summarizeAvailabilityByVehicleType();
}
