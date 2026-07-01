import { simulatedDayjs, useSystemTime, useSimulatedOffset, refreshSimulatedOffset } from '../../core/utils/timeProvider';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, DatePicker, message, Spin, Radio, Input, Modal, QRCode, Alert } from 'antd';
import { CarOutlined, CreditCardOutlined, CalendarOutlined, CheckCircleOutlined, EnvironmentOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { getImageUrl } from '../../core/utils/imageHelper';

const { Title, Text } = Typography;

const GATEWAYS = [
  { id: 'PAYPAL', name: 'PayPal', icon: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg' },
  { id: 'PAYOS', name: 'PayOS (VietQR)', icon: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg' }
];

export const PreBookingScreen = () => {
  const navigate = useNavigate();
  
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  
  const [arrivalTime, setArrivalTime] = useState<dayjs.Dayjs>(simulatedDayjs().add(30, 'minute'));
  const [endTime, setEndTime] = useState<dayjs.Dayjs>(simulatedDayjs().add(2, 'hour').add(30, 'minute'));
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

  // Automatically adjust time if system offset syncs after page load
  const systemOffset = useSimulatedOffset();
  useEffect(() => {
    refreshSimulatedOffset();
  }, []);

  // Fetch System Configs
  const { data: configsData } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/system/configs');
        return res.data.data;
      } catch (err) {
        return null;
      }
    }
  });

  const { data: earlyMinsData } = useQuery({
    queryKey: ['public-config-early-mins'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/public/config/RESERVATION_EARLY_MINS');
        return parseInt(res.data.data, 10);
      } catch (err) {
        return 30;
      }
    }
  });

  const earlyMins = React.useMemo(() => {
    if (earlyMinsData !== undefined) return earlyMinsData;
    if (!configsData) return 30;
    const config = configsData.find((c: any) => c.configKey === 'RESERVATION_EARLY_MINS');
    return config && config.configValue ? parseInt(config.configValue, 10) : 30;
  }, [configsData, earlyMinsData]);

  useEffect(() => {
    // If the offset changes (e.g., initial fetch from server), update the selected times
    setArrivalTime(simulatedDayjs().add(earlyMins, 'minute'));
    setEndTime(simulatedDayjs().add(2, 'hour').add(earlyMins, 'minute'));
  }, [systemOffset, earlyMins]);

  const addDebugLog = (type: string, data: any) => {
    setDebugLogs(prev => [...prev, { time: dayjs().format('HH:mm:ss'), type, data }]);
  };
  
  const [selectedGateway, setSelectedGateway] = useState<string>('PAYPAL');
  
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(900);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentQrCode, setPaymentQrCode] = useState<string>('');
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');

  // Fetch Vehicle Types
  const { data: vehicleTypesData } = useQuery({
    queryKey: ['vehicle-types', 'public'],
    queryFn: async () => {
      const res = await axiosClient.get('/public/vehicle-types?activeOnly=true');
      return res.data.data;
    }
  });
  const VEHICLES = vehicleTypesData || [];



  // Fetch Zones
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'map'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/zones/map');
      return res.data.data;
    }
  });

  const allZones = zonesData || [];
  const vehicleType = VEHICLES.find((v: any) => v.id === selectedVehicle)?.typeName;
  const filteredZones = allZones.filter((z: any) => {
    if (z.functionType !== 'WALK_IN') return false;
    if (!selectedVehicle) return true;
    if (z.vehicleTypeId) return z.vehicleTypeId === selectedVehicle;
    // Fallback if backend hasn't been restarted yet and vehicleTypeId is missing
    return z.vehicleType === vehicleType || (z.vehicleType && vehicleType && z.vehicleType.substring(0, 3) === vehicleType.substring(0, 3));
  });

  const durationMinutes = Math.max(1, Math.ceil(endTime.diff(arrivalTime, 'minute', true)));

  // Calculate Fee from DB
  const { data: feeData, isFetching: isFeeLoading } = useQuery({
    queryKey: ['preview-price', selectedVehicle, durationMinutes, arrivalTime.format('YYYY-MM-DDTHH:mm:ss')],
    queryFn: async () => {
      if (!selectedVehicle) return 0;
      // Calculate estimated fee from pricing engine
      try {
        const res = await axiosClient.post('/customer/reservations/preview', {
          vehicleTypeId: selectedVehicle,
          expectedEntryTime: arrivalTime.format('YYYY-MM-DDTHH:mm:00'),
          expectedDurationMinutes: durationMinutes
        });
        return res.data.data || 0;
      } catch (err) {
        console.error("Failed to fetch price preview", err);
        return 0;
      }
    },
    enabled: !!selectedVehicle && durationMinutes > 0,
  });

  const totalFee = feeData || 0;

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicleTypeId: selectedVehicle,
        plateNumber: plateNumber,
        zoneId: selectedZone,
        expectedEntryTime: arrivalTime.format('YYYY-MM-DDTHH:mm:00'),
        expectedDurationMinutes: durationMinutes
      };
      addDebugLog('REQUEST', payload);
      const res = await axiosClient.post('/customer/reservations', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      addDebugLog('SUCCESS', data);
      setCountdown(5);
      setIsPaymentSuccess(true);
      message.success('Payment Success! Your place has been reserved');
      setTimeout(() => {
        navigate('/customer/my-parking?tab=booking');
      }, 2000);
    },
    onError: (err: any) => {
      addDebugLog('ERROR', err.response?.data || err.message);
      message.error(err.response?.data?.message || 'an error occurred when creating a booking');
      setIsQRModalVisible(false);
    }
  });

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/payments/generate-link', {
        amount: totalFee,
        gateway: selectedGateway
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setPaymentUrl(data.paymentUrl);
      setPaymentQrCode(data.qrCode || '');
      if (selectedGateway === 'PAYPAL') {
        const urlParams = new URL(data.paymentUrl).searchParams;
        setPaymentOrderId(urlParams.get('token') || '');
      } else if (selectedGateway === 'PAYOS') {
        setPaymentOrderId(data.orderId || '');
      } else {
        setPaymentOrderId(data.paymentUrl.split('/').pop() || '');
      }
    },
    onError: () => {
      message.error('Error when creating payment link');
      setIsQRModalVisible(false);
    }
  });

  const handleConfirm = () => {
    if (!selectedVehicle) return message.error('Please select Vehicle type');
    if (!plateNumber) return message.error('Please enter vehicle License Plate');
    if (!selectedZone) return message.error('Please select Parking Zone');
    if (arrivalTime.isBefore(simulatedDayjs().add(earlyMins - 1, 'minute'))) return message.error(`Estimated arrival time must be at least ${earlyMins} minutes later than current time`);
    if (endTime.isBefore(arrivalTime)) return message.error('Exit Time must be after Entry Time');
    
    setIsQRModalVisible(true);
    setIsPaymentSuccess(false);
    setPaymentUrl('');
    setPaymentOrderId('');
    setCountdown(900);
    generateLinkMutation.mutate();
  };

  useEffect(() => {
    let timer: any;
    if (isQRModalVisible && !isPaymentSuccess && paymentOrderId) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(c => c - 1);
          if (countdown % 3 === 0) {
            const captureUrl = selectedGateway === 'PAYOS' ? '/payments/payos/capture' : '/payments/paypal/capture';
            axiosClient.post(captureUrl, { token: paymentOrderId })
              .then(res => {
                if (res.data?.data?.status === 'COMPLETED') {
                  createBookingMutation.mutate();
                }
              })
              .catch(() => {});
          }
        }, 1000);
      } else {
        setIsQRModalVisible(false);
        message.warning('Waiting time for payment is over');
      }
    }
    return () => clearTimeout(timer);
  }, [isQRModalVisible, isPaymentSuccess, paymentOrderId, countdown]);
  
  // Debug: System Time
  const currentSystemTime = useSystemTime();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-10">
      
      {/* System Time Debugger */}
      <div className="hidden fixed bottom-4 left-4 z-50 bg-slate-900/90 text-green-400 font-mono p-3 rounded-lg shadow-lg border border-green-500/30 backdrop-blur-md pointer-events-auto max-h-[50vh] overflow-y-auto w-80">
        <div className="text-[10px] text-green-500/70 mb-1 font-bold uppercase tracking-wider">⏱ System Time (Debug)</div>
        <div className="text-base font-bold mb-3 pb-2 border-b border-green-500/30">{currentSystemTime.format('DD/MM/YYYY HH:mm:ss')}</div>
        
        <div className="text-[10px] text-blue-400/70 mb-1 font-bold uppercase tracking-wider">📝 Booking Logs</div>
        {debugLogs.length === 0 ? (
          <div className="text-xs text-slate-500 italic">None log...</div>
        ) : (
          <div className="space-y-2">
            {debugLogs.map((log, idx) => (
              <div key={idx} className="bg-black/40 p-2 rounded text-[10px] break-words">
                <span className="text-slate-400">[{log.time}]</span>{' '}
                <span className={log.type === 'ERROR' ? 'text-red-400' : log.type === 'SUCCESS' ? 'text-green-400' : 'text-blue-400'}>{log.type}</span>:
                <pre className="mt-1 text-slate-300 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <Title level={3} className="m-0 text-slate-800 text-xl md:text-2xl">Pre-Booking</Title>
        <Text type="secondary" className="text-slate-500 text-sm">Reserve your spot in advance to ensure there is always a parking spot at PBMS</Text>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 mt-2 md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          
          <Card title={<><CarOutlined className="mr-2 text-blue-500"/>1e Vehicle Information</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Vehicle Type:</Text>
              <div className="grid grid-cols-2 gap-4">
                {VEHICLES.map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setSelectedZone(null); }}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedVehicle === v.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                  >
                    {v.iconUrl ? <img src={getImageUrl(v.iconUrl)} className="h-10 mb-2 object-contain" /> : <CarOutlined className="text-3xl mb-2" />}
                    <span className="font-bold text-lg">{v.typeName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Text className="block font-bold mb-2 text-slate-700">License Plate xe:</Text>
              <Input 
                size="large" 
                prefix={<NumberOutlined className="text-slate-400" />}
                placeholder="For example: 51H-123e45" 
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                className="rounded-lg h-12 text-lg font-mono font-bold uppercase"
              />
            </div>
          </Card>

          <Card title={<><CalendarOutlined className="mr-2 text-green-500"/>2e Parking time</>} className="shadow-sm rounded-xl border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <div>
                  <Text className="block font-bold mb-2 text-slate-700">Expected arrival:</Text>
                  <DatePicker 
                    showTime 
                    format="HH:mm DD/MM/YYYY" 
                    value={arrivalTime}
                    onChange={(val) => val && setArrivalTime(val)} 
                    className="w-full h-12 rounded-lg" 
                    minDate={simulatedDayjs().add(30, 'minute')}
                  />
                </div>
                <div>
                <Text className="block font-bold mb-2 text-slate-700">Expected to pick up the car:</Text>
                <DatePicker 
                  showTime 
                  format="HH:mm DD/MM/YYYY" 
                  value={endTime}
                  onChange={(val) => val && setEndTime(val)} 
                  className="w-full h-12 rounded-lg" 
                  minDate={arrivalTime}
                />
              </div>
            </div>
          </Card>

          <Card title={<><EnvironmentOutlined className="mr-2 text-orange-500"/>3e Select Zone</>} className="shadow-sm rounded-xl border-slate-200">
            {!selectedVehicle ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Text className="text-slate-400">Please select the Vehicle type first to see the Zonee list</Text>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredZones.map((z: any) => {
                    const isFull = (z.availableSlots || 0) <= 0;
                    return (
                      <div
                        key={z.id || Math.random()}
                        onClick={() => {
                          if (!isFull) setSelectedZone(z.id);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isFull ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' :
                          selectedZone === z.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Text strong className={`text-base ${selectedZone === z.id ? 'text-orange-700' : 'text-slate-700'}`}>{z.name}</Text>
                          {isFull && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">BOOKED</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${(((z.capacity || 1) - (z.availableSlots || 0)) / (z.capacity || 1)) * 100}%` }}
                            />
                          </div>
                          <Text className="text-xs font-bold whitespace-nowrap">Drum {z.availableSlots}/{z.capacity}</Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedZone && (
                  <div className="mt-4">
                    <Alert 
                      message="Entry Gate Notice" 
                      description={`The selected zone is located on ${allZones.find((z: any) => z.id === selectedZone)?.floorName}. Please ensure you use the correct entry gate designated for this floor when arriving.`} 
                      type="warning" 
                      showIcon 
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card title="Booking Summary" className="shadow-lg rounded-xl border-slate-200 overflow-hidden" headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Space direction="vertical" className="w-full" size="middle">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Vehicle Type:</Text>
                  <Text strong className="text-slate-800">{VEHICLES.find((v: any) => v.id === selectedVehicle)?.typeName || '---'}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">License Plate:</Text>
                  <Text strong className="text-slate-800 font-mono">{plateNumber || '---'}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Zone (Zone):</Text>
                  <Text strong className="text-slate-800 text-right max-w-[150px]">{allZones.find((z: any) => z.id === selectedZone)?.name || '---'}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Expected on:</Text>
                  <Text strong className="text-slate-800">{arrivalTime.format('HH:mm DD/MM/YYYY')}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Expected release:</Text>
                  <Text strong className="text-slate-800">{endTime.format('HH:mm DD/MM/YYYY')}</Text>
                </div>
                <div className="flex justify-between pb-1">
                  <Text className="text-slate-500">Total provisional fee:</Text>
                  {isFeeLoading ? <Spin size="small" /> : <Text strong className="text-xl text-blue-600 font-bold">{totalFee.toLocaleString()}  VND</Text>}
                </div>
              </Space>
            </Card>

            <Card title={<><CreditCardOutlined className="mr-2 text-purple-500"/>Payment method</>} className="shadow-sm rounded-xl border-slate-200">
              <Radio.Group 
                onChange={e => setSelectedGateway(e.target.value)} 
                value={selectedGateway}
                className="w-full flex flex-col space-y-3"
              >
                {GATEWAYS.map(gw => (
                  <Radio.Button 
                    key={gw.id} 
                    value={gw.id}
                    className={`h-16 flex items-center px-4 rounded-xl border-2 transition-all ${selectedGateway === gw.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <img src={gw.icon} alt={gw.name} className="h-6 object-contain" />
                      <span className="font-bold text-slate-700">{gw.name}</span>
                    </div>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Card>

            <Button 
              type="primary" 
              size="large" 
              block 
              className="h-14 text-lg font-bold shadow-md"
              onClick={handleConfirm}
            >
              Confirm & Payment
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={isQRModalVisible}
        footer={null}
        closable={!isPaymentSuccess}
        onCancel={() => !isPaymentSuccess && setIsQRModalVisible(false)}
        centered
        maskClosable={false}
        width={400}
      >
        <div className="text-center py-6">
          {!isPaymentSuccess ? (
            <>
              <Title level={4} className="mb-2 text-slate-800">Scan QR code to pay</Title>
              <Text className="block mb-2 text-slate-500">Use the Camera or Zalo application to scan the code</Text>
              <Text className="block mb-6 text-orange-600 font-bold">After making payment on Success on your phone, please keep this screen intact so that the System will automatically confirm</Text>
              
              <div className="relative inline-block mb-6">
                <div className="bg-white p-4 border-2 border-dashed border-slate-300 rounded-2xl shadow-sm relative z-10 flex justify-center items-center h-[240px] w-[240px]">
                  {paymentUrl ? <QRCode value={selectedGateway === 'PAYOS' && paymentQrCode ? paymentQrCode : paymentUrl} size={200} /> : <Spin size="large" />}
                </div>
                {/* Scanning animation line */}
                <style>
                  {`
                    @keyframes scan {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(220px); }
                      100% { transform: translateY(0); }
                    }
                  `}
                </style>
                {paymentUrl && <div className="absolute top-2 left-2 w-[calc(100%-16px)] h-1 bg-green-500 shadow-[0_0_15px_#22c55e] z-20" style={{ animation: 'scan 2s ease-in-out infinite' }}></div>}
              </div>
              
              <div className="text-2xl font-black text-blue-600 mb-2">{totalFee.toLocaleString()} VND</div>
              
              <div className="mb-6">
                {paymentUrl ? (
                  <Button type="primary" size="large" href={paymentUrl} target="_blank" className={`w-full ${selectedGateway === 'PAYOS' ? 'bg-[#1890ff] hover:bg-[#096dd9]' : 'bg-[#0070ba] hover:bg-[#003087]'} border-none font-bold flex items-center justify-center`}>
                    {selectedGateway === 'PAYOS' ? 'Pay with PayOS' : 'Payment directly by PayPal'}
                  </Button>
                ) : (
                  <Button disabled size="large" className="w-full">Creating payment linkeee</Button>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Spin size="small" />
                <Text>Awaiting payment ({Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')})...</Text>
              </div>
            </>
          ) : (
            <div className="animate-fade-in py-8">
              <CheckCircleOutlined className="text-[80px] text-green-500 mb-6" />
              <Title level={3} className="text-slate-800">Payment Success!</Title>
              <Text className="block text-slate-500 mb-2">Your parking space has been recorded by the System</Text>
              <Text className="block text-slate-500">Moving back to Managementeee page</Text>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
