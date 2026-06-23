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
