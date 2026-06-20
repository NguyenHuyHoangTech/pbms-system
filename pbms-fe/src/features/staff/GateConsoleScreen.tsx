import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useWebSocket } from '../../core/websocket/useWebSocket';
import { Card, Button, message, Tag, Typography, Modal, Row, Col, Radio, Input, Divider, Select, InputNumber } from 'antd';
import { CarOutlined, LockOutlined, UnlockOutlined, CheckCircleOutlined, DollarOutlined, AimOutlined, WarningOutlined, CloseCircleOutlined, QrcodeOutlined, IdcardOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../core/api/axiosClient';
import { Stage, Layer, Rect, Group, Text as KonvaText, Line } from 'react-konva';
import Konva from 'konva';

const { Title, Text } = Typography;

const MOCK_GATES = [
  { id: 1, name: 'Gate IN - Làn Ô tô (B1)', status: 'IDLE', type: 'IN', floor: 'B1' },
  { id: 2, name: 'Gate IN - Làn Xe máy (B1)', status: 'OCCUPIED', staffName: 'Nguyen Van A', type: 'IN', floor: 'B1' },
  { id: 3, name: 'Gate OUT - Tổng hợp (B1)', status: 'IDLE', type: 'OUT', floor: 'B1' },
  { id: 4, name: 'Đội Tuần Tra - Tầng 1', status: 'IDLE', type: 'PATROL', floor: 'B1' },
  { id: 5, name: 'Gate OUT - Tầng B2', status: 'IDLE', type: 'OUT', floor: 'B2' },
  { id: 6, name: 'Đội Tuần Tra - Tầng 2', status: 'IDLE', type: 'PATROL', floor: 'B2' }
];

const GRID_SIZE = 50;
const STAFF_MOCK_ZONES = [
  { id: 1, name: 'Zone A', capacity: 5, vehicleType: 'CAR', layoutX: 100, layoutY: 100, rotation: 0, slots: Array.from({length: 5}).map((_, i) => ({ id: `A0${i+1}`, status: i % 2 === 0 ? 'OCCUPIED' : 'EMPTY', name: `A0${i+1}`, plate: i % 2 === 0 ? `51A-${100+i}.4${i}` : undefined })) },
  { id: 2, name: 'Zone B', capacity: 8, vehicleType: 'MOTORBIKE', layoutX: 100, layoutY: 400, rotation: 0, slots: Array.from({length: 8}).map((_, i) => ({ id: `B0${i+1}`, status: i === 1 ? 'OCCUPIED' : 'EMPTY', name: `B0${i+1}`, plate: i === 1 ? '59G-123.45' : undefined })) },
  { id: 3, name: 'Zone C', capacity: 4, vehicleType: 'CAR', layoutX: 500, layoutY: 100, rotation: 90, slots: Array.from({length: 4}).map((_, i) => ({ id: `C0${i+1}`, status: i === 1 ? 'OCCUPIED' : 'EMPTY', name: `C0${i+1}`, plate: i === 1 ? '30A-999.99' : undefined })) },
];

const getVehicleDimensions = (type: string) => {
  if (type === 'CAR') return { width: 3 * GRID_SIZE, height: 5 * GRID_SIZE }; 
  if (type === 'MOTORBIKE') return { width: 1 * GRID_SIZE, height: 2 * GRID_SIZE }; 
  return { width: 2 * GRID_SIZE, height: 4 * GRID_SIZE };
};

export const GateConsoleScreen = () => {
  const { connected } = useWebSocket();
  
  const navigate = useNavigate();

  const [isShiftActive, setIsShiftActive] = useState(false);
  const [activeGate, setActiveGate] = useState<any>(null);

  const [scanData, setScanData] = useState<any>(null);
  const [editablePlate, setEditablePlate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mockZones, setMockZones] = useState(STAFF_MOCK_ZONES);
  const [preBookingSlotId, setPreBookingSlotId] = useState<string | null>(null);
  
  // OUT Gate states
  const [checkoutFee, setCheckoutFee] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PAYOS' | 'VNPAY'>('CASH');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Pre-booking notification state
  const [showPreBooking, setShowPreBooking] = useState(true);

  const shiftStatus = useAuthStore((state) => state.shiftStatus);

  useEffect(() => {
    const activeGateIdStr = sessionStorage.getItem('mockActiveGateId');
    if (shiftStatus === 'OPEN' && activeGateIdStr) {
      const gate = MOCK_GATES.find(g => String(g.id) === activeGateIdStr);
      if (gate) {
        setActiveGate(gate);
        setIsShiftActive(true);
      }
    } else {
      setIsShiftActive(false);
    }
  }, [shiftStatus]);

  // Konva State
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mapCols] = useState(30);
  const [mapRows] = useState(20);
  
  const activeSlotRef = useRef<Konva.Rect | null>(null);
  const tweenRef = useRef<Konva.Tween | null>(null);
  
  const preBookingSlotRef = useRef<Konva.Rect | null>(null);
  const preBookingTweenRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && isShiftActive) {
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const mapW = mapCols * GRID_SIZE;
      const mapH = mapRows * GRID_SIZE;
      
      const scale = Math.min(containerW / mapW, containerH / mapH) * 0.95;
      const minScaleLocked = Math.min(scale, 1);
      
      setStageScale(minScaleLocked);
      setStagePos({
        x: (containerW - mapW * minScaleLocked) / 2,
        y: (containerH - mapH * minScaleLocked) / 2
      });
    }
  }, [isShiftActive, mapCols, mapRows]);

  useEffect(() => {
    // Handle flashing animation for allocated slot (First empty slot in Zone)
    if (scanData?.allocatedZoneId && activeGate?.type === 'IN') {
      const stage = stageRef.current;
      if (stage) {
        const zone = mockZones.find(z => z.id === scanData.allocatedZoneId);
        if (zone) {
           const firstEmptySlot = [...zone.slots].sort((a,b) => a.name.localeCompare(b.name)).find(s => s.status === 'EMPTY');
           if (firstEmptySlot) {
             const slotNode = stage.findOne(`#slot-${firstEmptySlot.id}`);
             if (slotNode) {
               activeSlotRef.current = slotNode as Konva.Rect;
               const rect = activeSlotRef.current;
               
               let isYellow = false;
               const blinkInterval = setInterval(() => {
                 rect.fill(isYellow ? 'transparent' : '#fef08a'); // yellow-200
                 isYellow = !isYellow;
                 rect.getLayer()?.batchDraw();
               }, 500);

               tweenRef.current = blinkInterval as any;
             }
           }
        }
      }
    } else {
      if (tweenRef.current) {
        clearInterval(tweenRef.current as any);
        tweenRef.current = null;
      }
      if (activeSlotRef.current) {
        activeSlotRef.current.fill('transparent');
        activeSlotRef.current.getLayer()?.batchDraw();
        activeSlotRef.current = null;
      }
    }
    
    return () => {
      if (tweenRef.current) clearInterval(tweenRef.current as any);
    }
  }, [scanData, activeGate]);

  useEffect(() => {
    // Handle flashing for pre-booking notification
    if (showPreBooking && isShiftActive && activeGate?.type === 'IN') {
      const stage = stageRef.current;
      if (stage) {
        const zoneA = mockZones.find(z => z.id === 1);
        if (zoneA) {
          const firstEmpty = [...zoneA.slots].sort((a,b) => a.name.localeCompare(b.name)).find(s => s.status === 'EMPTY');
          if (firstEmpty) {
            setPreBookingSlotId(firstEmpty.id);
            const slotNode = stage.findOne(`#slot-${firstEmpty.id}`);
            if (slotNode) {
              preBookingSlotRef.current = slotNode as Konva.Rect;
              const rect = preBookingSlotRef.current;
              
              let isBlue = false;
              const blinkInterval = setInterval(() => {
                rect.fill(isBlue ? 'transparent' : '#bfdbfe'); // blue-200
                isBlue = !isBlue;
                rect.getLayer()?.batchDraw();
              }, 500);

              preBookingTweenRef.current = blinkInterval;
            }
          }
        }
      }
    } else {
      if (preBookingTweenRef.current) {
        clearInterval(preBookingTweenRef.current);
        preBookingTweenRef.current = null;
      }
      if (preBookingSlotRef.current) {
        preBookingSlotRef.current.fill('transparent');
        preBookingSlotRef.current.getLayer()?.batchDraw();
        preBookingSlotRef.current = null;
      }
    }

    return () => {
      if (preBookingTweenRef.current) clearInterval(preBookingTweenRef.current);
    }
  }, [showPreBooking, isShiftActive, activeGate, mockZones]);



  useEffect(() => {
    if (isShiftActive && activeGate) {
      // Enhanced Mock Data Generator for UI Demonstration
      const mockInterval = setInterval(() => {
        if (!scanData) {
          const isBlacklisted = Math.random() > 0.8;
          const types = ['VÃNG LAI', 'ĐẶT TRƯỚC', 'VÉ THÁNG'];
          const customerType = types[Math.floor(Math.random() * types.length)];
          const isCar = Math.random() > 0.5;

          if (activeGate.type === 'IN') {
            const plate = isCar ? `51G-${Math.floor(100+Math.random()*899)}.${Math.floor(10+Math.random()*89)}` : `59X1-${Math.floor(10000+Math.random()*89999)}`;
            const hasWarning = Math.random() > 0.5;
            const warnings = hasWarning ? ['Khách hàng nợ phí tháng trước', 'Biển số có dấu hiệu bị mờ'] : [];
            
            setEditablePlate(plate);
            setScanData({
              plateNumber: plate,
              imageBase64: 'https://placehold.co/600x400/2c3e50/ffffff?text=Panorama+Camera+Feed',
              lprImageBase64: 'https://placehold.co/300x100/34495e/ffffff?text=LPR+Crop',
              isBlacklisted,
              warnings,
              rfid: `CARD-${Math.floor(10000 + Math.random() * 89999)}`,
              customerType,
              vehicleType: isCar ? 'CAR' : 'MOTORBIKE',
              allocatedZoneId: isCar ? 1 : 2,
              routing: isCar ? `Tầng B1 - Zone A` : `Tầng B1 - Zone B`
            });
          } else {
            // OUT Gate mock data
            const plate = isCar ? `51G-${Math.floor(100+Math.random()*899)}.${Math.floor(10+Math.random()*89)}` : `59X1-${Math.floor(10000+Math.random()*89999)}`;
            const hasWarning = Math.random() > 0.6;
            const warnings = hasWarning ? ['Thời gian ra trễ hơn đăng ký', 'Biển số AI nhận dạng có 1 ký tự sai lệch'] : [];

            setEditablePlate(plate);
            setScanData({
              plateNumberOut: plate,
              plateNumberIn: plate.replace(/.$/, (Math.random() > 0.5 ? 'X' : plate.slice(-1))),
              imageOutBase64: 'https://placehold.co/600x400/2c3e50/ffffff?text=OUT+Panorama',
              lprImageOutBase64: 'https://placehold.co/300x100/34495e/ffffff?text=OUT+LPR',
              imageInBase64: 'https://placehold.co/600x400/27ae60/ffffff?text=IN+Panorama',
              lprImageInBase64: 'https://placehold.co/300x100/27ae60/ffffff?text=IN+LPR',
              feeBase: isCar ? 30000 : 5000,
              feePenalty: Math.random() > 0.8 ? 50000 : 0, 
              discount: Math.random() > 0.8 ? 10000 : 0,
              rfid: `CARD-${Math.floor(10000 + Math.random() * 89999)}`,
              customerType,
              vehicleType: isCar ? 'CAR' : 'MOTORBIKE',
              allocatedZoneId: isCar ? 1 : 2,
              timeIn: '08:00 18/06',
              timeOut: '13:30 18/06',
              duration: '5 giờ 30 phút',
              isBlacklisted: false,
              warnings
            });
          }
        }
      }, 10000);

      return () => clearInterval(mockInterval);
    }
  }, [isShiftActive, activeGate, scanData]);

  const handleCancel = () => {
    setScanData(null);
    setEditablePlate('');
    setCheckoutFee(null);
    setPaymentMethod('CASH');
    setPaymentConfirmed(false);
    message.warning('Đã hủy bỏ phiên quét hiện tại.');
  };

  const handleCheckIn = async () => {
    if (!scanData || !activeGate) return;
    setIsLoading(true);
    setTimeout(() => {
      message.success(`Xác nhận xe vào thành công! Barrier đã mở.`);
      setScanData(null);
      setEditablePlate('');
      setIsLoading(false);
    }, 800);
  };

  const handleCalculateFee = () => {
    if (!scanData) return;
    setIsLoading(true);
    setTimeout(() => {
      const total = scanData.feeBase + scanData.feePenalty - (scanData.discount || 0);
      setCheckoutFee(total > 0 ? total : 0);
      setIsLoading(false);
    }, 500);
  };

  const handleMockPaymentSuccess = () => {
    setPaymentConfirmed(true);
    message.success('Hệ thống ghi nhận thanh toán thành công!');
  };

  const handleCompletePaymentAndOpen = () => {
    message.success('Đã mở barrier cho xe ra!');
    setScanData(null);
    setEditablePlate('');
    setCheckoutFee(null);
    setPaymentMethod('CASH');
    setPaymentConfirmed(false);
  };

  const handleAutoZoom = (zone: any) => {
    if (!stageRef.current || !containerRef.current) return;
    
    const { width: slotW, height: slotH } = getVehicleDimensions(zone.vehicleType);
    let zoneW = zone.capacity * slotW;
    let zoneH = slotH;
    
    if (zone.rotation === 90 || zone.rotation === 270) {
      zoneW = slotH;
      zoneH = zone.capacity * slotW;
    }

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const padding = 100;
    const scaleX = (containerW - padding) / zoneW;
    const scaleY = (containerH - padding) / zoneH;
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.min(newScale, 3);

    let centerX = zone.layoutX;
    let centerY = zone.layoutY;
    
    if (zone.rotation === 0) {
      centerX += zoneW / 2;
      centerY += zoneH / 2;
    } else if (zone.rotation === 90) {
      centerX -= zoneW / 2;
      centerY += zoneH / 2;
    }

    const newX = containerW / 2 - centerX * newScale;
    const newY = containerH / 2 - centerY * newScale;

    const tween = new Konva.Tween({
      node: stageRef.current,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut,
      x: newX,
      y: newY,
      scaleX: newScale,
      scaleY: newScale,
      onFinish: () => {
        setStagePos({ x: newX, y: newY });
        setStageScale(newScale);
      }
    });
    tween.play();
  };

  const drawGrid = () => {
    const lines = [];
    const width = mapCols * GRID_SIZE;
    const height = mapRows * GRID_SIZE;
    
    lines.push(
      <Rect key="bg" x={0} y={0} width={width} height={height} fill="#f8fafc" />
    );

    for (let i = 1; i < mapCols; i++) {
      lines.push(
        <Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, height]} stroke="#cbd5e1" strokeWidth={1} opacity={0.2} />
      );
    }
    for (let j = 1; j < mapRows; j++) {
      lines.push(
        <Line key={`h-${j}`} points={[0, j * GRID_SIZE, width, j * GRID_SIZE]} stroke="#cbd5e1" strokeWidth={1} opacity={0.2} />
      );
    }
    
    lines.push(
      <Rect key="border" x={0} y={0} width={width} height={height} stroke="#334155" strokeWidth={4} listening={false} />
    );

    return lines;
  };

  if (!isShiftActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <WarningOutlined className="text-6xl text-orange-400 mb-4" />
          <Title level={3} className="text-slate-800">Chưa Mở Ca Trực</Title>
          <Text className="block text-slate-500 mb-8 text-base">Hệ thống không tìm thấy phiên làm việc nào đang mở. Vui lòng quay lại màn hình Quản lý Ca để nhận vị trí phân công.</Text>
          <Button 
            type="primary" 
            size="large" 
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 font-bold text-lg rounded-xl shadow-md"
            onClick={() => navigate('/staff/shift-management')}
          >
            Về trang Quản lý Ca
          </Button>
        </div>
      </div>
    );
  }

  // Universal Identity Card
  const renderIdentityCard = () => {
    let tagColor = 'blue';
    if (scanData?.customerType === 'ĐẶT TRƯỚC') tagColor = 'gold';
    if (scanData?.customerType === 'VÉ THÁNG') tagColor = 'green';

    return (
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <IdcardOutlined className="text-2xl text-blue-500" />
            <Text className="text-xl font-bold text-slate-800">{scanData?.rfid || '---'}</Text>
          </div>
          <div className="flex items-center space-x-2">
            {scanData?.customerType && (
              <Tag color={tagColor} className="m-0 font-bold px-3 py-1 text-sm border-0">
                {scanData.customerType}
              </Tag>
            )}
            <Tag color="default" className="m-0 font-bold px-3 py-1 text-sm border-0 flex items-center">
              {scanData?.vehicleType === 'CAR' ? '🚗 Ô tô' : (scanData ? '🛵 Xe máy' : '---')}
            </Tag>
          </div>
        </div>
        <div className="flex flex-col">
          <Text className="text-slate-500 font-bold mb-1 block">Biển số nhận diện (Chỉnh sửa nếu AI sai):</Text>
          <Input 
            size="large" 
            value={editablePlate} 
            onChange={(e) => setEditablePlate(e.target.value)} 
            disabled={!scanData}
            className="text-4xl font-mono font-bold text-center h-16 tracking-widest text-slate-900 border-2 border-blue-400 focus:border-blue-600"
          />
        </div>
      </div>
    );
  };

  const renderInGatePanel = () => (
    <div className="flex flex-col h-full overflow-hidden w-full bg-slate-100">
      {/* TASK 1 & 2: Top Zone (Cameras) - STRICT h-[35%] */}
      <div className="h-[35%] flex-none p-2 relative flex bg-slate-900 border-b-4 border-slate-800">
        <div className="absolute top-0 left-0 bg-black/70 text-white px-2 py-1 text-[10px] z-10 font-bold uppercase tracking-widest">
          Camera Feeds
        </div>
        {scanData ? (
          <>
            <div className="flex-1 relative border-r-2 border-slate-800 h-full">
              <img src={scanData.imageBase64} alt="Panorama" className="w-full h-full object-cover" />
            </div>
            <div className="w-1/3 h-full relative bg-slate-950 flex flex-col items-center justify-center p-2">
              <div className="w-full aspect-[3/1] border-2 border-blue-500 rounded relative overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <img src={scanData.lprImageBase64} alt="LPR Crop" className="w-full h-full object-cover" />
              </div>
              <Text className="text-slate-400 text-[9px] mt-1 font-bold tracking-widest uppercase">LPR Snapshot</Text>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
            <AimOutlined className="text-5xl mb-2 opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
            <Text className="text-slate-400 font-bold tracking-widest text-sm">ĐANG CHỜ TÍN HIỆU XE TỪ CỔNG...</Text>
          </div>
        )}
      </div>

      {/* TASK 1 & 3: Middle Zone (Info & Alerts) - STRICT h-[50%] No Scroll */}
      <div className="h-[50%] flex-none overflow-hidden p-2 flex flex-col gap-2 bg-slate-50">
        {scanData?.isBlacklisted && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-2 font-bold text-center rounded-lg animate-pulse shadow-sm flex-none">
            <WarningOutlined className="mr-2" />
            <span className="text-sm">CẢNH BÁO: XE DANH SÁCH ĐEN! TỪ CHỐI CHO VÀO!</span>
          </div>
        )}

        {scanData && (
          <div className={`p-2 rounded-lg shadow-sm flex-none text-xs flex flex-col gap-1 overflow-hidden border ${scanData.warnings?.length > 0 ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
             <div className="font-bold flex items-center justify-between">
               <div className="flex items-center">
                 {scanData.warnings?.length > 0 ? <WarningOutlined className="mr-1"/> : <CheckCircleOutlined className="mr-1"/>} 
                 CẢNH BÁO / LƯU Ý:
               </div>
             </div>
             <div className="flex-1 overflow-hidden min-h-[30px]">
               {scanData.warnings?.length > 0 ? (
                 <ul className="list-disc pl-4 m-0">
                   {scanData.warnings.map((w: string, idx: number) => <li key={idx} className="truncate" title={w}>{w}</li>)}
                 </ul>
               ) : (
                 <span className="text-green-600">Hệ thống không ghi nhận cảnh báo nào đối với xe này.</span>
               )}
             </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <IdcardOutlined className="text-2xl text-blue-600" />
              <Text className="text-xl font-bold text-slate-700 font-mono tracking-wider">{scanData?.rfid || '---'}</Text>
            </div>
            <div className="flex items-center space-x-2">
              <Tag color={
                !scanData ? 'default' :
                scanData.customerType === 'VÃNG LAI' ? 'blue' : 
                (scanData.customerType === 'ĐẶT TRƯỚC' ? 'gold' : 'green')
              } className="m-0 font-bold px-3 py-1 text-sm rounded shadow-sm border border-transparent">
                {scanData?.customerType || '---'}
              </Tag>
              {scanData ? (
                <Select 
                  size="large"
                  value={scanData.vehicleType}
                  onChange={(val) => setScanData({...scanData, vehicleType: val})}
                  className="w-32 font-bold text-base"
                  options={[
                    { value: 'CAR', label: '🚗 Ô Tô' },
                    { value: 'MOTORBIKE', label: '🛵 Xe Máy' }
                  ]}
                />
              ) : (
                <Tag className="m-0 font-bold px-3 py-1 text-sm rounded border-slate-300">---</Tag>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 min-h-0">
            <Text className="text-slate-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Biển Số Nhận Diện (AI)</Text>
            <Input 
              value={editablePlate} 
              onChange={(e) => setEditablePlate(e.target.value)} 
              disabled={!scanData}
              placeholder="---"
              className="w-full text-3xl h-12 font-mono text-center font-bold uppercase rounded-lg border-2 border-blue-400 focus:border-blue-600 focus:shadow-[0_0_8px_rgba(37,99,235,0.2)] bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        {scanData?.routing ? (
          <div className="bg-slate-900 border-2 border-green-500 rounded-xl p-3 text-center shadow-[0_0_15px_rgba(34,197,94,0.3)] flex-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
            <Text className="text-green-400 text-xs font-bold tracking-widest block uppercase mb-1">HƯỚNG DẪN VÀO BÃI</Text>
            <div className="text-xl font-bold text-white tracking-wide truncate">
              {scanData.routing}
            </div>
          </div>
        ) : (
           <div className="bg-slate-200 border border-slate-300 rounded-xl p-3 text-center flex-none">
             <Text className="text-slate-400 text-xs font-bold tracking-widest block uppercase mb-1">HƯỚNG DẪN VÀO BÃI</Text>
             <div className="text-xl font-bold text-slate-500 tracking-wide truncate">---</div>
           </div>
        )}
      </div>

      {/* TASK 1 & 4: Bottom Zone (Actions) - STRICT h-[15%] */}
      <div className="h-[15%] flex-none p-2 border-t border-slate-200 bg-white flex gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <Button 
          size="large" 
          danger
          icon={<CloseCircleOutlined />}
          className="h-full flex-1 text-lg font-bold rounded-lg border border-red-500 text-red-600 hover:bg-red-50"
          disabled={!scanData}
          onClick={handleCancel}
        >
          Hủy bỏ
        </Button>
        <Button 
          type="primary" 
          size="large" 
          className="h-full flex-[2] text-xl font-bold rounded-lg bg-green-600 hover:bg-green-500 shadow-md border-b-2 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
          disabled={!scanData}
          loading={isLoading}
          onClick={handleCheckIn}
        >
          Xác nhận & Cho xe vào
        </Button>
      </div>
    </div>
  );

  const renderOutGatePanel = () => {
    const totalFee = scanData ? Math.max(0, scanData.feeBase + scanData.feePenalty - (scanData.discount || 0)) : 0;

    return (
      <div className="flex h-full overflow-hidden w-full bg-slate-100 rounded-xl shadow-inner gap-4">
        {/* LEFT SIDE: 4-Way Cameras (45% width) */}
        <div className="w-[45%] flex-none p-2 flex gap-2 bg-slate-900 border-4 border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {!scanData ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
              <AimOutlined className="text-6xl mb-4 opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
              <Text className="text-slate-400 font-bold tracking-widest text-lg">ĐANG CHỜ TÍN HIỆU XE RA...</Text>
            </div>
          ) : (
            <>
              {/* IN Column */}
              <div className="flex-1 flex flex-col gap-2 border-r-2 border-slate-700 pr-2">
                <div className="text-xs font-bold text-green-400 text-center uppercase tracking-widest bg-slate-800 py-1 rounded">Ảnh Xe Vào</div>
                <div className="flex-1 relative bg-black rounded overflow-hidden border border-slate-700"><img src={scanData.imageInBase64} alt="IN Pan" className="w-full h-full object-cover absolute" /></div>
                <div className="h-[25%] relative bg-black rounded overflow-hidden border border-slate-700"><img src={scanData.lprImageInBase64} alt="IN LPR" className="w-full h-full object-cover absolute" /></div>
              </div>
              {/* OUT Column */}
              <div className="flex-1 flex flex-col gap-2 pl-2">
                <div className="text-xs font-bold text-blue-400 text-center uppercase tracking-widest bg-slate-800 py-1 rounded">Ảnh Xe Ra</div>
                <div className="flex-1 relative bg-black rounded overflow-hidden border border-slate-700"><img src={scanData.imageOutBase64} alt="OUT Pan" className="w-full h-full object-cover absolute" /></div>
                <div className="h-[25%] relative bg-black rounded overflow-hidden border border-slate-700"><img src={scanData.lprImageOutBase64} alt="OUT LPR" className="w-full h-full object-cover absolute" /></div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDE: Info, Plates, Billing, Actions (55% width) */}
        <div className="w-[55%] flex flex-col h-full bg-slate-50 border border-slate-300 rounded-xl overflow-hidden shadow-sm">
          
          {/* STRICT ZERO-SCROLL Detail Area (Split into 2 internal columns) */}
          <div className="flex-1 p-2 flex gap-2 min-h-0 overflow-hidden">
            {scanData ? (
              <>
                {/* Internal Left: Info & Plates */}
                <div className="w-1/2 flex flex-col gap-2 h-full">
                  
                  {/* Identity & Slot */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center flex-none">
                    <div className="flex items-center space-x-2">
                      <IdcardOutlined className="text-2xl text-blue-600" />
                      <Text className="text-xl font-bold text-slate-700 font-mono tracking-wider">{scanData.rfid}</Text>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag color="purple" className="m-0 font-bold px-3 py-1 text-sm rounded">Khu: {scanData.allocatedZoneId === 1 ? 'Zone A' : 'Zone B'}</Tag>
                      <Tag color={scanData.customerType === 'VÃNG LAI' ? 'blue' : (scanData.customerType === 'ĐẶT TRƯỚC' ? 'gold' : 'green')} className="m-0 font-bold px-3 py-1 text-sm rounded shadow-sm border border-transparent">
                        {scanData.customerType}
                      </Tag>
                    </div>
                  </div>

                  {/* Warnings Section */}
                  <div className={`p-2 rounded-lg shadow-sm flex-none flex flex-col gap-1 border overflow-hidden ${scanData.warnings?.length > 0 ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
                    <div className="font-bold flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        {scanData.warnings?.length > 0 ? <WarningOutlined className="mr-1 text-sm"/> : <CheckCircleOutlined className="mr-1 text-sm"/>} 
                        CẢNH BÁO / LƯU Ý:
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-[30px]">
                      {scanData.warnings?.length > 0 ? (
                        <ul className="list-disc pl-6 m-0 text-xs">
                          {scanData.warnings.map((w: string, idx: number) => <li key={idx} className="font-medium truncate" title={w}>{w}</li>)}
                        </ul>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">Xe không có phí phạt và cảnh báo nào.</span>
                      )}
                    </div>
                  </div>

                  {/* Time Tracker */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center flex-none mt-2">
                    <div className="text-center"><Text type="secondary" className="block text-xs uppercase font-bold tracking-widest">Giờ Vào</Text><Text strong className="text-base">{scanData.timeIn}</Text></div>
                    <div className="text-center text-blue-600"><ClockCircleOutlined className="text-2xl" /><Text strong className="block text-xs uppercase mt-1">{scanData.duration}</Text></div>
                    <div className="text-center"><Text type="secondary" className="block text-xs uppercase font-bold tracking-widest">Giờ Ra</Text><Text strong className="text-base">{scanData.timeOut}</Text></div>
                  </div>

                  {/* Plate Comparison */}
                  <div className="flex flex-col gap-2 flex-1 min-h-0 mt-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex flex-col items-center justify-center flex-1">
                      <Text className="text-green-700 font-bold mb-1 uppercase tracking-widest text-[10px]">Biển số VÀO</Text>
                      <Input 
                        value={scanData.plateNumberIn} 
                        disabled
                        className="w-full text-2xl h-10 font-mono text-center font-bold uppercase rounded border-green-300 bg-green-100 text-green-800"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-col items-center justify-center shadow-inner flex-1">
                      <Text className="text-blue-700 font-bold mb-1 uppercase tracking-widest text-[10px]">Biển số RA (Sửa nếu sai)</Text>
                      <Input 
                        value={editablePlate} 
                        onChange={(e) => setEditablePlate(e.target.value)} 
                        className="w-full text-2xl h-10 font-mono text-center font-bold uppercase rounded border-2 border-blue-400 focus:border-blue-600 bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Internal Right: Billing & Payment */}
                <div className="w-1/2 flex flex-col h-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg text-white p-4">
                  <div className="flex justify-between items-center text-sm text-slate-300 mb-2"><span>Phí đỗ xe (Cơ sở):</span><span className="font-bold text-white text-base">{scanData.feeBase.toLocaleString()} ₫</span></div>
                  <div className="flex justify-between items-center text-sm text-red-400 mb-2">
                    <span>Phí phạt phụ thu:</span>
                    <span className="font-bold text-base">{scanData.feePenalty ? scanData.feePenalty.toLocaleString() : 0} ₫</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-400 mb-2"><span>Chiết khấu (Manager):</span><span className="font-bold text-base">-{scanData.discount ? scanData.discount.toLocaleString() : 0} ₫</span></div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-600">
                    <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">TỔNG THANH TOÁN:</span>
                    <span className="text-3xl font-bold text-yellow-400">{totalFee.toLocaleString()} ₫</span>
                  </div>

                  {/* Payment Radio */}
                  <div className="mt-6">
                    <Radio.Group 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="flex w-full bg-slate-700 rounded-lg p-1 border border-slate-600 shadow-inner"
                    >
                      <Radio.Button value="CASH" className="flex-1 text-center font-bold text-base h-12 leading-[40px] border-0 !text-slate-800 bg-white shadow-sm rounded-l-md">Tiền mặt</Radio.Button>
                      <Radio.Button value="PAYOS" className="flex-1 text-center font-bold text-base h-12 leading-[40px] border-0 border-l border-slate-600 !text-slate-200">PayOS</Radio.Button>
                      <Radio.Button value="VNPAY" className="flex-1 text-center font-bold text-base h-12 leading-[40px] border-0 border-l border-slate-600 !text-slate-200 rounded-r-md">VNPay</Radio.Button>
                    </Radio.Group>
                  </div>

                  {/* QR Code conditionally rendered */}
                  <div className="flex-1 mt-3 relative">
                    {(paymentMethod === 'PAYOS' || paymentMethod === 'VNPAY') ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-white rounded border border-dashed border-blue-400">
                        {!paymentConfirmed ? (
                          <>
                            <QrcodeOutlined className="text-5xl text-slate-800 mb-1" />
                            <Text type="secondary" className="font-bold text-[9px] uppercase">Khách quét QR</Text>
                            <Button type="primary" size="small" className="mt-2 bg-blue-600 w-full font-bold text-xs" onClick={handleMockPaymentSuccess}>
                              Xác nhận đã nhận tiền
                            </Button>
                          </>
                        ) : (
                          <div className="bg-green-100 text-green-800 p-2 rounded w-full h-full text-center font-bold flex flex-col items-center justify-center text-xs shadow-inner">
                            <CheckCircleOutlined className="text-2xl mb-1 text-green-600" /> Đã thu tiền thành công!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 rounded border border-slate-600 text-slate-400 text-xs font-bold text-center p-4">
                        <DollarOutlined className="text-4xl mb-2 opacity-50" />
                        THU TIỀN MẶT TRỰC TIẾP
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Text className="font-bold tracking-widest text-lg uppercase text-slate-300">Chờ dữ liệu...</Text>
              </div>
            )}
          </div>

          {/* Fixed Actions Area (STRICT h-[15%]) */}
          <div className="flex-none h-[15%] p-2 border-t border-slate-200 bg-white flex gap-3 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] relative z-10">
            <Button 
              size="large" 
              danger
              icon={<CloseCircleOutlined />}
              className="h-full flex-1 text-lg font-bold rounded-lg border-2 border-red-500 text-red-600 hover:bg-red-50 transition-colors"
              disabled={!scanData}
              onClick={handleCancel}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              size="large" 
              className={`h-full flex-[2] text-xl font-bold rounded-lg shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                (paymentMethod !== 'CASH' && !paymentConfirmed) 
                  ? 'bg-slate-400 border-slate-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 border-green-800 animate-pulse'
              }`}
              disabled={(!scanData) || (paymentMethod !== 'CASH' && !paymentConfirmed)}
              loading={isLoading}
              onClick={handleCompletePaymentAndOpen}
            >
              {paymentMethod === 'CASH' ? 'Thu tiền & Mở cổng ra' : 'Xác nhận & Mở cổng ra'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-100">
      <Row className="h-full w-full m-0">
        {activeGate?.type === 'IN' ? (
          <>
            {/* LEFT PANEL: Action Console (IN) */}
            <Col span={9} className="h-full p-4 flex flex-col border-r border-slate-300 bg-slate-50">
              
              <div className="flex justify-between items-center mb-2 shrink-0 gap-2">
                <Title level={4} className="m-0 text-slate-800 whitespace-nowrap flex items-center">
                  {activeGate?.name} <span className="text-[10px] ml-2 bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm">LIVE</span>
                </Title>
                
                {showPreBooking && (
                  <div className="flex-1 bg-blue-50 border border-blue-300 p-1 px-2 rounded-lg flex items-center shadow-sm relative overflow-hidden group transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <ClockCircleOutlined className="text-blue-600 text-sm ml-1 mr-1.5 animate-pulse" />
                    <div className="flex-1 mr-2 flex flex-col justify-center">
                      <Text className="text-blue-800 font-bold text-[9px] uppercase tracking-widest block leading-none mb-0.5">Hệ Thống Đặt trước</Text>
                      <Text className="text-blue-700 text-[10px] leading-none block">
                        VIP 51H-555.22 - <span className="font-bold text-white bg-blue-600 px-1 rounded shadow-sm">Khu: Zone A</span>
                      </Text>
                    </div>
                    <Button type="primary" className="h-6 text-[10px] px-2 py-0" onClick={() => {
                      if (preBookingSlotId) {
                        setMockZones(prev => prev.map(z => z.id === 1 ? {
                          ...z,
                          slots: z.slots.map(s => s.id === preBookingSlotId ? { ...s, status: 'OCCUPIED', plate: '51H-555.22' } : s)
                        } : z));
                      }
                      message.success('Đã xác nhận sắp xếp chỗ đỗ Đặt trước!');
                      setShowPreBooking(false);
                    }}>Xác nhận</Button>
                  </div>
                )}
              </div>
              {renderInGatePanel()}
            </Col>

            {/* RIGHT PANEL: Live Space Map */}
            <Col span={15} className="h-full bg-slate-200 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm">
                <Text strong className="mr-2 flex items-center"><AimOutlined className="mr-1"/> Điều hướng bản đồ:</Text>
                <Button size="small" onClick={() => {
                  if (containerRef.current) {
                    const mapW = mapCols * GRID_SIZE;
                    const mapH = mapRows * GRID_SIZE;
                    const scale = Math.min(containerRef.current.clientWidth / mapW, containerRef.current.clientHeight / mapH) * 0.95;
                    const minScaleLocked = Math.min(scale, 1);
                    const tween = new Konva.Tween({
                      node: stageRef.current,
                      duration: 0.5,
                      easing: Konva.Easings.EaseInOut,
                      x: (containerRef.current.clientWidth - mapW * minScaleLocked) / 2,
                      y: (containerRef.current.clientHeight - mapH * minScaleLocked) / 2,
                      scaleX: minScaleLocked,
                      scaleY: minScaleLocked,
                      onFinish: () => {
                        setStagePos({ x: (containerRef.current.clientWidth - mapW * minScaleLocked) / 2, y: (containerRef.current.clientHeight - mapH * minScaleLocked) / 2 });
                        setStageScale(minScaleLocked);
                      }
                    });
                    tween.play();
                  }
                }}>Tổng thể</Button>
                {STAFF_MOCK_ZONES.map(z => (
                  <Button key={z.id} size="small" onClick={() => handleAutoZoom(z)}>{z.name}</Button>
                ))}
              </div>

              <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" ref={containerRef}>
                {containerRef.current && (
                  <Stage 
                    width={containerRef.current.clientWidth} 
                    height={containerRef.current.clientHeight}
                    draggable
                    scaleX={stageScale}
                    scaleY={stageScale}
                    x={stagePos.x}
                    y={stagePos.y}
                    ref={stageRef}
                    onDragEnd={(e) => {
                      if (e.target === e.target.getStage()) {
                        setStagePos({ x: e.target.x(), y: e.target.y() });
                      }
                    }}
                  >
                    <Layer>
                      {drawGrid()}
                    </Layer>
                    <Layer>
                      {mockZones.map((zone) => {
                        const { width: slotW, height: slotH } = getVehicleDimensions(zone.vehicleType);
                        const zoneW = zone.capacity * slotW;
                        const zoneH = slotH;
                        
                        return (
                          <Group
                            key={zone.id}
                            x={zone.layoutX}
                            y={zone.layoutY}
                            rotation={zone.rotation}
                          >
                            <KonvaText
                              x={0}
                              y={-20}
                              text={`${zone.name}`}
                              fontSize={18}
                              fontFamily="sans-serif"
                              fill="#334155"
                              fontStyle="bold"
                            />
                            <Rect
                              width={zoneW}
                              height={zoneH}
                              fill="rgba(0,0,0,0.05)"
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            {zone.slots.map((slot, i) => {
                              const xPos = i * slotW;
                              let slotFill = 'transparent';
                              if (slot.status === 'OCCUPIED') slotFill = '#fecaca';

                              return (
                                <Group key={slot.id} x={xPos} y={0}>
                                  <Rect
                                    id={`slot-${slot.id}`}
                                    width={slotW}
                                    height={slotH}
                                    fill={slotFill}
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                  />
                                  <KonvaText
                                    x={0}
                                    y={slotH / 2 - 16}
                                    width={slotW}
                                    align="center"
                                    text={slot.name}
                                    fontSize={16}
                                    fill="#334155"
                                    fontStyle="bold"
                                    listening={false}
                                  />
                                  {slot.status === 'OCCUPIED' && slot.plate && (
                                    <KonvaText
                                      x={0}
                                      y={slotH / 2 + 4}
                                      width={slotW}
                                      align="center"
                                      text={slot.plate}
                                      fontSize={12}
                                      fill="#ef4444"
                                      fontStyle="bold"
                                      listening={false}
                                    />
                                  )}
                                </Group>
                              );
                            })}
                          </Group>
                        );
                      })}
                    </Layer>
                  </Stage>
                )}
              </div>
            </Col>
          </>
        ) : (
          <Col span={24} className="h-full p-4 flex flex-col bg-slate-50">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Title level={4} className="m-0 text-slate-800">
                {activeGate?.name} <span className="text-xs ml-2 bg-blue-600 text-white px-2 py-1 rounded">LIVE FULL-SCREEN</span>
              </Title>
            </div>
            {renderOutGatePanel()}
          </Col>
        )}
      </Row>
    </div>
  );
};
