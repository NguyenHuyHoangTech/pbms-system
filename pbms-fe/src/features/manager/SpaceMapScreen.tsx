import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, message, Spin, Input, Select, InputNumber, Collapse, Slider, Switch, Radio, notification, Badge, Tooltip } from 'antd';
import { 
  SaveOutlined, SyncOutlined, AimOutlined, PlusOutlined, 
  SettingOutlined, CompassOutlined, GatewayOutlined, 
  CloseCircleOutlined, SwapRightOutlined, SwapLeftOutlined,
  StopOutlined
} from '@ant-design/icons';
import { Stage, Layer, Line, Group, Rect, Text as KonvaText } from 'react-konva';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import Konva from 'konva';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Constants & Types
const GRID_SIZE = 50;

interface Floor {
  id: number;
  name: string;
  type: 'CAR' | 'MOTORBIKE';
  mapCols: number;
  mapRows: number;
}

interface Slot {
  id: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED' | 'DISABLED';
  plate?: string;
}

interface Zone {
  id: number;
  floorId: number;
  name: string;
  capacity: number;
  vehicleType: 'CAR' | 'MOTORBIKE';
  functionType: 'WALK_IN' | 'IMPOUNDED' | 'MONTHLY';
  layoutX: number;
  layoutY: number;
  rotation: number;
  slots: Slot[];
  overflowThreshold: number;
}

interface Gate {
  id: string;
  floorId: number;
  name: string;
  type: 'IN' | 'OUT';
  status: 'IDLE' | 'OCCUPIED';
  staffName?: string;
  layoutX: number;
  layoutY: number;
  rotation: number;
  pendingCommand?: string | null;
}

type SelectedEntity = 
  | { type: 'ZONE'; id: number } 
  | { type: 'SLOT'; zoneId: number; slotId: string } 
  | { type: 'GATE'; id: string } 
  | null;

const getVehicleDimensions = (type: string) => {
  if (type === 'CAR') return { width: 3 * GRID_SIZE, height: 5 * GRID_SIZE }; 
  if (type === 'MOTORBIKE') return { width: 1 * GRID_SIZE, height: 2 * GRID_SIZE }; 
  return { width: 2 * GRID_SIZE, height: 4 * GRID_SIZE };
};

export const SpaceMapScreen = () => {
  const queryClient = useQueryClient();
  
  // State
  const [zones, setZones] = useState<Zone[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['0', '1', '2', '4']);
  const [collidingNodeId, setCollidingNodeId] = useState<string | null>(null);
  
  // Floors State
  const [floors, setFloors] = useState<Floor[]>([
    { id: 1, name: 'Tầng 1 (Trệt)', type: 'CAR', mapCols: 60, mapRows: 40 },
    { id: 2, name: 'Hầm B1', type: 'MOTORBIKE', mapCols: 40, mapRows: 30 }
  ]);
  const [selectedFloorId, setSelectedFloorId] = useState<number>(1);
  
  const activeFloor = floors.find(f => f.id === selectedFloorId);
  const mapCols = activeFloor?.mapCols || 60;
  const mapRows = activeFloor?.mapRows || 40;

  const handleUpdateMapSize = (cols: number, rows: number) => {
    setFloors(prev => prev.map(f => f.id === selectedFloorId ? { ...f, mapCols: cols, mapRows: rows } : f));
  };
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [defaultScale, setDefaultScale] = useState(1);

  // Fetch initial data (Mocking for now to match UI specs)
  useEffect(() => {
    // Initial Zones
    setZones([
      { 
        id: 1, floorId: 1, name: 'Khu A (Vãng lai)', capacity: 5, vehicleType: 'CAR', functionType: 'WALK_IN', 
        layoutX: 100, layoutY: 100, rotation: 0, overflowThreshold: 80,
        slots: Array.from({length: 5}).map((_, i) => ({ id: `A${i+1}`, name: `A0${i+1}`, status: i === 1 ? 'OCCUPIED' : 'EMPTY', plate: i === 1 ? '51G-123.45' : undefined })) 
      },
      { 
        id: 2, floorId: 2, name: 'Khu B (Vé tháng)', capacity: 10, vehicleType: 'MOTORBIKE', functionType: 'MONTHLY', 
        layoutX: 100, layoutY: 100, rotation: 0, overflowThreshold: 90,
        slots: Array.from({length: 10}).map((_, i) => ({ id: `B${i+1}`, name: `B${i < 9 ? '0'+(i+1) : i+1}`, status: i === 3 ? 'DISABLED' : (i === 1 ? 'OCCUPIED' : 'EMPTY'), plate: i === 1 ? '59X-999.99' : undefined })) 
      },
    ]);
    
    // Initial Gates
    setGates([
      { id: 'G1', floorId: 1, name: 'Cổng IN - Tầng 1', type: 'IN', status: 'IDLE', layoutX: 50, layoutY: 800, rotation: 0 },
      { id: 'G2', floorId: 1, name: 'Cổng OUT - Tầng 1', type: 'OUT', status: 'OCCUPIED', staffName: 'Nguyễn Văn A', layoutX: 800, layoutY: 800, rotation: 0, pendingCommand: null },
      { id: 'G3', floorId: 2, name: 'Cổng IN - Hầm B1', type: 'IN', status: 'IDLE', layoutX: 50, layoutY: 500, rotation: 0 },
    ]);
  }, []);

  // Handle floor switch selection clear
  useEffect(() => {
    if (selectedEntity) {
       let keep = false;
       if (selectedEntity.type === 'ZONE' || selectedEntity.type === 'SLOT') {
          const zId = selectedEntity.type === 'ZONE' ? selectedEntity.id : selectedEntity.zoneId;
          if (zones.find(z => z.id === zId)?.floorId === selectedFloorId) keep = true;
       } else if (selectedEntity.type === 'GATE') {
          if (gates.find(g => g.id === selectedEntity.id)?.floorId === selectedFloorId) keep = true;
       }
       if (!keep) setSelectedEntity(null);
    }
  }, [selectedFloorId, zones, gates]);

  const visibleZones = zones.filter(z => z.floorId === selectedFloorId);
  const visibleGates = gates.filter(g => g.floorId === selectedFloorId);

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    // Slight delay to ensure flex layout has computed
    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Fit to screen logic
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      const mapW = mapCols * GRID_SIZE;
      const mapH = mapRows * GRID_SIZE;
      
      const scale = Math.min(containerSize.width / mapW, containerSize.height / mapH) * 0.95; 
      const minScaleLocked = Math.min(scale, 1);
      
      setDefaultScale(minScaleLocked);
      setStageScale(minScaleLocked);
      
      setStagePos({
        x: (containerSize.width - mapW * minScaleLocked) / 2,
        y: (containerSize.height - mapH * minScaleLocked) / 2
      });
    }
  }, [mapCols, mapRows, containerSize]);

  // -- Event Handlers --

  const handleZoomToBox = (boxX: number, boxY: number, boxW: number, boxH: number, padding: number = 50) => {
    if (!stageRef.current || !containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const scaleX = (containerW - padding * 2) / boxW;
    const scaleY = (containerH - padding * 2) / boxH;
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.max(defaultScale, Math.min(newScale, 4));

    const centerX = boxX + boxW / 2;
    const centerY = boxY + boxH / 2;
    
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

  const handleZoomZone = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    setSelectedEntity({ type: 'ZONE', id: zone.id });
    
    const { width: slotW, height: slotH } = getVehicleDimensions(zone.vehicleType);
    let zoneW = zone.capacity * slotW;
    let zoneH = slotH;
    if (zone.rotation === 90 || zone.rotation === 270) {
      zoneW = slotH;
      zoneH = zone.capacity * slotW;
    }
    
    let boxX = zone.layoutX;
    let boxY = zone.layoutY;
    if (zone.rotation === 90) boxX -= zoneW;
    else if (zone.rotation === 180) { boxX -= zoneW; boxY -= zoneH; }
    else if (zone.rotation === 270) boxY -= zoneH;

    handleZoomToBox(boxX, boxY, zoneW, zoneH, 100);
  };

  const checkIntersection = (rect1: any, rect2: any) => {
    return !(
      rect2.x > rect1.x + rect1.width ||
      rect2.x + rect2.width < rect1.x ||
      rect2.y > rect1.y + rect1.height ||
      rect2.y + rect2.height < rect1.y
    );
  };

  const handleDragMove = (e: any, id: number | string, isZone: boolean) => {
    const node = e.target;
    const stage = node.getStage();
    const layer = node.getLayer();
    const nodeRect = node.getClientRect({ skipTransform: false });
    const mapW = mapCols * GRID_SIZE;
    const mapH = mapRows * GRID_SIZE;
    
    const stageTransform = stage.getAbsoluteTransform().copy();
    stageTransform.invert();
    const absRect = {
      x: (nodeRect.x - stage.x()) / stage.scaleX(),
      y: (nodeRect.y - stage.y()) / stage.scaleY(),
      width: nodeRect.width / stage.scaleX(),
      height: nodeRect.height / stage.scaleY()
    };

    let hasCollision = false;
    
    // Bounds check
    if (absRect.x < 0 || absRect.y < 0 || absRect.x + absRect.width > mapW || absRect.y + absRect.height > mapH) {
      hasCollision = true;
    } else {
      // Sibling collision check
      for (const child of layer.getChildren()) {
        if (child !== node && (child.name() === 'zoneGroup' || child.name() === 'gateGroup')) {
          const otherRect = child.getClientRect({ skipTransform: false });
          if (checkIntersection(nodeRect, otherRect)) {
            hasCollision = true;
            break;
          }
        }
      }
    }

    if (hasCollision) {
      if (collidingNodeId !== String(id)) setCollidingNodeId(String(id));
      node.setAttr('isColliding', true);
    } else {
      if (collidingNodeId === String(id)) setCollidingNodeId(null);
      node.setAttr('isColliding', false);
    }
  };

  const handleDragEnd = (e: any, id: number | string, isZone: boolean) => {
    setCollidingNodeId(null);
    const node = e.target;
    if (node.getAttr('isColliding')) {
      // Revert position
      const previousState = isZone ? zones.find(z => z.id === id) : gates.find(g => g.id === id);
      if (previousState) {
        node.position({ x: previousState.layoutX, y: previousState.layoutY });
      }
      node.setAttr('isColliding', false);
      message.error('Vị trí không hợp lệ do trùng lặp hoặc ngoài bản đồ!');
      return;
    }

    const x = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;
    node.position({ x, y });
    
    if (isZone) {
      setZones(prev => prev.map(z => z.id === id ? { ...z, layoutX: x, layoutY: y } : z));
    } else {
      setGates(prev => prev.map(g => g.id === id ? { ...g, layoutX: x, layoutY: y } : g));
    }
  };

  const handleRotateZone = (zoneId: number) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, rotation: (z.rotation + 90) % 360 } : z));
    // Note: A robust system would check collision AFTER rotation and revert if needed.
  };

  const findEmptyPosition = (w: number, h: number) => {
    const mapW = mapCols * GRID_SIZE;
    const mapH = mapRows * GRID_SIZE;
    
    const rects = [];
    for (const z of visibleZones) {
       const { width: slotW, height: slotH } = getVehicleDimensions(z.vehicleType);
       let zw = z.capacity * slotW;
       let zh = slotH;
       if (z.rotation === 90 || z.rotation === 270) { zw = slotH; zh = z.capacity * slotW; }
       
       let zx = z.layoutX; let zy = z.layoutY;
       if (z.rotation === 90) zx -= zw;
       else if (z.rotation === 180) { zx -= zw; zy -= zh; }
       else if (z.rotation === 270) zy -= zh;
       
       rects.push({ x: zx, y: zy, width: zw, height: zh });
    }
    for (const g of visibleGates) {
       let gw = 3 * GRID_SIZE; let gh = GRID_SIZE;
       if (g.rotation === 90 || g.rotation === 270) { gw = GRID_SIZE; gh = 3 * GRID_SIZE; }
       let gx = g.layoutX; let gy = g.layoutY;
       if (g.rotation === 90) gx -= gw;
       else if (g.rotation === 180) { gx -= gw; gy -= gh; }
       else if (g.rotation === 270) gy -= gh;
       rects.push({ x: gx, y: gy, width: gw, height: gh });
    }
    
    for (let y = 0; y <= mapH - h; y += GRID_SIZE) {
      for (let x = 0; x <= mapW - w; x += GRID_SIZE) {
         const newRect = { x, y, width: w, height: h };
         let collision = false;
         for (const r of rects) {
           if (!(r.x >= newRect.x + newRect.width || r.x + r.width <= newRect.x ||
                 r.y >= newRect.y + newRect.height || r.y + r.height <= newRect.y)) {
              collision = true;
              break;
           }
         }
         if (!collision) return { x, y };
      }
    }
    return null;
  };

  const handleAddZone = () => {
    const activeFloor = floors.find(f => f.id === selectedFloorId);
    const vehicleType = activeFloor?.type === 'MOTORBIKE' ? 'MOTORBIKE' : 'CAR';
    const { width: slotW, height: slotH } = getVehicleDimensions(vehicleType);
    const capacity = 5;
    const w = capacity * slotW;
    const h = slotH;

    const pos = findEmptyPosition(w, h);
    if (!pos) {
      message.error("Bản đồ đã đầy, không còn vị trí trống để thêm Khu vực mới!");
      return;
    }

    const newId = Date.now();
    const newZone: Zone = {
      id: newId,
      floorId: selectedFloorId,
      name: `Khu vực Mới`,
      capacity: capacity,
      vehicleType: vehicleType,
      functionType: 'WALK_IN',
      layoutX: pos.x,
      layoutY: pos.y,
      rotation: 0,
      overflowThreshold: 80,
      slots: Array.from({length: capacity}).map((_, i) => ({ id: `NEW-${newId}-${i}`, name: `N${i+1}`, status: 'EMPTY' }))
    };
    
    setZones(prev => [...prev, newZone]);
    setSelectedEntity({ type: 'ZONE', id: newId });
    if (!expandedKeys.includes('2')) setExpandedKeys(prev => [...prev, '2']);
  };

  const handleAddGate = () => {
    const pos = findEmptyPosition(3 * GRID_SIZE, GRID_SIZE);
    if (!pos) {
      message.error("Bản đồ đã đầy, không còn vị trí trống để thêm Cổng mới!");
      return;
    }

    const newId = `G-${Date.now()}`;
    const newGate: Gate = {
      id: newId,
      floorId: selectedFloorId,
      name: `Cổng Mới`,
      type: 'IN',
      status: 'IDLE',
      layoutX: pos.x,
      layoutY: pos.y,
      rotation: 0,
    };
    setGates(prev => [...prev, newGate]);
    setSelectedEntity({ type: 'GATE', id: newId });
    if (!expandedKeys.includes('4')) setExpandedKeys(prev => [...prev, '4']);
  };

  const handleUpdateZoneCapacity = (zoneId: number, newCapacity: number) => {
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      if (newCapacity === z.capacity) return z;
      
      let newSlots = [...z.slots];
      if (newCapacity > z.capacity) {
        // Add slots
        for (let i = z.capacity; i < newCapacity; i++) {
          newSlots.push({ id: `S-${z.id}-${Date.now()}-${i}`, name: `S${i+1}`, status: 'EMPTY' });
        }
      } else {
        // Reduce slots (LIFO)
        // Check if any removed slot is occupied
        const removedSlots = newSlots.slice(newCapacity);
        const hasOccupied = removedSlots.some(s => s.status !== 'EMPTY');
        if (hasOccupied) {
          message.error('Không thể cắt giảm! Các ô bị cắt đang có xe đỗ.');
          return z; // Abort
        }
        newSlots = newSlots.slice(0, newCapacity);
      }
      return { ...z, capacity: newCapacity, slots: newSlots };
    }));
  };

  const handleToggleSlotStatus = (zoneId: number, slotId: string, newStatus: 'EMPTY' | 'DISABLED') => {
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      return {
        ...z,
        slots: z.slots.map(s => {
          if (s.id !== slotId) return s;
          if (s.status === 'OCCUPIED') {
            message.warning('Không thể bảo trì ô đang có xe!');
            return s;
          }
          return { ...s, status: newStatus };
        })
      };
    }));
  };

  const handleGateCommand = (gateId: string, cmd: string) => {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return;

    if (gate.status === 'IDLE') {
      // Real-time update
      message.success(`Đã áp dụng lệnh ${cmd} ngay lập tức cho ${gate.name}`);
      // Typically API call here
    } else {
      // OCCUPIED -> Pending Command via WebSocket mock
      setGates(prev => prev.map(g => g.id === gateId ? { ...g, pendingCommand: cmd } : g));
      notification.error({
        message: 'LỆNH CHỜ ĐÃ GỬI (CRITICAL)',
        description: `Đã gửi thông báo đẩy đến màn hình POS của ${gate.staffName}. Lệnh sẽ được kích hoạt khi nhân viên chốt ca.`,
        duration: 8,
        placement: 'bottomRight'
      });
    }
  };

  const handleCancelGateCommand = (gateId: string) => {
    setGates(prev => prev.map(g => g.id === gateId ? { ...g, pendingCommand: null } : g));
    message.info('Đã hủy lệnh chờ.');
  };

  const handleSave = () => {
    const payload = { mapCols, mapRows, zones, gates };
    console.log("Saving Configuration:", payload);
    message.success('Đã lưu cấu hình sơ đồ và trung tâm điều khiển thành công!');
  };

  // -- Render Helpers --
  const drawGrid = () => {
    const lines = [];
    const width = mapCols * GRID_SIZE;
    const height = mapRows * GRID_SIZE;
    
    lines.push(<Rect key="bg" x={0} y={0} width={width} height={height} fill="#f8fafc" />);

    for (let i = 1; i < mapCols; i++) {
      lines.push(<Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, height]} stroke="#cbd5e1" strokeWidth={1} opacity={0.3} listening={false} />);
    }
    for (let j = 1; j < mapRows; j++) {
      lines.push(<Line key={`h-${j}`} points={[0, j * GRID_SIZE, width, j * GRID_SIZE]} stroke="#cbd5e1" strokeWidth={1} opacity={0.3} listening={false} />);
    }
    
    lines.push(<Rect key="border" x={0} y={0} width={width} height={height} stroke="#334155" strokeWidth={4} listening={false} />);
    return lines;
  };

  // Get current selected data for Inspector
  const activeZone = selectedEntity?.type === 'ZONE' || selectedEntity?.type === 'SLOT' ? zones.find(z => z.id === (selectedEntity as any).zoneId || z.id === selectedEntity.id) : null;
  const activeSlot = selectedEntity?.type === 'SLOT' ? activeZone?.slots.find(s => s.id === selectedEntity.slotId) : null;
  const activeGate = selectedEntity?.type === 'GATE' ? gates.find(g => g.id === selectedEntity.id) : null;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* COLUMN 2: MAIN CANVAS WORKSPACE (~75%) */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-gray-200" ref={containerRef}>
        {containerSize.width > 0 && containerSize.height > 0 && (
          <Stage 
            width={containerSize.width} 
            height={containerSize.height}
            draggable
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={(e) => {
              e.evt.preventDefault();
              const scaleBy = 1.05;
              const stage = e.target.getStage();
              if(!stage) return;
              const oldScale = stage.scaleX();
              const pointer = stage.getPointerPosition();
              if(!pointer) return;
              
              const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
              };

              let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
              newScale = Math.max(defaultScale, Math.min(newScale, 5));

              setStageScale(newScale);
              setStagePos({
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
              });
            }}
            ref={stageRef}
            onClick={(e) => {
              if (e.target === e.target.getStage() || e.target.name() === 'bg') {
                setSelectedEntity(null);
              }
            }}
          >
            <Layer>
              {drawGrid()}
            </Layer>
            
            <Layer>
              {/* Draw Zones & Slots */}
              {visibleZones.map((zone) => {
                const { width: slotW, height: slotH } = getVehicleDimensions(zone.vehicleType);
                const isZoneSelected = selectedEntity?.type === 'ZONE' && selectedEntity.id === zone.id;
                const isSlotSelectedInZone = selectedEntity?.type === 'SLOT' && selectedEntity.zoneId === zone.id;
                const isSelected = isZoneSelected || isSlotSelectedInZone;
                
                const zoneW = zone.capacity * slotW;
                const zoneH = slotH;
                
                return (
                  <Group
                    key={`zone-${zone.id}`}
                    name="zoneGroup"
                    x={zone.layoutX}
                    y={zone.layoutY}
                    rotation={zone.rotation}
                    draggable
                    onDragMove={(e) => handleDragMove(e, zone.id, true)}
                    onDragEnd={(e) => handleDragEnd(e, zone.id, true)}
                  >
                    {/* Zone Bounding Box */}
                    <Rect
                      width={zoneW} height={zoneH}
                      fill={isZoneSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}
                      stroke={collidingNodeId === String(zone.id) ? '#ef4444' : (isZoneSelected ? '#3b82f6' : '#94a3b8')}
                      strokeWidth={isZoneSelected ? 3 : 1}
                      dash={collidingNodeId === String(zone.id) ? [10, 5] : []}
                      onClick={(e) => { e.cancelBubble = true; setSelectedEntity({ type: 'ZONE', id: zone.id }); if(!expandedKeys.includes('2')) setExpandedKeys(p => [...p, '2']); }}
                      onTap={(e) => { e.cancelBubble = true; setSelectedEntity({ type: 'ZONE', id: zone.id }); }}
                    />
                    
                    {/* Slots within Zone */}
                    {zone.slots.map((slot, i) => {
                      const xPos = i * slotW;
                      const isThisSlotSelected = selectedEntity?.type === 'SLOT' && selectedEntity.slotId === slot.id;
                      
                      let slotFill = 'transparent';
                      if (slot.status === 'OCCUPIED') slotFill = '#fee2e2'; // Light red
                      else if (slot.status === 'DISABLED') slotFill = '#f1f5f9'; // Gray
                      else if (slot.status === 'EMPTY' && isThisSlotSelected) slotFill = '#eff6ff'; // Light blue highlight
                      else slotFill = '#ffffff';

                      return (
                        <Group 
                          key={slot.id} 
                          x={xPos} 
                          y={0}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            if (isZoneSelected) {
                              setSelectedEntity({ type: 'SLOT', zoneId: zone.id, slotId: slot.id });
                              if(!expandedKeys.includes('3')) setExpandedKeys(p => [...p, '3']);
                            } else {
                              setSelectedEntity({ type: 'ZONE', id: zone.id });
                              if(!expandedKeys.includes('2')) setExpandedKeys(p => [...p, '2']);
                            }
                          }}
                        >
                          <Rect
                            width={slotW} height={slotH}
                            fill={slotFill}
                            stroke={isThisSlotSelected ? '#2563eb' : (slot.status === 'OCCUPIED' ? '#ef4444' : '#cbd5e1')}
                            strokeWidth={isThisSlotSelected ? 3 : 2}
                          />
                          {/* Disabled Crosshatch pattern mock using lines */}
                          {slot.status === 'DISABLED' && (
                            <Line points={[0, 0, slotW, slotH]} stroke="#cbd5e1" strokeWidth={2} listening={false} />
                          )}
                          
                          <KonvaText
                            x={0} y={slotH / 2 - 16}
                            width={slotW}
                            align="center"
                            text={slot.name}
                            fontSize={16}
                            fill={slot.status === 'DISABLED' ? '#94a3b8' : '#334155'}
                            fontStyle="bold"
                            listening={false}
                          />
                          {slot.status === 'OCCUPIED' && slot.plate && (
                            <KonvaText
                              x={0} y={slotH / 2 + 4}
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

                    {/* Zone Name Top-Left (Inside) */}
                    <KonvaText
                      x={8} y={8}
                      text={zone.name}
                      fontSize={14}
                      fontFamily="sans-serif"
                      fill={isSelected ? '#2563eb' : '#334155'}
                      fontStyle="bold"
                      listening={false}
                    />
                  </Group>
                );
              })}

              {/* Draw Gates */}
              {visibleGates.map((gate) => {
                const isSelected = selectedEntity?.type === 'GATE' && selectedEntity.id === gate.id;
                const gateColor = gate.status === 'OCCUPIED' ? '#f59e0b' : '#10b981'; // Amber if staffed, Green if idle
                
                return (
                  <Group
                    key={`gate-${gate.id}`}
                    name="gateGroup"
                    x={gate.layoutX}
                    y={gate.layoutY}
                    rotation={gate.rotation}
                    draggable
                    onDragMove={(e) => handleDragMove(e, gate.id, false)}
                    onDragEnd={(e) => handleDragEnd(e, gate.id, false)}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedEntity({ type: 'GATE', id: gate.id });
                      if(!expandedKeys.includes('4')) setExpandedKeys(p => [...p, '4']);
                    }}
                  >
                    <Rect
                      width={3 * GRID_SIZE} height={GRID_SIZE}
                      fill={isSelected ? '#e0f2fe' : '#ffffff'}
                      stroke={collidingNodeId === gate.id ? '#ef4444' : (isSelected ? '#2563eb' : gateColor)}
                      dash={collidingNodeId === gate.id ? [10, 5] : []}
                      strokeWidth={isSelected ? 3 : 2}
                      cornerRadius={4}
                    />
                    <KonvaText
                      x={0} y={GRID_SIZE / 2 - 6}
                      width={3 * GRID_SIZE}
                      align="center"
                      text={gate.name}
                      fontSize={12}
                      fontStyle="bold"
                      fill={gateColor}
                      listening={false}
                    />
                    {gate.pendingCommand && (
                       <KonvaText x={0} y={-15} text="⚠️ PENDING" fill="#ef4444" fontSize={12} fontStyle="bold" listening={false} />
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* COLUMN 3: RIGHT INSPECTOR PANEL (~25%) */}
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-10 shrink-0">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between shrink-0">
          <Title level={5} className="m-0 text-slate-800 flex items-center">
            <CompassOutlined className="mr-2 text-blue-600" /> Thanh Cấu Hình
          </Title>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <Collapse 
            ghost 
            expandIconPosition="end" 
            activeKey={expandedKeys}
            onChange={(keys) => setExpandedKeys(keys as string[])}
            className="bg-white"
          >
            {/* --- SECTION 0: VIEWPORT --- */}
            <Panel header={<Text strong>0. Tầm nhìn & Điều hướng</Text>} key="0" className="border-b border-gray-100">
              <Button size="small" block icon={<AimOutlined />} className="mb-3" onClick={() => handleZoomToBox(0, 0, mapCols*GRID_SIZE, mapRows*GRID_SIZE)}>
                Zoom Toàn Cảnh
              </Button>
              <Text type="secondary" className="text-xs mb-1 block">Đi đến Khu vực:</Text>
              <Select 
                size="small"
                className="w-full" 
                placeholder="Chọn Zone..."
                onChange={handleZoomZone}
                value={selectedEntity?.type === 'ZONE' ? selectedEntity.id : undefined}
              >
                {visibleZones.map(z => <Select.Option key={z.id} value={z.id}>{z.name}</Select.Option>)}
              </Select>
            </Panel>

            {/* --- SECTION 1: FLOOR CONFIG --- */}
            <Panel header={<Text strong>1. Quản lý Tầng (Floor)</Text>} key="1" className="border-b border-gray-100 bg-slate-50/50">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Select 
                    size="small" 
                    className="flex-1" 
                    value={selectedFloorId}
                    onChange={(v) => setSelectedFloorId(v)}
                  >
                    {floors.map(f => <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>)}
                  </Select>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => {
                    const newId = Date.now();
                    setFloors(prev => [...prev, { id: newId, name: `Tầng Mới`, type: 'CAR', mapCols: 60, mapRows: 40 }]);
                    setSelectedFloorId(newId);
                  }}>Thêm</Button>
                </div>
                {floors.find(f => f.id === selectedFloorId) && (
                  <div>
                    <Text className="text-xs text-gray-500 block mb-1">Đặc tính Tầng (Giới hạn loại xe):</Text>
                    <Select 
                      size="small" 
                      value={floors.find(f => f.id === selectedFloorId)?.type} 
                      className="w-full"
                      onChange={(v) => {
                         setFloors(prev => prev.map(f => f.id === selectedFloorId ? { ...f, type: v as 'CAR' | 'MOTORBIKE' } : f));
                      }}
                    >
                      <Select.Option value="CAR">Tầng Ô tô</Select.Option>
                      <Select.Option value="MOTORBIKE">Tầng Xe máy</Select.Option>
                    </Select>
                  </div>
                )}
                <div>
                  <Text className="text-xs text-gray-500 block mb-1">Kích thước ma trận (Ô):</Text>
                  <div className="flex items-center space-x-2">
                    <InputNumber size="small" value={mapCols} onChange={v => v && handleUpdateMapSize(v, mapRows)} className="w-20" />
                    <Text type="secondary">x</Text>
                    <InputNumber size="small" value={mapRows} onChange={v => v && handleUpdateMapSize(mapCols, v)} className="w-20" />
                  </div>
                </div>
              </div>
            </Panel>

            {/* --- SECTION 2: ZONE CONFIG --- */}
            <Panel 
              header={<div className="flex justify-between items-center w-full pr-4">
                <Text strong>2. Khu vực đỗ (Zone)</Text>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); handleAddZone(); }} />
              </div>} 
              key="2" 
              className="border-b border-gray-100"
            >
              {activeZone ? (
                <div className="space-y-4">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded flex justify-between items-center">
                    <Text strong className="text-blue-700">
                      <Input 
                        value={activeZone.name} 
                        size="small" 
                        variant="borderless" 
                        className="font-bold text-blue-700 p-0"
                        onChange={(e) => setZones(prev => prev.map(z => z.id === activeZone.id ? {...z, name: e.target.value} : z))}
                      />
                    </Text>
                  </div>
                  
                  <div>
                    <Text className="text-xs text-gray-500 block mb-1">Chức năng Zone:</Text>
                    <Select 
                      size="small" className="w-full" value={activeZone.functionType}
                      onChange={v => setZones(prev => prev.map(z => z.id === activeZone.id ? {...z, functionType: v} : z))}
                    >
                      <Select.Option value="WALK_IN">Vãng lai (Walk-in)</Select.Option>
                      <Select.Option value="MONTHLY">Vé tháng (Monthly)</Select.Option>
                      <Select.Option value="IMPOUNDED">Vi phạm (Impounded)</Select.Option>
                    </Select>
                  </div>

                  <div>
                    <Text className="text-xs text-gray-500 block mb-1">Loại phương tiện:</Text>
                    <Select 
                      size="small" className="w-full" value={activeZone.vehicleType}
                      onChange={v => setZones(prev => prev.map(z => z.id === activeZone.id ? {...z, vehicleType: v} : z))}
                    >
                      {floors.find(f => f.id === selectedFloorId)?.type !== 'MOTORBIKE' && (
                        <Select.Option value="CAR">Ô tô (150x250)</Select.Option>
                      )}
                      {floors.find(f => f.id === selectedFloorId)?.type !== 'CAR' && (
                        <Select.Option value="MOTORBIKE">Xe máy (50x100)</Select.Option>
                      )}
                    </Select>
                  </div>

                  <div>
                    <Text className="text-xs text-gray-500 block mb-1">Số lượng Slot (LIFO):</Text>
                    <InputNumber 
                      size="small" min={1} max={100} value={activeZone.capacity} className="w-full"
                      onChange={v => v && handleUpdateZoneCapacity(activeZone.id, v)}
                    />
                  </div>

                  <div>
                    <Text className="text-xs text-gray-500 block mb-1">Ngưỡng lấp đầy điều hướng (%):</Text>
                    <Slider 
                      min={0} max={100} value={activeZone.overflowThreshold}
                      onChange={v => setZones(prev => prev.map(z => z.id === activeZone.id ? {...z, overflowThreshold: v} : z))}
                    />
                  </div>

                  <Button block icon={<SyncOutlined />} onClick={() => handleRotateZone(activeZone.id)}>
                    Xoay Zone 90°
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-400 italic text-sm">
                  Click vào một Zone trên bản đồ để cấu hình.
                </div>
              )}
            </Panel>

            {/* --- SECTION 3: SLOT CONFIG --- */}
            <Panel header={<Text strong>3. Ô đỗ đơn lẻ (Slot)</Text>} key="3" className="border-b border-gray-100 bg-slate-50/50">
              {activeSlot && activeZone ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
                    <Text strong className="text-lg">{activeSlot.name}</Text>
                    <Badge status={activeSlot.status === 'EMPTY' ? 'success' : (activeSlot.status === 'OCCUPIED' ? 'error' : 'default')} text={activeSlot.status} />
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <Text>Hoạt động bình thường:</Text>
                    <Switch 
                      checked={activeSlot.status !== 'DISABLED'}
                      onChange={(checked) => handleToggleSlotStatus(activeZone.id, activeSlot.id, checked ? 'EMPTY' : 'DISABLED')}
                    />
                  </div>
                  <Text type="secondary" className="text-xs italic block mt-1">
                    * Tắt công tắc để chuyển sang chế độ Bảo trì. Không thể bảo trì nếu đang có xe.
                  </Text>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-400 italic text-sm">
                  Click đúp vào một Slot để cấu hình riêng biệt.
                </div>
              )}
            </Panel>

            {/* --- SECTION 4: GATE COMMAND CENTER --- */}
            <Panel 
              header={<div className="flex justify-between items-center w-full pr-4">
                <Text strong className={activeGate ? "text-amber-600" : ""}>4. Lệnh Cổng Điều hành</Text>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); handleAddGate(); }} />
              </div>} 
              key="4" 
            >
              {activeGate ? (
                <div className="space-y-4">
                  <div className={`p-3 rounded border ${activeGate.status === 'OCCUPIED' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center mb-1">
                      <GatewayOutlined className="mr-2 text-lg" />
                      <Input 
                        value={activeGate.name} 
                        size="small" 
                        variant="borderless" 
                        className="font-bold p-0"
                        onChange={(e) => setGates(prev => prev.map(g => g.id === activeGate.id ? {...g, name: e.target.value} : g))}
                      />
                    </div>
                    <div className="mb-2">
                      <Text className="text-xs text-gray-500 block mb-1">Loại cổng:</Text>
                      <Select 
                        size="small" 
                        value={activeGate.type} 
                        className="w-full"
                        onChange={(v) => setGates(prev => prev.map(g => g.id === activeGate.id ? {...g, type: v as 'IN' | 'OUT'} : g))}
                      >
                        <Select.Option value="IN">Cổng Vào (IN)</Select.Option>
                        <Select.Option value="OUT">Cổng Ra (OUT)</Select.Option>
                      </Select>
                    </div>
                    <Text className="text-xs block">Trạng thái: <Text strong>{activeGate.status}</Text></Text>
                    {activeGate.staffName && <Text className="text-xs block">Nhân viên trực: <Text strong>{activeGate.staffName}</Text></Text>}
                  </div>

                  {activeGate.pendingCommand ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <Text strong className="text-red-600 block mb-2"><SettingOutlined spin /> Lệnh chờ đang thực thi...</Text>
                      <Text className="text-sm block mb-3">Hệ thống đang chờ nhân viên {activeGate.staffName} dọn dẹp hàng đợi và chốt ca để kích hoạt lệnh: <Text strong>{activeGate.pendingCommand}</Text></Text>
                      <Button danger block icon={<CloseCircleOutlined />} onClick={() => handleCancelGateCommand(activeGate.id)}>
                        Hủy Lệnh Chờ
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Text className="text-xs text-gray-500 block mb-2">Gửi lệnh điều khiển từ xa (Override):</Text>
                      <Radio.Group className="w-full flex flex-col space-y-2">
                        <Radio value="NORMAL"><Text>Bình thường (Tự động)</Text></Radio>
                        <Radio value="CLOSED"><Text className="text-red-600">Khóa ĐÓNG CỔNG</Text></Radio>
                        <Radio value="FORCE_IN"><Text className="text-blue-600">Ép luồng VÀO</Text></Radio>
                        <Radio value="FORCE_OUT"><Text className="text-orange-600">Ép luồng RA</Text></Radio>
                      </Radio.Group>
                      <Button type="primary" className="mt-4 bg-slate-800" block onClick={() => handleGateCommand(activeGate.id, 'CLOSED')}>
                        Gửi Lệnh Điều Phối
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-400 italic text-sm">
                  Click vào biểu tượng Cổng (Gate) trên viền bản đồ để thao tác.
                </div>
              )}
            </Panel>
          </Collapse>
        </div>

        {/* BOTTOM ACTION */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <Button 
            type="primary" 
            size="large" 
            block 
            icon={<SaveOutlined />} 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium shadow-md"
          >
            LƯU CẤU HÌNH
          </Button>
        </div>

      </div>
    </div>
  );
};
