package com.pbms.modules.infrastructure.repository;

public interface VehicleAvailabilityView {
    Long getVehicleTypeId();
    String getVehicleType();
    Long getTotalSlots();
    Long getAvailableSlots();
}
