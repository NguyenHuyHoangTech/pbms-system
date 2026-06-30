const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Revert the main panel overflow
content = content.replace(
    '<div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full bg-slate-100 rounded-lg shadow-sm">',
    '<div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">'
);

// 2. Revert height of ZONE ROUTING PRIORITY
content = content.replace(
    'relative overflow-hidden h-[125px] mt-1 w-full flex-none"',
    'relative overflow-hidden h-[105px] mt-1 w-full"'
);

// 3. Revert the inner container
content = content.replace(
    'className="flex overflow-x-hidden overflow-y-hidden gap-3 items-center w-full pt-1 pb-1"',
    'className="flex overflow-x-hidden gap-3 items-center w-full"'
);

fs.writeFileSync(file, content);
console.log('Successfully reverted height and overflow!');
