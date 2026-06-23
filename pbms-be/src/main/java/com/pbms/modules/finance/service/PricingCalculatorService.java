package com.pbms.modules.finance.service;

import com.pbms.modules.finance.domain.PricingBlock;
import com.pbms.modules.finance.domain.PricingPolicy;
import com.pbms.modules.finance.domain.PricingShift;
import com.pbms.modules.finance.repository.PricingPolicyRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PricingCalculatorService {

    private final PricingPolicyRepository policyRepository;

    public PricingCalculatorService(PricingPolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    public BigDecimal calculateTotalFee(Long vehicleTypeId, LocalDateTime checkInTime, LocalDateTime checkOutTime) {
        PricingPolicy policy = policyRepository.findByVehicleTypeIdAndStatus(vehicleTypeId, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("No active pricing policy for vehicle type: " + vehicleTypeId));

        return calculate(policy, checkInTime, checkOutTime);
    }

    public BigDecimal calculate(PricingPolicy policy, LocalDateTime checkInTime, LocalDateTime checkOutTime) {
        if (checkOutTime.isBefore(checkInTime)) {
            throw new IllegalArgumentException("Check-out time must be after check-in time");
        }

        long totalMinutes = Duration.between(checkInTime, checkOutTime).toMinutes();

        // LỚP TIỀN XỬ LÝ: BỘ LỌC CƠ BẢN TOÀN CẢNH (GLOBAL BASE INTERCEPTOR)
        if (totalMinutes <= policy.getGlobalBaseMins()) {
            return policy.getGlobalBaseFee();
        }

        // BƯỚC 1: MÁY CẮT THEO CA (Helper_SliceByShift)
        List<ShiftSlice> slices = sliceByShift(policy.getShifts(), checkInTime, checkOutTime);

        // BƯỚC 2: CỖ MÁY TRƯỢT BLOCK (Helper_SlideBlocks)
        BigDecimal totalFee = BigDecimal.ZERO;
        for (ShiftSlice slice : slices) {
            BigDecimal sliceFee = slideBlocks(slice.shift, slice.durationMins);
            totalFee = totalFee.add(sliceFee);
        }

        // BƯỚC 3: TỔNG HỢP VÀ ÁP TRẦN (Main_CalculateTotalFee)
        if (totalFee.compareTo(policy.getMaxParkingCap()) > 0) {
            return policy.getMaxParkingCap();
        }

        return totalFee;
    }

    private List<ShiftSlice> sliceByShift(List<PricingShift> shifts, LocalDateTime checkIn, LocalDateTime checkOut) {
        List<ShiftSlice> slices = new ArrayList<>();
        LocalDateTime current = checkIn;

        while (current.isBefore(checkOut)) {
            PricingShift currentShift = findShiftForTime(shifts, current.toLocalTime());
            if (currentShift == null) {
                // Nếu không tìm thấy ca nào (Cấu hình hổng), tính theo giờ mặc định hoặc bỏ qua
                current = current.plusMinutes(60);
                continue;
            }

            // Tính thời điểm kết thúc của Ca này trong ngày hiện tại
            LocalDateTime shiftEnd = LocalDateTime.of(current.toLocalDate(), currentShift.getEndTime());
            if (currentShift.getEndTime().isBefore(currentShift.getStartTime())) {
                // Ca vắt qua đêm (ví dụ: 18:00 - 06:00)
                if (current.toLocalTime().isBefore(currentShift.getEndTime())) {
                    // Đang ở rạng sáng (sau nửa đêm)
                } else {
                    // Đang ở buổi tối (trước nửa đêm), kết thúc ca là sáng hôm sau
                    shiftEnd = shiftEnd.plusDays(1);
                }
            }

            // Thời điểm kết thúc của lát cắt là min(thời điểm ra, thời điểm kết thúc ca)
            LocalDateTime sliceEnd = checkOut.isBefore(shiftEnd) ? checkOut : shiftEnd;

            long durationMins = Duration.between(current, sliceEnd).toMinutes();
            if (durationMins > 0) {
                slices.add(new ShiftSlice(currentShift, (int) durationMins));
            }

            current = sliceEnd;
        }

        return slices;
    }

    private PricingShift findShiftForTime(List<PricingShift> shifts, LocalTime time) {
        for (PricingShift shift : shifts) {
            LocalTime s = shift.getStartTime();
            LocalTime e = shift.getEndTime();
            if (s.isBefore(e)) {
                if (!time.isBefore(s) && time.isBefore(e)) {
                    return shift;
                }
            } else { // Vắt qua đêm
                if (!time.isBefore(s) || time.isBefore(e)) {
                    return shift;
                }
            }
        }
        return null;
    }

    private BigDecimal slideBlocks(PricingShift shift, int durationMins) {
        BigDecimal fee = BigDecimal.ZERO;
        int remainingMins = durationMins;

        for (PricingBlock block : shift.getBlocks()) {
            if (remainingMins > 0) {
                fee = fee.add(block.getFee());
                remainingMins -= block.getDurationMins();
            } else {
                break;
            }
        }

        // Nếu còn dư (ví dụ đỗ lố thời gian ca mà thuật toán cắt sai), có thể cộng thêm hoặc bỏ qua.
        // Ở đây theo spec, tổng block = tổng ca, nên max remainingMins sẽ về <= 0
        return fee;
    }

    private static class ShiftSlice {
        PricingShift shift;
        int durationMins;

        public ShiftSlice(PricingShift shift, int durationMins) {
            this.shift = shift;
            this.durationMins = durationMins;
        }
    }
}
