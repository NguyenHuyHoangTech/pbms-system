package com.pbms.modules.operation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "staff_work_sessions")
public class StaffWorkSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "gate_id")
    private Long gateId;

    @Column(name = "working_mode")
    private String workingMode = "MANUAL";

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "sys_total_online")
    private BigDecimal sysTotalOnline = BigDecimal.ZERO;

    @Column(name = "sys_total_cash")
    private BigDecimal sysTotalCash = BigDecimal.ZERO;

    @Column(name = "declared_cash")
    private BigDecimal declaredCash;

    @Column(name = "variance_amount")
    private BigDecimal varianceAmount;

    @Column(name = "variance_reason")
    private String varianceReason;

    @Column(name = "settlement_status")
    private String settlementStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
