import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, DatePicker, message, Spin, Radio, Input, Modal, QRCode } from 'antd';
import { CarOutlined, CreditCardOutlined, CalendarOutlined, CheckCircleOutlined, EnvironmentOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

const VEHICLES = [
  { id: 1, type: 'CAR', name: 'Ô tô' },
  { id: 2, type: 'MOTORBIKE', name: 'Xe máy' }
];

const GATEWAYS = [
  { id: 'PAYPAL', name: 'PayPal Sandbox', icon: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg' },
  { id: 'PAYOS', name: 'PayOS', icon: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg' }
];

export const PreBookingScreen = () => {
  const navigate = useNavigate();
  
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  
  const [arrivalTime, setArrivalTime] = useState<dayjs.Dayjs>(dayjs());
  const [endTime, setEndTime] = useState<dayjs.Dayjs>(dayjs().add(2, 'hour'));
  
  const [selectedGateway, setSelectedGateway] = useState<string>('PAYPAL');
  
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');

  // Fetch Zones
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'map'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/zones/map');
      return res.data.data;
    }
  });

  const allZones = zonesData || [];
  const vehicleType = VEHICLES.find(v => v.id === selectedVehicle)?.type;
  const filteredZones = allZones.filter((z: any) => !vehicleType || z.vehicleType === vehicleType);

  const durationMinutes = Math.max(1, Math.ceil(endTime.diff(arrivalTime, 'minute', true)));

  // Calculate Fee from DB
  const { data: feeData, isFetching: isFeeLoading } = useQuery({
    queryKey: ['preview-price', selectedVehicle, durationMinutes],
    queryFn: async () => {
      if (!selectedVehicle) return 0;
      // Tính phí tạm tính từ pricing engine
      try {
        const res = await axiosClient.post('/customer/reservations/preview', {
          vehicleTypeId: selectedVehicle,
          expectedDurationMinutes: durationMinutes
        });
        return res.data.data || 0;
      } catch {
        // Fallback: tính tạm theo công thức đơn giản nếu endpoint chưa có
        return Math.ceil(durationMinutes / 60) * (selectedVehicle === 1 ? 15000 : 5000);
      }
    },
    enabled: !!selectedVehicle && durationMinutes > 0,
  });

  const totalFee = feeData || 0;

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/customer/reservations', {
        vehicleTypeId: selectedVehicle,
        plateNumber: plateNumber,
        zoneId: selectedZone,
        expectedEntryTime: arrivalTime.format('YYYY-MM-DDTHH:mm:ss'),
        expectedDurationMinutes: durationMinutes
      });
      return res.data.data;
    },
    onSuccess: () => {
      setCountdown(5);
      setIsPaymentSuccess(true);
      message.success('Thanh toán thành công! Chỗ của bạn đã được giữ.');
      setTimeout(() => {
        navigate('/customer/my-parking?tab=booking');
      }, 2000);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo Đặt chỗ');
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
      if (selectedGateway === 'PAYPAL') {
        const urlParams = new URL(data.paymentUrl).searchParams;
        setPaymentOrderId(urlParams.get('token') || '');
      } else {
        setPaymentOrderId(data.paymentUrl.split('/').pop() || '');
      }
    },
    onError: () => {
      message.error('Lỗi khi tạo link thanh toán');
      setIsQRModalVisible(false);
    }
  });

  const handleConfirm = () => {
    if (!selectedVehicle) return message.error('Vui lòng chọn loại phương tiện');
    if (!plateNumber) return message.error('Vui lòng nhập biển số xe');
    if (!selectedZone) return message.error('Vui lòng chọn khu vực đỗ');
    if (endTime.isBefore(arrivalTime)) return message.error('Thời gian ra phải sau thời gian vào');
    
    setIsQRModalVisible(true);
    setIsPaymentSuccess(false);
    setPaymentUrl('');
    setPaymentOrderId('');
    setCountdown(60);
    generateLinkMutation.mutate();
  };

  useEffect(() => {
    let timer: any;
    if (isQRModalVisible && !isPaymentSuccess && paymentOrderId) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(c => c - 1);
          if (countdown % 3 === 0) {
            axiosClient.post('/payments/paypal/capture', { token: paymentOrderId })
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
        message.warning('Hết thời gian chờ thanh toán.');
      }
    }
    return () => clearTimeout(timer);
  }, [isQRModalVisible, isPaymentSuccess, paymentOrderId, countdown]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-10">
      <div className="p-4 md:p-6 bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <Title level={3} className="m-0 text-slate-800 text-xl md:text-2xl">Đặt Chỗ Trước (Pre-Booking)</Title>
        <Text type="secondary" className="text-slate-500 text-sm">Giữ chỗ trước để đảm bảo luôn có vị trí đỗ xe tại PBMS</Text>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 mt-2 md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          
          <Card title={<><CarOutlined className="mr-2 text-blue-500"/>1. Thông tin phương tiện</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Loại phương tiện:</Text>
              <div className="grid grid-cols-2 gap-4">
                {VEHICLES.map(v => (
                  <div
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setSelectedZone(null); }}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedVehicle === v.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                  >
                    <CarOutlined className="text-3xl mb-2" />
                    <span className="font-bold text-lg">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Text className="block font-bold mb-2 text-slate-700">Biển số xe:</Text>
              <Input 
                size="large" 
                prefix={<NumberOutlined className="text-slate-400" />}
                placeholder="Ví dụ: 51H-123.45" 
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                className="rounded-lg h-12 text-lg font-mono font-bold uppercase"
              />
            </div>
          </Card>

          <Card title={<><CalendarOutlined className="mr-2 text-green-500"/>2. Thời gian gửi xe</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Dự kiến đến:</Text>
                <DatePicker 
                  showTime 
                  format="HH:mm DD/MM/YYYY" 
                  value={arrivalTime}
                  onChange={(val) => val && setArrivalTime(val)} 
                  className="w-full h-12 rounded-lg" 
                  minDate={dayjs()}
                />
              </div>
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Dự kiến lấy xe ra:</Text>
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

          <Card title={<><EnvironmentOutlined className="mr-2 text-orange-500"/>3. Chọn khu vực (Zone)</>} className="shadow-sm rounded-xl border-slate-200">
            {!selectedVehicle ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Text className="text-slate-400">Vui lòng chọn loại phương tiện trước để xem danh sách khu vực.</Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredZones.map((z: any) => {
                  const isFull = z.availableSlots === 0;
                  return (
                    <div
                      key={z.id}
                      onClick={() => !isFull && setSelectedZone(z.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isFull ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' :
                        selectedZone === z.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Text strong className={`text-base ${selectedZone === z.id ? 'text-orange-700' : 'text-slate-700'}`}>{z.name}</Text>
                        {isFull && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">KÍN CHỖ</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${((z.capacity - z.availableSlots) / z.capacity) * 100}%` }}
                          />
                        </div>
                        <Text className="text-xs font-bold whitespace-nowrap">Trống {z.availableSlots}/{z.capacity}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card title="Tóm tắt Đơn Đặt Chỗ" className="shadow-lg rounded-xl border-slate-200 overflow-hidden" headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Space direction="vertical" className="w-full" size="middle">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Loại xe:</Text>
                  <Text strong className="text-slate-800">{VEHICLES.find(v => v.id === selectedVehicle)?.name || '---'}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Biển số:</Text>
                  <Text strong className="text-slate-800 font-mono">{plateNumber || '---'}</Text>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Khu vực (Zone):</Text>
                  <Text strong className="text-slate-800 text-right max-w-[150px]">{allZones.find((z: any) => z.id === selectedZone)?.name || '---'}</Text>
                </div>
                <div className="flex justify-between pb-1">
                  <Text className="text-slate-500">Tổng phí tạm tính:</Text>
                  {isFeeLoading ? <Spin size="small" /> : <Text strong className="text-xl text-blue-600 font-bold">{totalFee.toLocaleString()} VNĐ</Text>}
                </div>
              </Space>
            </Card>

            <Card title={<><CreditCardOutlined className="mr-2 text-purple-500"/>Phương thức thanh toán</>} className="shadow-sm rounded-xl border-slate-200">
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
              onClick={handleConfirm}
            >
              Xác nhận & Thanh toán
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
              <Title level={4} className="mb-2 text-slate-800">Quét mã QR để thanh toán</Title>
              <Text className="block mb-6 text-slate-500">Mở ứng dụng Ngân hàng hoặc Ví điện tử</Text>
              
              <div className="relative inline-block mb-6">
                <div className="bg-white p-4 border-2 border-dashed border-slate-300 rounded-2xl shadow-sm relative z-10 flex justify-center items-center h-[240px] w-[240px]">
                  {paymentUrl ? <QRCode value={paymentUrl} size={200} /> : <Spin size="large" />}
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
              <Text className="block text-slate-500 mb-6 font-mono bg-slate-100 py-2 rounded-lg break-all px-2 text-xs">
                {selectedGateway === 'PAYPAL' ? (
                  <a href={paymentUrl} target="_blank" rel="noreferrer">Mở PayPal Checkout</a>
                ) : (
                  <a href={paymentUrl} target="_blank" rel="noreferrer">Mở PayOS Checkout</a>
                )}
              </Text>
              
              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Spin size="small" />
                <Text>Đang chờ thanh toán ({countdown}s)...</Text>
              </div>
            </>
          ) : (
            <div className="animate-fade-in py-8">
              <CheckCircleOutlined className="text-[80px] text-green-500 mb-6" />
              <Title level={3} className="text-slate-800">Thanh toán thành công!</Title>
              <Text className="block text-slate-500 mb-2">Chỗ đỗ xe của bạn đã được hệ thống ghi nhận.</Text>
              <Text className="block text-slate-500">Đang chuyển về trang quản lý...</Text>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
