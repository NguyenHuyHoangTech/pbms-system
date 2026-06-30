const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    '<div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">',
    '<div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full bg-slate-100 rounded-lg shadow-sm">'
);

fs.writeFileSync(file, content);
console.log('Successfully fixed h-full to flex-1 min-h-0');
