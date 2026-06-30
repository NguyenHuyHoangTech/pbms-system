import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Group, Rect, Text as KonvaText, Label, Tag } from 'react-konva';
import { Button, Select } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, AimOutlined } from '@ant-design/icons';
import Konva from 'konva';

const GRID_SIZE = 50;

const getVehicleDimensions = (typeId, vehicleTypes) => {
  const type = vehicleTypes.find(v => v.id === typeId);
  if (type) {
    const w = type.matrixWidth || 3;
    const h = type.matrixHeight || 6;
    return { width: w * GRID_SIZE, height: h * GRID_SIZE };
  }
  return { width: 3 * GRID_SIZE, height: 6 * GRID_SIZE };
};

export const SimulatorMap = ({ floors, zones, gates, slots, vehicleTypes, selectedFloorId, toggleSlot }) => {
  const activeFloor = floors.find(f => f.id === selectedFloorId);
  const mapCols = activeFloor?.mapCols || 60;
  const mapRows = activeFloor?.mapRows || 40;

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [defaultScale, setDefaultScale] = useState(1);

  const visibleZones = zones.filter(z => z.floorId === selectedFloorId);
  const visibleGates = gates.filter(g => g.floorId === selectedFloorId);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

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

  const handleZoom = (factor) => {
    if (!stageRef.current || !containerRef.current) return;
    const oldScale = stageScale;
    let newScale = oldScale * factor;
    newScale = Math.max(defaultScale, Math.min(newScale, 5));

    const center = {
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2,
    };

    const mousePointTo = {
      x: (center.x - stagePos.x) / oldScale,
      y: (center.y - stagePos.y) / oldScale,
    };

    setStageScale(newScale);
    setStagePos({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    });
  };

  const handleZoomFit = () => {
    if (!containerRef.current) return;
    const mapW = mapCols * GRID_SIZE;
    const mapH = mapRows * GRID_SIZE;

    const scale = Math.min(containerRef.current.clientWidth / mapW, containerRef.current.clientHeight / mapH) * 0.95;
    const minScaleLocked = Math.min(scale, 1);

    setStageScale(minScaleLocked);
    setStagePos({
      x: (containerRef.current.clientWidth - mapW * minScaleLocked) / 2,
      y: (containerRef.current.clientHeight - mapH * minScaleLocked) / 2
    });
  };

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
    const zone = visibleZones.find((z: any) => z.id === zoneId);
    if (!zone) return;

    let slotW = 3 * GRID_SIZE;
    let slotH = 6 * GRID_SIZE;
    if (zone.vehicleTypeId) {
      const vType = vehicleTypes.find((vt: any) => vt.id === zone.vehicleTypeId);
      if (vType) {
        slotW = (vType.matrixWidth || 3) * GRID_SIZE;
        slotH = (vType.matrixHeight || 6) * GRID_SIZE;
      }
    }

    let zoneW = zone.capacity * slotW;
    let zoneH = slotH;
    if (zone.rotation === 90 || zone.rotation === 270) {
      zoneW = slotH;
      zoneH = zone.capacity * slotW;
    }

    let boxX = zone.layoutX || 0;
    let boxY = zone.layoutY || 0;
    if (zone.rotation === 90) boxX -= zoneW;
    else if (zone.rotation === 180) { boxX -= zoneW; boxY -= zoneH; }
    else if (zone.rotation === 270) boxY -= zoneH;

    handleZoomToBox(boxX, boxY, zoneW, zoneH, 100);
  };

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

  return (
    <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-gray-200 h-full w-full rounded-xl overflow-hidden" ref={containerRef} style={{ minHeight: '600px' }}>
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
            if (!stage) return;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

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
        >
          <Layer>
            {drawGrid()}
          </Layer>

          <Layer>
            {/* Draw Zones & Slots */}
            {visibleZones.map((zone) => {
              const { width: slotW, height: slotH } = getVehicleDimensions(zone.vehicleTypeId, vehicleTypes);
              const zoneSlots = (zone.slots && zone.slots.length > 0)
                ? zone.slots
                : slots.filter(s => String(s.zoneId) === String(zone.id));

              const capacity = Math.max(zone.capacity || 0, zoneSlots.length);

              const zoneW = capacity * slotW;
              const zoneH = slotH;

              return (
                <Group
                  key={`zone-${zone.id}`}
                  x={zone.layoutX || 0}
                  y={zone.layoutY || 0}
                  rotation={zone.rotation || 0}
                >
                  <Rect
                    width={zoneW || (3 * GRID_SIZE)} height={zoneH || (6 * GRID_SIZE)}
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth={1}
                  />

                  {/* Slots within Zone */}
                  {zoneSlots.map((slotConfig, i) => {
                    const liveSlot = slots.find(s => String(s.id) === String(slotConfig.id)) || slotConfig;
                    const xPos = i * slotW;

                    let slotFill = '#ffffff';
                    let strokeColor = '#cbd5e1';
                    if (liveSlot.status === 'OCCUPIED') {
                      slotFill = '#fee2e2'; // Light red
                      strokeColor = '#ef4444';
                    } else if (liveSlot.status === 'DISABLED') {
                      slotFill = '#f1f5f9'; // Gray
                    }

                    return (
                      <Group
                        key={liveSlot.id}
                        x={xPos || 0}
                        y={0}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          toggleSlot(liveSlot);
                        }}
                        onTap={(e) => {
                          e.cancelBubble = true;
                          toggleSlot(liveSlot);
                        }}
                        onMouseEnter={(e) => {
                          const container = e.target.getStage().container();
                          container.style.cursor = 'pointer';
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage().container();
                          container.style.cursor = 'grab';
                        }}
                      >
                        <Rect
                          width={slotW} height={slotH}
                          fill={slotFill}
                          stroke={strokeColor}
                          strokeWidth={2}
                        />
                        {/* Disabled Crosshatch pattern mock using lines */}
                        {liveSlot.status === 'DISABLED' && (
                          <Line points={[0, 0, slotW, slotH]} stroke="#cbd5e1" strokeWidth={2} listening={false} />
                        )}

                        <KonvaText
                          x={0} y={slotH / 2 - 16}
                          width={slotW}
                          align="center"
                          text={liveSlot.slotName || liveSlot.name}
                          fontSize={16}
                          fill={liveSlot.status === 'DISABLED' ? '#94a3b8' : '#334155'}
                          fontStyle="bold"
                          listening={false}
                        />
                        {liveSlot.status === 'OCCUPIED' && liveSlot.currentPlate && (
                          <KonvaText
                            x={0} y={slotH / 2 + 4}
                            width={slotW}
                            align="center"
                            text={liveSlot.currentPlate}
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
                  <Label x={5} y={5} listening={false}>
                    <Tag fill="rgba(255, 255, 255, 0.85)" cornerRadius={4} />
                    <KonvaText
                      text={`${zone.zoneName || zone.name}`}
                      fontSize={14}
                      fontFamily="sans-serif"
                      fill="#334155"
                      fontStyle="bold"
                      padding={4}
                    />
                  </Label>
                </Group>
              );
            })}

            {/* Draw Gates */}
            {visibleGates.map((gate) => {
              let gateW = 3 * GRID_SIZE;
              let gateH = GRID_SIZE;
              if (gate.vehicleTypeId) {
                const vt = vehicleTypes.find(v => v.id === gate.vehicleTypeId);
                if (vt) gateW = (vt.matrixWidth || 3) * GRID_SIZE;
              }
              const gateColor = (gate.status === 'ACTIVE' || gate.status === 'IDLE' || gate.status === 'OCCUPIED') ? '#059669' : '#94a3b8'; // emerald vs slate

              return (
                <Group
                  key={`gate-${gate.id}`}
                  x={gate.layoutX || 0}
                  y={gate.layoutY || 0}
                  rotation={gate.rotation || 0}
                >
                  <Rect
                    width={gateW || (3 * GRID_SIZE)} height={gateH || GRID_SIZE}
                    fill="#ffffff"
                    stroke={gateColor}
                    strokeWidth={3}
                    cornerRadius={4}
                  />
                  <KonvaText
                    x={0} y={gateH / 2 - 6}
                    width={gateW}
                    align="center"
                    text={gate.name || gate.gateName}
                    fontSize={12}
                    fontStyle="bold"
                    fill={gateColor}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      )}
      <div className="absolute top-4 left-4 flex gap-2 z-10 bg-white/80 p-2 rounded-lg backdrop-blur-sm shadow-sm border border-gray-200">
        <Button icon={<AimOutlined />} onClick={handleZoomFit}>Fit to Screen</Button>
        <Select
          placeholder="Zoom to Zone"
          options={visibleZones.map((z: any) => ({ label: z.zoneName || z.name, value: z.id }))}
          onChange={handleZoomZone}
          allowClear
          className="w-48"
        />
      </div>
      {!activeFloor && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-white">
          Chưa tải được dữ liệu tầng
        </div>
      )}
    </div>
  );
};
