const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms/modules/operation/controller/IotHardwareController.java';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
content = content.replace(/import com.pbms.modules.operation.repository.VehicleTypeRepository;/, `import com.pbms.modules.operation.repository.VehicleTypeRepository;\nimport com.pbms.modules.operation.repository.MonthlyTicketRepository;`);

// 2. Add field
content = content.replace(/private final StaffWorkSessionRepository staffWorkSessionRepository;/, `private final StaffWorkSessionRepository staffWorkSessionRepository;\n    private final MonthlyTicketRepository monthlyTicketRepository;`);

// 3. Add to constructor
content = content.replace(/StaffWorkSessionRepository staffWorkSessionRepository\)/, `StaffWorkSessionRepository staffWorkSessionRepository,\n                                 MonthlyTicketRepository monthlyTicketRepository)`);
content = content.replace(/this.staffWorkSessionRepository = staffWorkSessionRepository;/, `this.staffWorkSessionRepository = staffWorkSessionRepository;\n        this.monthlyTicketRepository = monthlyTicketRepository;`);

// 4. Add monthlyTickets to syncData()
const syncDataInsert = `
        // 10. Monthly Tickets
        data.put("monthlyTickets", monthlyTicketRepository.findAll().stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("plateNumber", m.getPlateNumber());
                    map.put("status", m.getStatus());
                    map.put("validFrom", m.getValidFrom());
                    map.put("validTo", m.getValidTo());
                    if (m.getVehicleType() != null) {
                        Map<String, Object> vMap = new HashMap<>();
                        vMap.put("id", m.getVehicleType().getId());
                        vMap.put("typeName", m.getVehicleType().getTypeName());
                        map.put("vehicleType", vMap);
                    }
                    return map;
                })
                .toList());
`;

content = content.replace(/        return ResponseEntity.ok\(ApiResponse.success\(data, "Sync data successful"\)\);/, syncDataInsert + `\n        return ResponseEntity.ok(ApiResponse.success(data, "Sync data successful"));`);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified IotHardwareController!');
