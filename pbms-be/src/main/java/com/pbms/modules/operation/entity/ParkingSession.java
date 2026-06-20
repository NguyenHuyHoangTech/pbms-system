package com.pbms.modules.operation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "parking_sessions")
public class ParkingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plate_number", nullable = false)
    private String plateNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfid_card_id")
    private RfidCard rfidCard;

    @Column(name = "time_in", nullable = false)
    private LocalDateTime timeIn;

    @Column(name = "time_out")
    private LocalDateTime timeOut;

    @Column(name = "gate_in_id")
    private Long gateInId;

    @Column(name = "gate_out_id")
    private Long gateOutId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_slot_id")
    private Slot allocatedSlot;

    @Column(name = "checkout_staff_id")
    private Long checkoutStaffId;

    @Column(name = "expiry_time")
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "total_fee")
    private BigDecimal totalFee;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        timeIn = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
