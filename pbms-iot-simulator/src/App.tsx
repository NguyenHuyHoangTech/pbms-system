import React, { useState } from 'react';
import { Card, Typography, Row, Col, Form, Input, Button, Slider, Select, message, Tabs, Table, Tag, DatePicker, ConfigProvider, theme, Radio } from 'antd';
import { ApiOutlined, SendOutlined, FastForwardOutlined, ClockCircleOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useMutation, useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { Client } from '@stomp/stompjs';

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
  
  let seed = (plateNumber || 'UNKNOWN').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // 1. Random background color (street/wall simulation)
  const r = Math.floor(random() * 100) + 50;
  const g = Math.floor(random() * 100) + 50;
  const b = Math.floor(random() * 100) + 50;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw some random lines/shapes for noise
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.moveTo(random() * canvas.width, random() * canvas.height);
    ctx.lineTo(random() * canvas.width, random() * canvas.height);
    ctx.strokeStyle = `rgba(255,255,255,${random() * 0.2})`;
    ctx.lineWidth = random() * 10;
    ctx.stroke();
  }

  // 3. Draw Vehicle tail (a simple box representing the car rear)
  const isCar = vehicleType?.includes('4 ch') || vehicleType?.includes('7 ch') || !vehicleType;
  const carWidth = isCar ? 400 : 200;
  const carHeight = isCar ? 250 : 300;
  const carX = (canvas.width - carWidth) / 2;
  const carY = canvas.height - carHeight - 40; 
  
  // Randomize car color slightly
  const carR = Math.floor(random() * 155) + 100;
  const carG = Math.floor(random() * 155) + 100;
  const carB = Math.floor(random() * 155) + 100;
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
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [debugMinimized, setDebugMinimized] = useState(false);
  
  React.useEffect(() => {
    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-pbms',
      onConnect: () => {
        stompClient.subscribe('/topic/time-sync', (message) => {
          if (message.body) {
            try {
              const data = JSON.parse(message.body);
              if (typeof data.offsetSeconds === 'number') {
                (window as any).SIMULATED_OFFSET_SECONDS = data.offsetSeconds;
              }
            } catch (e) {
              console.error("Failed to parse time-sync message", e);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });
    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);
  
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
    const monthlyTickets = syncData?.monthlyTickets || [];
  const currentTime = syncData?.currentTime ? dayjs(syncData.currentTime).format('DD/MM/YYYY HH:mm:ss') : '--:--:--';

  const availableCards = syncData?.availableCards || [];
  const floors = syncData?.floors || [];
  const zones = syncData?.zones || [];

  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [filterPreBookedFloor, setFilterPreBookedFloor] = useState<number | null>(null);
  const [filterPreBookedGate, setFilterPreBookedGate] = useState<number | null>(null);
  const [vehicleListType, setVehicleListType] = useState<'PREBOOKED' | 'MONTHLY'>('PREBOOKED');

  const [checkoutForm] = Form.useForm();
  const [selectedFloorIdForOut, setSelectedFloorIdForOut] = useState<number | null>(null);
  const [selectedVehicleTypeIdForOut, setSelectedVehicleTypeIdForOut] = useState<number | null>(null);
  const [selectedSessionIdForOut, setSelectedSessionIdForOut] = useState<number | null>(null);

  // States for Monthly Ticket Tab
  const [selectedMonthlyType, setSelectedMonthlyType] = useState<number | null>(null);
  const [selectedMonthlyId, setSelectedMonthlyId] = useState<number | null>(null);
  const [selectedMonthlyGate, setSelectedMonthlyGate] = useState<number | null>(null);

  // States for Pre-booked Tab
  const [selectedPreBookType, setSelectedPreBookType] = useState<number | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [selectedPreBookGate, setSelectedPreBookGate] = useState<number | null>(null);
  const [preBookRfid, setPreBookRfid] = useState<string>('');

  const selectedSession = activeSessions.find((s: any) => s.id === selectedSessionIdForOut);

  // Auto-select floor & type if empty
  React.useEffect(() => {
    if (floors.length > 0 && selectedFloorIdForOut === null) setSelectedFloorIdForOut(floors[0].id);
    if (vehicleTypes.length > 0 && selectedVehicleTypeIdForOut === null) setSelectedVehicleTypeIdForOut(vehicleTypes[0].id);
  }, [floors, vehicleTypes, selectedFloorIdForOut, selectedVehicleTypeIdForOut]);

  // Generate Image OUT when a session is selected
  const [checkoutImages, setCheckoutImages] = useState<{ panorama: string | null, lpr: string | null }>({ panorama: null, lpr: null });
  React.useEffect(() => {
    if (selectedSession) {
      const typeStr = vehicleTypes.find((v: any) => v.id === selectedSession.vehicleTypeId)?.typeName || '';
      const pano = generateMockLicensePlateImage(selectedSession.plate, 'OUT', typeStr);
      const lpr = generateMockLprImage(selectedSession.plate);
      setCheckoutImages({ panorama: pano, lpr: lpr });
      
      // Auto prefill form
      checkoutForm.setFieldsValue({
        plate: selectedSession.plate,
        rfid: selectedSession.rfidCard?.cardCode,
        vehicleType: typeStr
      });
    } else {
      setCheckoutImages({ panorama: null, lpr: null });
      checkoutForm.resetFields();
    }
  }, [selectedSessionIdForOut, selectedSession?.plate, vehicleTypes.length]);


  const renderMonthlyTicketInTab = () => {
    // 1. Filter monthly tickets
    const filteredTickets = selectedMonthlyType 
      ? monthlyTickets.filter((m: any) => m.vehicleType?.id === selectedMonthlyType)
      : monthlyTickets;

    // 2. Selected Ticket details
    const selectedTicket = monthlyTickets.find((m: any) => m.id === selectedMonthlyId);

    // 3. Filter gates
    const availableGates = gates.filter((g: any) => g.gateType === 'IN' || g.gateType === 'IN_OUT' || g.gateType === 'ENTRY');

    const handleSubmitMonthlyIn = () => {
      if (!selectedMonthlyId) return message.error("Please select a monthly pass vehicle!");
      if (!selectedMonthlyGate) return message.error("Please select an entry gate!");

      const payload = {
        gateId: selectedMonthlyGate,
        actionType: 'IN',
        plateNumber: selectedTicket.plate,
        vehicleType: selectedTicket.vehicleType?.typeName || 'Passenger Car',
        rfid: `RF-MTH-${selectedTicket.id}`,
        imageBase64: generateMockLicensePlateImage(selectedTicket.plate || '', 'IN', selectedTicket.vehicleType?.typeName),
        lprImageBase64: generateMockLprImage(selectedTicket.plate || ''),
        customerType: 'MONTHLY'
      };

      triggerApiMutation.mutate(payload);
    };

    return (
      <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-purple-500 font-bold">Monthly Pass Entry Flow</span>}>
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <Title level={5} className="mb-4 text-gray-700">1. Select Vehicle Type</Title>
              <Select 
                className="w-full mb-4" 
                placeholder="-- All vehicle types --" 
                allowClear
                value={selectedMonthlyType} 
                onChange={setSelectedMonthlyType}
              >
                {Array.from(new Set(monthlyTickets.map((m: any) => JSON.stringify(m.vehicleType)))).filter(Boolean).map((vtStr: any) => {
                  try {
                    const vt = JSON.parse(vtStr as string);
                    if (!vt) return null;
                    return <Select.Option key={vt.id} value={vt.id}>{vt.typeName}</Select.Option>;
                  } catch(e) { return null; }
                })}
              </Select>

              <Title level={5} className="mb-4 text-gray-700">2. Select Monthly Pass Vehicle</Title>
              <div className="max-h-64 overflow-y-auto bg-white border rounded">
                {filteredTickets.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">No monthly pass available.</div>
                ) : (
                  filteredTickets.map((m: any) => (
                    <div 
                      key={m.id} 
                      className={`p-3 border-b cursor-pointer transition-colors ${selectedMonthlyId === m.id ? 'bg-purple-100 border-purple-300' : 'hover:bg-gray-50'}`}
                      onClick={() => {
                        setSelectedMonthlyId(m.id);
                        setSelectedMonthlyGate(null);
                      }}
                    >
                      <div className="font-bold text-lg">{m.plate || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">Guest: {m.customerName || 'N/A'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Col>

          <Col span={16}>
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 h-full">
              <Title level={5} className="mb-4 text-gray-700">3. Entry Info</Title>
              
              {!selectedTicket ? (
                <div className="h-40 flex items-center justify-center text-gray-400">Please select a monthly vehicle on the left</div>
              ) : (
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="License Plate">
                        <Input readOnly value={selectedTicket.plate} className="bg-gray-100 font-mono font-bold text-lg" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Vehicle Type">
                        <Input readOnly value={selectedTicket.vehicleType?.typeName || 'Unknown'} className="bg-gray-100" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Owner">
                        <Input readOnly value={selectedTicket.customerName || 'N/A'} className="bg-purple-50 text-purple-700 font-bold" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Entry Gate" required>
                        <Select 
                          value={selectedMonthlyGate} 
                          onChange={setSelectedMonthlyGate}
                          placeholder="-- Select entry gate --"
                        >
                          {availableGates.map((g: any) => (
                            <Select.Option key={g.id} value={g.id}>
                              {g.gateName} (Tầng ID: {g.floorId})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} align="middle">
                    <Col span={16}>
                      <Form.Item label="RFID Card - System auto" required>
                        <Input value={`RF-MTH-${selectedTicket.id}`} readOnly />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="mt-4 mb-6">
                    <Text strong className="block mb-2">Camera Image (Auto-simulated):</Text>
                    <Row gutter={16}>
                      <Col span={16}>
                        <div className="border border-gray-300 rounded overflow-hidden">
                          <img 
                            src={generateMockLicensePlateImage(selectedTicket?.plate || '', 'IN', selectedTicket?.vehicleType?.typeName)} 
                            alt="Camera Panorama" 
                            className="w-full h-auto"
                          />
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="border border-gray-300 rounded overflow-hidden flex items-center justify-center bg-gray-50 h-full">
                          <img 
                            src={generateMockLprImage(selectedTicket?.plate || '')} 
                            alt="Camera LPR" 
                            className="w-full object-contain"
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<SendOutlined />} 
                    block 
                    onClick={handleSubmitMonthlyIn}
                    loading={triggerApiMutation.isPending}
                    className="bg-purple-500"
                  >
                    Xác Nhận Monthly Pass Vehicle Vào Bãi
                  </Button>
                </Form>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderPreBookedInTab = () => {
    // 1. Filter reservations by type
    const activeReservations = reservations.filter((r: any) => r.status === 'ACTIVE' || r.status === 'PENDING');
    const filteredReservations = selectedPreBookType 
      ? activeReservations.filter((r: any) => r.vehicle?.vehicleType?.id === selectedPreBookType)
      : activeReservations;

    // 2. Selected Reservation details
    const selectedRes = activeReservations.find((r: any) => r.id === selectedReservationId);

    // 3. Filter gates by floor of reserved zone
    let availableGates = gates.filter((g: any) => g.gateType === 'IN' || g.gateType === 'IN_OUT' || g.gateType === 'ENTRY');
    if (selectedRes && selectedRes.zone && selectedRes.zone.floorId) {
      availableGates = availableGates.filter((g: any) => g.floorId === selectedRes.zone.floorId);
    }

    const handleGetRandomCardPreBook = () => {
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        setPreBookRfid(randomCard);
      } else {
        message.warning('No available card in system'); // will be message.warning
      }
    };

    const handleSubmitPreBookIn = () => {
      if (!selectedReservationId) return message.error("Please select reserved vehicle!");
      if (!selectedPreBookGate) return message.error("Please select an entry gate!");
      if (!preBookRfid) return message.error("Please take a new card!");

      const payload = {
        gateId: selectedPreBookGate,
        actionType: 'IN',
        plateNumber: selectedRes.vehicle?.plateNumber,
        vehicleType: selectedRes.vehicle?.vehicleType?.typeName || 'Passenger Car',
        rfid: preBookRfid,
        imageBase64: generateMockLicensePlateImage(selectedRes.vehicle?.plateNumber || '', 'IN', selectedRes.vehicle?.vehicleType?.typeName),
        lprImageBase64: generateMockLprImage(selectedRes.vehicle?.plateNumber || ''),
        customerType: 'PREBOOKED'
      };

      triggerApiMutation.mutate(payload);
    };

    return (
      <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-blue-500 font-bold">Reservation Entry Flow</span>}>
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <Title level={5} className="mb-4 text-gray-700">1. Select Vehicle Type</Title>
              <Select 
                className="w-full mb-4" 
                placeholder="-- All vehicle types --" 
                allowClear
                value={selectedPreBookType} 
                onChange={setSelectedPreBookType}
              >
                {Array.from(new Set(activeReservations.map((r: any) => JSON.stringify(r.vehicle?.vehicleType)))).filter(Boolean).map((vtStr: any) => {
                  try {
                    const vt = JSON.parse(vtStr);
                    if (!vt) return null;
                    return <Select.Option key={vt.id} value={vt.id}>{vt.typeName}</Select.Option>;
                  } catch(e) { return null; }
                })}
              </Select>

              <Title level={5} className="mb-4 text-gray-700">2. Select Reserved Vehicle</Title>
              <div className="max-h-64 overflow-y-auto bg-white border rounded">
                {filteredReservations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">No reserved vehicle available.</div>
                ) : (
                  filteredReservations.map((r: any) => (
                    <div 
                      key={r.id} 
                      className={`p-3 border-b cursor-pointer transition-colors ${selectedReservationId === r.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}`}
                      onClick={() => {
                        setSelectedReservationId(r.id);
                        setSelectedPreBookGate(null); // Reset gate when reservation changes
                        setPreBookRfid('');
                      }}
                    >
                      <div className="font-bold text-lg">{r.vehicle?.plateNumber || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">Zone: <Tag color="blue">{r.zone?.zoneName || 'N/A'}</Tag></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Col>

          <Col span={16}>
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 h-full">
              <Title level={5} className="mb-4 text-gray-700">3. Entry Info</Title>
              
              {!selectedRes ? (
                <div className="h-40 flex items-center justify-center text-gray-400">Please select a reserved vehicle on the left</div>
              ) : (
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="License Plate">
                        <Input readOnly value={selectedRes.vehicle?.plateNumber} className="bg-gray-100 font-mono font-bold text-lg" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Vehicle Type">
                        <Input readOnly value={selectedRes.vehicle?.vehicleType?.typeName || 'Unknown'} className="bg-gray-100" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Reserved Zone">
                        <Input readOnly value={selectedRes.zone?.zoneName || 'N/A'} className="bg-blue-50 text-blue-700 font-bold" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Entry Gate (Filtered by Zone floor)" required>
                        <Select 
                          value={selectedPreBookGate} 
                          onChange={setSelectedPreBookGate}
                          placeholder="-- Select entry gate --"
                          notFoundContent="No IN/IN_OUT gate on this floor"
                        >
                          {availableGates.map((g: any) => (
                            <Select.Option key={g.id} value={g.id}>
                              {g.gateName} (Tầng ID: {g.floorId})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} align="middle">
                    <Col span={16}>
                      <Form.Item label="RFID Card" required>
                        <Input value={preBookRfid} readOnly placeholder="Press button to get card" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Button type="dashed" onClick={handleGetRandomCardPreBook} className="mt-1" block icon={<SyncOutlined />}>Get system card</Button>
                    </Col>
                  </Row>

                  <div className="mt-4 mb-6">
                    <Text strong className="block mb-2">Camera Image (Auto-simulated):</Text>
                    <Row gutter={16}>
                      <Col span={16}>
                        <div className="border border-gray-300 rounded overflow-hidden">
                          <img 
                            src={generateMockLicensePlateImage(selectedRes?.vehicle?.plateNumber || '', 'IN', selectedRes?.vehicle?.vehicleType?.typeName)} 
                            alt="Camera Panorama" 
                            className="w-full h-auto"
                          />
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="border border-gray-300 rounded overflow-hidden flex items-center justify-center bg-gray-50 h-full">
                          <img 
                            src={generateMockLprImage(selectedRes?.vehicle?.plateNumber || '')} 
                            alt="Camera LPR" 
                            className="w-full object-contain"
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<SendOutlined />} 
                    block 
                    onClick={handleSubmitPreBookIn}
                    loading={triggerApiMutation.isPending}
                    className="bg-blue-500"
                  >
                    Xác Nhận Reserved Vehicle Vào Bãi
                  </Button>
                </Form>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderInteractiveCheckoutTab = () => {
    const currentCheckoutPlate = Form.useWatch('plate', checkoutForm);
    const currentCheckoutVehicleType = Form.useWatch('vehicleType', checkoutForm);
    
    const checkoutPreviewImages = React.useMemo(() => {
      if (!currentCheckoutPlate && !selectedSession) return { panorama: null, lpr: null };
      const plate = currentCheckoutPlate || selectedSession?.plate;
      const typeStr = currentCheckoutVehicleType || (selectedSession ? vehicleTypes.find((v: any) => v.id === selectedSession.vehicleTypeId)?.typeName : 'CAR');
      return {
        panorama: generateMockLicensePlateImage(plate, 'OUT', typeStr),
        lpr: generateMockLprImage(plate)
      };
    }, [currentCheckoutPlate, currentCheckoutVehicleType, selectedSession, vehicleTypes]);

    const filteredSessions = activeSessions.filter((s: any) => 
      s.floorId === selectedFloorIdForOut && 
      s.vehicleType?.id === selectedVehicleTypeIdForOut
    );

    const availableCheckoutGates = gates.filter((g: any) => 
      g.floorId === selectedFloorIdForOut && 
      (g.gateType === 'OUT' || g.gateType === 'IN_OUT' || g.gateType === 'EXIT') &&
      (!g.vehicleTypeId || g.vehicleTypeId === selectedVehicleTypeIdForOut)
    );

    return (
      <div className="space-y-6">
        <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-blue-400 font-mono">1. Select Zone & Vehicle Type</span>}>
          <Row gutter={16}>
            <Col span={12}>
              <div className="mb-2 text-gray-600">Select Floor</div>
              <Select className="w-full" value={selectedFloorIdForOut} onChange={setSelectedFloorIdForOut}>
                {floors.map((f: any) => <Select.Option key={f.id} value={f.id}>{f.floorName}</Select.Option>)}
              </Select>
            </Col>
            <Col span={12}>
              <div className="mb-2 text-gray-600">Chọn Vehicle Type</div>
              <Select className="w-full" value={selectedVehicleTypeIdForOut} onChange={setSelectedVehicleTypeIdForOut}>
                {vehicleTypes.map((v: any) => <Select.Option key={v.id} value={v.id}>{v.typeName}</Select.Option>)}
              </Select>
            </Col>
          </Row>
        </Card>

        <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-orange-400 font-mono">2. Active Vehicles (Click to select)</span>}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredSessions.map((s: any) => (
              <div 
                key={s.id} 
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedSessionIdForOut === s.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 bg-slate-50'}`}
                onClick={() => setSelectedSessionIdForOut(s.id)}
              >
                <div className="text-center font-bold text-xl text-gray-800 tracking-widest">{s.plate}</div>
                <div className="text-center text-xs text-gray-500 mt-2">In at: {dayjs(s.timeIn).format('HH:mm DD/MM')}</div>
                <div className="text-center text-xs mt-1"><Tag color="green">{s.slot?.slotName || 'No slot'}</Tag></div>
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-4">No parked vehicle matches.</div>
            )}
          </div>
        </Card>

        {selectedSession && (
          <Card className="bg-white border-blue-200 rounded-xl shadow-lg" title={<span className="text-green-500 font-mono font-bold text-lg">3. Check-Out Confirm - Plate: {selectedSession.plate}</span>}>
            <Form 
              form={checkoutForm} 
              layout="vertical"
              onFinish={values => {
                triggerApiMutation.mutate({
                  gateId: values.gateId,
                  actionType: 'OUT',
                  vehicleType: values.vehicleType,
                  plate: values.plate,
                  rfid: values.rfid
                });
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="gateId" label="Select Check-Out Gate" rules={[{ required: true, message: 'Please select checkout gate!' }]}>
                    <Select placeholder="-- Check-Out Gate --" size="large">
                      {availableCheckoutGates.map((g: any) => (
                        <Select.Option key={g.id} value={g.id}>{g.gateName}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="plate" label="Auto-recognized Plate" rules={[{ required: true }]}>
                    <Input size="large" className="font-mono" />
                  </Form.Item>
                  <Form.Item name="rfid" label="Recovered RFID Card">
                    <Input size="large" className="font-mono" />
                  </Form.Item>
                  <Form.Item name="vehicleType" hidden><Input /></Form.Item>
                </Col>
                
                <Col span={12}>
                  <div className="flex flex-col gap-4 h-full">
                    {/* IN Images */}
                    <div className="flex-1 bg-gray-100 rounded border border-gray-300 p-2 overflow-hidden flex flex-col relative">
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded z-10">ENTRY CAMERA (DB)</div>
                      <div className="flex gap-2 h-full">
                        <div className="flex-1 relative">
                          {selectedSession.picInPanorama ? (
                            <img src={selectedSession.picInPanorama} alt="IN" className="w-full h-full object-cover rounded opacity-80" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="w-1/3 relative bg-gray-200 rounded flex items-center justify-center p-1">
                          {selectedSession.picInFace ? (
                            <img src={selectedSession.picInFace} alt="LPR IN" className="w-full h-auto rounded border border-gray-400" />
                          ) : (
                            <div className="text-[10px] text-gray-400">No plate</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* OUT Images */}
                    <div className="flex-1 bg-blue-50 rounded border-2 border-blue-400 p-2 overflow-hidden flex flex-col relative shadow-inner">
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded z-10 font-bold">EXIT CAMERA (MOCK LPR)</div>
                      <div className="flex gap-2 h-full">
                        <div className="flex-1 relative">
                          {checkoutPreviewImages.panorama && (
                            <img src={checkoutPreviewImages.panorama} alt="OUT" className="w-full h-full object-cover rounded" />
                          )}
                        </div>
                        <div className="w-1/3 relative bg-white border border-blue-200 rounded flex items-center justify-center p-1 shadow-sm">
                          {checkoutPreviewImages.lpr && (
                            <img src={checkoutPreviewImages.lpr} alt="LPR OUT" className="w-full h-auto rounded border-2 border-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="mt-6 flex justify-end">
                <Button size="large" type="primary" htmlType="submit" className="bg-red-500 hover:bg-red-400 border-none font-bold text-white" icon={<SendOutlined />}>
                  XÁC NHẬN & BẮN TÍN HIỆU RA (CHECK-OUT)
                </Button>
              </div>
            </Form>
          </Card>
        )}
      </div>
    );
  };

  React.useEffect(() => {
    if (floors.length > 0 && selectedFloorId === null) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const selectedGateId = Form.useWatch('gateId', form);
  const selectedGate = gates.find((g: any) => g.id === selectedGateId);

  React.useEffect(() => {
    if (selectedGate) {
      if (selectedGate.gateType === 'IN' || selectedGate.gateType === 'ENTRY') {
        form.setFieldValue('actionType', 'IN');
      } else if (selectedGate.gateType === 'OUT' || selectedGate.gateType === 'EXIT') {
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
      message.success('Successfully got RFID: ' + randomCard);
    } else {
      message.warning('No empty RFID card in inventory!');
    }
  };

  // API Mutations
  const triggerApiMutation = useMutation({
    mutationFn: async (values: any) => {
      const gate = gates.find((g: any) => g.id === values.gateId);
      const isOut = gate?.gateType === 'OUT' || gate?.gateType === 'EXIT' || (gate?.gateType === 'IN_OUT' && values.actionType === 'OUT');
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
      
      setLastPayload({
        method: "POST",
        url: url,
        data: payload
      });
      
      return axios.post(url, payload).then(res => res.data);
    },
    onSuccess: (_, variables) => {
      message.success(`[Gate ID ${variables.gateId}] API fired! Plate: ${variables.plate || 'N/A'}`);
      refetchSync();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Error calling IoT API');
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
      message.success(`Updated slot ID ${variables.id} to ${variables.status}`);
      refetchSync();
    },
    onError: () => {
      message.error('Error calling Sensor API');
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
      message.success('Successfully fast-forwarded system time!');
      refetchSync();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Error fast-forwarding time');
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
    message.info(`Copied: ${text}`);
  };

  // Table Columns
  const activeSessionsColumns = [
    { title: 'Biển số', dataIndex: 'plate', key: 'plate', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Slot', dataIndex: ['slot', 'slotName'], key: 'slotName', render: (text: string) => text || 'Không rõ' },
    { title: 'Time in', dataIndex: 'timeIn', key: 'timeIn', render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '' },
    { title: 'Loại xe', dataIndex: ['vehicleType', 'typeName'], key: 'vehicleType' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (text: string) => <Tag color="green">{text}</Tag> },
    { title: 'Action', key: 'action', render: (_: any, record: any) => <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(record.plate)}>Copy Plate</Button> }
  ];

  const reservationsColumns = [
    { title: 'Biển số', dataIndex: ['vehicle', 'plateNumber'], key: 'plate', render: (text: string) => <Tag color="orange">{text || 'Unknown'}</Tag> },
    { title: 'Zone', dataIndex: ['zone', 'zoneName'], key: 'zoneName', render: (text: string) => text || 'Không rõ' },
    { title: 'Expected Entry', dataIndex: 'expectedEntryTime', key: 'expectedEntryTime', render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '' },
    { title: 'Booking Fee', dataIndex: 'reservationFee', key: 'reservationFee', render: (text: number) => text ? `${text.toLocaleString()} VND` : '0 VND' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (text: string) => <Tag color={text === 'ACTIVE' ? 'blue' : 'orange'}>{text}</Tag> },
    { title: 'Action', key: 'action', render: (_: any, record: any) => <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(record.vehicle?.plateNumber)}>Copy Plate</Button> }
  ];

  const renderHardwareTab = () => {
    const currentPlate = Form.useWatch('plate', form);
    const customerType = Form.useWatch('customerType', form);

    const activeReservations = reservations.filter((r: any) => r.status === 'ACTIVE' || r.status === 'PENDING');
    const filteredReservations = activeReservations.filter((r: any) => {
        let match = true;
        if (filterPreBookedFloor) {
            match = match && r.zone?.floorId === filterPreBookedFloor;
        }
        if (filterPreBookedGate) {
           const gate = gates.find((g: any) => g.id === filterPreBookedGate);
           if (gate) match = match && r.zone?.floorId === gate.floorId;
        }
        return match;
    });

    let allowedGates = gates.filter((g: any) => g.gateType === 'IN' || g.gateType === 'IN_OUT' || g.gateType === 'ENTRY');
    // Filter by selected reservation floor
    if (customerType === 'PREBOOKED' && currentPlate) {
       const res = reservations.find((r: any) => r.vehicle?.plateNumber === currentPlate && (r.status === 'ACTIVE' || r.status === 'PENDING'));
       if (res && res.zone?.floorId) {
           allowedGates = allowedGates.filter((g: any) => g.floorId === res.zone.floorId);
       }
    }

    return (
    <Row gutter={16}>
      <Col span={14}>
        <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-blue-400 font-mono">Camera LPR & RFID Trigger</span>}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={values => {
                triggerApiMutation.mutate(values);
            }}
            initialValues={{ confidence: 95, actionType: 'IN' }}
          >
            <Form.Item name="customerType" hidden><Input /></Form.Item>
            
            <Form.Item name="gateId" label={<span className="text-gray-600">Gate</span>} rules={[{ required: true, message: 'Please select gate' }]}>
              <Select className="bg-gray-100 text-gray-800 border-none rounded" placeholder="-- Select Gate --" size="large">
                {allowedGates.map((g: any) => (
                  <Select.Option key={g.id} value={g.id}>
                    {g.gateName || g.name} ({g.gateType || g.type})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actionType" label={<span className="text-gray-600">Action</span>} initialValue="IN">
                  <Select 
                    className="bg-gray-100 text-gray-800 border-none rounded" size="large"
                    disabled={selectedGate && (selectedGate.gateType === 'IN' || selectedGate.gateType === 'ENTRY' || selectedGate.gateType === 'OUT' || selectedGate.gateType === 'EXIT')}
                  >
                    <Select.Option value="IN"><span className="text-blue-400 font-bold">Check-In</span></Select.Option>
                    <Select.Option value="OUT"><span className="text-red-400 font-bold">Check-Out (Ra)</span></Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="vehicleType" label={<span className="text-gray-600">Vehicle Type</span>} rules={[{ required: true, message: 'Please select Vehicle Type' }]}>
                  <Select className="bg-gray-100 text-gray-800 border-none rounded" placeholder="-- Select Vehicle Type --" size="large">
                    {availableVehicleTypes.map((v: any) => (
                      <Select.Option key={v.id} value={v.typeName}>
                        {v.typeName} ({v.category === 'FOUR_WHEEL' ? 'Car' : 'Motorbike'})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span className="text-gray-600">License Plate</span>}>
              <div className="flex gap-2">
                <Form.Item name="plate" noStyle>
                  <Input placeholder="51G-123.45" className="bg-gray-100 text-gray-800 border-gray-300 font-mono text-lg w-full" onChange={() => form.setFieldsValue({customerType: undefined})} />
                </Form.Item>
                <Button size="large" onClick={handleRandomPlate} className="bg-gray-200 text-gray-800 border-none shrink-0" icon={<SyncOutlined />}>Random</Button>
              </div>
            </Form.Item>

            <Form.Item label={<span className="text-gray-600">RFID Card (Optional)</span>}>
              <div className="flex gap-2">
                <Form.Item name="rfid" noStyle>
                  <Input placeholder="RFID-100001" className="bg-gray-100 text-gray-800 border-gray-300 font-mono text-lg w-full" />
                </Form.Item>
                <Button size="large" onClick={handleFetchRandomRFID} className="bg-gray-200 text-gray-800 border-none shrink-0" icon={<SyncOutlined />}>Get empty card</Button>
              </div>
            </Form.Item>

            <Form.Item name="confidence" label={<span className="text-gray-600">OCR Confidence Score</span>}>
              <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} className="mx-2" />
            </Form.Item>

            {previewImages.panorama && (
              <div className="mb-4 bg-slate-50 border-4 border-gray-200 rounded-xl overflow-hidden shadow-lg p-2 flex gap-2 h-48">
                <div className="flex-1 relative border-r-2 border-gray-200 h-full">
                  <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 uppercase tracking-widest">
                    Panorama Camera
                  </div>
                  <img src={previewImages.panorama} alt="Preview" className="w-full h-full object-cover opacity-90 rounded" />
                </div>
                <div className="w-1/3 h-full relative bg-gray-50 flex flex-col items-center justify-center p-2 rounded">
                  <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 uppercase tracking-widest">
                    LPR Crop
                  </div>
                  <div className="w-full aspect-[3/1] border-2 border-blue-500 rounded relative overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    <img src={previewImages.lpr!} alt="LPR Preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-gray-500 text-[9px] mt-2 font-bold tracking-widest uppercase">Mock LPR Snapshot</span>
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
      </Col>
      
      <Col span={10}>
          <Card className="bg-white border-gray-200 rounded-xl h-full shadow-lg" title={
            <div className="flex justify-between items-center">
              <span className="text-purple-500 font-mono">Guest Vehicle List</span>
              <Radio.Group value={vehicleListType} onChange={e => setVehicleListType(e.target.value)} size="small" buttonStyle="solid">
                <Radio.Button value="PREBOOKED">Reserved Vehicle</Radio.Button>
                <Radio.Button value="MONTHLY">Monthly Pass Vehicle</Radio.Button>
              </Radio.Group>
            </div>
          }>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Select placeholder="Filter by Floor" allowClear className="flex-1" value={filterPreBookedFloor} onChange={setFilterPreBookedFloor}>
                  {floors.map((f: any) => <Select.Option key={f.id} value={f.id}>{f.floorName}</Select.Option>)}
                </Select>
                <Select placeholder="Filter by Gate" allowClear className="flex-1" value={filterPreBookedGate} onChange={setFilterPreBookedGate}>
                  {gates.filter((g: any) => g.gateType === 'IN' || g.gateType === 'IN_OUT' || g.gateType === 'ENTRY').map((g: any) => <Select.Option key={g.id} value={g.id}>{g.gateName}</Select.Option>)}
                </Select>
              </div>

              <div className="overflow-y-auto max-h-[600px] border border-gray-200 rounded-lg p-2 bg-slate-50">
                {vehicleListType === 'PREBOOKED' ? (
                  filteredReservations.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No matching reserved vehicle</div>
                  ) : filteredReservations.map((r: any) => (
                    <div 
                      key={r.id} 
                      className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${currentPlate === r.vehicle?.plateNumber ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 bg-white'}`}
                      onClick={() => {
                        let randomCard = undefined;
                        if (availableCards.length > 0) {
                          randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                        }
                        form.setFieldsValue({
                          plate: r.vehicle?.plateNumber,
                          vehicleType: r.vehicle?.vehicleType?.typeName,
                          customerType: undefined,
                          rfid: randomCard,
                          gateId: undefined
                        });
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-purple-700 text-lg border border-purple-200 px-2 py-0.5 rounded bg-white shadow-sm">{r.vehicle?.plateNumber}</span>
                        <span className="text-xs text-blue-500 font-bold bg-blue-100 px-2 rounded-full">{r.vehicle?.vehicleType?.typeName}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1"><span className="font-bold">Guest:</span> {r.customer?.name || r.customer?.phone}</div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>Reserved zone: <b className="text-purple-600">{r.zone?.zoneName}</b></span>
                        <span>Floor: {floors.find((f: any) => f.id === r.zone?.floorId)?.floorName}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  monthlyTickets.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No monthly vehicle</div>
                  ) : monthlyTickets.map((m: any) => (
                    <div 
                      key={m.id} 
                      className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${currentPlate === m.plate ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 bg-white'}`}
                      onClick={() => {
                        let cardToUse = m.rfidCardId || undefined;
                        if (!cardToUse && availableCards.length > 0) {
                          cardToUse = availableCards[Math.floor(Math.random() * availableCards.length)];
                        }
                        form.setFieldsValue({
                          plate: m.plate,
                          vehicleType: m.vehicleType?.typeName,
                          customerType: undefined,
                          rfid: cardToUse,
                          gateId: undefined
                        });
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-purple-700 text-lg border border-purple-200 px-2 py-0.5 rounded bg-white shadow-sm">{m.plate}</span>
                        <span className="text-xs text-blue-500 font-bold bg-blue-100 px-2 rounded-full">{m.vehicleType?.typeName}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1"><span className="font-bold">Guest:</span> {m.customerName}</div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>Expiry: <b className="text-purple-600">{dayjs(m.validUntil).format('DD/MM/YYYY')}</b></span>
                        <span className="text-green-500 font-bold">Monthly Pass</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </Col>
    </Row>
    );
  };


  const renderSensorTab = () => {
    const activeFloor = floors.find((f: any) => f.id === selectedFloorId);
    const floorZones = zones.filter((z: any) => z.floorId === selectedFloorId);
    
    // Calculate grid scaling
    // We scale down the map so it fits nicely. For example 1 col = 30px
    const CELL_SIZE = 30;
    
    return (
      <Card className="bg-white border-gray-200 rounded-xl h-full min-h-[600px]" 
            title={
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 font-mono">Visual Sensor Map</span>
                <Select
                  className="w-48 bg-gray-100 text-gray-800 border-none rounded"
                  value={selectedFloorId}
                  onChange={(val) => setSelectedFloorId(val)}
                  options={floors.map((f: any) => ({ label: `${f.floorName} (${f.floorType})`, value: f.id }))}
                  placeholder="-- Select Floor --"
                />
              </div>
            }>
        
        <div className="mb-4 flex gap-4 text-sm text-gray-500">
          <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Occupied</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Available</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div> Reserved</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-gray-500 rounded-full mr-2 shadow-[0_0_8px_rgba(107,114,128,0.8)]"></div> Disabled</div>
        </div>
        
        <div className="overflow-auto bg-slate-50 border border-gray-200 p-4 rounded-xl flex items-start justify-start relative shadow-inner" style={{ minHeight: '500px', backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '20px 20px' }}>
          {activeFloor && (
            <div 
              className="relative bg-white border border-dashed border-gray-300 rounded"
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
                    className="absolute border border-gray-300 bg-gray-100/50 rounded flex items-center justify-center p-1"
                    style={{
                      left: zone.layoutX || 0,
                      top: zone.layoutY || 0,
                      width: zoneW,
                      height: zoneH,
                      transform: isRotated ? `rotate(${zone.rotation}deg)` : 'none',
                      transformOrigin: 'top left', // This matches Konva default origin roughly if layout X/Y are top-left
                    }}
                  >
                    <div className="absolute -top-6 left-0 text-blue-700 font-bold text-xs bg-white/80 px-1 rounded shadow-sm z-10 whitespace-nowrap">
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
                          bgColor = 'bg-gray-500/20 border-gray-300';
                          textColor = 'text-gray-500';
                        }

                        return (
                          <div 
                            key={slot.id}
                            onClick={() => toggleSlot(slot)}
                            className={`flex-1 border-2 m-[1px] rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:brightness-125 ${bgColor}`}
                          >
                            <span className={`font-bold text-[10px] ${textColor}`}>{slot.slotName}</span>
                            {slot.status === 'OCCUPIED' && slot.currentPlate && (
                              <span className="text-[9px] bg-black/60 px-1 rounded mt-1 text-white truncate max-w-full font-mono border border-gray-300">{slot.currentPlate}</span>
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
      <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-blue-400 font-mono">Active Parking Sessions</span>}>
        <div className="bg-slate-50 p-2 rounded-lg">
          <Table dataSource={activeSessions} columns={activeSessionsColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: true }} />
        </div>
      </Card>
      
      <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-orange-400 font-mono">Reservations</span>}>
        <div className="bg-slate-50 p-2 rounded-lg">
          <Table dataSource={reservations} columns={reservationsColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: true }} />
        </div>
      </Card>
    </div>
  );

  const renderTimeControllerTab = () => (
    <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-purple-400 font-mono">System Time Controller</span>}>
      <div className="mb-8 bg-slate-50 p-6 rounded-lg text-center border border-gray-300 shadow-inner">
        <Text className="text-gray-500 block mb-2 text-lg">Current System Virtual Time</Text>
        <Title level={1} className="!text-purple-400 m-0 font-mono tracking-widest">{currentTime}</Title>
      </div>

      <Form form={timeForm} layout="vertical" onFinish={values => timeTravelMutation.mutate(values)}>
        <Form.Item name="targetTime" label={<span className="text-gray-600 text-base">Select Fast-Forward Target</span>} rules={[{ required: true, message: 'Please select target time' }]}>
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
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      {/* FLOATING DEBUG LOG PANEL */}
      <div className={`fixed top-4 right-4 ${debugMinimized ? 'w-auto' : 'w-96'} max-h-[80vh] bg-black/80 text-green-400 font-mono text-[10px] p-3 overflow-y-auto z-[9999] rounded border border-green-500/50 shadow-2xl flex flex-col gap-2 transition-all`}>
        <div className="flex justify-between items-center border-b border-gray-600 pb-1 mb-1">
          <div className="text-white font-bold">⚙️ DEBUG LOGS (Sent)</div>
          <Button 
            type="text" 
            size="small" 
            className="text-white hover:text-green-400 p-0 h-auto"
            onClick={() => setDebugMinimized(!debugMinimized)}
          >
            {debugMinimized ? '[+] Expand' : '[-] Collapse'}
          </Button>
        </div>
        {!debugMinimized && (
          <div className="flex flex-col gap-2">
            {lastPayload ? (
              <div className="pt-1">
                <div className="text-yellow-400 font-bold mb-1">RAW JSON PAYLOAD:</div>
                <pre className="text-[12px] text-blue-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(lastPayload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 italic">No API requests made yet...</div>
            )}
          </div>
        )}
      </div>

      <div className="min-h-screen bg-slate-50 text-gray-800 p-8 font-mono">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 border-b border-gray-200 pb-4">
            <Title level={2} className="m-0 text-green-400 flex items-center font-mono">
              <ApiOutlined className="mr-3" /> Hardware Simulation Terminal (IoT Mock)
            </Title>
            <Text className="text-gray-500 font-mono mt-2 block">
              Công cụ chuyên dụng để mô phỏng sự kiện phần cứng, thiết lập trạng thái cảm biến và điều hướng thời gian toàn hệ thống.
            </Text>
          </div>

          <Tabs 
            defaultActiveKey="1"
            type="card"
            className="iot-tabs [&_.ant-tabs-nav::before]:border-gray-200 [&_.ant-tabs-tab]:bg-white [&_.ant-tabs-tab]:border-gray-200 [&_.ant-tabs-tab]:text-gray-500 [&_.ant-tabs-tab-active]:bg-slate-50 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-blue-400 [&_.ant-tabs-tab-active]:!border-b-transparent"
            items={[
              {
                key: '1',
                label: <span className="font-bold text-sm px-2"><ApiOutlined /> Trigger Camera & Gate Signal</span>,
                children: <div className="pt-4">{renderHardwareTab()}</div>
              },
              {
                key: '2',
                label: <span className="font-bold text-sm px-2"><SendOutlined /> Sensor Map</span>,
                children: <div className="pt-4">{renderSensorTab()}</div>
              },
              {
                key: '3',
                label: <span className="font-bold text-sm px-2"><ApiOutlined /> Real-time Data Stream</span>,
                children: <div className="pt-4">{renderDataTab()}</div>
              },
              {
                key: '4',
                label: <span className="font-bold text-sm px-2"><ClockCircleOutlined /> Fast-Forward Time</span>,
                children: <div className="pt-4">{renderTimeControllerTab()}</div>
              },
              {
                key: '5',
                label: <span className="font-bold text-sm px-2 text-red-400"><FastForwardOutlined /> Interactive Check-Out</span>,
                children: <div className="pt-4">{renderInteractiveCheckoutTab()}</div>
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
