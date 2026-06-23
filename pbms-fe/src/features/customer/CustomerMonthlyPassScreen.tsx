import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, DatePicker, message, Spin, Radio, Input, Modal, Row, Col, QRCode } from 'antd';
import { IdcardOutlined, CarOutlined, CreditCardOutlined, CheckCircleOutlined, UserOutlined, CalendarOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../../core/store/useAuthStore';

const { Title, Text } = Typography;

const VEHICLES = [
  { id: 'CAR', name: 'Ô tô', pricePerMonth: 1000000 },
  { id: 'MOTORBIKE', name: 'Xe máy', pricePerMonth: 150000 }
];

const PACKAGES = [
  { id: 1, name: '1 Tháng', discount: 0 },
  { id: 3, name: '3 Tháng', discount: 0.05 }, // 5% off
  { id: 6, name: '6 Tháng', discount: 0.10 }, // 10% off
  { id: 12, name: '12 Tháng', discount: 0.15 }, // 15% off
];

const GATEWAYS = [
  { id: 'PAYPAL', name: 'PayPal Sandbox', icon: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg' },
  { id: 'PAYOS', name: 'PayOS', icon: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg' }
];

export const CustomerMonthlyPassScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [fullName, setFullName] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState<dayjs.Dayjs>(dayjs());
  
  const [selectedGateway, setSelectedGateway] = useState<string>('PAYPAL');
  
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');

  // Auto fill name if available from store
  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  // Calculate fee
  const vehicleConfig = VEHICLES.find(v => v.id === selectedVehicle);
  const packageConfig = PACKAGES.find(p => p.id === selectedDuration);
  
  const baseFee = (vehicleConfig?.pricePerMonth || 0) * selectedDuration;
  const discountAmount = baseFee * (packageConfig?.discount || 0);
  const totalFee = baseFee - discountAmount;

  const endDate = startDate.add(selectedDuration, 'month');

  const createPassMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/operation/monthly-tickets', {
        vehicleTypeId: selectedVehicle,
        plateNumber: plateNumber,
        duration: selectedDuration
      });
      return res.data;
    },
    onSuccess: () => {
      setCountdown(5);
      setIsPaymentSuccess(true);
      message.success('Thanh toán thành công! Vé tháng của bạn đã được kích hoạt.');
      setTimeout(() => {
        navigate('/customer/my-parking?tab=monthly');
      }, 2000);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi đăng ký vé tháng');
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
    if (!fullName.trim()) return message.error('Vui lòng nhập Họ và Tên');
    if (!selectedVehicle) return message.error('Vui lòng chọn loại phương tiện');
    if (!plateNumber.trim()) return message.error('Vui lòng nhập biển số xe');
    if (!startDate) return message.error('Vui lòng chọn ngày bắt đầu hiệu lực');
    
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
                  createPassMutation.mutate();
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
        <Title level={3} className="m-0 text-slate-800 flex items-center text-xl md:text-2xl">
          <IdcardOutlined className="mr-3 text-blue-600" /> Đăng ký Vé Tháng
        </Title>
        <Text type="secondary" className="text-slate-500 text-sm md:text-base">Đăng ký giữ chỗ đỗ xe dài hạn với nhiều ưu đãi hấp dẫn</Text>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 mt-2 md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Thông tin cá nhân */}
          <Card title={<><UserOutlined className="mr-2 text-blue-500"/>1. Thông tin chủ vé</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Họ và tên:</Text>
                <Input 
                  size="large" 
                  placeholder="Nhập họ và tên" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="rounded-lg h-12"
                />
              </div>
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Email nhận hóa đơn:</Text>
                <Input 
                  size="large" 
                  value={user?.username || 'khachhang@example.com'}
                  disabled
                  className="rounded-lg h-12 bg-slate-100 text-slate-500"
                />
                <Text className="text-xs text-slate-400 mt-1 block">Email được lấy tự động từ tài khoản đăng nhập</Text>
              </div>
            </div>
          </Card>

          {/* 2. Thông tin phương tiện */}
          <Card title={<><CarOutlined className="mr-2 text-green-500"/>2. Phương tiện đăng ký</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Loại phương tiện:</Text>
              <div className="grid grid-cols-2 gap-4">
                {VEHICLES.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedVehicle === v.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white hover:border-green-300'}`}
                  >
                    <CarOutlined className="text-3xl mb-2" />
                    <span className="font-bold text-lg mb-1">{v.name}</span>
                    <span className="text-sm text-slate-500">{v.pricePerMonth.toLocaleString()} ₫/tháng</span>
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

          {/* 3. Thời hạn & Ngày bắt đầu */}
          <Card title={<><CalendarOutlined className="mr-2 text-orange-500"/>3. Gói Vé Tháng & Hiệu lực</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Chọn gói thời gian:</Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PACKAGES.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedDuration(p.id)}
                    className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedDuration === p.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white hover:border-orange-300'}`}
                  >
                    {p.discount > 0 && (
                      <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        -{p.discount * 100}%
                      </div>
                    )}
                    <span className="font-bold text-base">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Text className="block font-bold mb-2 text-slate-700">Ngày bắt đầu hiệu lực:</Text>
              <DatePicker 
                format="DD/MM/YYYY" 
                value={startDate}
                onChange={(val) => val && setStartDate(val)} 
                className="w-full md:w-1/2 h-12 rounded-lg" 
                minDate={dayjs()}
              />
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: Sticky Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            <Card title="Hóa Đơn Thanh Toán" className="shadow-lg rounded-xl border-slate-200 overflow-hidden" headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Space direction="vertical" className="w-full" size="middle">
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Chủ thẻ:</Text>
                  <Text strong className="text-slate-800 text-right max-w-[150px] truncate">{fullName || '---'}</Text>
                </div>
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Loại xe:</Text>
                  <Text strong className="text-slate-800">{vehicleConfig?.name || '---'} <span className="text-slate-400 font-normal">({plateNumber || 'Chưa nhập biển'})</span></Text>
                </div>
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Thời hạn:</Text>
                  <Text strong className="text-slate-800 text-right">
                    {selectedDuration} tháng
                    <br/><span className="text-xs text-blue-500 font-normal">({startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')})</span>
                  </Text>
                </div>

                <div className="flex justify-between mt-2">
                  <Text className="text-slate-500">Phí cơ bản:</Text>
                  <Text strong className="text-slate-700">{baseFee.toLocaleString()} ₫</Text>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <Text className="text-green-500">Chiết khấu ưu đãi:</Text>
                    <Text strong className="text-green-600">- {discountAmount.toLocaleString()} ₫</Text>
                  </div>
                )}
                
                <div className="bg-slate-50 p-4 rounded-lg mt-2 flex justify-between items-center border border-slate-200">
                  <Text strong className="text-slate-600">TỔNG TIỀN:</Text>
                  <Text className="text-2xl font-black text-blue-600">{totalFee.toLocaleString()} ₫</Text>
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
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 animate-pulse"
              onClick={handleConfirm}
            >
              XÁC NHẬN ĐĂNG KÝ
            </Button>
          </div>
        </div>

      </div>

      {/* QR Code Modal */}
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
              <Text className="block text-slate-500 mb-2">Vé tháng của bạn đã được kích hoạt.</Text>
              <Text className="block text-slate-500">Đang chuyển về trang quản lý...</Text>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
