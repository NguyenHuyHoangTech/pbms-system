import json
import os
import sys

problems_json = r"""[
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\common\\config\\RedisConfig.java","message":"The import org.springframework.context.annotation.Configuration is never used","severity":"warning","startLine":4,"endLine":4},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\common\\service\\FileStorageService.java","message":"The import java.io.File is never used","severity":"warning","startLine":6,"endLine":6},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\finance\\domain\\PricingPolicy.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":41,"endLine":41},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\finance\\domain\\RefundRequest.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":49,"endLine":49},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\identity\\domain\\User.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":38,"endLine":38},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\identity\\dto\\ResetPasswordRequest.java","message":"The import jakarta.validation.constraints.Size is never used","severity":"warning","startLine":4,"endLine":4},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\identity\\dto\\UserDTO.java","message":"The import jakarta.validation.constraints.Pattern is never used","severity":"warning","startLine":5,"endLine":5},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\identity\\service\\UserService.java","message":"The import org.springframework.stereotype.Service is never used","severity":"warning","startLine":15,"endLine":15},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\identity\\service\\UserService.java","message":"The import org.springframework.transaction.annotation.Transactional is never used","severity":"warning","startLine":16,"endLine":16},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\incident\\domain\\IncidentTicket.java","message":"The import com.pbms.modules.identity.domain.StaffWorkSession is never used","severity":"warning","startLine":4,"endLine":4},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\incident\\dto\\ZoneTrendDTO.java","message":"The import java.time.LocalDateTime is never used","severity":"warning","startLine":9,"endLine":9},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\incident\\service\\IncidentService.java","message":"The import java.time.temporal.ChronoUnit is never used","severity":"warning","startLine":21,"endLine":21},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\incident\\service\\IncidentTicketService.java","message":"The import java.time.LocalDateTime is never used","severity":"warning","startLine":15,"endLine":15},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\controller\\GateController.java","message":"The import com.pbms.modules.identity.domain.StaffWorkSession is never used","severity":"warning","startLine":8,"endLine":8},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\controller\\GateController.java","message":"The import org.springframework.security.access.prepost.PreAuthorize is never used","severity":"warning","startLine":14,"endLine":14},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\controller\\GateController.java","message":"The import java.util.Map is never used","severity":"warning","startLine":15,"endLine":15},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\controller\\GateController.java","message":"The import java.util.HashMap is never used","severity":"warning","startLine":16,"endLine":16},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\Gate.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":36,"endLine":36},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\Gate.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":39,"endLine":39},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\RoutingRule.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":40,"endLine":40},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\RoutingRule.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":43,"endLine":43},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\Slot.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":27,"endLine":27},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\Slot.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":33,"endLine":33},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\domain\\Zone.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":46,"endLine":46},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\dto\\config\\SlotConfigDTO.java","message":"The import java.util.List is never used","severity":"warning","startLine":7,"endLine":7},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\infrastructure\\service\\MapConfigurationService.java","message":"The import java.util.Optional is never used","severity":"warning","startLine":25,"endLine":25},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\controller\\GateConsoleController.java","message":"The import org.springframework.http.ResponseEntity is never used","severity":"warning","startLine":16,"endLine":16},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\controller\\ParkingSessionController.java","message":"The import org.springframework.security.core.Authentication is never used","severity":"warning","startLine":8,"endLine":8},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\controller\\ParkingSessionController.java","message":"The import java.time.LocalDateTime is never used","severity":"warning","startLine":16,"endLine":16},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\domain\\MonthlyTicket.java","message":"@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default. If it is not supposed to be settable during building, make the field final.","severity":"warning","startLine":49,"endLine":49},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\domain\\Reservation.java","message":"The import com.pbms.modules.infrastructure.domain.Slot is never used","severity":"warning","startLine":5,"endLine":5},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\GateOperationService.java","message":"The import com.pbms.modules.infrastructure.domain.Slot is never used","severity":"warning","startLine":23,"endLine":23},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\GateOperationService.java","message":"The import java.time.LocalDateTime is never used","severity":"warning","startLine":31,"endLine":31},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\IotIntegrationService.java","message":"The import java.time.LocalDateTime is never used","severity":"warning","startLine":16,"endLine":16},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\ReservationService.java","message":"The import com.pbms.modules.finance.domain.PricingPolicy is never used","severity":"warning","startLine":3,"endLine":3},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\ReservationService.java","message":"The import org.springframework.scheduling.annotation.Scheduled is never used","severity":"warning","startLine":26,"endLine":26},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\ZoneRoutingService.java","message":"The import java.util.Comparator is never used","severity":"warning","startLine":20,"endLine":20},
{"path":"d:\\0_Semester_5\\pbms-system\\pbms-be\\src\\main\\java\\com\\pbms\\modules\\operation\\service\\ZoneRoutingService.java","message":"The import java.util.Optional is never used","severity":"warning","startLine":22,"endLine":22}
]"""

problems = json.loads(problems_json)
from collections import defaultdict
file_changes = defaultdict(list)

for p in problems:
    path = p["path"]
    startLine = p["startLine"]
    msg = p["message"]
    file_changes[path].append((startLine, msg))

for path, changes in file_changes.items():
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Process changes in reverse to not mess up line numbers if we were deleting
    # Wait, instead of deleting, let's just make the line empty so line numbers stay intact
    for line_num, msg in changes:
        idx = line_num - 1
        if "never used" in msg:
            lines[idx] = "" # Remove import
        elif "@Builder will ignore" in msg:
            if "@Builder.Default" not in lines[idx]:
                # find leading whitespace
                leading = lines[idx][:len(lines[idx]) - len(lines[idx].lstrip())]
                lines[idx] = leading + "@Builder.Default\n" + lines[idx]
    
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)

print("Done")
