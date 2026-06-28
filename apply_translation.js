const fs = require('fs');

const filesToProcess = [
    "pbms-be/src/main/java/com/pbms/modules/finance/controller/DashboardController.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/controller/PaymentController.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/controller/RevenueController.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/service/DashboardService.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/service/PricingCalculatorService.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/service/RefundService.java",
    "pbms-be/src/main/java/com/pbms/modules/finance/strategy/PaymentStrategy.java",
    "pbms-be/src/main/java/com/pbms/modules/identity/controller/WorkSessionController.java",
    "pbms-be/src/main/java/com/pbms/modules/identity/job/UnverifiedUserCleanupJob.java",
    "pbms-be/src/main/java/com/pbms/modules/incident/service/IncidentService.java",
    "pbms-be/src/main/java/com/pbms/modules/infrastructure/service/WebSocketEventPublisher.java",
    "pbms-be/src/main/java/com/pbms/modules/operation/controller/ParkingSessionController.java",
    "pbms-be/src/main/java/com/pbms/modules/operation/job/MonthlyTicketJob.java",
    "pbms-be/src/main/java/com/pbms/modules/operation/service/ZoneRoutingService.java",
    "pbms-fe/src/features/customer/HomeScreen.tsx",
    "pbms-fe/src/features/customer/MyParkingScreen.tsx",
    "pbms-fe/src/features/customer/PreBookingScreen.tsx",
    "pbms-fe/src/features/manager/OperationalDashboardScreen.tsx",
    "pbms-fe/src/features/manager/PricingConfigScreen.tsx",
    "pbms-fe/src/features/manager/SpaceMapScreen.tsx",
    "pbms-fe/src/features/manager/VehicleTypeScreen.tsx",
    "pbms-fe/src/features/shared/components/UserProfileSettingsModal.tsx",
    "pbms-fe/src/features/staff/ShiftManagementScreen.tsx",
    "pbms-iot-simulator/src/App.tsx",
    "pbms-iot-simulator/src/SimulatorMap.tsx"
];

const dictionary = require('./translated_dict.json');

filesToProcess.forEach(file => {
    let truePath = file.replace(/\\/g, '/');
    if (!fs.existsSync(truePath)) return;
    let content = fs.readFileSync(truePath, 'utf8');
    
    // Sort keys by length descending to prevent partial replacements (e.g. replacing 'abc' before 'abc def')
    const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
    
    let changed = false;
    keys.forEach(key => {
        // Simple global replace. Note: some strings might be tricky, so we use split.join.
        if (content.includes(key)) {
            content = content.split(key).join(dictionary[key]);
            changed = true;
        }
    });
    
    if (changed) {
        fs.writeFileSync(truePath, content, 'utf8');
        console.log(`Updated ${truePath}`);
    }
});
