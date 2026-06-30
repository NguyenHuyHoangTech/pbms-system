const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/h-\[28\%\]/g, 'h-[30%]');
content = content.replace(/h-\[60\%\]/g, 'h-[58%]');
content = content.replace(
    '<div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full bg-slate-100 rounded-lg shadow-sm">',
    '<div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">'
);
content = content.replace(
    'relative overflow-hidden h-[125px] mt-1 w-full flex-none"',
    'relative overflow-hidden h-[105px] mt-1 w-full"'
);
content = content.replace(
    'className="flex overflow-x-hidden overflow-y-hidden gap-3 items-center w-full pt-1 pb-1"',
    'className="flex overflow-x-hidden gap-3 items-center w-full"'
);

fs.writeFileSync(file, content);
console.log('Successfully reverted everything back');
