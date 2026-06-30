const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{routingStatusData && routingStatusData\.length > 0 && \([\s\S]*?<AimOutlined className="mr-1" \/> Current Suggested:[\s\S]*?<span className="ml-1 text-red-600 font-black">\{routingStatusData\.find\(\(r: any\) => \s*r\.isSuggested\)\?\.zoneName \|\| 'None'\}<\/span>\s*<\/div>\s*\)\}/;

const newHeader = `{routingStatusData && routingStatusData.length > 0 && (
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

if (regex.test(content)) {
    content = content.replace(regex, newHeader);
    console.log("Successfully replaced the header with scroll buttons!");
} else {
    console.log("Failed to find header regex!");
}

fs.writeFileSync(file, content);
