const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the main panel overflow
content = content.replace(
    '<div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">',
    '<div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full bg-slate-100 rounded-lg shadow-sm">'
);

// 2. Increase height of ZONE ROUTING PRIORITY
content = content.replace(
    'relative overflow-hidden h-[105px] mt-1 w-full"',
    'relative overflow-hidden h-[125px] mt-1 w-full flex-none"'
);

// 3. Make sure the inner container doesn't show vertical scrollbar
content = content.replace(
    'className="flex overflow-x-hidden gap-3 items-center w-full"',
    'className="flex overflow-x-hidden overflow-y-hidden gap-3 items-center w-full pt-1 pb-1"'
);

fs.writeFileSync(file, content);
console.log('Successfully fixed height and overflow!');
