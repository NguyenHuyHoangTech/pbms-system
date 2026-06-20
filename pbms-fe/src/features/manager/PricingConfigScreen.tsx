import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Button, InputNumber, Switch, Input, TimePicker, Collapse, Modal, message, Checkbox, Card } from 'antd';
import { 
  CalculatorOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  CloseOutlined,
  ClockCircleOutlined,
  CarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface Slice {
  id: string;
  duration: number | null; 
  price: number;
  isTail: boolean;
}

interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
  slices: Slice[];
}

interface VehicleConfig {
  globalBaseGuardEnabled: boolean;
  globalBaseGuardTime: number;
  globalBaseGuardPrice: number;
  globalMaxCapEnabled: boolean;
  globalMaxCapPrice: number | null;
  shifts: Shift[];
}

const mockDataByVehicle: Record<string, VehicleConfig> = {
  car4: {
    globalBaseGuardEnabled: true,
    globalBaseGuardTime: 60,
    globalBaseGuardPrice: 15000,
    globalMaxCapEnabled: false,
    globalMaxCapPrice: null,
    shifts: [
      {
        id: 'shift_1', name: 'Ca Ngày', startTime: '06:00', endTime: '22:00', color: 'bg-blue-100 border-blue-300 text-blue-800',
        slices: [
          { id: 'slice_1', duration: 120, price: 20000, isTail: false },
          { id: 'slice_2', duration: 60, price: 10000, isTail: false },
          { id: 'slice_3', duration: null, price: 10000, isTail: true }
        ]
      },
      {
        id: 'shift_2', name: 'Ca Đêm', startTime: '22:00', endTime: '06:00', color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
        slices: [
          { id: 'slice_4', duration: null, price: 50000, isTail: true }
        ]
      }
    ]
  },
  carBig: {
    globalBaseGuardEnabled: true,
    globalBaseGuardTime: 60,
    globalBaseGuardPrice: 25000,
    globalMaxCapEnabled: true,
    globalMaxCapPrice: 200000,
    shifts: [
      {
        id: 'shift_1', name: 'Ca Ngày', startTime: '06:00', endTime: '22:00', color: 'bg-orange-100 border-orange-300 text-orange-800',
        slices: [
          { id: 'slice_1', duration: 120, price: 30000, isTail: false },
          { id: 'slice_2', duration: null, price: 20000, isTail: true }
        ]
      },
      {
        id: 'shift_2', name: 'Ca Đêm', startTime: '22:00', endTime: '06:00', color: 'bg-purple-100 border-purple-300 text-purple-800',
        slices: [
          { id: 'slice_3', duration: null, price: 80000, isTail: true }
        ]
      }
    ]
  },
  moto: {
    globalBaseGuardEnabled: false,
    globalBaseGuardTime: 0,
    globalBaseGuardPrice: 0,
    globalMaxCapEnabled: false,
    globalMaxCapPrice: null,
    shifts: [
      {
        id: 'shift_1', name: 'Cả Ngày', startTime: '00:00', endTime: '23:59', color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
        slices: [
          { id: 'slice_1', duration: 240, price: 5000, isTail: false },
          { id: 'slice_2', duration: null, price: 3000, isTail: true }
        ]
      }
    ]
  },
  bike: {
    globalBaseGuardEnabled: false,
    globalBaseGuardTime: 0,
    globalBaseGuardPrice: 0,
    globalMaxCapEnabled: true,
    globalMaxCapPrice: 10000,
    shifts: [
      {
        id: 'shift_1', name: 'Cả Ngày', startTime: '00:00', endTime: '23:59', color: 'bg-gray-100 border-gray-300 text-gray-800',
        slices: [
          { id: 'slice_1', duration: null, price: 2000, isTail: true }
        ]
      }
    ]
  }
};

export const PricingConfigScreen = () => {
  const [activeTab, setActiveTab] = useState('car4');
  
  // Current config state
  const [config, setConfig] = useState<VehicleConfig>(mockDataByVehicle['car4']);

  useEffect(() => {
    setConfig(mockDataByVehicle[activeTab]);
    setSelectedShiftId(mockDataByVehicle[activeTab].shifts[0]?.id || null);
    setSelectedSliceId(null);
    setCalcResult(null);
  }, [activeTab]);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>('shift_1');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | string[]>(['1', '2']);

  // Calculator State
  const [timeIn, setTimeIn] = useState<Dayjs | null>(dayjs('08:00', 'HH:mm'));
  const [timeOut, setTimeOut] = useState<Dayjs | null>(dayjs('10:30', 'HH:mm'));
  const [calcResult, setCalcResult] = useState<{ total: number, breakdown: string[], minutes: number } | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const selectedShift = config.shifts.find(s => s.id === selectedShiftId);
  const selectedSlice = selectedShift?.slices.find(s => s.id === selectedSliceId);

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const getShiftDuration = (shift: Shift) => {
    const start = parseTime(shift.startTime);
    let end = parseTime(shift.endTime);
    if (end <= start) end += 24 * 60;
    return end - start;
  };

  const getTailDuration = (shift: Shift) => {
    const shiftDur = getShiftDuration(shift);
    const othersSum = shift.slices.filter(s => !s.isTail).reduce((sum, s) => sum + (s.duration || 0), 0);
    return Math.max(0, shiftDur - othersSum);
  };

  // Helper to get shift percentage for timeline
  const getShiftPosition = (startTime: string, endTime: string) => {
    const startMins = parseTime(startTime);
    let endMins = parseTime(endTime);
    if (endMins <= startMins) endMins += 24 * 60;

    const left = (startMins / (24 * 60)) * 100;
    const width = ((endMins - startMins) / (24 * 60)) * 100;
    
    if (startMins + (endMins - startMins) > 24 * 60) {
      return { left: `${left}%`, width: `${width}%`, isWrap: true };
    }
    
    return { left: `${left}%`, width: `${width}%`, isWrap: false };
  };

  const calculatePrice = () => {
    if (!timeIn || !timeOut) return;
    
    let minutes = timeOut.diff(timeIn, 'minute');
    if (minutes < 0) {
      // Assuming next day
      minutes += 24 * 60;
    }
    if (minutes === 0) minutes = 1; // Minimum 1 minute

    let total = 0;
    let breakdown: string[] = [];

    const { globalBaseGuardEnabled, globalBaseGuardTime, globalBaseGuardPrice, globalMaxCapEnabled, globalMaxCapPrice } = config;

    // LỚP TIỀN XỬ LÝ: BỘ LỌC CƠ BẢN TOÀN CẢNH (GLOBAL BASE INTERCEPTOR)
    if (globalBaseGuardEnabled && minutes <= globalBaseGuardTime) {
      total = globalBaseGuardPrice;
      breakdown.push(`[Lớp Tiền Xử Lý] Đỗ ngắn (${minutes}p <= ${globalBaseGuardTime}p)`);
      breakdown.push(`-> Kết thúc thuật toán: Tính giá nền ${globalBaseGuardPrice.toLocaleString()}đ`);
    } else {
      if (globalBaseGuardEnabled) {
         breakdown.push(`[Lớp Tiền Xử Lý] Vượt giá nền (${minutes}p > ${globalBaseGuardTime}p) -> Bỏ qua giá nền, chuyển xuống Máy Cắt Ca.`);
      }

      // BƯỚC 1: MÁY CẮT THEO CA (Helper_SliceByShift)
      const startMinOfDay = timeIn.hour() * 60 + timeIn.minute();
      let chunks: { shift: Shift, duration: number }[] = [];
      
      let currentShiftId: string | null = null;
      let chunkDuration = 0;

      const getShiftForMinute = (min: number) => {
         const wrappedMin = min % 1440;
         return config.shifts.find(s => {
            const sm = parseTime(s.startTime);
            const em = parseTime(s.endTime);
            if (sm < em) return wrappedMin >= sm && wrappedMin < em;
            return wrappedMin >= sm || wrappedMin < em;
         });
      };

      // Dò từng phút để cắt lát
      for (let i = 0; i < minutes; i++) {
         const currentMin = (startMinOfDay + i) % 1440;
         const shift = getShiftForMinute(currentMin);
         const shiftId = shift ? shift.id : 'unknown';

         if (currentShiftId === null) {
            currentShiftId = shiftId;
            chunkDuration = 1;
         } else if (currentShiftId === shiftId) {
            chunkDuration++;
         } else {
            const prevShift = config.shifts.find(s => s.id === currentShiftId);
            if (prevShift) chunks.push({ shift: prevShift, duration: chunkDuration });
            currentShiftId = shiftId;
            chunkDuration = 1;
         }
      }
      
      // Đẩy lát cắt cuối cùng
      if (currentShiftId !== 'unknown') {
         const prevShift = config.shifts.find(s => s.id === currentShiftId);
         if (prevShift) chunks.push({ shift: prevShift, duration: chunkDuration });
      }

      // BƯỚC 2: CỖ MÁY TRƯỢT BLOCK (Helper_SlideBlocks)
      chunks.forEach((chunk, index) => {
         breakdown.push(`--- Lát cắt ${index + 1}: ${chunk.shift.name} (Dài ${chunk.duration} phút) ---`);
         let remainingChunkTime = chunk.duration;
         
         for (let i = 0; i < chunk.shift.slices.length; i++) {
            const slice = chunk.shift.slices[i];
            if (remainingChunkTime <= 0) break;

            const blockDuration = slice.isTail ? getTailDuration(chunk.shift) : (slice.duration || 0);
            const blockName = slice.isTail ? 'Lớp Chốt' : `Lớp ${i+1}`;

            if (remainingChunkTime > 0) {
               total += slice.price;
               if (remainingChunkTime <= blockDuration) {
                  breakdown.push(`[Trượt] ${blockName}: +${slice.price.toLocaleString()}đ (Tiêu hao ${remainingChunkTime}p, Hết Lát cắt)`);
                  remainingChunkTime -= blockDuration;
                  break;
               } else {
                  breakdown.push(`[Trượt] ${blockName}: +${slice.price.toLocaleString()}đ (Tiêu hao hết ${blockDuration}p)`);
                  remainingChunkTime -= blockDuration;
               }
            }
         }

         if (remainingChunkTime > 0) {
            breakdown.push(`⚠️ Cảnh báo: Lát cắt còn dư ${remainingChunkTime}p chưa được tính phí (Do cấu hình block bị hụt so với thời lượng Ca).`);
         }
      });
    }

    // BƯỚC 3: TỔNG HỢP VÀ ÁP TRẦN (Main_CalculateTotalFee)
    breakdown.push(`======================`);
    if (globalMaxCapEnabled && globalMaxCapPrice && total > globalMaxCapPrice) {
      total = globalMaxCapPrice;
      breakdown.push(`-> Chạm Giá Trần Lưu Bãi. Áp dụng trần: ${globalMaxCapPrice.toLocaleString()}đ`);
    } else {
      breakdown.push(`-> Tổng hóa đơn tạm tính: ${total.toLocaleString()}đ`);
    }

    setCalcResult({ total, breakdown, minutes });
  };

  const handleSave = () => {
    if (confirmInput === 'XACNHAN') {
      message.success('Đã lưu cấu hình bảng giá thành công!');
      setIsConfirmModalOpen(false);
      setConfirmInput('');
    } else {
      message.error('Mã xác nhận không hợp lệ!');
    }
  };

  const updateConfig = (field: keyof VehicleConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSliceUpdate = (field: string, value: any) => {
    if (!selectedShiftId || !selectedSliceId) return;
    setConfig(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => {
        if (s.id !== selectedShiftId) return s;
        return {
          ...s,
          slices: s.slices.map(sl => {
            if (sl.id !== selectedSliceId) return sl;
            const newSl = { ...sl, [field]: value };
            if (field === 'isTail' && value === true) {
               newSl.duration = null;
            }
            return newSl;
          })
        };
      })
    }));
  };

  const handleAddShift = () => {
    const newId = `shift_${Date.now()}`;
    let newStartTime = '00:00';
    if (config.shifts.length > 0) {
       newStartTime = config.shifts[config.shifts.length - 1].endTime;
    }
    const [h, m] = newStartTime.split(':').map(Number);
    const endH = (h + 4) % 24; // Mặc định ca mới 4 tiếng
    const newEndTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    
    setConfig(prev => ({
      ...prev,
      shifts: [...prev.shifts, {
        id: newId,
        name: `Ca Mới ${prev.shifts.length + 1}`,
        startTime: newStartTime,
        endTime: newEndTime,
        color: 'bg-gray-100 border-gray-300 text-gray-800',
        slices: [{ id: `slice_${Date.now()}`, duration: null, price: 10000, isTail: true }]
      }]
    }));
    setSelectedShiftId(newId);
  };

  const handleDeleteShift = () => {
    if (!selectedShiftId) return;
    if (config.shifts.length <= 1) {
       message.error('Hệ thống yêu cầu ít nhất 1 ca!');
       return;
    }
    setConfig(prev => ({
      ...prev,
      shifts: prev.shifts.filter(s => s.id !== selectedShiftId)
    }));
    setSelectedShiftId(null);
    setSelectedSliceId(null);
  };

  const handleAddSlice = () => {
    if (!selectedShiftId) return;
    const newId = `slice_${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => {
        if (s.id !== selectedShiftId) return s;
        const tailIndex = s.slices.findIndex(sl => sl.isTail);
        const newSlice = { id: newId, duration: 60, price: 10000, isTail: false };
        let newSlices = [...s.slices];
        if (tailIndex !== -1) {
          newSlices.splice(tailIndex, 0, newSlice);
        } else {
          newSlices.push(newSlice);
        }
        return { ...s, slices: newSlices };
      })
    }));
  };

  const handleDeleteSlice = () => {
    if (!selectedShiftId || !selectedSliceId) return;
    setConfig(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => {
        if (s.id !== selectedShiftId) return s;
        return { ...s, slices: s.slices.filter(sl => sl.id !== selectedSliceId) };
      })
    }));
    setSelectedSliceId(null);
  };

  const handleMoveSlice = (direction: 'left' | 'right') => {
    if (!selectedShiftId || !selectedSliceId) return;
    setConfig(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => {
        if (s.id !== selectedShiftId) return s;
        const idx = s.slices.findIndex(sl => sl.id === selectedSliceId);
        if (idx === -1 || s.slices[idx].isTail) return s;
        const newIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= s.slices.length || s.slices[newIdx].isTail) return s;
        
        const newSlices = [...s.slices];
        [newSlices[idx], newSlices[newIdx]] = [newSlices[newIdx], newSlices[idx]];
        return { ...s, slices: newSlices };
      })
    }));
  };

  const checkTimelineCoverage = () => {
    let totalMins = 0;
    config.shifts.forEach(s => {
      const start = parseTime(s.startTime);
      let end = parseTime(s.endTime);
      if (end <= start) end += 24 * 60;
      totalMins += (end - start);
    });
    // Cho phép sai số 1 phút (ví dụ kết thúc 23:59 thay vì 00:00)
    return totalMins >= 1439 && totalMins <= 1440;
  };
  const is24HCovered = checkTimelineCoverage();

  const tabs = [
    { key: 'car4', label: '🚗 Ô tô 4-7 chỗ' },
    { key: 'carBig', label: '🚙 Ô tô Khách/Tải' },
    { key: 'moto', label: '🛵 Xe máy' },
    { key: 'bike', label: '🚲 Xe đạp/Điện' }
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 text-gray-800 overflow-hidden font-sans">
      
      {/* 1. LEFT COLUMN: MAIN PRICING CANVAS */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200 shadow-sm z-10 overflow-hidden">
        
        {/* Header / Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
               <DollarOutlined className="text-blue-600 text-xl" />
             </div>
             <div>
               <h1 className="text-lg font-bold text-gray-800 m-0">Cấu hình Bảng Giá</h1>
               <p className="text-xs text-gray-500 m-0">Quản lý ma trận giá cước & thời gian</p>
             </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer border-none outline-none ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar bg-gray-50/50">
          
          {/* Master Timeline 24H */}
          <div className="space-y-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2 m-0">
                <ClockCircleOutlined /> Trục Thời Gian Tổng Thể (24H)
              </h3>
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddShift}>
                Thêm Ca
              </Button>
            </div>
            
            {!is24HCovered && (
              <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-md border border-amber-200 inline-block mb-2">
                ⚠️ Tổng thời gian các ca chưa đủ 24H hoặc có sự chồng chéo. Vui lòng kiểm tra lại.
              </div>
            )}
            
            <div className="relative h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden mt-4">
               {/* Grid Lines */}
               <div className="absolute inset-0 flex justify-between px-2 opacity-30 pointer-events-none">
                 {[0, 6, 12, 18, 24].map(h => (
                   <div key={h} className="h-full border-l border-dashed border-gray-400 relative">
                     <span className="absolute -bottom-6 -translate-x-1/2 text-xs font-mono text-gray-500">{h.toString().padStart(2, '0')}:00</span>
                   </div>
                 ))}
               </div>

               {/* Shift Blocks */}
               {config.shifts.map(shift => {
                 const { left, width, isWrap } = getShiftPosition(shift.startTime, shift.endTime);
                 const isSelected = selectedShiftId === shift.id;
                 
                 const renderBlock = (styleLeft: string, styleWidth: string, extraClasses: string = '') => (
                    <div
                      onClick={() => {
                        setSelectedShiftId(shift.id);
                        setSelectedSliceId(null);
                        setActiveAccordion(['2']);
                      }}
                      className={`absolute top-1 bottom-1 rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center border
                        ${shift.color} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : 'opacity-80 hover:opacity-100'} ${extraClasses}`}
                      style={{ left: styleLeft, width: styleWidth }}
                    >
                       <span className={`text-xs font-bold px-2 truncate`}>
                         {shift.name} ({shift.startTime} - {shift.endTime})
                       </span>
                    </div>
                 );

                 if (isWrap) {
                   const startMins = parseTime(shift.startTime);
                   const width1 = ((24 * 60 - startMins) / (24 * 60)) * 100;
                   const endMins = parseTime(shift.endTime);
                   const width2 = (endMins / (24 * 60)) * 100;
                   return (
                     <React.Fragment key={shift.id}>
                        {renderBlock(`${(startMins/(24*60))*100}%`, `${width1}%`, 'rounded-r-none border-r-0')}
                        {renderBlock('0%', `${width2}%`, 'rounded-l-none border-l-0')}
                     </React.Fragment>
                   )
                 }

                 return <React.Fragment key={shift.id}>{renderBlock(left, width)}</React.Fragment>;
               })}
            </div>
            <div className="h-4"></div> {/* Spacer for time labels */}
          </div>

          {/* Shift Slicing Workspace */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide m-0 mb-6 flex items-center gap-2">
              <DollarOutlined /> Lớp Cắt Giá: <span className="text-blue-600">{selectedShift?.name || 'Chưa chọn Ca'}</span>
            </h3>

            {selectedShift ? (
              <div className="flex-1 flex flex-col relative py-4">
                
                {(() => {
                  const shiftDur = getShiftDuration(selectedShift);
                  const othersSum = selectedShift.slices.filter(s => !s.isTail).reduce((sum, s) => sum + (s.duration || 0), 0);
                  const tailDuration = Math.max(0, shiftDur - othersSum);
                  const isOverLimit = othersSum > shiftDur;

                  return (
                    <>
                      {isOverLimit && (
                        <div className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-md border border-red-200 mb-4 inline-block self-start">
                          ⚠️ Tổng thời gian các lớp vượt quá thời lượng Ca ({othersSum}/{shiftDur} phút). Lớp chốt hiện đang là 0 Phút.
                        </div>
                      )}

                      <div className="flex gap-4 items-stretch w-full overflow-x-auto pb-4 custom-scrollbar px-2">
                        {selectedShift.slices.map((slice, index) => {
                          const isTail = slice.isTail;
                          const isSelected = selectedSliceId === slice.id;
                          const displayDuration = isTail ? tailDuration : slice.duration;
                          
                          return (
                            <div
                              key={slice.id}
                              onClick={() => {
                                setSelectedSliceId(slice.id);
                                setActiveAccordion(prev => {
                                  const arr = Array.isArray(prev) ? prev : [prev];
                                  return arr.includes('3') ? arr : [...arr, '3'];
                                });
                              }}
                              className={`relative flex-shrink-0 flex flex-col justify-center items-center p-4 rounded-lg border-2 transition-all cursor-pointer group
                                ${isTail ? 'bg-blue-50 border-blue-200 w-48' : 'bg-white border-gray-200 hover:border-gray-300 w-40'}
                                ${isSelected ? '!border-blue-500 shadow-md scale-105 z-10' : ''}
                                ${isTail && isOverLimit ? '!border-red-300 bg-red-50' : ''}
                              `}
                            >
                              <div className="text-xs text-gray-500 mb-2 font-medium uppercase">
                                {isTail ? 'Lớp Chốt (Tự động)' : `Lớp ${index + 1}`}
                              </div>
                              <div className={`text-lg font-bold mb-3 flex items-center gap-2 ${isTail && isOverLimit ? 'text-red-500' : 'text-gray-800'}`}>
                                {isTail ? `${displayDuration} Phút` : `${slice.duration} Phút`}
                              </div>
                              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-bold border border-green-200">
                                {slice.price.toLocaleString()} đ
                              </div>
                              
                              {/* Connection arrow between blocks */}
                              {!isTail && (
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-0 text-gray-300">
                                  <ArrowRightOutlined />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Slice block */}
                        <div 
                          onClick={handleAddSlice}
                          className="w-32 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer ml-4"
                        >
                          <PlusOutlined className="text-2xl" />
                        </div>
                      </div>
                    </>
                  );
                })()}

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                <div className="text-center">
                  <ClockCircleOutlined className="text-3xl mb-2 text-gray-300" />
                  <p>Vui lòng chọn một Ca trên trục thời gian để cấu hình lớp cắt.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: INSPECTOR PANEL */}
      <div className="w-[450px] bg-white flex flex-col relative z-20">
        
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-700 m-0 uppercase tracking-wide">Cấu hình thông số</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          
          {/* CALCULATOR WIDGET FIXED AT TOP OF INSPECTOR */}
          <div className="p-4 border-b border-gray-200 bg-blue-50/50">
             <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
               <CalculatorOutlined /> WIDGET TÍNH THỬ
             </div>
             
             <div className="flex items-center gap-2 mb-3">
               <div className="flex-1">
                 <label className="block text-xs text-gray-500 mb-1">Giờ Vào</label>
                 <TimePicker 
                   className="w-full" 
                   format="HH:mm" 
                   value={timeIn} 
                   onChange={setTimeIn}
                   allowClear={false}
                 />
               </div>
               <div className="flex-1">
                 <label className="block text-xs text-gray-500 mb-1">Giờ Ra</label>
                 <TimePicker 
                   className="w-full" 
                   format="HH:mm" 
                   value={timeOut} 
                   onChange={setTimeOut}
                   allowClear={false}
                 />
               </div>
               <div className="pt-5">
                 <Button type="primary" onClick={calculatePrice} className="bg-blue-600 shadow-sm">Tính</Button>
               </div>
             </div>

             {/* Output Screen */}
             <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm min-h-[90px] flex flex-col justify-between">
               {calcResult ? (
                 <>
                   <div className="text-xs text-gray-600 space-y-1 mb-2">
                      <div className="font-semibold text-gray-800 mb-1 border-b border-gray-100 pb-1">
                        Tổng thời gian đỗ: {calcResult.minutes} phút
                      </div>
                      {calcResult.breakdown.map((line, i) => <div key={i}>{line}</div>)}
                   </div>
                   <div className="text-right pt-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold">TỔNG CỘNG</span>
                      <span className="text-lg text-green-600 font-bold">
                        {calcResult.total.toLocaleString()} đ
                      </span>
                   </div>
                 </>
               ) : (
                 <div className="text-gray-400 text-xs flex h-full items-center justify-center">
                   Chưa có dữ liệu tính toán.
                 </div>
               )}
             </div>
          </div>

          <Collapse 
             activeKey={activeAccordion} 
             onChange={setActiveAccordion} 
             ghost 
             expandIconPosition="end"
             className="[&_.ant-collapse-item]:border-b [&_.ant-collapse-item]:border-gray-200 [&_.ant-collapse-header]:text-gray-800 [&_.ant-collapse-header]:font-bold [&_.ant-collapse-header]:p-4"
          >
            {/* Section 1: Global */}
            <Panel header={<span className="text-orange-500 text-sm"><CarOutlined className="mr-2"/> CẤU HÌNH TOÀN CỤC</span>} key="1">
               <div className="space-y-4 px-2 pb-2">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-gray-700 font-semibold text-sm">Giá Nền (Base Guard)</span>
                     <Switch checked={config.globalBaseGuardEnabled} onChange={v => updateConfig('globalBaseGuardEnabled', v)} />
                   </div>
                   <div className="space-y-3">
                     <div>
                       <label className="text-xs text-gray-500 block mb-1 font-medium">Thời gian mốc (Phút)</label>
                       <InputNumber disabled={!config.globalBaseGuardEnabled} className="w-full" value={config.globalBaseGuardTime} onChange={v => updateConfig('globalBaseGuardTime', v || 0)} />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 block mb-1 font-medium">Giá tiền (VNĐ)</label>
                       <InputNumber disabled={!config.globalBaseGuardEnabled} className="w-full font-mono text-green-600" value={config.globalBaseGuardPrice} onChange={v => updateConfig('globalBaseGuardPrice', v || 0)} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                     </div>
                   </div>
                 </div>

                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-gray-700 font-semibold text-sm">Giá Lưu Bãi Tối Đa</span>
                     <Switch checked={config.globalMaxCapEnabled} onChange={v => updateConfig('globalMaxCapEnabled', v)} />
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 block mb-1 font-medium">Mức phí tối đa / 1 lượt (VNĐ)</label>
                     <InputNumber disabled={!config.globalMaxCapEnabled} className="w-full font-mono text-orange-600" placeholder="VD: 150000" value={config.globalMaxCapPrice} onChange={v => updateConfig('globalMaxCapPrice', v)} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                   </div>
                 </div>
               </div>
            </Panel>

            {/* Section 2: Shift */}
            {selectedShiftId && (
              <Panel header={<span className="text-blue-500 text-sm"><ClockCircleOutlined className="mr-2"/> CẤU HÌNH CA</span>} key="2">
                <div className="space-y-4 px-2 pb-2">
                  <div>
                     <label className="text-xs text-gray-500 block mb-1 font-medium">Tên Ca</label>
                     <Input value={selectedShift?.name} onChange={e => {
                       setConfig(prev => ({...prev, shifts: prev.shifts.map(s => s.id === selectedShiftId ? {...s, name: e.target.value} : s)}));
                     }}/>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1 font-medium">Bắt đầu</label>
                      <TimePicker className="w-full" value={dayjs(selectedShift?.startTime, 'HH:mm')} format="HH:mm" allowClear={false} onChange={(t, ts) => {
                         if(typeof ts === 'string') {
                           setConfig(prev => ({...prev, shifts: prev.shifts.map(s => s.id === selectedShiftId ? {...s, startTime: ts} : s)}));
                         }
                      }}/>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1 font-medium">Kết thúc</label>
                      <TimePicker className="w-full" value={dayjs(selectedShift?.endTime, 'HH:mm')} format="HH:mm" allowClear={false} onChange={(t, ts) => {
                         if(typeof ts === 'string') {
                           setConfig(prev => ({...prev, shifts: prev.shifts.map(s => s.id === selectedShiftId ? {...s, endTime: ts} : s)}));
                         }
                      }}/>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                     <Button danger size="small" icon={<DeleteOutlined />} onClick={handleDeleteShift}>
                        Xóa Ca Này
                     </Button>
                  </div>
                </div>
              </Panel>
            )}

            {/* Section 3: Slice */}
            {selectedSliceId && selectedSlice && (
              <Panel header={<span className="text-green-600 text-sm"><DollarOutlined className="mr-2"/> CHI TIẾT LỚP CẮT</span>} key="3">
                 <div className="space-y-4 px-2 pb-2">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                       <h4 className="text-green-800 font-bold mb-4 text-sm flex justify-between items-center">
                         <span>Cấu hình Lớp số {selectedShift?.slices.findIndex(s => s.id === selectedSliceId) !== undefined ? (selectedShift!.slices.findIndex(s => s.id === selectedSliceId) + 1) : 'X'}</span>
                         {selectedSlice.isTail && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Lớp Chốt</span>}
                       </h4>
                       
                       <div className="space-y-4">
                         <div>
                           <label className="text-xs text-gray-600 block mb-1 font-medium">
                             Thời lượng {selectedSlice.isTail && "(Tự động tính toán)"}
                           </label>
                           <InputNumber 
                             disabled={selectedSlice?.isTail} 
                             className="w-full" 
                             value={selectedSlice?.isTail ? getTailDuration(selectedShift!) : selectedSlice?.duration} 
                             onChange={v => handleSliceUpdate('duration', v)}
                             addonAfter={<span className="text-gray-500 text-xs">Phút</span>}
                           />
                         </div>
                         <div>
                           <label className="text-xs text-gray-600 block mb-1 font-medium">Giá tiền áp dụng</label>
                           <InputNumber 
                             className="w-full font-mono text-green-600 text-base" 
                             value={selectedSlice?.price} 
                             onChange={v => handleSliceUpdate('price', v)}
                             formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                             addonAfter={<span className="text-gray-500 text-xs">VNĐ</span>}
                           />
                         </div>

                         <div className="flex justify-between items-center pt-3 mt-4 border-t border-green-200/60 border-dashed">
                           <div className="flex gap-2">
                              <Button 
                                size="small" 
                                icon={<ArrowLeftOutlined />} 
                                disabled={selectedSlice.isTail || selectedShift!.slices.findIndex(s => s.id === selectedSliceId) === 0}
                                onClick={() => handleMoveSlice('left')}
                              />
                              <Button 
                                size="small" 
                                icon={<ArrowRightOutlined />} 
                                disabled={selectedSlice.isTail || selectedShift!.slices.findIndex(s => s.id === selectedSliceId) >= selectedShift!.slices.length - 2}
                                onClick={() => handleMoveSlice('right')}
                              />
                           </div>
                           <Button 
                             danger 
                             size="small" 
                             icon={<DeleteOutlined />} 
                             disabled={selectedSlice.isTail}
                             onClick={handleDeleteSlice}
                           >
                              Xóa Lớp
                           </Button>
                        </div>
                       </div>
                    </div>
                 </div>
              </Panel>
            )}

          </Collapse>
        </div>

        {/* BOTTOM ACTION - FIXED */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30 flex gap-3">
           <Button size="large" icon={<CloseOutlined />} className="flex-1 bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100">
             Hủy
           </Button>
           <Button 
             size="large" type="primary" icon={<SaveOutlined />} 
             className="flex-[2] bg-blue-600 hover:bg-blue-500 border-none font-bold shadow-md"
             onClick={() => setIsConfirmModalOpen(true)}
           >
             LƯU BẢNG GIÁ
           </Button>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      <Modal
        title={<span className="text-red-500 font-bold flex items-center gap-2"><InfoCircleOutlined /> XÁC NHẬN THAY ĐỔI DÒNG TIỀN</span>}
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="py-4 text-gray-700">
          <p className="mb-4 text-sm">Hành động này sẽ cập nhật thuật toán tính tiền cho <strong>{tabs.find(t => t.key === activeTab)?.label}</strong>. Vui lòng gõ chữ xác nhận:</p>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <p className="mb-2 text-xs text-gray-500 flex justify-between">
              <span>Mã xác nhận:</span>
              <strong className="text-blue-600 bg-blue-50 px-1 rounded font-mono">XACNHAN</strong>
            </p>
            <Input 
              autoFocus
              placeholder="Gõ XACNHAN..." 
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              className="text-center font-mono uppercase"
              onPressEnter={handleSave}
            />
          </div>
          <div className="flex gap-2">
             <Button onClick={() => setIsConfirmModalOpen(false)} className="flex-1">Hủy Bỏ</Button>
             <Button type="primary" danger onClick={handleSave} disabled={confirmInput !== 'XACNHAN'} className="flex-1 font-bold">
               XÁC NHẬN LƯU
             </Button>
          </div>
        </div>
      </Modal>

      {/* Global Style Overrides */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
};
