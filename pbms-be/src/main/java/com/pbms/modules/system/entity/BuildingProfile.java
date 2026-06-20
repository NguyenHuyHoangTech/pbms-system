package com.pbms.modules.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "building_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false, length = 50)
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{10}$", message = "Hotline must be exactly 10 digits")
    private String hotline;

    @Column(name = "operating_hours", nullable = false)
    private String operatingHours;

    @Column(columnDefinition = "VARCHAR(MAX)")
    private String rules;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
