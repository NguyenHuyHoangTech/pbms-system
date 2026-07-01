import { simulatedDayjs } from '../../core/utils/timeProvider';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, DatePicker, message, Spin, Radio, Input, Modal, Row, Col, QRCode } from 'antd';
import { IdcardOutlined, CarOutlined, CreditCardOutlined, CheckCircleOutlined, UserOutlined, CalendarOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
const { Title, Text } = Typography;

const PACKAGES = [
  { id: 1, name: '1 month', discount: 0 },
  { id: 3, name: '3 Months', discount: 0.05 }, // 5% off
  { id: 6, name: '6 Months', discount: 0.10 }, // 10% off
  { id: 12, name: '12 Months', discount: 0.15 }, // 15% off
];

const GATEWAYS = [
  { id: 'PAYPAL', name: 'PayPal Sandbox', icon: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg' },
  { id: 'PAYOS', name: 'PayOS (VietQR)', icon: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg' }
];

export const CustomerMonthlyPassScreen = () => {
  const navigate = useNavigate();
  const email = useAuthStore(state => state.email);
  const name = useAuthStore(state => state.name);
  
  const [fullName, setFullName] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState<dayjs.Dayjs>(simulatedDayjs());
  
  const [selectedGateway, setSelectedGateway] = useState<string>('PAYPAL');
  
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentQrCode, setPaymentQrCode] = useState<string>('');
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');

  const { data: pricingPolicies = [], isLoading: isPricingLoading } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: async () => {
      const res = await axiosClient.get('/public/pricing');
      return res.data.data || [];
    }
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['public-vehicle-types'],
    queryFn: async () => {
      const res = await axiosClient.get('/public/vehicle-types');
      return res.data.data || [];
    }
  });

  const dynamicVehicles = pricingPolicies.map((p: any) => {
    const vt = vehicleTypes.find((v: any) => v.id === p.vehicleTypeId);
    return {
      id: p.vehicleTypeId,
      name: vt?.typeName || p.policyName.replace(/Bảng giá |Price list /gi, ''),
      iconUrl: vt?.iconUrl,
      pricePerMonth: p.monthlyRate || 0
    };
  });

  // Auto fill name if available from store
  useEffect(() => {
    if (name) {
      setFullName(name);
    }
  }, [name]);

  // Calculate fee
  const vehicleConfig = dynamicVehicles.find((v: any) => v.id === selectedVehicle);
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
      message.success('Payment Success! Your Monthly Pass has been activated');
      setTimeout(() => {
        navigate('/customer/my-parking?tab=monthly');
      }, 2000);
    },
    onError: () => {
      message.error('an error occurred when registering for Monthly Pass');
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
    if (!fullName.trim()) return message.error('Please enter Full Name');
    if (!selectedVehicle) return message.error('Please select Vehicle type');
    if (!plateNumber.trim()) return message.error('Please enter vehicle License Plate');
    if (!startDate) return message.error('Please select an effective date');
    
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
            const captureUrl = selectedGateway === 'PAYOS' ? '/payments/payos/capture' : '/payments/paypal/capture';
            axiosClient.post(captureUrl, { token: paymentOrderId })
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
        message.warning('Waiting time for payment is over');
      }
    }
    return () => clearTimeout(timer);
  }, [isQRModalVisible, isPaymentSuccess, paymentOrderId, countdown]);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8080';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-10">
      <div className="p-4 md:p-6 bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <Title level={3} className="m-0 text-slate-800 flex items-center text-xl md:text-2xl">
          <IdcardOutlined className="mr-3 text-blue-600" />  Sign up for Monthly Passes
                          </Title>
        <Text type="secondary" className="text-slate-500 text-sm md:text-base">Register to reserve a long-term parking space with many attractive incentives</Text>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 mt-2 md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Personal Information */}
          <Card title={<><UserOutlined className="mr-2 text-blue-500"/>1. Ticket holder information</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Full name:</Text>
                <Input 
                  size="large" 
                  placeholder="Enter first and last name" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="rounded-lg h-12"
                />
              </div>
              <div>
                <Text className="block font-bold mb-2 text-slate-700">Email to receive invoice:</Text>
                <Input 
                  size="large" 
                  value={email || 'khachhang@example.com'}
                  disabled
                  className="rounded-lg h-12 bg-slate-100 text-slate-500"
                />
                <Text className="text-xs text-slate-400 mt-1 block">Email is automatically taken from Login account</Text>
              </div>
            </div>
          </Card>

          {/* 2. Vehicle Information */}
          <Card title={<><CarOutlined className="mr-2 text-green-500"/>2. Vehicle registration</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Vehicle Type:</Text>
              {isPricingLoading ? (
                 <Spin />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {dynamicVehicles.map((v: any) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedVehicle === v.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white hover:border-green-300'}`}
                    >
                      {v.iconUrl ? (
                        <img src={getImageUrl(v.iconUrl)} alt={v.name} className="h-10 w-10 object-contain mb-2" />
                      ) : (
                        <CarOutlined className="text-3xl mb-2" />
                      )}
                      <span className="font-bold text-lg mb-1">{v.name}</span>
                      <span className="text-sm text-slate-500">{v.pricePerMonth.toLocaleString()} VND/month</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Text className="block font-bold mb-2 text-slate-700">License Plate:</Text>
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

          {/* 3. Duration & Start Date */}
          <Card title={<><CalendarOutlined className="mr-2 text-orange-500"/>3e Package Monthly Passes & Validity</>} className="shadow-sm rounded-xl border-slate-200">
            <div className="mb-6">
              <Text className="block font-bold mb-3 text-slate-700">Choose Time package:</Text>
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
              <Text className="block font-bold mb-2 text-slate-700">Effective Start Date:</Text>
              <DatePicker 
                format="DD/MM/YYYY" 
                value={startDate}
                onChange={(val) => val && setStartDate(val)} 
                className="w-full md:w-1/2 h-12 rounded-lg" 
                minDate={simulatedDayjs()}
              />
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: Sticky Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            <Card title="Payment Invoice" className="shadow-lg rounded-xl border-slate-200 overflow-hidden" headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Space direction="vertical" className="w-full" size="middle">
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Card holder:</Text>
                  <Text strong className="text-slate-800 text-right max-w-[150px] truncate">{fullName || '---'}</Text>
                </div>
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Vehicle Type:</Text>
                  <Text strong className="text-slate-800">{vehicleConfig?.name || '---'} <span className="text-slate-400 font-normal">({plateNumber || 'Not entered yet'})</span></Text>
                </div>
                
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <Text className="text-slate-500">Duration:</Text>
                  <Text strong className="text-slate-800 text-right">
                    {selectedDuration} month(s)
                                                          <br/><span className="text-xs text-blue-500 font-normal">({startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')})</span>
                  </Text>
                </div>

                <div className="flex justify-between mt-2">
                  <Text className="text-slate-500">Basic fee:</Text>
                  <Text strong className="text-slate-700">{baseFee.toLocaleString()} VND</Text>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <Text className="text-green-500">Special discount:</Text>
                    <Text strong className="text-green-600">- {discountAmount.toLocaleString()} VND</Text>
                  </div>
                )}
                
                <div className="bg-slate-50 p-4 rounded-lg mt-2 flex justify-between items-center border border-slate-200">
                  <Text strong className="text-slate-600">TOTAL AMOUNT:</Text>
                  <Text className="text-2xl font-black text-blue-600">{totalFee.toLocaleString()} VND</Text>
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
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 animate-pulse"
              onClick={handleConfirm}
            >
              
                                        Confirm Registration
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
              <Title level={4} className="mb-2 text-slate-800">Scan QR code to pay</Title>
              <Text className="block mb-6 text-slate-500">Open the Banking or eWallet app</Text>
              
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
              <Text className="block text-slate-500 mb-6 font-mono bg-slate-100 py-2 rounded-lg break-all px-2 text-xs">
                {selectedGateway === 'PAYOS' ? (
                  <a href={paymentUrl} target="_blank" rel="noreferrer">Open PayOS Checkout</a>
                ) : (
                  <a href={paymentUrl} target="_blank" rel="noreferrer">Open PayPal Checkout</a>
                )}
              </Text>
              
              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Spin size="small" />
                <Text>Awaiting payment ({countdown}s)...</Text>
              </div>
            </>
          ) : (
            <div className="animate-fade-in py-8">
              <CheckCircleOutlined className="text-[80px] text-green-500 mb-6" />
              <Title level={3} className="text-slate-800">Payment Success!</Title>
              <Text className="block text-slate-500 mb-2">Your Monthly Pass has been activated</Text>
              <Text className="block text-slate-500">Moving back to Management page...</Text>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
