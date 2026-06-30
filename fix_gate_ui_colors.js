const fs = require('fs');
const file = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldInstructionBlock = `        <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-3 flex flex-col flex-none relative overflow-hidden h-[120px] mt-2 w-full">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <Text className="text-green-400 text-[10px] font-bold tracking-widest block uppercase">ZONE ROUTING PRIORITY</Text>
            {routingStatusData && routingStatusData.length > 0 && (
              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center bg-blue-100 px-2 py-0.5 rounded shadow-sm">
                <AimOutlined className="mr-1" /> Current Suggested:
                <span className="ml-1 text-red-600 font-black">{routingStatusData.find((r: any) => r.isSuggested)?.zoneName || 'None'}</span>
              </div>
            )}
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar items-center w-full">
            {routingStatusData && routingStatusData.length > 0 ? (
              routingStatusData.map((route: any, index: number) => {
                let progressColor = '#52c41a'; // green
                if (route.occupancyRate >= 90) progressColor = '#f5222d'; // red
                else if (route.occupancyRate >= 70) progressColor = '#faad14'; // yellow

                return (
                  <div key={route.zoneId} className={\`flex-none w-52 p-2 rounded-lg border \${route.isSuggested ? 'border-green-400 bg-green-50 shadow-[0_0_8px_rgba(74,222,128,0.3)]' : 'border-slate-600 bg-slate-800'}\`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={\`font-bold text-xs flex items-center \${route.isSuggested ? 'text-green-800' : 'text-slate-200'}\`}>
                        <span className={\`\${route.isSuggested ? 'text-green-500' : 'text-slate-500'} w-4\`}>{index + 1}.</span> 
                        {route.zoneName}
                      </span>
                      <span className={\`text-[10px] font-medium \${route.isSuggested ? 'text-green-700' : 'text-slate-400'}\`}>
                        Avail: <strong className={route.isSuggested ? 'text-green-600' : 'text-white'}>{route.available}</strong> / {route.capacity}
                      </span>
                    </div>
                    <div className={\`flex justify-between text-[10px] mb-1.5 \${route.isSuggested ? 'text-green-600' : 'text-slate-400'}\`}>
                      <span>Parked: {route.occupied}</span>
                      <span>Res: {route.reserved}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        percent={Math.min(100, Math.max(0, route.occupancyRate))} 
                        strokeColor={progressColor} 
                        trailColor={route.isSuggested ? '#bbf7d0' : '#334155'}
                        size="small" 
                        className="m-0 flex-1" 
                        showInfo={false} 
                      />
                      <span className={\`text-[10px] font-bold w-8 text-right \${route.isSuggested ? 'text-green-800' : 'text-slate-300'}\`}>{route.occupancyRate.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500 italic text-xs w-full text-center">Waiting for routing data...</div>
            )}
          </div>
        </div>`;

const newInstructionBlock = `        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col flex-none relative overflow-hidden h-[120px] mt-2 w-full">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <Text className="text-slate-700 text-[10px] font-bold tracking-widest block uppercase">ZONE ROUTING PRIORITY</Text>
            {routingStatusData && routingStatusData.length > 0 && (
              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                <AimOutlined className="mr-1" /> Current Suggested:
                <span className="ml-1 text-red-600 font-black">{routingStatusData.find((r: any) => r.isSuggested)?.zoneName || 'None'}</span>
              </div>
            )}
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar items-center w-full">
            {routingStatusData && routingStatusData.length > 0 ? (
              routingStatusData.map((route: any, index: number) => {
                let progressColor = '#52c41a'; // green
                if (route.occupancyRate >= 90) progressColor = '#f5222d'; // red
                else if (route.occupancyRate >= 70) progressColor = '#faad14'; // yellow

                return (
                  <div key={route.zoneId} className={\`flex-none w-52 p-2 rounded-lg border \${route.isSuggested ? 'border-green-500 bg-green-50 shadow-[0_0_8px_rgba(74,222,128,0.2)]' : 'border-slate-200 bg-slate-50'}\`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={\`font-bold text-xs flex items-center \${route.isSuggested ? 'text-green-800' : 'text-slate-700'}\`}>
                        <span className={\`\${route.isSuggested ? 'text-green-500' : 'text-slate-400'} w-4\`}>{index + 1}.</span> 
                        {route.zoneName}
                      </span>
                      <span className={\`text-[10px] font-medium \${route.isSuggested ? 'text-green-700' : 'text-slate-500'}\`}>
                        Avail: <strong className={route.isSuggested ? 'text-green-600' : 'text-blue-600'}>{route.available}</strong> / {route.capacity}
                      </span>
                    </div>
                    <div className={\`flex justify-between text-[10px] mb-1.5 \${route.isSuggested ? 'text-green-600' : 'text-slate-500'}\`}>
                      <span>Parked: {route.occupied}</span>
                      <span>Res: {route.reserved}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        percent={Math.min(100, Math.max(0, route.occupancyRate))} 
                        strokeColor={progressColor} 
                        trailColor={route.isSuggested ? '#bbf7d0' : '#e2e8f0'}
                        size="small" 
                        className="m-0 flex-1" 
                        showInfo={false} 
                      />
                      <span className={\`text-[10px] font-bold w-8 text-right \${route.isSuggested ? 'text-green-800' : 'text-slate-600'}\`}>{route.occupancyRate.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 italic text-xs w-full text-center">Waiting for routing data...</div>
            )}
          </div>
        </div>`;

content = content.replace(oldInstructionBlock, newInstructionBlock);
fs.writeFileSync(file, content);
console.log('Successfully updated UI colors!');
