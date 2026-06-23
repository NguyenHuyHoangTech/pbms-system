package com.pbms.modules.infrastructure.service;

import com.pbms.common.exception.BusinessException;
import com.pbms.modules.infrastructure.domain.Floor;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.dto.CustomerSlotDTO;
import com.pbms.modules.infrastructure.dto.SlotAvailabilityDTO;
import com.pbms.modules.infrastructure.repository.FloorRepository;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.repository.ReservationRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomerSlotService {

    public static final Set<String> PHYSICALLY_AVAILABLE = Set.of("AVAILABLE", "EMPTY");

    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SlotRepository slotRepository;
    private final ReservationRepository reservationRepository;

    //UC-401: Lấy danh sách slot hợp lệ cho customer theo floorId và vehicleTypeId.
    @Transactional(readOnly = true)
    public List<CustomerSlotDTO> getSlots(Long floorId, Long vehicleTypeId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Floor not found"));
        if (!vehicleTypeRepository.existsById(vehicleTypeId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Vehicle type not found");
        }

        return slotRepository.findCustomerSlots(floor.getId(), vehicleTypeId).stream()
                .map(this::toDTO)
                .toList();
    }

    //UC-401: Kiểm tra slot có khả dụng trong khoảng thời gian dự kiến không.
    @Transactional(readOnly = true)
    public SlotAvailabilityDTO checkAvailability(
            Long slotId,
            LocalDateTime expectedEntryTime,
            LocalDateTime expectedEndTime
    ) {
        if (expectedEntryTime == null || expectedEndTime == null
                || !expectedEntryTime.isBefore(expectedEndTime)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Expected entry time must be before expected end time");
        }

        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Slot not found"));
        String reason = unavailableReason(slot, expectedEntryTime, expectedEndTime);
        return SlotAvailabilityDTO.builder()
                .slotId(slot.getId())
                .slotName(slot.getSlotName())
                .physicalStatus(slot.getStatus())
                .available(reason == null)
                .message(reason == null ? "Slot is available" : reason)
                .build();
    }

    //UC-401: Dùng khi tạo booking để chắc chắn slot chưa bị đặt, không maintenance, không disabled.
    public void ensureBookable(Slot slot, LocalDateTime start, LocalDateTime end) {
        String reason = unavailableReason(slot, start, end);
        if (reason != null) {
            throw new BusinessException(HttpStatus.CONFLICT, reason);
        }
    }

    //UC-401: Trả về lý do slot không đặt được, ví dụ đang bảo trì, đã reserved, hoặc bị booking trùng giờ.
    private String unavailableReason(Slot slot, LocalDateTime start, LocalDateTime end) {
        if ("DISABLED".equals(slot.getStatus()) || "MAINTENANCE".equals(slot.getStatus())) {
            return "Slot is unavailable for maintenance";
        }
        if ("RESERVED".equals(slot.getStatus())) {
            return "Slot is currently reserved";
        }

        boolean overlaps = reservationRepository
                .findBySlot_IdAndStatusIn(slot.getId(), ReservationStatus.SLOT_BLOCKING)
                .stream()
                .anyMatch(reservation -> overlaps(reservation, start, end));
        return overlaps ? "Slot is already booked for the selected time range" : null;
    }

    //UC-401: Kiểm tra 2 khoảng thời gian booking có bị trùng nhau không.
    public static boolean overlaps(Reservation reservation, LocalDateTime start, LocalDateTime end) {
        LocalDateTime existingEnd = reservation.getExpectedEntryTime()
                .plusMinutes(reservation.getExpectedDurationMinutes());
        return reservation.getExpectedEntryTime().isBefore(end) && existingEnd.isAfter(start);
    }

    //UC-401: Convert Slot sang CustomerSlotDTO để trả về FE.
    private CustomerSlotDTO toDTO(Slot slot) {
        return CustomerSlotDTO.builder()
                .slotId(slot.getId())
                .slotName(slot.getSlotName())
                .status(slot.getStatus())
                .zoneId(slot.getZone().getId())
                .zoneName(slot.getZone().getZoneName())
                .floorId(slot.getZone().getFloor().getId())
                .floorName(slot.getZone().getFloor().getFloorName())
                .vehicleTypeId(slot.getZone().getVehicleType().getId())
                .vehicleTypeName(slot.getZone().getVehicleType().getTypeName())
                .build();
    }
}
