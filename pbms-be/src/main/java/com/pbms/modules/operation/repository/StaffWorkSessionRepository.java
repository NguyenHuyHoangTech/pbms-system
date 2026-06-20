package com.pbms.modules.operation.repository;

import com.pbms.modules.operation.entity.StaffWorkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffWorkSessionRepository extends JpaRepository<StaffWorkSession, Long> {
    Optional<StaffWorkSession> findTopByStaffIdOrderByStartedAtDesc(Long staffId);
}
