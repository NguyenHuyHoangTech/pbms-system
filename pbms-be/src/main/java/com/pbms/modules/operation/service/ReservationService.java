package com.pbms.modules.operation.service;

import com.pbms.common.exception.BusinessException;
import com.pbms.common.utils.TimeProvider;
import com.pbms.modules.finance.service.PricingCalculatorService;
import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.repository.UserRepository;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.infrastructure.service.CustomerSlotService;
import com.pbms.modules.operation.domain.Reservation;
import com.pbms.modules.operation.domain.ReservationStatus;
import com.pbms.modules.operation.domain.Vehicle;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.dto.CreateReservationRequest;
import com.pbms.modules.operation.dto.ReservationDTO;
import com.pbms.modules.operation.repository.ReservationRepository;
import com.pbms.modules.operation.repository.VehicleRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final SlotRepository slotRepository;
    private final CustomerSlotService customerSlotService;
    private final PricingCalculatorService pricingCalculatorService;
    private final BookingPolicyService bookingPolicyService;
    private final ReservationScheduler reservationScheduler;

    //UC-401: Lấy danh sách reservation theo quyền: customer chỉ thấy của mình, staff/admin thấy tất cả.
    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservations(String email, boolean elevatedAccess) {
        List<Reservation> reservations = elevatedAccess
                ? reservationRepository.findAllByOrderByCreatedAtDesc()
                : reservationRepository.findAllByVehicle_User_EmailOrderByCreatedAtDesc(email);
        return reservations.stream().map(this::mapToDTO).toList();
    }

    //UC-401: Tính phí dự kiến dựa trên loại xe, thời gian bắt đầu và thời lượng gửi.
    public BigDecimal previewPrice(Long vehicleTypeId, Integer durationMinutes, LocalDateTime entryTime) {
        if (vehicleTypeId == null || durationMinutes == null || durationMinutes <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Vehicle type and positive duration are required");
        }
        LocalDateTime start = entryTime == null ? TimeProvider.now() : entryTime;
        return pricingCalculatorService.calculateTotalFee(
                vehicleTypeId,
                start,
                start.plusMinutes(durationMinutes)
        );
    }

    // UC-401: Tạo reservation đã thanh toán.
    @Transactional
    public ReservationDTO createReservation(String email, CreateReservationRequest request) {
        LocalDateTime now = TimeProvider.now();
        validateBookingWindow(request, now);

        User customer = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        if (!"ACTIVE".equals(customer.getStatus())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customer account is not active");
        }

        String normalizedPlate = normalizePlate(request.getPlateNumber());
        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Vehicle type not found"));
        Vehicle vehicle = getOrCreateVehicle(customer, vehicleType, normalizedPlate);

        LocalDateTime end = request.getExpectedEntryTime().plusMinutes(request.getExpectedDurationMinutes());
        boolean vehicleHasOverlap = reservationRepository
                .findByVehicle_PlateNumberAndStatusIn(normalizedPlate, ReservationStatus.SLOT_BLOCKING)
                .stream()
                .anyMatch(existing -> CustomerSlotService.overlaps(
                        existing, request.getExpectedEntryTime(), end));
        if (vehicleHasOverlap) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "This vehicle already has a reservation in the selected time range");
        }

        Slot slot = selectAndLockSlot(request, vehicleType, end);
        BigDecimal fee = previewPrice(
                request.getVehicleTypeId(),
                request.getExpectedDurationMinutes(),
                request.getExpectedEntryTime()
        );

        Reservation reservation = Reservation.builder()
                .vehicle(vehicle)
                .slot(slot)
                .expectedEntryTime(request.getExpectedEntryTime())
                .expectedDurationMinutes(request.getExpectedDurationMinutes())
                .status(ReservationStatus.PAID)
                .reservationFee(fee)
                .qrCode("RSV-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .refundAmount(BigDecimal.ZERO)
                .build();

        Reservation saved = reservationRepository.save(reservation);
        reservationScheduler.schedule(saved);   // UC-402: lên lịch xử lý vòng đời booking như no-show/overstay.
        return mapToDTO(saved);
    }

    //UC-407: Xử lý hủy, tính hoàn tiền
    /*
    Hoàn 100%: Hủy trước thời gian chuẩn bị slot.
    Hoàn 50%: Hủy sát giờ nhưng chưa đến giờ booking.
    Hoàn 0%: Hủy sau giờ booking.
     */
    @Transactional
    public ReservationDTO cancelReservation(Long reservationId, String email, boolean elevatedAccess) {
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Reservation not found"));
        assertOwnership(reservation, email, elevatedAccess);
        if (!ReservationStatus.PAID.equals(reservation.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only a paid reservation can be cancelled");
        }

        LocalDateTime now = TimeProvider.now();
        int prepMinutes = bookingPolicyService.getInt(BookingPolicyService.PREP_TIME_MINS);
        BigDecimal refund;
        if (now.isBefore(reservation.getExpectedEntryTime().minusMinutes(prepMinutes))) {
            refund = reservation.getReservationFee();
            reservation.setStatus(ReservationStatus.PENDING_FULL_REFUND);
            reservation.setRefundStatus("PENDING_FULL_REFUND");
        } else if (now.isBefore(reservation.getExpectedEntryTime())) {
            refund = reservation.getReservationFee().divide(BigDecimal.valueOf(2));
            reservation.setStatus(ReservationStatus.PENDING_HALF_REFUND);
            reservation.setRefundStatus("PENDING_HALF_REFUND");
        } else {
            refund = BigDecimal.ZERO;
            reservation.setStatus(ReservationStatus.CANCELLED_NO_REFUND);
            reservation.setRefundStatus("NO_REFUND");
        }
        reservation.setRefundAmount(refund);
        releaseReservedSlot(reservation.getSlot());
        return mapToDTO(reservationRepository.save(reservation));
    }

    /*
    UC-407: Đổi slot.
     */
    @Transactional
    public ReservationDTO reassignSlot(Long reservationId, Long newSlotId) {
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!ReservationStatus.PAID.equals(reservation.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only a paid reservation can be reassigned");
        }
        if (reservation.getSlot().getId().equals(newSlotId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "New slot must be different");
        }

        Long oldSlotId = reservation.getSlot().getId();
        Long firstLockId = Math.min(oldSlotId, newSlotId);
        Long secondLockId = Math.max(oldSlotId, newSlotId);
        Slot firstLocked = slotRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Slot not found"));
        Slot secondLocked = slotRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Slot not found"));
        Slot oldSlot = oldSlotId.equals(firstLockId) ? firstLocked : secondLocked;
        Slot newSlot = newSlotId.equals(firstLockId) ? firstLocked : secondLocked;
        if (!newSlot.getZone().getVehicleType().getId()
                .equals(reservation.getVehicle().getVehicleType().getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "New slot does not support the reservation vehicle type");
        }

        LocalDateTime end = reservation.getExpectedEntryTime()
                .plusMinutes(reservation.getExpectedDurationMinutes());
        customerSlotService.ensureBookable(newSlot, reservation.getExpectedEntryTime(), end);
        releaseReservedSlot(oldSlot);
        reservation.setSlot(newSlot);

        int prepMinutes = bookingPolicyService.getInt(BookingPolicyService.PREP_TIME_MINS);
        if (!TimeProvider.now().isBefore(reservation.getExpectedEntryTime().minusMinutes(prepMinutes))) {
            if (!CustomerSlotService.PHYSICALLY_AVAILABLE.contains(newSlot.getStatus())) {
                throw new BusinessException(HttpStatus.CONFLICT, "New slot is not physically available");
            }
            newSlot.setStatus("RESERVED");
            slotRepository.save(newSlot);
        }
        return mapToDTO(reservationRepository.save(reservation));
    }

    //UC-401: Kiểm tra rule đặt chỗ: phải đặt trước tối thiểu bao nhiêu phút, không được đặt quá xa, không vượt quá thời lượng cho phép.
    private void validateBookingWindow(CreateReservationRequest request, LocalDateTime now) {
        LocalDateTime start = request.getExpectedEntryTime();
        int prepMinutes = bookingPolicyService.getInt(BookingPolicyService.PREP_TIME_MINS);
        int maxAdvanceHours = bookingPolicyService.getInt(BookingPolicyService.MAX_ADVANCE_HOURS);
        int maxDurationHours = bookingPolicyService.getInt(BookingPolicyService.MAX_DURATION_HOURS);

        if (start.isBefore(now.plusMinutes(prepMinutes))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Reservation must be made at least " + prepMinutes + " minutes in advance");
        }
        if (start.isAfter(now.plusHours(maxAdvanceHours))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Reservation cannot be more than " + maxAdvanceHours + " hours in advance");
        }
        if (request.getExpectedDurationMinutes() > maxDurationHours * 60) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Reservation duration cannot exceed " + maxDurationHours + " hours");
        }
    }

    //UC-401: Tìm xe theo biển số. Nếu chưa có thì tạo mới, nếu đã có thì kiểm tra đúng chủ xe và đúng loại xe.
    private Vehicle getOrCreateVehicle(User customer, VehicleType type, String plate) {
        return vehicleRepository.findByPlateNumber(plate).map(existing -> {
            if (existing.getUser() != null && !existing.getUser().getId().equals(customer.getId())) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "Plate number belongs to another customer account");
            }
            if (existing.getVehicleType() == null
                    || !existing.getVehicleType().getId().equals(type.getId())) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "Plate number is registered with another vehicle type");
            }
            if (existing.getUser() == null) {
                existing.setUser(customer);
                return vehicleRepository.save(existing);
            }
            return existing;
        }).orElseGet(() -> vehicleRepository.save(Vehicle.builder()
                .user(customer)
                .vehicleType(type)
                .plateNumber(plate)
                .status("ACTIVE")
                .isBlacklisted(false)
                .build()));
    }

    //UC-401: Chọn slot cho booking. Nếu user chọn slot cụ thể thì lock slot đó; nếu không thì tự tìm slot còn trống trong zone.
    private Slot selectAndLockSlot(
            CreateReservationRequest request,
            VehicleType vehicleType,
            LocalDateTime end
    ) {
        if (request.getSlotId() != null) {
            Slot slot = slotRepository.findByIdForUpdate(request.getSlotId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Slot not found"));
            validateSlotContext(slot, request.getZoneId(), vehicleType.getId());
            customerSlotService.ensureBookable(slot, request.getExpectedEntryTime(), end);
            return slot;
        }

        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Zone not found"));
        validateZone(zone, vehicleType.getId());
        return slotRepository.findAvailableByZoneForUpdate(
                        zone.getId(), CustomerSlotService.PHYSICALLY_AVAILABLE)
                .stream()
                .filter(candidate -> reservationRepository
                        .findBySlot_IdAndStatusIn(candidate.getId(), ReservationStatus.SLOT_BLOCKING)
                        .stream()
                        .noneMatch(existing -> CustomerSlotService.overlaps(
                                existing, request.getExpectedEntryTime(), end)))
                .findFirst()
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT,
                        "No slot is available in this zone for the selected time range"));
    }

    //UC-401: Kiểm tra slot có thuộc đúng zone và đúng loại xe không.
    private void validateSlotContext(Slot slot, Long requestedZoneId, Long vehicleTypeId) {
        validateZone(slot.getZone(), vehicleTypeId);
        if (requestedZoneId != null && !requestedZoneId.equals(slot.getZone().getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Slot does not belong to selected zone");
        }
    }

    //UC-401: Kiểm tra zone còn active, có hỗ trợ booking, và đúng loại phương tiện.
    private void validateZone(Zone zone, Long vehicleTypeId) {
        if (!"ACTIVE".equals(zone.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Zone is not active");
        }
        if (!Set.of("WALK_IN", "BOOKING").contains(zone.getFunctionType())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Zone does not accept pre-booking");
        }
        if (!vehicleTypeId.equals(zone.getVehicleType().getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Zone does not support selected vehicle type");
        }
    }

    //UC-407: Kiểm tra người dùng có quyền hủy/đổi booking này không.
    private void assertOwnership(Reservation reservation, String email, boolean elevatedAccess) {
        if (elevatedAccess) {
            return;
        }
        User owner = reservation.getVehicle().getUser();
        if (owner == null || !owner.getEmail().equalsIgnoreCase(email)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
    }

    //UC-407: Trả slot đã giữ về trạng thái trống sau khi hủy/đổi booking.
    private void releaseReservedSlot(Slot slot) {
        if ("RESERVED".equals(slot.getStatus())) {
            slot.setStatus("AVAILABLE");
            slot.setCurrentPlate(null);
            slotRepository.save(slot);
        }
    }

    //UC-401: Chuẩn hóa biển số: trim, viết hoa, bỏ khoảng trắng.
    private String normalizePlate(String plate) {
        return plate.trim().toUpperCase().replace(" ", "");
    }

    //UC-401: Convert entity Reservation sang ReservationDTO để trả về API.
    ReservationDTO mapToDTO(Reservation reservation) {
        Slot slot = reservation.getSlot();
        return ReservationDTO.builder()
                .id(reservation.getId())
                .customerId(reservation.getVehicle().getUser() == null
                        ? null : reservation.getVehicle().getUser().getId())
                .plateNumber(reservation.getVehicle().getPlateNumber())
                .vehicleType(reservation.getVehicle().getVehicleType().getTypeName())
                .zoneId(slot.getZone().getId())
                .zoneName(slot.getZone().getZoneName())
                .slotId(slot.getId())
                .slotName(slot.getSlotName())
                .expectedEntryTime(reservation.getExpectedEntryTime())
                .expectedDurationMinutes(reservation.getExpectedDurationMinutes())
                .expectedEndTime(reservation.getExpectedEntryTime()
                        .plusMinutes(reservation.getExpectedDurationMinutes()))
                .status(reservation.getStatus())
                .reservationFee(reservation.getReservationFee())
                .qrCode(reservation.getQrCode())
                .refundStatus(reservation.getRefundStatus())
                .refundAmount(reservation.getRefundAmount())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
