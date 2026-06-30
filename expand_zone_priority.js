const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Adjust percentage heights
content = content.replace(/h-\[30\%\]/g, 'h-[28%]');
content = content.replace(/h-\[58\%\]/g, 'h-[60%]');
content = content.replace(/h-\[12\%\]/g, 'h-[12%]'); // keep at 12% to make 100% total (28+60+12)

// 2. Fix the overflow layout of the panel
content = content.replace(
    '<div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">',
    '<div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full bg-slate-100 rounded-lg shadow-sm">'
);

// 3. Expand the ZONE ROUTING PRIORITY card
content = content.replace(
    'relative overflow-hidden h-[105px] mt-1 w-full"',
    'relative overflow-hidden h-[125px] mt-1 w-full flex-none"'
);

// 4. Force hide scrollbar inside the zone router to be safe
content = content.replace(
    'className="flex overflow-x-hidden gap-3 items-center w-full"',
    'className="flex overflow-x-hidden overflow-y-hidden gap-3 items-center w-full pt-1 pb-1"'
);

fs.writeFileSync(file, content);
console.log('Successfully adjusted layout to allocate more space!');
