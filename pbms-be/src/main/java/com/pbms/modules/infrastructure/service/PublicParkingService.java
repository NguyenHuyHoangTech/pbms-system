import com.pbms.modules.infrastructure.dto.ParkingLotSummaryDTO;
import com.pbms.modules.system.domain.BuildingProfile;
    private final BuildingProfileService buildingProfileService;
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
