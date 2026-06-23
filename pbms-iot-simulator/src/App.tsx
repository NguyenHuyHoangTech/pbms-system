import React, { useState } from 'react';
import { Card, Typography, Row, Col, Form, Input, Button, Slider, Select, message, Tabs, Table, Tag, DatePicker, ConfigProvider, theme } from 'antd';
import { ApiOutlined, SendOutlined, FastForwardOutlined, ClockCircleOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useMutation, useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const queryClient = new QueryClient();

// Default mock slots if backend is down
const MOCK_SLOTS = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  slotName: `S${i + 1}`,
  status: 'EMPTY',
  currentPlate: null
}));

const generateMockLicensePlateImage = (plateNumber: string, actionType: string, vehicleType: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Random background color (street/wall simulation)
  const r = Math.floor(Math.random() * 100) + 50;
  const g = Math.floor(Math.random() * 100) + 50;
  const b = Math.floor(Math.random() * 100) + 50;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw some random lines/shapes for noise
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
    ctx.lineWidth = Math.random() * 10;
    ctx.stroke();
  }

  // 3. Draw Vehicle tail (a simple box representing the car rear)
  const isCar = vehicleType?.includes('4 ch') || vehicleType?.includes('7 ch') || !vehicleType;
  const carWidth = isCar ? 400 : 200;
  const carHeight = isCar ? 250 : 300;
  const carX = (canvas.width - carWidth) / 2;
  const carY = canvas.height - carHeight - 40; 
  
  // Randomize car color slightly
  const carR = Math.floor(Math.random() * 155) + 100;
  const carG = Math.floor(Math.random() * 155) + 100;
  const carB = Math.floor(Math.random() * 155) + 100;
  ctx.fillStyle = `rgb(${carR},${carG},${carB})`;
  
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  // Car body
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(carX, carY, carWidth, carHeight, 20) : ctx.fillRect(carX, carY, carWidth, carHeight);
  ctx.fill();
  ctx.shadowBlur = 0; 
  
  // Draw taillights
  ctx.fillStyle = '#e74c3c';
  if (isCar) {
    ctx.fillRect(carX + 20, carY + 40, 60, 30);
    ctx.fillRect(carX + carWidth - 80, carY + 40, 60, 30);
  } else {
    // Motorcycle single tail light
    ctx.fillRect(carX + carWidth / 2 - 25, carY + 40, 50, 30);
  }

  // 4. Draw License Plate
  const plateWidth = 220;
  const plateHeight = 70;
  const plateX = (canvas.width - plateWidth) / 2;
  const plateY = carY + 120;

  ctx.fillStyle = '#ffffff'; 
  ctx.fillRect(plateX, plateY, plateWidth, plateHeight);
  ctx.strokeStyle = '#000000'; 
  ctx.lineWidth = 4;
  ctx.strokeRect(plateX, plateY, plateWidth, plateHeight);

  // 5. Draw Plate Number text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plateNumber || 'NO-PLATE', plateX + plateWidth / 2, plateY + plateHeight / 2 + 5);

  // 6. Draw overlay info
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, 40);
  
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const eventText = `EVENT: ${actionType} | TYPE: ${vehicleType || 'UNKNOWN'}`;
  ctx.fillText(`CAM-01 | ${timestamp} | ${eventText}`, 10, 25);

  // 7. Add a small mock camera watermark/crosshair
  ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 40);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // Return base64 without data URI prefix for backend if needed? 
  // Wait, the previous mock sent 'data:image/png;base64,...' so we include it
  return canvas.toDataURL('image/jpeg', 0.8);
};

const generateMockLprImage = (plateNumber: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#000000'; 
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plateNumber || 'NO-PLATE', canvas.width / 2, canvas.height / 2 + 5);

  return canvas.toDataURL('image/jpeg', 0.9);
};

const App = () => {
  const [form] = Form.useForm();
  const [timeForm] = Form.useForm();
  
  const { data: syncData, refetch: refetchSync } = useQuery({
    queryKey: ['iot-data-sync'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:8080/api/v1/iot/data-sync');
      return res.data.data;
    },
    refetchInterval: 2000
  });

  const slots = syncData?.slots || MOCK_SLOTS;
  const gates = syncData?.gates || [];
  const vehicleTypes = syncData?.vehicleTypes || [];
  const activeSessions = syncData?.activeSessions || [];
  const reservations = syncData?.reservations || [];
  const currentTime = syncData?.currentTime ? dayjs(syncData.currentTime).format('DD/MM/YYYY HH:mm:ss') : '--:--:--';

  const availableCards = syncData?.availableCards || [];
  const floors = syncData?.floors || [];
  const zones = syncData?.zones || [];

  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  React.useEffect(() => {
    if (floors.length > 0 && selectedFloorId === null) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const selectedGateId = Form.useWatch('gateId', form);
  const selectedGate = gates.find((g: any) => g.id === selectedGateId);

  React.useEffect(() => {
    if (selectedGate) {
      if (selectedGate.gateType === 'IN') {
        form.setFieldValue('actionType', 'IN');
      } else if (selectedGate.gateType === 'OUT') {
        form.setFieldValue('actionType', 'OUT');
      }
      form.setFieldValue('vehicleType', undefined); 
    }
  }, [selectedGateId, selectedGate, form]);

  const currentPlate = Form.useWatch('plate', form);
  const currentActionType = Form.useWatch('actionType', form);
  const currentVehicleType = Form.useWatch('vehicleType', form);

  const previewImages = React.useMemo(() => {
    if (!currentPlate) return { panorama: null, lpr: null };
    return {
      panorama: generateMockLicensePlateImage(currentPlate, currentActionType || 'IN', currentVehicleType || 'CAR'),
      lpr: generateMockLprImage(currentPlate)
    };
  }, [currentPlate, currentActionType, currentVehicleType]);

  const availableVehicleTypes = React.useMemo(() => {
    if (!selectedGate) return vehicleTypes;
    return vehicleTypes.filter((v: any) => {
      if (selectedGate.vehicleTypeId && selectedGate.vehicleTypeId !== v.id) {
        return false;
      }
      if (selectedGate.floorType && v.category !== selectedGate.floorType) {
        return false;
      }
      return true;
    });
  }, [selectedGate, vehicleTypes]);


  const handleRandomPlate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let plate = '30A-';
    plate += nums.charAt(Math.floor(Math.random() * nums.length));
    plate += nums.charAt(Math.floor(Math.random() * nums.length));
    plate += nums.charAt(Math.floor(Math.random() * nums.length));
    plate += '.';
    plate += nums.charAt(Math.floor(Math.random() * nums.length));
    plate += nums.charAt(Math.floor(Math.random() * nums.length));
    form.setFieldValue('plate', plate);
  };

  const handleFetchRandomRFID = () => {
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      form.setFieldValue('rfid', randomCard);
      message.success('Đã lấy thẻ RFID thành công: ' + randomCard);
    } else {
      message.warning('Không có thẻ RFID trống trong kho!');
    }
  };

  // API Mutations
  const triggerApiMutation = useMutation({
    mutationFn: async (values: any) => {
      const gate = gates.find((g: any) => g.id === values.gateId);
      const isOut = gate?.type === 'OUT' || (gate?.type === 'IN_OUT' && values.actionType === 'OUT');
      const url = isOut ? 'http://localhost:8080/api/v1/iot/gates/checkout' : 'http://localhost:8080/api/v1/iot/gates/checkin';
      
      const base64Img = generateMockLicensePlateImage(values.plate, values.actionType, values.vehicleType);
      
      const payload = {
        gateId: values.gateId,
        plateNumber: values.plate,
        vehicleType: values.vehicleType,
        rfid: values.rfid,
        imageBase64: base64Img,
        lprImageBase64: generateMockLprImage(values.plate)
      };
      return axios.post(url, payload).then(res => res.data);
    },
    onSuccess: (_, variables) => {
      message.success(`[Cổng ID ${variables.gateId}] Bắn API thành công! Biển số: ${variables.plate || 'N/A'}`);
      refetchSync();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi bắn API IoT');
    }
  });

  const triggerSensorMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return axios.post('http://localhost:8080/api/v1/iot/sensors/update', {
        sensorId: id,
        status: status
      }).then(res => res.data);
    },
    onSuccess: (_, variables) => {
      message.success(`Đã cập nhật slot ID ${variables.id} thành ${variables.status}`);
      refetchSync();
    },
    onError: () => {
      message.error('Lỗi khi bắn API Sensor');
    }
  });

  const timeTravelMutation = useMutation({
    mutationFn: async (values: any) => {
      const targetTimeStr = values.targetTime.format('YYYY-MM-DDTHH:mm:ss');
      return axios.post('http://localhost:8080/api/v1/iot/time/fast-forward', {
        targetTime: targetTimeStr
      }).then(res => res.data);
    },
    onSuccess: () => {
      message.success('Đã tua thời gian hệ thống thành công!');
      refetchSync();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi tua thời gian');
    }
  });

  const toggleSlot = (slot: any) => {
    const newStatus = slot.status === 'OCCUPIED' ? 'EMPTY' : 'OCCUPIED';
    triggerSensorMutation.mutate({
      id: slot.id,
      status: newStatus
    });
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.info(`Đã copy: ${text}`);
  };

  // Table Columns
  const activeSessionsColumns = [
    { title: 'Biển số', dataIndex: 'plate', key: 'plate', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Slot', dataIndex: ['slot', 'slotName'], key: 'slotName', render: (text: string) => text || 'Không rõ' },
    { title: 'Giờ vào', dataIndex: 'timeIn', key: 'timeIn', render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '' },
    { title: 'Loại xe', dataIndex: ['vehicleType', 'typeName'], key: 'vehicleType' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (text: string) => <Tag color="green">{text}</Tag> },
    { title: 'Hành động', key: 'action', render: (_: any, record: any) => <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(record.plate)}>Copy Biển</Button> }
  ];

  const reservationsColumns = [
    { title: 'Biển số', dataIndex: ['vehicle', 'plateNumber'], key: 'plate', render: (text: string) => <Tag color="orange">{text || 'Không rõ'}</Tag> },
    { title: 'Khu vực', dataIndex: ['zone', 'zoneName'], key: 'zoneName', render: (text: string) => text || 'Không rõ' },
    { title: 'Dự kiến vào', dataIndex: 'expectedEntryTime', key: 'expectedEntryTime', render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '' },
    { title: 'Phí đặt', dataIndex: 'reservationFee', key: 'reservationFee', render: (text: number) => text ? `${text.toLocaleString()} đ` : '0 đ' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (text: string) => <Tag color={text === 'ACTIVE' ? 'blue' : 'orange'}>{text}</Tag> },
    { title: 'Hành động', key: 'action', render: (_: any, record: any) => <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(record.vehicle?.plateNumber)}>Copy Biển</Button> }
  ];

  const renderHardwareTab = () => (
    <Card className="bg-gray-800 border-gray-700 rounded-xl" title={<span className="text-blue-400 font-mono">Camera LPR & RFID Trigger</span>}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={values => triggerApiMutation.mutate(values)}
        initialValues={{ confidence: 95, actionType: 'IN' }}
      >
        <Form.Item name="gateId" label={<span className="text-gray-300">Cổng (Gate)</span>} rules={[{ required: true, message: 'Vui lòng chọn cổng' }]}>
          <Select className="bg-gray-700 text-white border-none rounded" placeholder="-- Chọn Cổng --">
            {gates.map((g: any) => (
              <Select.Option key={g.id} value={g.id}>
                {g.gateName || g.name} ({g.gateType || g.type})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="actionType" label={<span className="text-gray-300">Hành động</span>} initialValue="IN">
              <Select 
                className="bg-gray-700 text-white border-none rounded" 
                disabled={selectedGate && (selectedGate.gateType === 'IN' || selectedGate.gateType === 'OUT')}
              >
                <Select.Option value="IN"><span className="text-blue-400 font-bold">Check-In (Vào)</span></Select.Option>
                <Select.Option value="OUT"><span className="text-red-400 font-bold">Check-Out (Ra)</span></Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vehicleType" label={<span className="text-gray-300">Loại phương tiện</span>}>
              <Select className="bg-gray-700 text-white border-none rounded" placeholder="-- Chọn Loại Xe --">
                {availableVehicleTypes.map((v: any) => (
                  <Select.Option key={v.id} value={v.typeName}>
                    {v.typeName} ({v.category === 'FOUR_WHEEL' ? 'Ô tô' : 'Xe máy'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={<span className="text-gray-300">Biển số (License Plate)</span>}>
          <div className="flex gap-2">
            <Form.Item name="plate" noStyle>
              <Input placeholder="51G-123.45" className="bg-gray-700 text-white border-gray-600 font-mono text-lg w-full" />
            </Form.Item>
            <Button onClick={handleRandomPlate} className="bg-gray-600 text-white border-none shrink-0" icon={<SyncOutlined />}>Random</Button>
          </div>
        </Form.Item>

        <Form.Item label={<span className="text-gray-300">Mã thẻ RFID (Tùy chọn)</span>}>
          <div className="flex gap-2">
            <Form.Item name="rfid" noStyle>
              <Input placeholder="RFID-100001" className="bg-gray-700 text-white border-gray-600 font-mono w-full" />
            </Form.Item>
            <Button onClick={handleFetchRandomRFID} className="bg-gray-600 text-white border-none shrink-0" icon={<SyncOutlined />}>Lấy thẻ trống</Button>
          </div>
        </Form.Item>

        <Form.Item name="confidence" label={<span className="text-gray-300">Độ tin cậy OCR (Confidence Score)</span>}>
          <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} className="mx-2" />
        </Form.Item>

        {previewImages.panorama && (
          <div className="mb-4 bg-gray-900 border-4 border-gray-800 rounded-xl overflow-hidden shadow-lg p-2 flex gap-2 h-48">
            <div className="flex-1 relative border-r-2 border-gray-700 h-full">
              <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 uppercase tracking-widest">
                Panorama Camera
              </div>
              <img src={previewImages.panorama} alt="Preview" className="w-full h-full object-cover opacity-90 rounded" />
            </div>
            <div className="w-1/3 h-full relative bg-gray-950 flex flex-col items-center justify-center p-2 rounded">
              <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 uppercase tracking-widest">
                LPR Crop
              </div>
              <div className="w-full aspect-[3/1] border-2 border-blue-500 rounded relative overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <img src={previewImages.lpr!} alt="LPR Preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-gray-400 text-[9px] mt-2 font-bold tracking-widest uppercase">Mock LPR Snapshot</span>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            icon={<SendOutlined />} 
            loading={triggerApiMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 border-none font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            FIRE EVENT (Bắn API)
          </Button>
        </div>
      </Form>
    </Card>
  );

  const renderSensorTab = () => {
    const activeFloor = floors.find((f: any) => f.id === selectedFloorId);
    const floorZones = zones.filter((z: any) => z.floorId === selectedFloorId);
    
    // Calculate grid scaling
    // We scale down the map so it fits nicely. For example 1 col = 30px
    const CELL_SIZE = 30;
    
    return (
      <Card className="bg-gray-800 border-gray-700 rounded-xl h-full min-h-[600px]" 
            title={
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 font-mono">Bản Đồ Cảm Biến Trực Quan</span>
                <Select
                  className="w-48 bg-gray-700 text-white border-none rounded"
                  value={selectedFloorId}
                  onChange={(val) => setSelectedFloorId(val)}
                  options={floors.map((f: any) => ({ label: `${f.floorName} (${f.floorType})`, value: f.id }))}
                  placeholder="-- Chọn Tầng --"
                />
              </div>
            }>
        
        <div className="mb-4 flex gap-4 text-sm text-gray-400">
          <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Có xe (Occupied)</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Trống (Available)</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div> Đã Đặt (Reserved)</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-gray-500 rounded-full mr-2 shadow-[0_0_8px_rgba(107,114,128,0.8)]"></div> Khóa (Disabled)</div>
        </div>
        
        <div className="overflow-auto bg-gray-900 border border-gray-700 p-4 rounded-xl flex items-start justify-start relative shadow-inner" style={{ minHeight: '500px' }}>
          {activeFloor && (
            <div 
              className="relative bg-gray-800 border border-dashed border-gray-600 rounded"
              style={{
                width: activeFloor.mapCols * CELL_SIZE,
                height: activeFloor.mapRows * CELL_SIZE,
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
              }}
            >
              {floorZones.map((zone: any) => {
                // Get vehicle size to determine slot dimensions
                // For simplicity in this tool, assume standard car slot is 3x6 cells, bike is 1x3 cells
                const vType = vehicleTypes.find((vt: any) => vt.id === zone.vehicleTypeId);
                const slotW = (vType?.matrixWidth || 3) * CELL_SIZE;
                const slotH = (vType?.matrixHeight || 6) * CELL_SIZE;
                
                const zoneSlots = slots.filter((s: any) => s.zoneId === zone.id);
                // Capacity fallback if slots length is smaller, but usually zoneSlots.length is real capacity
                const capacity = Math.max(zone.capacity || 0, zoneSlots.length);
                
                let zoneW = capacity * slotW;
                let zoneH = slotH;

                // Handle rotation visually (If rotation is 90/270, swap W/H)
                const isRotated = zone.rotation === 90 || zone.rotation === 270;
                if (isRotated) {
                  zoneW = slotH;
                  zoneH = capacity * slotW;
                }

                return (
                  <div 
                    key={zone.id}
                    className="absolute border border-gray-500 bg-gray-700/50 rounded flex items-center justify-center p-1"
                    style={{
                      left: zone.layoutX || 0,
                      top: zone.layoutY || 0,
                      width: zoneW,
                      height: zoneH,
                      transform: isRotated ? `rotate(${zone.rotation}deg)` : 'none',
                      transformOrigin: 'top left', // This matches Konva default origin roughly if layout X/Y are top-left
                    }}
                  >
                    <div className="absolute -top-6 left-0 text-yellow-400 font-bold text-xs bg-gray-800/80 px-1 rounded shadow-sm z-10 whitespace-nowrap">
                      {zone.zoneName}
                    </div>

                    <div className="flex w-full h-full" style={{ flexDirection: 'row' }}>
                      {zoneSlots.map((slot: any) => {
                        let bgColor = 'bg-green-500/20 border-green-500';
                        let textColor = 'text-green-300';
                        if (slot.status === 'OCCUPIED') {
                          bgColor = 'bg-red-500/30 border-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.5)]';
                          textColor = 'text-red-200';
                        } else if (slot.status === 'DISABLED') {
                          bgColor = 'bg-gray-500/20 border-gray-500';
                          textColor = 'text-gray-400';
                        }

                        return (
                          <div 
                            key={slot.id}
                            onClick={() => toggleSlot(slot)}
                            className={`flex-1 border-2 m-[1px] rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:brightness-125 ${bgColor}`}
                          >
                            <span className={`font-bold text-[10px] ${textColor}`}>{slot.slotName}</span>
                            {slot.status === 'OCCUPIED' && slot.currentPlate && (
                              <span className="text-[9px] bg-black/60 px-1 rounded mt-1 text-white truncate max-w-full font-mono border border-gray-600">{slot.currentPlate}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!activeFloor && (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Chưa tải được dữ liệu tầng
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderDataTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700 rounded-xl" title={<span className="text-blue-400 font-mono">Danh sách Xe Đang Trong Bãi (Active Sessions)</span>}>
        <div className="bg-gray-900 p-2 rounded-lg">
          <Table dataSource={activeSessions} columns={activeSessionsColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: true }} />
        </div>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700 rounded-xl" title={<span className="text-orange-400 font-mono">Danh sách Xe Đặt Trước (Reservations)</span>}>
        <div className="bg-gray-900 p-2 rounded-lg">
          <Table dataSource={reservations} columns={reservationsColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: true }} />
        </div>
      </Card>
    </div>
  );

  const renderTimeControllerTab = () => (
    <Card className="bg-gray-800 border-gray-700 rounded-xl" title={<span className="text-purple-400 font-mono">Điều Khiển Thời Gian Hệ Thống (Time Controller)</span>}>
      <div className="mb-8 bg-gray-900 p-6 rounded-lg text-center border border-gray-600 shadow-inner">
        <Text className="text-gray-400 block mb-2 text-lg">Thời Gian Ảo Hiện Tại của Toàn Hệ Thống</Text>
        <Title level={1} className="!text-purple-400 m-0 font-mono tracking-widest">{currentTime}</Title>
      </div>

      <Form form={timeForm} layout="vertical" onFinish={values => timeTravelMutation.mutate(values)}>
        <Form.Item name="targetTime" label={<span className="text-gray-300 text-base">Chọn thời điểm muốn tua tới (Fast-Forward Target)</span>} rules={[{ required: true, message: 'Vui lòng chọn thời gian đích' }]}>
          <DatePicker showTime className="w-full" size="large" format="YYYY-MM-DD HH:mm:ss" />
        </Form.Item>
        <div className="mt-8">
          <Button type="primary" htmlType="submit" size="large" icon={<FastForwardOutlined />} className="w-full bg-purple-600 hover:bg-purple-500 border-none font-bold text-lg h-12" loading={timeTravelMutation.isPending}>
            XÁC NHẬN TUA THỜI GIAN
          </Button>
        </div>
      </Form>
    </Card>
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 border-b border-gray-700 pb-4">
            <Title level={2} className="m-0 text-green-400 flex items-center font-mono">
              <ApiOutlined className="mr-3" /> Hardware Simulation Terminal (IoT Mock)
            </Title>
            <Text className="text-gray-400 font-mono mt-2 block">
              Công cụ chuyên dụng để mô phỏng sự kiện phần cứng, thiết lập trạng thái cảm biến và điều hướng thời gian toàn hệ thống.
            </Text>
          </div>

          <Tabs 
            defaultActiveKey="1"
            type="card"
            className="iot-tabs [&_.ant-tabs-nav::before]:border-gray-700 [&_.ant-tabs-tab]:bg-gray-800 [&_.ant-tabs-tab]:border-gray-700 [&_.ant-tabs-tab]:text-gray-400 [&_.ant-tabs-tab-active]:bg-gray-900 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-blue-400 [&_.ant-tabs-tab-active]:!border-b-transparent"
            items={[
              {
                key: '1',
                label: <span className="font-bold text-sm px-2"><ApiOutlined /> Bắn Tín Hiệu Camera & Cổng</span>,
                children: <div className="pt-4">{renderHardwareTab()}</div>
              },
              {
                key: '2',
                label: <span className="font-bold text-sm px-2"><SendOutlined /> Bản Đồ Cảm Biến</span>,
                children: <div className="pt-4">{renderSensorTab()}</div>
              },
              {
                key: '3',
                label: <span className="font-bold text-sm px-2"><ApiOutlined /> Luồng Dữ Liệu Thời Gian Thực</span>,
                children: <div className="pt-4">{renderDataTab()}</div>
              },
              {
                key: '4',
                label: <span className="font-bold text-sm px-2"><ClockCircleOutlined /> Tua Nhanh Thời Gian</span>,
                children: <div className="pt-4">{renderTimeControllerTab()}</div>
              }
            ]}
          />

        </div>
      </div>
    </ConfigProvider>
  );
};

const RootApp = () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

export default RootApp;
