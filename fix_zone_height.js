const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/h-\[110px\]/g, 'h-[135px]');

fs.writeFileSync(file, content);
console.log('Successfully adjusted zone routing priority height!');
