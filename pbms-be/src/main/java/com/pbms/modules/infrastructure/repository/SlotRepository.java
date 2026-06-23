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
    java.util.List<Slot> findByZoneId(Long zoneId);
    //UC-403: Xem sức chứa và trạng thái slot real-time
    @Query("select s.zone.vehicleType.id as vehicleTypeId, " +
            "s.zone.vehicleType.typeName as vehicleType, count(s.id) as totalSlots, " +
            "sum(case when s.status in ('AVAILABLE', 'EMPTY') then 1 else 0 end) as availableSlots " +
            "from Slot s where s.zone.status = 'ACTIVE' " +
            "group by s.zone.vehicleType.id, s.zone.vehicleType.typeName " +
            "order by s.zone.vehicleType.typeName")
    List<VehicleAvailabilityView> summarizeAvailabilityByVehicleType();
}
