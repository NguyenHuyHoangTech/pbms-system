const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/h-\[35\%\]/g, 'h-[30%]');
content = content.replace(/h-\[50\%\]/g, 'h-[58%]');
content = content.replace(/h-\[15\%\]/g, 'h-[12%]');
content = content.replace(/h-\[120px\]/g, 'h-[110px]');
content = content.replace(/mt-2 w-full/g, 'mt-1 w-full');

fs.writeFileSync(file, content);
console.log('Successfully adjusted layout heights!');
