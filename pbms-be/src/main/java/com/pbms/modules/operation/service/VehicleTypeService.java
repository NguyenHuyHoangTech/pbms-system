package com.pbms.modules.operation.service;

import com.pbms.modules.infrastructure.dto.config.VehicleTypeDTO;
import com.pbms.modules.operation.domain.VehicleType;
import com.pbms.modules.operation.repository.VehicleTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleTypeService {

    private final VehicleTypeRepository repository;

    public VehicleTypeService(VehicleTypeRepository repository) {
        this.repository = repository;
    }

    public List<VehicleTypeDTO> getAllVehicleTypes() {
        return repository.findAll().stream()
                .map(vt -> VehicleTypeDTO.builder()
                        .id(vt.getId())
                        .typeName(vt.getTypeName())
                        .category(vt.getCategory())
                        .matrixWidth(vt.getMatrixWidth())
                        .matrixHeight(vt.getMatrixHeight())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public VehicleTypeDTO createVehicleType(VehicleTypeDTO dto) {
        VehicleType vt = VehicleType.builder()
                .typeName(dto.getTypeName())
                .category(dto.getCategory())
                .matrixWidth(dto.getMatrixWidth())
                .matrixHeight(dto.getMatrixHeight())
                .build();
        vt = repository.save(vt);
        dto.setId(vt.getId());
        return dto;
    }

    @Transactional
    public VehicleTypeDTO updateVehicleType(Long id, VehicleTypeDTO dto) {
        VehicleType vt = repository.findById(id).orElseThrow(() -> new RuntimeException("VehicleType not found"));
        vt.setTypeName(dto.getTypeName());
        vt.setCategory(dto.getCategory());
        vt.setMatrixWidth(dto.getMatrixWidth());
        vt.setMatrixHeight(dto.getMatrixHeight());
        vt = repository.save(vt);
        dto.setId(vt.getId());
        return dto;
    }

    @Transactional
    public void deleteVehicleType(Long id) {
        repository.deleteById(id);
    }
}

