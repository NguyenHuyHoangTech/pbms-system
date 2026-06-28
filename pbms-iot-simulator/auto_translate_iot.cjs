const fs = require('fs');
const path = require('path');

const map = {
  "S?N SÀNG": "READY",
  "ÐANG B?N": "BUSY",
  "KHÓA": "LOCKED",
  "CH? Ð?": "SLOTS",
  "T?ng": "Floor",
  "Bãi Xe": "Parking Lot",
  "Ch?n v? trí C?ng": "Select Gate Location",
  "Tr?ng thái Bãi": "Lot Status",
  "Gi? l?p Camera Ð?u Vào": "Simulate Inbound Camera",
  "Gi? l?p Camera Ð?u Ra": "Simulate Outbound Camera",
  "Gi? l?p s? ki?n": "Simulate Event",
  "Bi?n s?": "Plate",
  "Nh?n di?n Bi?n s?": "Recognize Plate",
  "Lo?i xe": "Vehicle Type",
  "G?i S? ki?n": "Send Event"
};

function walkDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            walkDir(file);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                let content = fs.readFileSync(file, 'utf8');
                let modified = false;
                
                for (let key in map) {
                    if (content.includes(key)) {
                        content = content.split(key).join(map[key]);
                        modified = true;
                    }
                }
                
                if (modified) {
                    fs.writeFileSync(file, content, 'utf8');
                    console.log('Updated', file);
                }
            }
        }
    });
}
walkDir(path.join(__dirname, 'src'));
console.log('Done mapping IoT.');
