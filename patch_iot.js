const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms/modules/operation/controller/IotHardwareController.java';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(/import com\.pbms\.modules\.operation\.repository\.MonthlyTicketRepository;/, `import com.pbms.modules.operation.repository.MonthlyTicketRepository;\nimport org.springframework.context.ApplicationEventPublisher;\nimport com.pbms.common.event.TimeFastForwardedEvent;\nimport com.pbms.modules.system.service.SystemConfigService;`);

// 2. Add fields
content = content.replace(/private final MonthlyTicketRepository monthlyTicketRepository;/, `private final MonthlyTicketRepository monthlyTicketRepository;\n    private final SystemConfigService systemConfigService;\n    private final ApplicationEventPublisher eventPublisher;`);

// 3. Add to constructor
content = content.replace(/MonthlyTicketRepository monthlyTicketRepository\)/, `MonthlyTicketRepository monthlyTicketRepository,\n                                 SystemConfigService systemConfigService,\n                                 ApplicationEventPublisher eventPublisher)`);
content = content.replace(/this\.monthlyTicketRepository = monthlyTicketRepository;/, `this.monthlyTicketRepository = monthlyTicketRepository;\n        this.systemConfigService = systemConfigService;\n        this.eventPublisher = eventPublisher;`);

// 4. Update fastForwardTime
const newFastForward = `
    @PostMapping("/time/fast-forward")
    public ResponseEntity<ApiResponse<String>> fastForwardTime(@RequestBody Map<String, String> payload) {
        String targetTimeStr = payload.get("targetTime");
        if (targetTimeStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Missing targetTime"));
        }
        LocalDateTime targetTime = LocalDateTime.parse(targetTimeStr);
        try {
            TimeProvider.fastForwardTo(targetTime);
            
            // Save offset to DB
            long offsetSeconds = TimeProvider.getSimulatedOffset().getSeconds();
            systemConfigService.saveOrUpdateConfigValue("TIME_SIMULATED_OFFSET_SECONDS", String.valueOf(offsetSeconds));
            
            // Publish Event to trigger cronjobs
            eventPublisher.publishEvent(new TimeFastForwardedEvent(this, TimeProvider.now()));
            
            return ResponseEntity.ok(ApiResponse.success("Current Time: " + TimeProvider.now(), "Time fast-forwarded successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
`;

content = content.replace(/    @PostMapping\("\/time\/fast-forward"\)[\s\S]*?catch \(IllegalArgumentException e\) \{[\s\S]*?\}[\s\S]*?\}/, newFastForward.trim());

fs.writeFileSync(path, content, 'utf8');
console.log('Patched IotHardwareController!');
