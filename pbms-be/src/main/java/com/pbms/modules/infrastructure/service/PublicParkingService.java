package com.pbms.modules.infrastructure.service;

import com.pbms.modules.finance.domain.PricingPolicy;
import com.pbms.modules.finance.repository.PricingPolicyRepository;
import com.pbms.modules.infrastructure.dto.ParkingLotSummaryDTO;
import com.pbms.modules.infrastructure.dto.PublicPricingBlockDTO;
import com.pbms.modules.infrastructure.dto.PublicPricingPolicyDTO;
import com.pbms.modules.infrastructure.dto.PublicPricingShiftDTO;
import com.pbms.modules.infrastructure.dto.VehicleAvailabilityDTO;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.VehicleAvailabilityView;
import com.pbms.modules.system.domain.BuildingProfile;
import com.pbms.modules.system.service.BuildingProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicParkingService {

    private static final long LOW_AVAILABILITY_THRESHOLD = 5;

    private final BuildingProfileService buildingProfileService;
    private final SlotRepository slotRepository;
    private final PricingPolicyRepository pricingPolicyRepository;

    //Help UC-403: Lấy và tổng hợp thông tin bãi xe.
    @Transactional(readOnly = true)
    public ParkingLotSummaryDTO getSummary() {
        BuildingProfile profile = buildingProfileService.getProfile();
        List<VehicleAvailabilityDTO> availability = getAvailability();
        return ParkingLotSummaryDTO.builder()
                .parkingLotName(profile.getName())
                .address(profile.getAddress())
                .hotline(profile.getHotline())
                .operatingHours(profile.getOperatingHours())
                .rules(profile.getRules())
                .servedVehicleTypes(availability.stream()
                        .map(VehicleAvailabilityDTO::getLabel)
                        .toList())
                .pricing(getActivePricing())
                .availability(availability)
                .build();
    }

    //Help UC-403: Đếm tổng slot có sẵn
    @Transactional(readOnly = true)
    public List<VehicleAvailabilityDTO> getAvailability() {
        return slotRepository.summarizeAvailabilityByVehicleType().stream()
                .map(this::toAvailabilityDTO)
                .toList();
    }

    //UC-405: Lấy danh sách bảng giá đang ở trạng thái ACTIVE.
    @Transactional(readOnly = true)
    public List<PublicPricingPolicyDTO> getActivePricing() {
        return pricingPolicyRepository.findByStatusOrderByVehicleType_TypeNameAsc("ACTIVE")
                .stream()
                .map(this::toPricingDTO)
                .toList();
    }

    //Trả API cho FE
    private VehicleAvailabilityDTO toAvailabilityDTO(VehicleAvailabilityView view) {
        long available = view.getAvailableSlots() == null ? 0 : view.getAvailableSlots();
        return VehicleAvailabilityDTO.builder()
                .vehicleTypeId(view.getVehicleTypeId())
                .type(view.getVehicleType())
                .label(view.getVehicleType())
                .total(view.getTotalSlots() == null ? 0 : view.getTotalSlots())
                .available(available)
                .statusIndicator(available <= LOW_AVAILABILITY_THRESHOLD ? "RED" : "GREEN")
                .build();
    }

    //Chuyển dữ liệu bảng giá thành DTO trả về FE
    private PublicPricingPolicyDTO toPricingDTO(PricingPolicy policy) {
        return PublicPricingPolicyDTO.builder()
                .policyId(policy.getId())
                .policyName(policy.getPolicyName())
                .vehicleTypeId(policy.getVehicleType().getId())
                .vehicleTypeName(policy.getVehicleType().getTypeName())
                .globalBaseMinutes(policy.getGlobalBaseMins())
                .globalBaseFee(policy.getGlobalBaseFee())
                .maxParkingCap(policy.getMaxParkingCap())
                .shifts(policy.getShifts().stream()
                        .map(shift -> PublicPricingShiftDTO.builder()
                                .shiftName(shift.getShiftName())
                                .startTime(shift.getStartTime())
                                .endTime(shift.getEndTime())
                                .blocks(shift.getBlocks().stream()
                                        .map(block -> PublicPricingBlockDTO.builder()
                                                .blockOrder(block.getBlockOrder())
                                                .durationMinutes(block.getDurationMins())
                                                .fee(block.getFee())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}
