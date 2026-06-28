const fs = require('fs');
const path = require('path');

// 1. Patch GateOutConsoleScreen.tsx
const outPath = path.join(__dirname, 'pbms-fe', 'src', 'features', 'staff', 'GateOutConsoleScreen.tsx');
let outContent = fs.readFileSync(outPath, 'utf8');
outContent = outContent.replace(/imageBase64: payload\.imageBase64 \|\| 'https:\/\/placehold\.co\/.*?'/g, "imageBase64: payload.imageBase64 || ''");
outContent = outContent.replace(/lprImageBase64: payload\.lprImageBase64 \|\| 'https:\/\/placehold\.co\/.*?'/g, "lprImageBase64: payload.lprImageBase64 || ''");
outContent = outContent.replace(/imageInBase64: payload\.picInPanorama \|\| 'https:\/\/placehold\.co\/.*?'/g, "imageInBase64: payload.picInPanorama || ''");
outContent = outContent.replace(/lprImageInBase64: payload\.picInFace \|\| 'https:\/\/placehold\.co\/.*?'/g, "lprImageInBase64: payload.picInFace || ''");
fs.writeFileSync(outPath, outContent, 'utf8');
console.log('Fixed GateOutConsoleScreen.tsx');

// 2. Patch ExceptionDeskScreen.tsx
const excPath = path.join(__dirname, 'pbms-fe', 'src', 'features', 'staff', 'ExceptionDeskScreen.tsx');
let excContent = fs.readFileSync(excPath, 'utf8');
const excTarget = '      let mockUrl = `https://placehold.co/600x400/EEE/31343C?text=Anh_Bao_Cao_Tai_Quay_${values.plate || \'Khong_Ro\'}`;';
const excReplacement = '      let mockUrl = \'\';';
excContent = excContent.replace(excTarget, excReplacement);
fs.writeFileSync(excPath, excContent, 'utf8');
console.log('Fixed ExceptionDeskScreen.tsx');

// 3. Patch HelpdeskScreen.tsx
const helpPath = path.join(__dirname, 'pbms-fe', 'src', 'features', 'customer', 'HelpdeskScreen.tsx');
let helpContent = fs.readFileSync(helpPath, 'utf8');
helpContent = helpContent.replace(
  '    let mockUrl = `https://placehold.co/600x400/EEE/31343C?text=Anh_Bao_Cao_${values.plate || \'Khong_Ro\'}`;',
  '    let mockUrl = \'\';'
);
helpContent = helpContent.replace(
  '        else urls.push(`https://placehold.co/600x400/EEE/31343C?text=Anh_The_Hu_${values.plate || \'Khong_Ro\'}`);',
  '        // Omit default URLs in production'
);
helpContent = helpContent.replace(
  '        else urls.push(`https://placehold.co/600x400/EEE/31343C?text=Anh_CCCD_${values.plate || \'Khong_Ro\'}`);',
  '        // Omit default URLs in production'
);
fs.writeFileSync(helpPath, helpContent, 'utf8');
console.log('Fixed HelpdeskScreen.tsx');
