const fs = require('fs');

const file = 'D:\\0_Semester_5\\pbms-system\\pbms-iot-simulator\\src\\App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-black\/60 px-1 rounded mt-1 text-gray-800/g, 'bg-black/60 px-1 rounded mt-1 text-white');
content = content.replace(/text-yellow-400 font-bold text-xs bg-white\/80/g, 'text-blue-700 font-bold text-xs bg-white/80');
content = content.replace(/bg-blue-600 text-gray-800 text-\[10px\]/g, 'bg-blue-600 text-white text-[10px]');
content = content.replace(/text-gray-400 block mb-2 text-lg/g, 'text-gray-500 block mb-2 text-lg');
content = content.replace(/text-gray-400 font-mono mt-2 block/g, 'text-gray-500 font-mono mt-2 block');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed text contrast issues!');
