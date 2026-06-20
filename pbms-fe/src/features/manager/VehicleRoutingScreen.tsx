import React, { useState } from 'react';
import { 
  Typography, Select, DatePicker, Button, Input, 
  Card, message, Space, Divider, Tooltip 
} from 'antd';
import { 
  FilterOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  DashboardOutlined,
  NodeIndexOutlined,
  ClockCircleOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Legend, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

const { Title, Text } = Typography;

// --- MOCK DATA ---

const MOCK_CHART_DATA = [
  { time: '00:00', ZoneA: 5, ZoneB: 2, ZoneC: 0 },
  { time: '04:00', ZoneA: 2, ZoneB: 1, ZoneC: 0 },
  { time: '08:00', ZoneA: 85, ZoneB: 40, ZoneC: 10 },
  { time: '10:00', ZoneA: 95, ZoneB: 70, ZoneC: 30 }, 
  { time: '12:00', ZoneA: 98, ZoneB: 88, ZoneC: 45 }, 
  { time: '16:00', ZoneA: 80, ZoneB: 60, ZoneC: 25 },
  { time: '18:00', ZoneA: 92, ZoneB: 75, ZoneC: 40 }, 
  { time: '20:00', ZoneA: 60, ZoneB: 40, ZoneC: 15 },
  { time: '24:00', ZoneA: 10, ZoneB: 5, ZoneC: 2 },
];

interface ZoneConfig {
  id: string;
  name: string;
}

interface TimeFrame {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  zones: ZoneConfig[];
}

const INITIAL_ZONES: ZoneConfig[] = [
  { id: 'z1', name: 'Khu Vãng lai A (Sát sảnh chính)' },
  { id: 'z2', name: 'Khu Vãng lai B (Tầng lửng)' },
  { id: 'z3', name: 'Khu Vãng lai C (Cuối hầm)' },
  { id: 'z4', name: 'Khu Vãng lai D (Tầng Thượng)' },
];

export const VehicleRoutingScreen = () => {
  const [selectedFloor, setSelectedFloor] = useState('B1');
  const [selectedVehicle, setSelectedVehicle] = useState('CAR');

  const vehicleOptions = selectedFloor === 'B1' 
    ? [{label: 'Ô tô', value: 'CAR'}] 
    : [{label: 'Xe máy', value: 'MOTO'}];

  const handleFloorChange = (val: string) => {
    setSelectedFloor(val);
    setSelectedVehicle(val === 'B1' ? 'CAR' : 'MOTO');
  };

  const [timeFrames, setTimeFrames] = useState<TimeFrame[]>([
    {
      id: 'tf_1',
      name: 'Cao điểm Sáng',
      startTime: '07:00',
      endTime: '09:30',
      zones: [...INITIAL_ZONES]
    }
  ]);

  const handleAddFrame = () => {
    setTimeFrames(prev => [
      ...prev,
      {
        id: `tf_${Date.now()}`,
        name: `Khung giờ mới ${prev.length + 1}`,
        startTime: '10:00',
        endTime: '12:00',
        zones: [...INITIAL_ZONES]
      }
    ]);
  };

  const handleRemoveFrame = (frameId: string) => {
    setTimeFrames(prev => prev.filter(tf => tf.id !== frameId));
  };

  const handleFrameChange = (frameId: string, field: keyof TimeFrame, val: string) => {
    setTimeFrames(prev => prev.map(tf => tf.id === frameId ? { ...tf, [field]: val } : tf));
  };

  // --- CLICK TO MOVE HANDLERS ---
  const moveZone = (frameId: string, index: number, direction: 'LEFT' | 'RIGHT') => {
    setTimeFrames(prev => prev.map(tf => {
      if (tf.id !== frameId) return tf;
      
      const newZones = [...tf.zones];
      if (direction === 'LEFT' && index > 0) {
        // Swap with previous
        const temp = newZones[index];
        newZones[index] = newZones[index - 1];
        newZones[index - 1] = temp;
      } else if (direction === 'RIGHT' && index < newZones.length - 1) {
        // Swap with next
        const temp = newZones[index];
        newZones[index] = newZones[index + 1];
        newZones[index + 1] = temp;
      }
      
      return { ...tf, zones: newZones };
    }));
  };

  const handleSave = () => {
    message.success('Đã lưu kịch bản định tuyến! Hệ thống sẽ tự động bẻ luồng tại cổng.');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 flex flex-col relative pb-24">
      
      {/* KHU VỰC 1: THE ANALYTICS */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        
        {/* Global Filter Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
               <FilterOutlined className="text-indigo-600 text-xl" />
             </div>
             <div>
               <h1 className="text-lg font-bold text-gray-800 m-0">Giám Sát Lưu Lượng</h1>
               <p className="text-xs text-gray-500 m-0">Bộ lọc Toàn Cục</p>
             </div>
          </div>
          <div className="flex gap-4">
             <Select 
               value={selectedFloor} 
               onChange={handleFloorChange}
               className="w-32" 
               options={[ {label: 'Hầm B1', value: 'B1'}, {label: 'Hầm B2', value: 'B2'} ]} 
             />
             <Select 
               value={selectedVehicle} 
               onChange={setSelectedVehicle}
               className="w-32" 
               options={vehicleOptions} 
             />
             <DatePicker className="w-48" placeholder="Chọn ngày phân tích" format="DD/MM/YYYY" />
          </div>
        </div>

        {/* Multi-line Chart */}
        <div className="px-6 py-6 h-[280px] bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 m-0 flex items-center gap-2">
              <DashboardOutlined /> Biểu Đồ Lấp Đầy Zone Vãng Lai (24H)
            </h3>
            <div className="text-xs text-slate-500 bg-white px-3 py-1 rounded border shadow-sm">
              *Đã lọc bỏ Zone Vé Tháng & Khu Vi Phạm
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value}%`, undefined]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
              
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'top', value: 'Critical 90%', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
              
              <Line type="monotone" dataKey="ZoneA" name="Khu Vãng lai A" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="ZoneB" name="Khu Vãng lai B" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="ZoneC" name="Khu Vãng lai C" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KHU VỰC 2: ROUTING MATRIX */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
           <div>
             <Title level={3} className="m-0 flex items-center gap-2 text-gray-800">
               <NodeIndexOutlined className="text-blue-600" /> Ma Trận Định Tuyến (Sắp Xếp)
             </Title>
             <Text type="secondary">Thêm khung giờ và xếp hạng ưu tiên đổ xe (Từ trái sang phải).</Text>
           </div>
           <Button type="primary" ghost icon={<PlusOutlined />} onClick={handleAddFrame}>Thêm Khung Giờ Mới</Button>
        </div>

        {/* TIME FRAMES LIST (VERTICAL) */}
        <div className="flex flex-col gap-5">
          {timeFrames.map((frame) => (
            <Card 
              key={frame.id}
              className="shadow-sm border-gray-300 rounded-xl overflow-hidden [&_.ant-card-body]:p-4"
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Left: Frame Info */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-200 pb-4 lg:pb-0 lg:pr-6 relative">
                  <Input 
                    value={frame.name} 
                    onChange={e => handleFrameChange(frame.id, 'name', e.target.value)}
                    variant="borderless"
                    className="text-lg font-bold px-0 text-indigo-800 hover:bg-gray-50 focus:bg-white transition-colors mb-2"
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <ClockCircleOutlined />
                     <Input 
                       value={frame.startTime} 
                       onChange={e => handleFrameChange(frame.id, 'startTime', e.target.value)}
                       className="w-16 px-1 text-center font-mono border-gray-300" size="small"
                     />
                     <span>đến</span>
                     <Input 
                       value={frame.endTime} 
                       onChange={e => handleFrameChange(frame.id, 'endTime', e.target.value)}
                       className="w-16 px-1 text-center font-mono border-gray-300" size="small"
                     />
                  </div>
                  {timeFrames.length > 1 && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      size="small" 
                      className="absolute top-0 right-0 lg:hidden" 
                      onClick={() => handleRemoveFrame(frame.id)} 
                    />
                  )}
                </div>

                {/* Right: Zones Horizontal Flow */}
                <div className="flex-1 flex flex-row flex-wrap gap-3 items-center">
                  <div className="w-full text-xs text-gray-400 mb-1">Thứ tự ưu tiên:</div>
                  {frame.zones.map((zone, index) => (
                     <div 
                       key={zone.id}
                       className={`flex items-center gap-2 p-2 pr-3 rounded-lg border shadow-sm bg-white transition-all
                         ${index === 0 ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}
                       `}
                     >
                       {/* Priority Badge */}
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                         ${index === 0 ? 'bg-blue-600 text-white shadow-sm' : 
                           index === 1 ? 'bg-blue-400 text-white' : 
                           'bg-gray-200 text-gray-600'}`
                       }>
                         {index + 1}
                       </div>

                       {/* Zone Name */}
                       <div className="font-semibold text-gray-800 text-sm whitespace-nowrap">
                         {zone.name}
                       </div>

                       {/* Move Controls */}
                       <div className="flex items-center ml-2 border-l pl-2 border-gray-200 gap-1">
                          <Tooltip title="Đẩy lên trước">
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<CaretLeftOutlined />} 
                              disabled={index === 0}
                              onClick={() => moveZone(frame.id, index, 'LEFT')}
                              className="w-6 h-6 p-0 flex items-center justify-center hover:bg-gray-100"
                            />
                          </Tooltip>
                          <Tooltip title="Đẩy ra sau">
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<CaretRightOutlined />} 
                              disabled={index === frame.zones.length - 1}
                              onClick={() => moveZone(frame.id, index, 'RIGHT')}
                              className="w-6 h-6 p-0 flex items-center justify-center hover:bg-gray-100"
                            />
                          </Tooltip>
                       </div>
                     </div>
                  ))}
                </div>

                {/* Delete Button for Desktop */}
                {timeFrames.length > 1 && (
                  <div className="hidden lg:flex items-center">
                    <Tooltip title="Xóa khung giờ">
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveFrame(frame.id)} />
                    </Tooltip>
                  </div>
                )}

              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* KHU VỰC 3: BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 flex justify-end px-8">
         <Space size="large">
            <Text type="secondary" className="hidden sm:inline-block">Cấu hình sẽ được đồng bộ xuống Bảng LED điều hướng lập tức.</Text>
            <Button 
              type="primary" 
              size="large" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 font-bold px-8 h-12 text-lg"
            >
              LƯU KỊCH BẢN ĐỊNH TUYẾN
            </Button>
         </Space>
      </div>

    </div>
  );
};
