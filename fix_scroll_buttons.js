const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add LeftOutlined, RightOutlined
content = content.replace(
    'QrcodeOutlined, IdcardOutlined, ClockCircleOutlined } from \'@ant-design/icons\';',
    'QrcodeOutlined, IdcardOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from \'@ant-design/icons\';'
);

// 2. Add useRef for zone scroll
content = content.replace(
    'const containerRef = useRef<HTMLDivElement>(null);',
    'const containerRef = useRef<HTMLDivElement>(null);\n  const zoneScrollRef = useRef<HTMLDivElement>(null);\n  const scrollZones = (dir: \'left\' | \'right\') => { if(zoneScrollRef.current) { zoneScrollRef.current.scrollBy({ left: dir === \'left\' ? -220 : 220, behavior: \'smooth\' }) } };'
);

// 3. Update the container height and add buttons
content = content.replace(
    'overflow-hidden h-[135px] mt-1 w-full"',
    'overflow-hidden h-[105px] mt-1 w-full"'
);

const oldHeader = `              {routingStatusData && routingStatusData.length > 0 && (
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <AimOutlined className="mr-1" /> Current Suggested:
                  <span className="ml-1 text-red-600 font-black">{routingStatusData.find((r: any) => r.isSuggested)?.zoneName || 'None'}</span>
                </div>
              )}`;
const newHeader = `              {routingStatusData && routingStatusData.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <AimOutlined className="mr-1" /> Current Suggested:
                    <span className="ml-1 text-red-600 font-black">{routingStatusData.find((r: any) => r.isSuggested)?.zoneName || 'None'}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="small" icon={<LeftOutlined />} onClick={() => scrollZones('left')} />
                    <Button size="small" icon={<RightOutlined />} onClick={() => scrollZones('right')} />
                  </div>
                </div>
              )}`;
content = content.replace(oldHeader, newHeader);

// 4. Update the scroll container
content = content.replace(
    'className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar items-center w-full"',
    'ref={zoneScrollRef} className="flex overflow-x-hidden gap-3 items-center w-full"'
);

fs.writeFileSync(file, content);
console.log('Successfully updated gate in console screen scroll feature');
