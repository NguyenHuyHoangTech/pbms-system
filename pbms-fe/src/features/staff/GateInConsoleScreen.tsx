import { simulatedDayjs } from '../../core/utils/timeProvider';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useWebSocket } from '../../core/websocket/useWebSocket';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, message, Tag, Typography, Modal, Row, Col, Radio, Input, Divider, Select, InputNumber, QRCode } from 'antd';
import { CarOutlined, LockOutlined, UnlockOutlined, CheckCircleOutlined, DollarOutlined, AimOutlined, WarningOutlined, CloseCircleOutlined, QrcodeOutlined, IdcardOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../core/api/axiosClient';
import { Stage, Layer, Rect, Group, Text as KonvaText, Line } from 'react-konva';
import Konva from 'konva';

const { Title, Text } = Typography;

const GRID_SIZE = 50;



export const GateInConsoleScreen = ({ activeGate }: { activeGate: any }) => {
  const { connected, stompClient } = useWebSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: mapData } = useQuery({
    queryKey: ['zonesMap'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/zones/map');
      return res.data.data;
    }
  });

  const { data: vehicleTypes } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const res = await axiosClient.get('/operation/vehicle-types');
      return res.data.data;
    }
  });

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastRawPayload, setLastRawPayload] = useState<any>(null);
  const [debugMinimized, setDebugMinimized] = useState(false);

  const addLog = (msg: string) => {
    setDebugLogs(prev => {
      const newLogs = [...prev, `[${simulatedDayjs().format('HH:mm:ss')}] ${msg}`];
      return newLogs.slice(-20); // keep last 20 logs
    });
  };

  const [scanData, setScanData] = useState<any>(null);
  const [editablePlate, setEditablePlate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRef = useRef<boolean>(false);
  
  const shiftStatus = useAuthStore((state) => state.shiftStatus);

  // WebSocket for real-time map IoT updates
  useEffect(() => {
    if (stompClient && connected) {
      const sub = stompClient.subscribe('/topic/map-updates', (message) => {
        const payload = JSON.parse(message.body);
        queryClient.setQueryData(['zonesMap'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((z: any) => ({
            ...z,
            slots: (z.slots || []).map((s: any) => s.id === payload.id ? { ...s, status: payload.status } : s)
          }));
        });
      });
      return () => sub.unsubscribe();
    }
  }, [stompClient, connected, queryClient]);

  // Konva State
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mapCols] = useState(60);
  const [mapRows] = useState(40);
  
  const activeSlotRef = useRef<Konva.Rect | null>(null);
  const tweenRef = useRef<Konva.Tween | null>(null);

  useEffect(() => {
    if (containerRef.current && activeGate) {
      const containerW = (containerRef.current?.clientWidth || 0);
      const containerH = (containerRef.current?.clientHeight || 0);
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
  }, [activeGate, mapCols, mapRows]);

  useEffect(() => {
    // Only cleanup active slot logic if any
    return () => {
      if (tweenRef.current) clearInterval(tweenRef.current as any);
    }
  }, []);

  useEffect(() => {
    if (activeGate && stompClient && connected) {
      const destination = `/topic/gates/${activeGate.id}/scans`;
      const notifDest = `/topic/floors/${activeGate.floorId}/notifications`;
      addLog(`Subscribed to ${destination} and ${notifDest}`);
      
      const notifSub = stompClient.subscribe(notifDest, (msg) => {
        const payload = JSON.parse(msg.body);
        import('antd').then(({ notification }) => {
          notification.info({
            message: 'Upcoming Reservation',
            description: payload.message,
            duration: 10,
          });
        });
      });

      const subscription = stompClient.subscribe(destination, (msg) => {
        if (isProcessingRef.current) {
          addLog("Close stream band: Ignore new signal due to pending processing of current vehicle");
          return;
        }
        isProcessingRef.current = true;

        addLog(`Received message. Length: ${msg.body.length} bytes`);
        console.log("RECEIVED WEBSOCKET MESSAGE:", msg.body);
        const payload = JSON.parse(msg.body);
        if (payload.actionType === 'OUT') {
            isProcessingRef.current = false;
            return;
        }
        setLastRawPayload(payload);
        
        // IOT payload contains plateNumber, imageBase64, confidence
        // For UI purposes, we'll map it to our UI state shape
        setEditablePlate(payload.plateNumber || 'UNKNOWN');
        
        setScanData({
            plateNumber: payload.plateNumber,
            imageBase64: payload.imageBase64 || '',
            lprImageBase64: payload.lprImageBase64 || '',
            imageInBase64: payload.picInPanorama || '',
            imageOutBase64: payload.imageBase64 || '',
            lprImageInBase64: payload.picInFace || '',
            lprImageOutBase64: payload.lprImageBase64 || '',
            plateNumberIn: payload.plateNumberIn || payload.plateNumber || 'UNKNOWN',
            timeIn: payload.timeIn ? simulatedDayjs(payload.timeIn).format('DD/MM/YYYY HH:mm:ss') : '--:--',
            timeOut: simulatedDayjs().format('DD/MM/YYYY HH:mm:ss'),
            duration: payload.durationMinutes ? `${payload.durationMinutes} minutes` : '--',
            feeBase: 0,
            feePenalty: 0,
            discount: 0,
            expectedFee: payload.expectedFee || 0,
            durationMinutes: payload.durationMinutes || 0,
            isBlacklisted: false,
            warnings: [],
            rfid: payload.rfid || '---',
            customerType: payload.customerType === 'PREBOOKED' ? 'BOOK' : (payload.customerType === 'MONTHLY' ? 'Monthly Pass' : (payload.customerType || 'Haunt')),
            vehicleType: payload.vehicleType || 'CAR',
            routing: payload.suggestedZoneName || ''
          });
      });

      return () => {
        subscription.unsubscribe();
        notifSub.unsubscribe();
        addLog(`Unsubscribed from ${destination} and ${notifDest}`);
      };
    }
  }, [activeGate, stompClient, connected]);

  const handleCancel = () => {
    isProcessingRef.current = false;
    setScanData(null);
    setEditablePlate('');
    message.warning('The current scanning session has been canceled e System has reopened e');
  };

  const handleCheckIn = async () => {
    if (!scanData || !activeGate) return;
    setIsLoading(true);
    try {
      const payload = {
        gateId: activeGate.id,
        plateNumber: editablePlate,
        vehicleType: scanData.vehicleType || 'CAR',
        rfid: scanData.rfid,
        imageBase64: scanData.imageBase64,
        lprImageBase64: scanData.lprImageBase64
      };
      const response = await axiosClient.post('/operation/gates/check-in', payload);
      
      const suggestedZone = response.data.data.suggestedZoneName || 'Free';
      message.success(`Vehicle entry confirmed! Suggested zone: ${suggestedZone}`);

      // Auto-log LPR_MISMATCH if the staff edited the plate
      if (scanData.plateNumber && editablePlate && scanData.plateNumber.toUpperCase() !== editablePlate.toUpperCase()) {
        try {
          await axiosClient.post('/incidents', {
            issueType: 'LPR_MISMATCH',
            sessionId: response.data.data.sessionId,
            description: `[AUTO] License plate mismatch on ENTRY. AI recognized: ${scanData.plateNumber}. Staff edited to: ${editablePlate}.`,
            correctPlateNumber: editablePlate,
            priority: 'LOW'
          });
        } catch (e) {
          console.error("Error when automatically creating LPR_MISMaTCH:", e);
        }
      }

      setScanData(null);
      setEditablePlate('');
      isProcessingRef.current = false;
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error when checking in the car');
      isProcessingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoZoom = (zone: any) => {
    if (!stageRef.current || !containerRef.current) return;
    
    const slotW = (zone.vehicleMatrixWidth || 3) * GRID_SIZE;
    const slotH = (zone.vehicleMatrixHeight || 6) * GRID_SIZE;
    let zoneW = zone.capacity * slotW;
    let zoneH = slotH;
    
    if (zone.rotation === 90 || zone.rotation === 270) {
      zoneW = slotH;
      zoneH = zone.capacity * slotW;
    }

    const containerW = (containerRef.current?.clientWidth || 0);
    const containerH = (containerRef.current?.clientHeight || 0);

    const padding = 100;
    const scaleX = (containerW - padding) / zoneW;
    const scaleY = (containerH - padding) / zoneH;
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.min(newScale, 3);

    let centerX = zone.layoutX || 0;
    let centerY = zone.layoutY || 0;
    
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
              <div className="w-[80%] aspect-[3/1] border-2 border-blue-500 rounded relative overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.5)] bg-white flex items-center justify-center">
                <img src={scanData.lprImageBase64} alt="LPR Crop" className="max-w-full max-h-full object-contain" />
              </div>
              <Text className="text-slate-400 text-[9px] mt-1 font-bold tracking-widest uppercase">LPR Snapshot</Text>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
            <AimOutlined className="text-5xl mb-2 opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
            <Text className="text-slate-400 font-bold tracking-widest text-sm">WAITING FOR THE CAR SIGNAL FROM THE GATE</Text>
          </div>
        )}
      </div>

      {/* TASK 1 & 3: Middle Zone (Info & Alerts) - STRICT h-[50%] No Scroll */}
      <div className="h-[50%] flex-none overflow-hidden p-2 flex flex-col gap-2 bg-slate-50">
        {scanData?.isBlacklisted && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-2 font-bold text-center rounded-lg animate-pulse shadow-sm flex-none">
            <WarningOutlined className="mr-2" />
            <span className="text-sm">WARNING: BLACK LISTED VEHICLES! Reject GIVE IN!</span>
          </div>
        )}

        {scanData && (
          <div className={`p-2 rounded-lg shadow-sm flex-none text-xs flex flex-col gap-1 overflow-hidden border ${scanData.warnings?.length > 0 ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
             <div className="font-bold flex items-center justify-between">
               <div className="flex items-center">
                 {scanData.warnings?.length > 0 ? <WarningOutlined className="mr-1"/> : <CheckCircleOutlined className="mr-1"/>} 
                  
                                               WARNING / NOTE:
                                             </div>
             </div>
             <div className="flex-1 overflow-hidden min-h-[30px]">
               {scanData.warnings?.length > 0 ? (
                 <ul className="list-disc pl-4 m-0">
                   {scanData.warnings.map((w: string, idx: number) => <li key={idx} className="truncate" title={w}>{w}</li>)}
                 </ul>
               ) : (
                 <span className="text-green-600">The system does not record any warnings for this vehicle</span>
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
                scanData.customerType === 'Haunt' ? 'blue' : 
                (scanData.customerType === 'BOOK' ? 'gold' : 'green')
              } className="m-0 font-bold px-3 py-1 text-sm rounded shadow-sm border border-transparent">
                {scanData?.customerType || '---'}
              </Tag>
              {scanData ? (
                <Select 
                  size="large"
                  value={scanData.vehicleType}
                  onChange={(val) => setScanData({...scanData, vehicleType: val})}
                  className="w-48 font-bold text-base"
                  options={vehicleTypes ? vehicleTypes.map((v: any) => ({
                    value: v.typeName,
                    label: `${v.category === 'FOUR_WHEEL' ? '🚗' : '🏍️'} ${v.typeName}`
                  })) : []}
                />
              ) : (
                <Tag className="m-0 font-bold px-3 py-1 text-sm rounded border-slate-300">---</Tag>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 min-h-0">
            <Text className="text-slate-500 font-bold mb-1 uppercase tracking-widest text-[10px]">License Plate Identification (aI)</Text>
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
            <Text className="text-green-400 text-xs font-bold tracking-widest block uppercase mb-1">INSTRUCTIONS FOR ENTERING THE BEACH</Text>
            <div className="text-xl font-bold text-white tracking-wide truncate">
              {scanData.routing}
            </div>
          </div>
        ) : (
           <div className="bg-slate-200 border border-slate-300 rounded-xl p-3 text-center flex-none">
             <Text className="text-slate-400 text-xs font-bold tracking-widest block uppercase mb-1">INSTRUCTIONS FOR ENTERING THE BEACH</Text>
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
          
                            Cancel
                          </Button>
        <Button 
          type="primary" 
          size="large" 
          className="h-full flex-[2] text-xl font-bold rounded-lg bg-green-600 hover:bg-green-500 shadow-md border-b-2 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
          disabled={!scanData}
          loading={isLoading}
          onClick={handleCheckIn}
        >
          
                            Confirm & Put the car in
                          </Button>
      </div>
    </div>
  );


  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-100 relative">
      {/* FLOATING DEBUG LOG PANEL */}
      <div className={`absolute top-4 right-4 ${debugMinimized ? 'w-auto' : 'w-96'} max-h-[80vh] bg-black/80 text-green-400 font-mono text-[10px] p-3 overflow-y-auto z-[9999] rounded border border-green-500/50 shadow-2xl flex flex-col gap-2`}>
        <div className="flex justify-between items-center border-b border-gray-600 pb-1 mb-1">
          <div className="text-white font-bold">⚙️ DEBUG LOGS</div>
          <Button 
            type="text" 
            size="small" 
            className="text-white hover:text-green-400 p-0 h-auto"
            onClick={() => setDebugMinimized(!debugMinimized)}
          >
            {debugMinimized ? '[] Extend' : '[-] Zoom out'}
          </Button>
        </div>
        {!debugMinimized && (
          <div className="flex flex-col gap-2">
            {lastRawPayload ? (
              <div className="pt-1">
                <div className="text-yellow-400 font-bold mb-1">DATA FROM IOT TOOL SHOOTING:</div>
                <pre className="text-[12px] text-blue-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(lastRawPayload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 italic">None vehicle scanning signaleeee</div>
            )}
          </div>
        )}
      </div>

      <Row className="h-full w-full m-0">
          <>
            {/* LEFT PANEL: Action Console (IN) */}
            <Col span={9} className="h-full p-4 flex flex-col border-r border-slate-300 bg-slate-50">
              
              <div className="flex justify-between items-center mb-2 shrink-0 gap-2">
                <Title level={4} className="m-0 text-slate-800 whitespace-nowrap flex items-center">
                  {activeGate?.name} <span className="text-[10px] ml-2 bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm">LIVE</span>
                </Title>
              </div>
              {renderInGatePanel()}
            </Col>

            {/* RIGHT PANEL: Live Space Map */}
            <Col span={15} className="h-full bg-slate-200 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-white/80 p-2 rounded-lg shadow-sm backdrop-blur-sm">
                <Text strong className="mr-2 flex items-center"><AimOutlined className="mr-1"/>  Map navigation:</Text>
                <Button size="small" onClick={() => {
                  if (containerRef.current) {
                    const mapW = mapCols * GRID_SIZE;
                    const mapH = mapRows * GRID_SIZE;
                    const scale = Math.min((containerRef.current?.clientWidth || 0) / mapW, (containerRef.current?.clientHeight || 0) / mapH) * 0.95;
                    const minScaleLocked = Math.min(scale, 1);
                    const tween = new Konva.Tween({
                      node: stageRef.current,
                      duration: 0.5,
                      easing: Konva.Easings.EaseInOut,
                      x: ((containerRef.current?.clientWidth || 0) - mapW * minScaleLocked) / 2,
                      y: ((containerRef.current?.clientHeight || 0) - mapH * minScaleLocked) / 2,
                      scaleX: minScaleLocked,
                      scaleY: minScaleLocked,
                      onFinish: () => {
                        setStagePos({ x: ((containerRef.current?.clientWidth || 0) - mapW * minScaleLocked) / 2, y: ((containerRef.current?.clientHeight || 0) - mapH * minScaleLocked) / 2 });
                        setStageScale(minScaleLocked);
                      }
                    });
                    tween.play();
                  }
                }}>Overall</Button>
                {Array.isArray(mapData) && mapData.filter((z: any) => z.floorId === activeGate?.floorId).map((zone: any) => (
                  <Button key={zone.id} size="small" onClick={() => handleAutoZoom(zone)}>{zone.name || zone.zoneName}</Button>
                ))}
              </div>

              <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" ref={containerRef}>
                {containerRef.current && (
                  <Stage 
                    width={(containerRef.current?.clientWidth || 0)} 
                    height={(containerRef.current?.clientHeight || 0)}
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
                      {Array.isArray(mapData) && mapData.filter((z: any) => z.floorId === activeGate?.floorId).map((zone: any) => {
                        const slotW = (zone.vehicleMatrixWidth || 3) * GRID_SIZE;
                        const slotH = (zone.vehicleMatrixHeight || 6) * GRID_SIZE;
                        const zoneW = zone.capacity * slotW;
                        const zoneH = slotH;
                        
                        return (
                          <Group
                            key={zone.id}
                            x={zone.layoutX || 100}
                            y={zone.layoutY || 100}
                            rotation={zone.rotation || 0}
                          >
                            <KonvaText
                              x={5}
                              y={5}
                              text={`${zone.name || zone.zoneName} ${zone.activeReservationsCount ? `(Res: ${zone.activeReservationsCount})` : ''}`}
                              fontSize={14}
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
                            {(zone.slots || []).map((slot: any, i: number) => {
                              const xPos = i * slotW;
                              let slotFill = 'transparent';
                              if (slot.status === 'OCCUPIED') slotFill = '#fecaca';
                              else if (slot.status === 'DISABLED') slotFill = '#f1f5f9';

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
                                    text={slot.status === 'DISABLED' ? 'Maintenance' : slot.slotName}
                                    fontSize={slot.status === 'DISABLED' ? 12 : 16}
                                    fill="#334155"
                                    fontStyle="bold"
                                    listening={false}
                                  />
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
      </Row>
    </div>
  );
};
