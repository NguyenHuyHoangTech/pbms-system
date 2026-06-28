const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms/modules/operation/controller/IotHardwareController.java';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/map\.put\("rotation", z\.getRotation\(\)\);/, `map.put("rotation", z.getRotation());\n            map.put("functionType", z.getFunctionType());`);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified IotHardwareController Zones!');
