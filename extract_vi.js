const fs = require('fs');
const path = require('path');
const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

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
    "pbms-fe/src/features\manager/PricingConfigScreen.tsx",
    "pbms-fe/src/features/manager/SpaceMapScreen.tsx",
    "pbms-fe/src/features/manager/VehicleTypeScreen.tsx",
    "pbms-fe/src/features/shared/components/UserProfileSettingsModal.tsx",
    "pbms-fe/src/features/staff/ShiftManagementScreen.tsx",
    "pbms-iot-simulator/src/App.tsx",
    "pbms-iot-simulator/src/SimulatorMap.tsx"
];

let dictionary = {};

filesToProcess.forEach(file => {
    let truePath = file.replace(/\\/g, '/');
    if (!fs.existsSync(truePath)) return;
    const content = fs.readFileSync(truePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (vietnameseRegex.test(line)) {
            // Extract string literals or jsx text
            // A simple approach is to extract text between quotes or > <
            const strMatches = line.match(/(['"`])(.*?)\1/g);
            if (strMatches) {
                strMatches.forEach(m => {
                    const str = m.substring(1, m.length - 1);
                    if (vietnameseRegex.test(str)) dictionary[str] = str;
                });
            }
            const jsxMatches = line.match(/>([^<]+)</g);
            if (jsxMatches) {
                jsxMatches.forEach(m => {
                    const str = m.substring(1, m.length - 1).trim();
                    if (str && vietnameseRegex.test(str)) dictionary[str] = str;
                });
            }
            // For java exceptions and comments
            // Since we don't want to translate comments necessarily, let's keep it if we want.
        }
    });
});

fs.writeFileSync('dict.json', JSON.stringify(dictionary, null, 2));
console.log(`Extracted ${Object.keys(dictionary).length} strings.`);
