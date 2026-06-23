package com.pbms.modules.infrastructure.service;

import com.pbms.modules.infrastructure.domain.Floor;
import com.pbms.modules.infrastructure.domain.Gate;
import com.pbms.modules.infrastructure.domain.Slot;
import com.pbms.modules.infrastructure.domain.Zone;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.infrastructure.dto.config.*;
import com.pbms.modules.infrastructure.repository.FloorRepository;
import com.pbms.modules.infrastructure.repository.GateRepository;
import com.pbms.modules.infrastructure.repository.SlotRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import com.pbms.modules.system.domain.BuildingProfile;
import com.pbms.modules.system.repository.BuildingProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MapConfigurationService {

    private final FloorRepository floorRepository;
    private final ZoneRepository zoneRepository;
    private final GateRepository gateRepository;
    private final SlotRepository slotRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final BuildingProfileRepository buildingProfileRepository;

    @Transactional(readOnly = true)
    public MapConfigDTO getMapConfiguration() {
        List<Floor> floors = floorRepository.findAll();
        List<Zone> zones = zoneRepository.findAll().stream()
                .filter(z -> !"DELETED".equals(z.getStatus()))
                .collect(Collectors.toList());
        List<Gate> gates = gateRepository.findAll();

        Map<Long, VehicleType> vehicleTypes = vehicleTypeRepository.findAll().stream()
                .collect(Collectors.toMap(VehicleType::getId, Function.identity()));

        List<FloorConfigDTO> floorDTOs = floors.stream().map(f -> FloorConfigDTO.builder()
                .id(f.getId())
                .name(f.getFloorName())
                .type(f.getFloorType())
                .mapCols(f.getMapCols())
                .mapRows(f.getMapRows())
                .build()).collect(Collectors.toList());

        List<ZoneConfigDTO> zoneDTOs = zones.stream().map(z -> {
            List<SlotConfigDTO> slotDTOs = slotRepository.findByZoneId(z.getId()).stream()
                    .map(s -> SlotConfigDTO.builder()
                            .id(s.getId())
                            .name(s.getSlotName())
                            .status(s.getStatus())
                            .build()).collect(Collectors.toList());

            VehicleType vt = vehicleTypes.get(z.getVehicleType().getId());
            return ZoneConfigDTO.builder()
                    .id(z.getId())
                    .floorId(z.getFloor().getId())
                    .name(z.getZoneName())
                    .capacity(slotDTOs.size())
                    .vehicleTypeId(vt.getId())
                    .vehicleTypeName(vt.getTypeName())
                    .vehicleCategory(vt.getCategory())
                    .functionType(z.getFunctionType())
                    .layoutX(z.getLayoutX())
                    .layoutY(z.getLayoutY())
                    .rotation(z.getRotation())
                    .overflowThreshold(z.getOverflowThreshold())
                    .slots(slotDTOs)
                    .build();
        }).collect(Collectors.toList());

        List<GateConfigDTO> gateDTOs = gates.stream().map(g -> GateConfigDTO.builder()
                .id(g.getId())
                .floorId(g.getFloor().getId())
                .name(g.getGateName())
                .type(g.getGateType())
                .status(g.getStatus())
                .vehicleTypeId(g.getVehicleType() != null ? g.getVehicleType().getId() : null)
                .layoutX(g.getLayoutX())
                .layoutY(g.getLayoutY())
                .rotation(g.getRotation())
                .build()).collect(Collectors.toList());

        List<VehicleTypeDTO> vtDTOs = vehicleTypeRepository.findAll().stream()
                .map(vt -> VehicleTypeDTO.builder()
                        .id(vt.getId())
                        .typeName(vt.getTypeName())
                        .category(vt.getCategory())
                        .matrixWidth(vt.getMatrixWidth())
                        .matrixHeight(vt.getMatrixHeight())
                        .build())
                .collect(Collectors.toList());

        return MapConfigDTO.builder()
                .floors(floorDTOs)
                .zones(zoneDTOs)
                .gates(gateDTOs)
                .vehicleTypes(vtDTOs)
                .build();
    }

    @Transactional
    public void saveMapConfiguration(MapConfigDTO mapConfig) {
        BuildingProfile defaultBuilding = buildingProfileRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No building profile configured"));

        // 1. Process Floors
        List<Floor> currentFloors = floorRepository.findAll();
        Map<Long, Floor> floorMap = currentFloors.stream().collect(Collectors.toMap(Floor::getId, Function.identity()));

        for (FloorConfigDTO fDTO : mapConfig.getFloors()) {
            Floor floor;
            if (fDTO.getId() > 1000000000L || !floorMap.containsKey(fDTO.getId())) {
                // New Floor
                floor = Floor.builder()
                        .building(defaultBuilding)
                        .floorName(fDTO.getName())
                        .floorLevel(1) // Default or parse from name
                        .capacity(0)
                        .floorType(fDTO.getType())
                        .mapCols(fDTO.getMapCols())
                        .mapRows(fDTO.getMapRows())
                        .build();
                floor = floorRepository.save(floor);
                // Map the old temp ID to new ID for children
                Long oldId = fDTO.getId();
                fDTO.setId(floor.getId());
                final Long newFloorId = floor.getId();
                mapConfig.getZones().stream().filter(z -> z.getFloorId().equals(oldId)).forEach(z -> z.setFloorId(newFloorId));
                mapConfig.getGates().stream().filter(g -> g.getFloorId().equals(oldId)).forEach(g -> g.setFloorId(newFloorId));
            } else {
                floor = floorMap.get(fDTO.getId());
                
                // Rule: Cannot change floorType if it has zones with status != DELETED
                final Long currentFloorId = floor.getId();
                if (!floor.getFloorType().equals(fDTO.getType())) {
                    boolean hasZones = zoneRepository.findAll().stream()
                            .anyMatch(z -> z.getFloor().getId().equals(currentFloorId) && !"DELETED".equals(z.getStatus()));
                    if (hasZones) {
                        throw new RuntimeException("Không thể đổi loại xe của Tầng " + floor.getFloorName() + " vì đang có Khu vực hoạt động.");
                    }
                }
                
                floor.setFloorName(fDTO.getName());
                floor.setFloorType(fDTO.getType());
                floor.setMapCols(fDTO.getMapCols());
                floor.setMapRows(fDTO.getMapRows());
                floorRepository.save(floor);
            }
        }

        // 2. Process Zones
        List<Zone> currentZones = zoneRepository.findAll();
        Map<Long, Zone> zoneMap = currentZones.stream().collect(Collectors.toMap(Zone::getId, Function.identity()));
        
        // Find deleted zones
        List<Long> incomingZoneIds = mapConfig.getZones().stream()
                .filter(z -> z.getId() < 1000000000L)
                .map(ZoneConfigDTO::getId).collect(Collectors.toList());
        for (Zone cz : currentZones) {
            if (!incomingZoneIds.contains(cz.getId()) && !"DELETED".equals(cz.getStatus())) {
                // Check if any slot is occupied before deleting
                List<Slot> cSlots = slotRepository.findByZoneId(cz.getId());
                if (cSlots.stream().anyMatch(s -> "OCCUPIED".equals(s.getStatus()))) {
                    throw new RuntimeException("Không thể xóa Khu vực " + cz.getZoneName() + " vì đang có xe đỗ.");
                }
                cz.setStatus("DELETED");
                zoneRepository.save(cz);
                // Also clean up slots
                for (Slot s : cSlots) {
                    slotRepository.delete(s);
                }
            }
        }

        for (ZoneConfigDTO zDTO : mapConfig.getZones()) {
            if (zDTO.getCapacity() == 0) {
                // Soft delete
                if (zDTO.getId() < 1000000000L && zoneMap.containsKey(zDTO.getId())) {
                    Zone cz = zoneMap.get(zDTO.getId());
                    List<Slot> cSlots = slotRepository.findByZoneId(cz.getId());
                    if (cSlots.stream().anyMatch(s -> "OCCUPIED".equals(s.getStatus()))) {
                        throw new RuntimeException("Không thể xóa Khu vực " + cz.getZoneName() + " vì đang có xe đỗ.");
                    }
                    cz.setStatus("DELETED");
                    zoneRepository.save(cz);
                    for (Slot s : cSlots) {
                        slotRepository.delete(s);
                    }
                }
                continue;
            }

            Floor f = floorRepository.findById(zDTO.getFloorId()).orElseThrow();
            VehicleType vt = vehicleTypeRepository.findById(zDTO.getVehicleTypeId()).orElseThrow();

            if (!f.getFloorType().equals(vt.getCategory())) {
                throw new RuntimeException("Khu vực " + zDTO.getName() + " có loại phương tiện không khớp với loại xe của Tầng.");
            }

            Zone zone;
            if (zDTO.getId() > 1000000000L || !zoneMap.containsKey(zDTO.getId())) {
                // New Zone
                zone = Zone.builder()
                        .floor(f)
                        .zoneName(zDTO.getName())
                        .vehicleType(vt)
                        .functionType(zDTO.getFunctionType())
                        .layoutX(zDTO.getLayoutX())
                        .layoutY(zDTO.getLayoutY())
                        .rotation(zDTO.getRotation())
                        .overflowThreshold(zDTO.getOverflowThreshold())
                        .status("ACTIVE")
                        .build();
                zone = zoneRepository.save(zone);
                
                Long oldId = zDTO.getId();
                zDTO.setId(zone.getId()); // updated for future reference if needed
            } else {
                zone = zoneMap.get(zDTO.getId());
                zone.setZoneName(zDTO.getName());
                zone.setVehicleType(vt);
                zone.setFunctionType(zDTO.getFunctionType());
                zone.setLayoutX(zDTO.getLayoutX());
                zone.setLayoutY(zDTO.getLayoutY());
                zone.setRotation(zDTO.getRotation());
                zone.setOverflowThreshold(zDTO.getOverflowThreshold());
                zone.setStatus("ACTIVE");
                zone = zoneRepository.save(zone);
            }

            List<Slot> existingSlots = slotRepository.findByZoneId(zone.getId());
            Map<Long, Slot> existingSlotMap = existingSlots.stream().collect(Collectors.toMap(Slot::getId, Function.identity()));
            List<Long> incomingSlotIds = zDTO.getSlots().stream().map(SlotConfigDTO::getId).collect(Collectors.toList());

            // Delete missing slots
            for (Slot es : existingSlots) {
                if (!incomingSlotIds.contains(es.getId())) {
                    if ("OCCUPIED".equals(es.getStatus())) {
                        throw new RuntimeException("Không thể cắt giảm ô đỗ " + es.getSlotName() + " vì đang có xe đỗ.");
                    }
                    slotRepository.delete(es);
                }
            }

            // Add or update slots
            for (SlotConfigDTO sDTO : zDTO.getSlots()) {
                if (sDTO.getId() != null && existingSlotMap.containsKey(sDTO.getId())) {
                    Slot es = existingSlotMap.get(sDTO.getId());
                    es.setSlotName(sDTO.getName());
                    if ("DISABLED".equals(sDTO.getStatus()) && "OCCUPIED".equals(es.getStatus())) {
                        throw new RuntimeException("Không thể bảo trì ô đỗ " + es.getSlotName() + " vì đang có xe đỗ.");
                    }
                    if (!"OCCUPIED".equals(es.getStatus())) {
                        es.setStatus(sDTO.getStatus());
                    }
                    slotRepository.save(es);
                } else {
                    Slot newSlot = Slot.builder()
                            .zone(zone)
                            .slotName(sDTO.getName())
                            .status(sDTO.getStatus())
                            .build();
                    slotRepository.save(newSlot);
                }
            }
        }

        // 3. Process Gates
        List<Gate> currentGates = gateRepository.findAll();
        Map<Long, Gate> gateMap = currentGates.stream().collect(Collectors.toMap(Gate::getId, Function.identity()));

        for (GateConfigDTO gDTO : mapConfig.getGates()) {
            Floor f = floorRepository.findById(gDTO.getFloorId()).orElseThrow();
            VehicleType gvt = null;
            if (gDTO.getVehicleTypeId() != null) {
                gvt = vehicleTypeRepository.findById(gDTO.getVehicleTypeId()).orElse(null);
            }
            
            Gate gate;
            if (gDTO.getId() == null || gDTO.getId() > 1000000000L || !gateMap.containsKey(gDTO.getId())) {
                gate = Gate.builder()
                        .floor(f)
                        .vehicleType(gvt)
                        .gateName(gDTO.getName())
                        .gateType(gDTO.getType())
                        .status(gDTO.getStatus())
                        .liveOverrideMode("NORMAL")
                        .layoutX(gDTO.getLayoutX())
                        .layoutY(gDTO.getLayoutY())
                        .rotation(gDTO.getRotation())
                        .build();
                gateRepository.save(gate);
            } else {
                gate = gateMap.get(gDTO.getId());
                gate.setGateName(gDTO.getName());
                gate.setFloor(f);
                gate.setVehicleType(gvt);
                gate.setGateType(gDTO.getType());
                gate.setLayoutX(gDTO.getLayoutX());
                gate.setLayoutY(gDTO.getLayoutY());
                gate.setRotation(gDTO.getRotation());
                gateRepository.save(gate);
            }
        }
    }
}
