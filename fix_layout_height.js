const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change Top Zone
content = content.replace(
    '{/* TASK 1 & 2: Top Zone (Cameras) - STRICT h-[35%] */}\n      <div className="h-[35%]',
    '{/* TASK 1 & 2: Top Zone (Cameras) - STRICT h-[32%] */}\n      <div className="h-[32%]'
);

// Change Middle Zone
content = content.replace(
    '{/* TASK 1 & 3: Middle Zone (Info & Alerts) - STRICT h-[50%] No Scroll */}\n      <div className="h-[50%]',
    '{/* TASK 1 & 3: Middle Zone (Info & Alerts) - STRICT h-[56%] No Scroll */}\n      <div className="h-[56%]'
);

// Change Bottom Zone
content = content.replace(
    '{/* TASK 1 & 4: Bottom Zone (Actions) - STRICT h-[15%] */}\n      <div className="h-[15%]',
    '{/* TASK 1 & 4: Bottom Zone (Actions) - STRICT h-[12%] */}\n      <div className="h-[12%]'
);

// Adjust height of ZONE ROUTING PRIORITY if needed
content = content.replace(
    'relative overflow-hidden h-[120px] mt-2 w-full"',
    'relative overflow-hidden h-[110px] mt-1 w-full"'
);

fs.writeFileSync(file, content);
console.log('Successfully adjusted layout heights!');
