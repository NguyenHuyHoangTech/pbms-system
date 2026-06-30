const fs = require('fs');
let c1 = fs.readFileSync('src/features/staff/GateInConsoleScreen.tsx', 'utf8');
c1 = c1.replace(
  "await axiosClient.get('/operation/vehicle-types');\r\n      return res.data.data;",
  "await axiosClient.get('/operation/vehicle-types?activeOnly=true');\r\n      return res.data?.data || [];"
);
fs.writeFileSync('src/features/staff/GateInConsoleScreen.tsx', c1);

let c2 = fs.readFileSync('src/features/staff/GateOutConsoleScreen.tsx', 'utf8');
c2 = c2.replace(
  "await axiosClient.get('/operation/vehicle-types');\r\n      return res.data.data;",
  "await axiosClient.get('/operation/vehicle-types?activeOnly=true');\r\n      return res.data?.data || [];"
);
fs.writeFileSync('src/features/staff/GateOutConsoleScreen.tsx', c2);
