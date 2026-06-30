const fs = require('fs');

// 1. PreBookingScreen.tsx
let pBooking = fs.readFileSync('src/features/customer/PreBookingScreen.tsx', 'utf8');
if (!pBooking.includes('getImageUrl')) {
    pBooking = pBooking.replace(
        "import axiosClient from '../../core/api/axiosClient';",
        "import axiosClient from '../../core/api/axiosClient';\nimport { getImageUrl } from '../../core/utils/imageHelper';"
    );
}
pBooking = pBooking.replace(
    "<CarOutlined className=\"text-3xl mb-2\" />",
    "{v.iconUrl ? <img src={getImageUrl(v.iconUrl)} className=\"h-10 mb-2 object-contain\" /> : <CarOutlined className=\"text-3xl mb-2\" />}"
);
fs.writeFileSync('src/features/customer/PreBookingScreen.tsx', pBooking);

// 2. PricingConfigScreen.tsx
let pConfig = fs.readFileSync('src/features/manager/PricingConfigScreen.tsx', 'utf8');
if (!pConfig.includes('getImageUrl')) {
    pConfig = pConfig.replace(
        "import axiosClient from '../../core/api/axiosClient';",
        "import axiosClient from '../../core/api/axiosClient';\nimport { getImageUrl } from '../../core/utils/imageHelper';"
    );
}
// It already uses getImageUrl, let's just make sure
fs.writeFileSync('src/features/manager/PricingConfigScreen.tsx', pConfig);

// 3. GateInConsoleScreen.tsx
let gIn = fs.readFileSync('src/features/staff/GateInConsoleScreen.tsx', 'utf8');
if (!gIn.includes('getImageUrl')) {
    gIn = gIn.replace(
        "import axiosClient from '../../core/api/axiosClient';",
        "import axiosClient from '../../core/api/axiosClient';\nimport { getImageUrl } from '../../core/utils/imageHelper';"
    );
}
gIn = gIn.replace(
    "label: `${v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️'} ${v.typeName}`",
    "label: <div className=\"flex items-center gap-2\">{v.iconUrl ? <img src={getImageUrl(v.iconUrl)} style={{width: 20, height: 20, objectFit: 'contain'}} /> : (v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️')} {v.typeName}</div>"
);
fs.writeFileSync('src/features/staff/GateInConsoleScreen.tsx', gIn);

// 4. GateOutConsoleScreen.tsx
let gOut = fs.readFileSync('src/features/staff/GateOutConsoleScreen.tsx', 'utf8');
if (!gOut.includes('getImageUrl')) {
    gOut = gOut.replace(
        "import axiosClient from '../../core/api/axiosClient';",
        "import axiosClient from '../../core/api/axiosClient';\nimport { getImageUrl } from '../../core/utils/imageHelper';"
    );
}
gOut = gOut.replace(
    "label: `${v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️'} ${v.typeName}`",
    "label: <div className=\"flex items-center gap-2\">{v.iconUrl ? <img src={getImageUrl(v.iconUrl)} style={{width: 20, height: 20, objectFit: 'contain'}} /> : (v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️')} {v.typeName}</div>"
);
fs.writeFileSync('src/features/staff/GateOutConsoleScreen.tsx', gOut);

// 5. ExceptionDeskScreen.tsx
let exc = fs.readFileSync('src/features/staff/ExceptionDeskScreen.tsx', 'utf8');
if (!exc.includes('getImageUrl')) {
    exc = exc.replace(
        "import axiosClient from '../../core/api/axiosClient';",
        "import axiosClient from '../../core/api/axiosClient';\nimport { getImageUrl } from '../../core/utils/imageHelper';"
    );
}
exc = exc.replace(
    "label: `${v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️'} ${v.typeName}`",
    "label: <div className=\"flex items-center gap-2\">{v.iconUrl ? <img src={getImageUrl(v.iconUrl)} style={{width: 20, height: 20, objectFit: 'contain'}} /> : (v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️')} {v.typeName}</div>"
);
fs.writeFileSync('src/features/staff/ExceptionDeskScreen.tsx', exc);

console.log("Done");
