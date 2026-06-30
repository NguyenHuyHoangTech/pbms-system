const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Progress import
content = content.replace(
  "import { Card, Button, message, Tag, Typography, Modal, Row, Col, Radio, Input, Divider, Select, InputNumber, QRCode } from 'antd';",
  "import { Card, Button, message, Tag, Typography, Modal, Row, Col, Radio, Input, Divider, Select, InputNumber, QRCode, Progress } from 'antd';"
);

// 2. Add useQuery
const targetState = `  const [scanData, setScanData] = useState<any>(null);
  const [editablePlate, setEditablePlate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);`;

const replaceState = `  const [scanData, setScanData] = useState<any>(null);

  const vehicleTypeId = scanData ? (scanData.vehicleType === 'MOTORBIKE' ? 2 : 1) : (activeGate?.vehicleTypeId || 1);
  const customerType = scanData?.customerType === 'BOOK' ? 'BOOKING' : (scanData?.customerType === 'Monthly Pass' || scanData?.customerType === 'MONTHLY' ? 'MONTHLY' : 'WALK_IN');

  const { data: routingStatusData } = useQuery({
    queryKey: ['routing-status', vehicleTypeId, customerType],
    queryFn: async () => {
      const res = await axiosClient.get(\`/operation/gates/routing-status?vehicleTypeId=\${vehicleTypeId}&customerType=\${customerType}\`);
      return res.data.data;
    },
    refetchInterval: 5000,
    enabled: !!activeGate
  });

  const [editablePlate, setEditablePlate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);`;

content = content.replace(targetState, replaceState);

// 3. UI logic
const targetUI = `              ) : (
                <Tag className="m-0 font-bold px-3 py-1 text-sm rounded border-slate-300">---</Tag>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 min-h-0">
            <Text className="text-slate-500 font-bold mb-1 uppercase tracking-widest text-[10px]">License Plate Identification (aI)</Text>`;

const replaceUI = `              ) : (
                <Tag className="m-0 font-bold px-3 py-1 text-sm rounded border-slate-300">---</Tag>
              )}
            </div>
          </div>

          {/* Routing Recommendations */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden mt-1 pt-1">
            {routingStatusData && routingStatusData.length > 0 ? (
              <>
                <div className="text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wide flex items-center bg-blue-50 p-1.5 rounded">
                  <AimOutlined className="mr-2" />
                  Current recommended zone is: 
                  <span className="ml-1 text-red-600 font-extrabold bg-white px-2 py-0.5 rounded shadow-sm border border-red-200">
                    {routingStatusData.find((r: any) => r.isSuggested)?.zoneName || 'None'}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {routingStatusData.map((route: any, index: number) => {
                    let progressColor = '#52c41a'; // green
                    if (route.occupancyRate >= 90) progressColor = '#f5222d'; // red
                    else if (route.occupancyRate >= 70) progressColor = '#faad14'; // yellow

                    return (
                      <div key={route.zoneId} className={\`mb-2 p-2 rounded-lg border \${route.isSuggested ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white'}\`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs flex items-center">
                            <span className="text-slate-400 w-4">{index + 1}.</span> 
                            {route.zoneName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Avail: <strong className="text-blue-600">{route.available}</strong> / {route.capacity}
                          </span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-500 mb-1">
                          <span>Parked: {route.occupied}</span>
                          <span>Res: {route.reserved}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            percent={Math.min(100, Math.max(0, route.occupancyRate))} 
                            strokeColor={progressColor} 
                            size="small" 
                            className="m-0 flex-1" 
                            showInfo={false} 
                          />
                          <span className="text-[10px] font-bold w-8 text-right">{route.occupancyRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 italic text-xs mt-4">No routing data available</div>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 min-h-0 border-t border-slate-100 mt-2 pt-2">
            <Text className="text-slate-500 font-bold mb-1 uppercase tracking-widest text-[10px]">License Plate Identification (aI)</Text>`;

content = content.replace(targetUI, replaceUI);

fs.writeFileSync(file, content);
console.log('Script updated UI successfully!');
