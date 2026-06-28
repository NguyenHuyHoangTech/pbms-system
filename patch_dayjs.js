const fs = require('fs');

const files = [
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/customer/CustomerMonthlyPassScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/customer/MyParkingScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/customer/PreBookingScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/manager/OperationalDashboardScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/manager/PreBookingManagementScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/manager/PricingConfigScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/manager/RevenueDashboardScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/staff/GateInConsoleScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/staff/GateOutConsoleScreen.tsx',
    'D:/0_Semester_5/pbms-system/pbms-fe/src/features/staff/ShiftManagementScreen.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // add import if not exists
    if (!content.includes('simulatedDayjs')) {
        content = "import { simulatedDayjs } from '../../core/utils/timeProvider';\n" + content;
    }
    
    // replace dayjs( with simulatedDayjs(
    content = content.replace(/\bdayjs\(/g, 'simulatedDayjs(');
    
    fs.writeFileSync(file, content, 'utf8');
});

console.log('Patched frontend dayjs!');

// For iot-simulator:
const iotPath = 'D:/0_Semester_5/pbms-system/pbms-iot-simulator/src/App.tsx';
let iotContent = fs.readFileSync(iotPath, 'utf8');
if (!iotContent.includes('SIMULATED_OFFSET_SECONDS')) {
    const importCode = `
// Global variable to store offset (in seconds)
(window as any).SIMULATED_OFFSET_SECONDS = 0;
export const getSimulatedOffset = () => (window as any).SIMULATED_OFFSET_SECONDS || 0;
export const simulatedDayjs = (date?: any, format?: any, strict?: any) => {
    if (date !== undefined) return dayjs(date, format, strict);
    return dayjs().add(getSimulatedOffset(), 'second');
};
`;
    iotContent = iotContent.replace(/import dayjs from 'dayjs';/, "import dayjs from 'dayjs';\n" + importCode);
}
iotContent = iotContent.replace(/\bdayjs\(/g, 'simulatedDayjs(');

// Also need to fetch the offset in iot-simulator
if (!iotContent.includes('/system/configs')) {
    const fetchCode = `
  React.useEffect(() => {
    axios.get('http://localhost:8080/api/v1/system/configs').then((res: any) => {
      const configs = res.data?.data || [];
      const offsetConfig = configs.find((c: any) => c.configKey === 'TIME_SIMULATED_OFFSET_SECONDS');
      if (offsetConfig && offsetConfig.configValue) {
        (window as any).SIMULATED_OFFSET_SECONDS = parseInt(offsetConfig.configValue, 10);
      }
    }).catch(e => console.error(e));
  }, []);
`;
    iotContent = iotContent.replace(/const \[form\] = Form\.useForm\(\);/, fetchCode + "\n  const [form] = Form.useForm();");
}

fs.writeFileSync(iotPath, iotContent, 'utf8');
console.log('Patched iot-simulator dayjs!');
