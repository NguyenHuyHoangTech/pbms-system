import React, { useState, useEffect } from 'react';
import { Tabs, Card, Typography, List, Divider, Button, Tag, Spin, message, Input, Space, Popconfirm, Empty, Timeline, Drawer, Alert, Form, Select, Radio, Modal, QRCode, DatePicker } from 'antd';
import { ClockCircleOutlined, CarOutlined, CreditCardOutlined, SearchOutlined, IdcardOutlined, CloseCircleOutlined, HistoryOutlined, CheckCircleOutlined, PlusOutlined, UserOutlined, CalendarOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const MyParkingScreen = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [elapsedTime, setElapsedTime] = useState('');
  
  // URL tab handling
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'booking' ? '2' : 
    tabParam === 'monthly' ? '3' : 
    tabParam === 'history' ? '4' : '1'
  );

  const PACKAGES = [
    { id: 1, name: '1 Tháng', discount: 0 },
    { id: 3, name: '3 Tháng', discount: 0.05 },
    { id: 6, name: '6 Tháng', discount: 0.10 },
    { id: 12, name: '12 Tháng', discount: 0.15 },
  ];
  const VEHICLES = [
    { id: 'CAR', name: 'Ô tô', pricePerMonth: 1000000 },
    { id: 'MOTORBIKE', name: 'Xe máy', pricePerMonth: 150000 }
  ];
  const GATEWAYS = [
    { id: 'PAYPAL', name: 'PayPal Sandbox', icon: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg' },
    { id: 'PAYOS', name: 'PayOS', icon: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg' }
  ];

  // Strict Walk-in 2FA Lookup
  const [plateNumberInput, setPlateNumberInput] = useState('');
  const [rfidInput, setRfidInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/operation/reservations');
        return res.data.data;
      } catch (err) {
        return [];
      }
    }
  });

  const { data: monthlyPasses = [], isLoading: isPassesLoading } = useQuery({
    queryKey: ['my-passes'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/operation/monthly-tickets');
        return res.data.data;
      } catch (err) {
        return [];
      }
    }
  });

  const { data: historyRecords = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['my-history', plateNumberInput],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(`/operation/parking-sessions/history?plate=${plateNumberInput || '30A-123.45'}`);
        return res.data.data || [];
      } catch (err) {
        return [];
      }
    }
  });

  // We only fetch active session if we have searched in the Walk-in tab
  const { data: session, isLoading, isFetching } = useQuery({
    queryKey: ['my-active-session', plateNumberInput, rfidInput],
    queryFn: async () => {
      const res = await axiosClient.get('/parking-sessions/my-active');
      return res.data;
    },
    enabled: hasSearched
  });

  const [sessionPaymentUrl, setSessionPaymentUrl] = useState('');
  const [sessionPaymentToken, setSessionPaymentToken] = useState('');
  const [isSessionQRVisible, setIsSessionQRVisible] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);

  const paymentMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await axiosClient.post('/payments/generate-link', {
        sessionId,
        gateway: 'PAYPAL'
      });
      return res.data;
    },
    onSuccess: (data) => {
      setSessionPaymentUrl(data.data.paymentUrl);
      const urlParams = new URL(data.data.paymentUrl).searchParams;
      setSessionPaymentToken(urlParams.get('token') || '');
      setIsSessionQRVisible(true);
      setSessionCountdown(60);
    },
    onError: () => {
      message.error('Lỗi khi tạo giao dịch thanh toán.');
    }
  });

  useEffect(() => {
    let timer: any;
    if (isSessionQRVisible && sessionPaymentToken) {
      if (sessionCountdown > 0) {
        timer = setTimeout(() => {
          setSessionCountdown(c => c - 1);
          if (sessionCountdown % 3 === 0) {
            axiosClient.post('/payments/paypal/capture', { token: sessionPaymentToken })
              .then(res => {
                if (res.data?.data?.status === 'COMPLETED') {
                  message.success('Thanh toán thành công!');
                  setIsSessionQRVisible(false);
                  queryClient.invalidateQueries({ queryKey: ['my-active-session'] });
                  queryClient.invalidateQueries({ queryKey: ['my-history'] });
                }
              })
              .catch(() => {});
          }
        }, 1000);
      } else {
        setIsSessionQRVisible(false);
        message.warning('Hết thời gian chờ thanh toán.');
      }
    }
    return () => clearTimeout(timer);
  }, [isSessionQRVisible, sessionPaymentToken, sessionCountdown]);

  useEffect(() => {
    if (!session || !session.timeIn) return;

    const checkIn = dayjs(session.timeIn);
    const timer = setInterval(() => {
      const now = dayjs();
      const diffHrs = now.diff(checkIn, 'hour');
      const diffMins = now.diff(checkIn, 'minute') % 60;
      const diffSecs = now.diff(checkIn, 'second') % 60;
      setElapsedTime(`${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const handleSearchWalkIn = () => {
    setHasSearched(true);
  };

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.put(`/operation/reservations/${id}/cancel`);
    },
    onSuccess: () => {
      message.success('Đã gửi yêu cầu hủy đặt chỗ và hoàn tiền thành công.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setCancelDrawerVisible(false);
      setSelectedBookingToCancel(null);
    }
  });

  const handleCancelBooking = () => {
    if (selectedBookingToCancel) {
      cancelBookingMutation.mutate(selectedBookingToCancel.id);
    }
  };

  const calculateRefund = (booking: any) => {
    if (!booking) return { refund: 0, penalty: 0, amount: 0, percent: 0 };
    const now = dayjs();
    const arrTime = dayjs(booking.arrivalTime, 'HH:mm DD/MM/YYYY');
    const diffMins = arrTime.diff(now, 'minute');
    let refundPercent = 0;
    
    if (diffMins >= 30) {
      refundPercent = 1;
    } else if (diffMins > 0 && diffMins < 30) {
      refundPercent = 0.5;
    } else {
      refundPercent = 0;
    }

    const amount = booking.amount || 50000;
    const refund = amount * refundPercent;
    const penalty = amount - refund;

    return { amount, refund, penalty, percent: refundPercent * 100 };
  };

  const [cancelDrawerVisible, setCancelDrawerVisible] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<any>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Register Pass States (UC-404 popup)
  const [registerDrawerVisible, setRegisterDrawerVisible] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newSelectedVehicle, setNewSelectedVehicle] = useState<string | null>('CAR');
  const [newPlateNumber, setNewPlateNumber] = useState('');
  const [newSelectedDuration, setNewSelectedDuration] = useState<number>(1);
  const [newStartDate, setNewStartDate] = useState<dayjs.Dayjs>(dayjs());
  const [newGateway, setNewGateway] = useState('PAYPAL');

  const [isRegQRModalVisible, setIsRegQRModalVisible] = useState(false);
  const [regCountdown, setRegCountdown] = useState(60);
  const [isRegSuccess, setIsRegSuccess] = useState(false);
  const [regPaymentUrl, setRegPaymentUrl] = useState('');
  const [regPaymentToken, setRegPaymentToken] = useState('');

  const createPassMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/operation/monthly-tickets', {
        vehicleTypeId: newSelectedVehicle,
        plateNumber: newPlateNumber,
        duration: newSelectedDuration
      });
      return res.data;
    },
    onSuccess: () => {
      setRegCountdown(5);
      setIsRegSuccess(true);
      message.success('Đăng ký vé tháng thành công! Vé tháng của bạn đã được kích hoạt.');
      queryClient.invalidateQueries({ queryKey: ['my-passes'] });
      setTimeout(() => {
        setIsRegQRModalVisible(false);
        setRegisterDrawerVisible(false);
      }, 2000);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi đăng ký vé tháng');
      setIsRegQRModalVisible(false);
    }
  });

  const generateRegLinkMutation = useMutation({
    mutationFn: async (totalFee: number) => {
      const res = await axiosClient.post('/payments/generate-link', {
        amount: totalFee,
        gateway: newGateway
      });
      return res.data;
    },
    onSuccess: (data) => {
      setRegPaymentUrl(data.data.paymentUrl);
      const urlParams = new URL(data.data.paymentUrl).searchParams;
      setRegPaymentToken(urlParams.get('token') || '');
    },
    onError: () => {
      message.error('Lỗi khi tạo link thanh toán đăng ký.');
      setIsRegQRModalVisible(false);
    }
  });

  const handleConfirmRegister = (totalFee: number) => {
    if (!newFullName.trim()) return message.error('Vui lòng nhập Họ và Tên');
    if (!newSelectedVehicle) return message.error('Vui lòng chọn loại phương tiện');
    if (!newPlateNumber.trim()) return message.error('Vui lòng nhập biển số xe');
    if (!newStartDate) return message.error('Vui lòng chọn ngày bắt đầu hiệu lực');

    setIsRegQRModalVisible(true);
    setIsRegSuccess(false);
    setRegCountdown(60);
    setRegPaymentUrl('');
    setRegPaymentToken('');
    generateRegLinkMutation.mutate(totalFee);
  };

  useEffect(() => {
    let timer: any;
    if (isRegQRModalVisible && !isRegSuccess && regPaymentToken) {
      if (regCountdown > 0) {
        timer = setTimeout(() => {
          setRegCountdown(c => c - 1);
          if (regCountdown % 3 === 0) {
            axiosClient.post('/payments/paypal/capture', { token: regPaymentToken })
              .then(res => {
                if (res.data?.data?.status === 'COMPLETED') {
                  createPassMutation.mutate();
                }
              })
              .catch(() => {});
          }
        }, 1000);
      } else {
        setIsRegQRModalVisible(false);
        message.warning('Hết thời gian chờ thanh toán.');
      }
    }
    return () => clearTimeout(timer);
  }, [isRegQRModalVisible, isRegSuccess, regPaymentToken, regCountdown]);

  // Renew Pass States
  const [renewDrawerVisible, setRenewDrawerVisible] = useState(false);
  const [selectedPassToRenew, setSelectedPassToRenew] = useState<any>(null);
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewGateway, setRenewGateway] = useState('PAYPAL');
  
  const [isRenewQRModalVisible, setIsRenewQRModalVisible] = useState(false);
  const [renewCountdown, setRenewCountdown] = useState(60);
  const [isRenewSuccess, setIsRenewSuccess] = useState(false);
  const [renewPaymentUrl, setRenewPaymentUrl] = useState('');
  const [renewPaymentToken, setRenewPaymentToken] = useState('');

  const renewPassMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.put(`/operation/monthly-tickets/${selectedPassToRenew.id.replace('MP-','')}/renew`, {
        duration: renewDuration
      });
      return res.data;
    },
    onSuccess: () => {
      setRenewCountdown(5);
      setIsRenewSuccess(true);
      message.success('Gia hạn vé tháng thành công!');
      
      queryClient.invalidateQueries({ queryKey: ['my-passes'] });

      setTimeout(() => {
        setIsRenewQRModalVisible(false);
        setRenewDrawerVisible(false);
      }, 2000);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi gia hạn vé tháng');
      setIsRenewQRModalVisible(false);
    }
  });

  const generateRenewLinkMutation = useMutation({
    mutationFn: async (totalFee: number) => {
      const res = await axiosClient.post('/payments/generate-link', {
        amount: totalFee,
        gateway: renewGateway
      });
      return res.data;
    },
    onSuccess: (data) => {
      setRenewPaymentUrl(data.data.paymentUrl);
      const urlParams = new URL(data.data.paymentUrl).searchParams;
      setRenewPaymentToken(urlParams.get('token') || '');
    },
    onError: () => {
      message.error('Lỗi khi tạo link thanh toán gia hạn.');
      setIsRenewQRModalVisible(false);
    }
  });

  const handleOpenRenew = (pass: any) => {
    setSelectedPassToRenew(pass);
    setRenewDuration(1);
    setRenewGateway('PAYPAL');
    setRenewDrawerVisible(true);
  };

  const handleConfirmRenew = (totalFee: number) => {
    setIsRenewQRModalVisible(true);
    setIsRenewSuccess(false);
    setRenewCountdown(60);
    setRenewPaymentUrl('');
    setRenewPaymentToken('');
    generateRenewLinkMutation.mutate(totalFee);
  };

  useEffect(() => {
    let timer: any;
    if (isRenewQRModalVisible && !isRenewSuccess && renewPaymentToken) {
      if (renewCountdown > 0) {
        timer = setTimeout(() => {
          setRenewCountdown(c => c - 1);
          if (renewCountdown % 3 === 0) {
            axiosClient.post('/payments/paypal/capture', { token: renewPaymentToken })
              .then(res => {
                if (res.data?.data?.status === 'COMPLETED') {
                  renewPassMutation.mutate();
                }
              })
              .catch(() => {});
          }
        }, 1000);
      } else {
        setIsRenewQRModalVisible(false);
        message.warning('Hết thời gian chờ thanh toán.');
      }
    }
    return () => clearTimeout(timer);
  }, [isRenewQRModalVisible, isRenewSuccess, renewPaymentToken, renewCountdown]);

  const renderActiveSession = () => {
    if (isLoading || isFetching) return <div className="p-12 text-center"><Spin size="large" /></div>;

    if (!session) {
      return (
        <div className="py-12 text-center text-gray-500 animate-fade-in">
          <CarOutlined className="text-5xl mb-4 opacity-40" />
          <Title level={4} className="text-gray-500">Không tìm thấy phương tiện đang gửi</Title>
        </div>
      );
    }

    const isBooking = session.status === 'BOOKED';
    const totalFee = isBooking ? 50000 : 15000;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in mt-6">
        <Card className="shadow-sm border-gray-200">
          <div className="flex flex-col items-center justify-center py-6">
            <CarOutlined className="text-5xl text-blue-500 mb-4" />
            <Title level={2} className="m-0 tracking-widest">{session.plateNumber}</Title>
            <Tag color={isBooking ? 'orange' : 'blue'} className="mt-2 text-sm px-3 py-1">
              {isBooking ? 'ĐÃ ĐẶT TRƯỚC' : 'ĐANG ĐỖ XE'}
            </Tag>
            
            <div className="mt-8 text-center bg-gray-50 p-6 rounded-2xl w-full">
              <ClockCircleOutlined className="text-2xl text-gray-400 mb-2" />
              <Text className="block text-gray-500 mb-1">{isBooking ? 'Hết hạn giữ chỗ sau:' : 'Thời gian đã đỗ:'}</Text>
              <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider">
                {isBooking ? (
                  session.expiryTime ? dayjs(session.expiryTime).diff(dayjs(), 'minute') + ' phút' : '---'
                ) : (
                  elapsedTime || "00:00:00"
                )}
              </div>
              {!isBooking && <Text className="block text-gray-400 mt-2 text-sm">Vào lúc: {dayjs(session.timeIn).format('HH:mm DD/MM/YYYY')}</Text>}
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-gray-200 bg-gray-50/50 flex flex-col h-full">
          <Title level={4} className="mb-6"><CreditCardOutlined className="mr-2" />Thanh toán Dịch vụ</Title>
          <List
            size="small"
            dataSource={[
              { label: 'Loại phương tiện', value: session.vehicleType === 'CAR' ? 'Ô Tô' : 'Xe Máy' },
              { label: 'Vị trí đỗ', value: session.slotId || 'Chưa xếp chỗ' },
              { label: 'Mức phí cơ sở', value: isBooking ? '50,000 ₫ / lần' : '15,000 ₫ / block' },
            ]}
            renderItem={item => (
              <List.Item className="border-b border-gray-200 py-3">
                <Text type="secondary">{item.label}</Text>
                <Text strong>{item.value}</Text>
              </List.Item>
            )}
          />
          <Divider className="my-4" />
          <div className="flex justify-between items-center mb-6">
            <Text strong className="text-lg">TỔNG CỘNG:</Text>
            <Text strong className="text-2xl text-blue-600">{totalFee.toLocaleString()} ₫</Text>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-xl p-6 text-white mt-auto">
            {isBooking ? (
              <>
                <CreditCardOutlined className="text-6xl mb-4 opacity-90 text-blue-400" />
                <Button 
                  type="primary" 
                  size="large" 
                  className="bg-blue-600 w-full animate-pulse font-bold"
                  onClick={() => paymentMutation.mutate(session.id)}
                  loading={paymentMutation.isPending}
                >
                  THANH TOÁN ĐỂ GIỮ CHỖ
                </Button>
              </>
            ) : (
              <>
                <QRCode value={sessionPaymentUrl || '...'} size={120} className="mb-4" />
                <Text className="text-white/80 text-sm text-center">Đưa mã QR này vào máy quét hoặc thanh toán online.</Text>
                <Button 
                  type="primary" 
                  className="mt-4 bg-green-600 w-full"
                  onClick={() => paymentMutation.mutate(session.id)}
                  loading={paymentMutation.isPending}
                >
                  THANH TOÁN ONLINE
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderWalkInTab = () => (
    <div className="animate-fade-in">
      <Card className="bg-blue-50/50 border-blue-100 mb-6 shadow-sm">
        <Title level={5} className="mb-4 text-blue-800">Tra cứu Xe Vãng Lai (Bảo mật 2FA)</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            size="large" 
            placeholder="Nhập Biển số xe" 
            prefix={<CarOutlined className="text-gray-400" />} 
            value={plateNumberInput}
            onChange={(e) => setPlateNumberInput(e.target.value)}
          />
          <Input 
            size="large" 
            placeholder="Nhập Mã thẻ RFID" 
            prefix={<IdcardOutlined className="text-gray-400" />} 
            value={rfidInput}
            onChange={(e) => setRfidInput(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            size="large" 
            className="bg-blue-600"
            disabled={!plateNumberInput.trim() || !rfidInput.trim()}
            onClick={handleSearchWalkIn}
          >
            Tra cứu
          </Button>
        </div>
      </Card>
      
      {hasSearched && renderActiveSession()}
    </div>
  );

  const renderBookingsTab = () => (
    <div className="animate-fade-in">
      {bookings.length > 0 ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={bookings}
          renderItem={item => (
            <List.Item>
              <Card className="shadow-sm border border-gray-200 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div className="w-full sm:w-auto">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag color={
                        item.status === 'ACTIVE' ? 'orange' :
                        item.status === 'PENDING_REFUND' ? 'blue' :
                        item.status === 'CANCELLED_REFUNDED' ? 'default' : 'red'
                      } className="m-0 font-bold text-[10px] md:text-xs">
                        {item.status === 'ACTIVE' ? 'ĐẶT CHỖ TRƯỚC' :
                         item.status === 'PENDING_REFUND' ? 'ĐANG CHỜ HOÀN TIỀN' :
                         item.status === 'CANCELLED_REFUNDED' ? 'ĐÃ HỦY & HOÀN TIỀN' :
                         item.status === 'CANCELLED_NO_REFUND' ? 'ĐÃ HỦY (KHÔNG HOÀN)' : 'ĐÃ HỦY'}
                      </Tag>
                      <Text type="secondary" className="text-[10px] md:text-xs">ID: {item.id}</Text>
                    </div>
                    <Title level={4} className={`m-0 tracking-widest ${item.status !== 'ACTIVE' ? 'text-gray-400 line-through' : ''}`}>{item.plateNumber}</Title>
                    <div className="mt-4 space-y-1">
                      <Text className={`block ${item.status !== 'ACTIVE' ? 'text-gray-400' : 'text-gray-500'}`}>Giờ đến dự kiến: <Text strong className={item.status !== 'ACTIVE' ? 'text-gray-400' : 'text-gray-800'}>{item.arrivalTime}</Text></Text>
                      <Text className={`block ${item.status !== 'ACTIVE' ? 'text-gray-400' : 'text-gray-500'}`}>Vị trí giữ chỗ: <Text strong className={item.status !== 'ACTIVE' ? 'text-gray-400' : 'text-gray-800'}>{item.slot}</Text></Text>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0 w-full sm:w-auto">
                    {item.status === 'ACTIVE' && (
                      <Button 
                        danger 
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          setSelectedBookingToCancel(item);
                          setCancelDrawerVisible(true);
                        }}
                      >
                        Hủy Đặt Trước
                      </Button>
                    )}
                    {item.status === 'PENDING_REFUND' && (
                      <Text type="secondary" className="text-sm italic mt-2">Dự kiến xử lý: 1-2 ngày</Text>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <div className="py-16 text-center">
          <Empty description={<span className="text-gray-500 font-medium text-lg">Bạn chưa có lịch đặt trước nào</span>} />
          <Button type="primary" className="mt-4 bg-blue-600" onClick={() => navigate('/customer/pre-booking')}>
            Tạo Đặt Chỗ Ngay
          </Button>
        </div>
      )}
    </div>
  );

  const renderMonthlyPassTab = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
        <div>
          <Title level={5} className="m-0 text-blue-800">Danh sách Vé Tháng của bạn</Title>
          <Text type="secondary" className="text-xs md:text-sm">Quản lý các phương tiện gửi dài hạn tại tòa nhà</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large" 
          className="bg-blue-600 font-bold rounded-lg shadow-md hover:bg-blue-500" 
          onClick={() => setRegisterDrawerVisible(true)}
        >
          Đăng Ký Vé Mới
        </Button>
      </div>

      {monthlyPasses.length > 0 ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={monthlyPasses}
          renderItem={item => {
            const isExpired = dayjs(item.expiryDate, 'DD/MM/YYYY').isBefore(dayjs(), 'day');
            const isExpiringSoon = dayjs(item.expiryDate, 'DD/MM/YYYY').isBefore(dayjs().add(7, 'day'));
            return (
              <List.Item>
                <Card className={`shadow-sm border ${isExpired ? 'border-red-200 bg-red-50/20' : 'border-green-200 bg-green-50/30'} rounded-xl`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4 w-full">
                      <div className={`${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} p-3 md:p-4 rounded-full shrink-0`}>
                        <IdcardOutlined className="text-2xl md:text-3xl" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Title level={4} className="m-0 tracking-widest">{item.plateNumber}</Title>
                          <Tag color={isExpired ? 'red' : 'green'} className="m-0 font-bold">
                            {isExpired ? 'ĐÃ HẾT HẠN' : item.status}
                          </Tag>
                        </div>
                        <Text type="secondary">Mã thẻ: {item.id} • {item.type}</Text>
                        <div className="mt-1">
                          <Text className="text-gray-600">
                            Ngày hết hạn: <Text strong className={isExpired || isExpiringSoon ? 'text-red-500' : 'text-gray-800'}>{item.expiryDate}</Text>
                          </Text>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex flex-col items-end">
                      <Button 
                        type="primary" 
                        className={`w-full sm:w-auto font-bold ${isExpired ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 shadow-md'}`} 
                        onClick={() => !isExpired && handleOpenRenew(item)}
                        disabled={isExpired}
                      >
                        Gia Hạn
                      </Button>
                      {isExpired && (
                        <Text className="text-xs text-red-500 mt-1 italic text-right block">
                          *Vé đã hết hiệu lực, không thể gia hạn. Vui lòng đăng ký mới.
                        </Text>
                      )}
                    </div>
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      ) : (
        <div className="py-16 text-center">
          <Empty description={<span className="text-gray-500 font-medium text-lg">Bạn chưa đăng ký vé tháng nào</span>} />
          <Button type="primary" size="large" className="mt-4 bg-blue-600 font-bold" onClick={() => setRegisterDrawerVisible(true)}>
            Đăng Ký Vé Tháng Mới Ngay
          </Button>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="animate-fade-in">
      <Card className="shadow-sm border border-gray-100 rounded-xl">
        <div className="flex items-center mb-6">
          <HistoryOutlined className="text-2xl text-blue-600 mr-3" />
          <Title level={4} className="m-0">Lịch sử ra vào bãi</Title>
        </div>
        
        {historyRecords.length > 0 ? (
          <Timeline
            className="mt-4"
            items={historyRecords.map(record => ({
              color: record.type === 'VÉ THÁNG' ? 'green' : 'orange',
              children: (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Title level={5} className="m-0 tracking-widest">{record.plateNumber}</Title>
                      <Tag color={record.type === 'VÉ THÁNG' ? 'green' : 'orange'} className="mt-1">
                        {record.type}
                      </Tag>
                    </div>
                    <div className="text-right">
                      <Text strong className="text-blue-600 text-lg">{record.fee === 0 ? 'Miễn phí' : `${record.fee.toLocaleString()} ₫`}</Text>
                    </div>
                  </div>
                  <Divider className="my-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                      <Text type="secondary" className="block mb-1">Giờ Vào:</Text>
                      <Text strong className="text-gray-700"><ClockCircleOutlined className="mr-1"/> {record.timeIn}</Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block mb-1">Giờ Ra:</Text>
                      <Text strong className="text-gray-700"><ClockCircleOutlined className="mr-1"/> {record.timeOut}</Text>
                    </div>
                  </div>
                </div>
              )
            }))}
          />
        ) : (
          <div className="py-12 text-center">
            <Empty description={<span className="text-gray-500">Chưa có lịch sử gửi xe nào</span>} />
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .mobile-wrap-tabs .ant-tabs-nav-list {
            flex-wrap: wrap !important;
            justify-content: center !important;
            width: 100% !important;
          }
          .mobile-wrap-tabs .ant-tabs-tab {
            flex: 1 1 40% !important;
            justify-content: center !important;
            margin: 4px !important;
            padding: 8px 4px !important;
          }
          .mobile-wrap-tabs .ant-tabs-ink-bar {
            display: none !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div className="mb-8">
          <Title level={2} className="m-0 text-gray-800">Quản Lý Dịch Vụ</Title>
          <Text type="secondary">Kiểm tra thông tin thẻ, vé tháng và đặt chỗ của bạn</Text>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <Tabs 
            className="mobile-wrap-tabs"
            activeKey={activeTab} 
            onChange={(key) => {
              setActiveTab(key);
              navigate(`/customer/my-parking?tab=${key === '2' ? 'booking' : key === '3' ? 'monthly' : key === '4' ? 'history' : 'walkin'}`, { replace: true });
            }}
            size="large"
            items={[
              {
                key: '1',
                label: 'Xe Đang Gửi (Vãng Lai)',
                children: renderWalkInTab(),
              },
              {
                key: '2',
                label: 'Quản Lý Đặt Trước',
                children: renderBookingsTab(),
              },
              {
                key: '3',
                label: 'Quản Lý Vé Tháng',
                children: renderMonthlyPassTab(),
              },
              {
                key: '4',
                label: 'Lịch Sử Gửi Xe',
                children: renderHistoryTab(),
              }
            ]}
          />
        </div>
      </div>

      <Drawer
        title={<span className="text-red-600 font-bold">HỦY ĐẶT CHỖ & HOÀN TIỀN</span>}
        width={450}
        onClose={() => setCancelDrawerVisible(false)}
        open={cancelDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => setCancelDrawerVisible(false)}>Giữ Lại</Button>
            <Button 
              type="primary" 
              danger 
              onClick={handleCancelBooking} 
              disabled={selectedBookingToCancel && calculateRefund(selectedBookingToCancel).refund > 0 && (!bankName || !accountNumber || !accountName)}
            >
              Xác Nhận Hủy
            </Button>
          </Space>
        }
      >
        {selectedBookingToCancel && (() => {
          const { amount, refund, penalty, percent } = calculateRefund(selectedBookingToCancel);
          return (
            <div className="space-y-6">
              <Alert
                message={<span className="font-bold text-red-700">Chính sách Hoàn tiền Đặt trước</span>}
                description={
                  <ul className="list-disc pl-4 mt-2 text-sm text-red-600">
                    <li>Hủy trước 30 phút: Hoàn tiền 100%</li>
                    <li>Hủy trong vòng 30 phút trước giờ đến: Hoàn tiền 50%</li>
                    <li>Hủy sau giờ đặt đến: Không hoàn tiền (0%)</li>
                  </ul>
                }
                type="error"
                className="bg-red-50 border border-red-200"
              />

              <Card size="small" title="Chi tiết khoản tiền" className="bg-slate-50 border-slate-200">
                <div className="flex justify-between mb-2">
                  <Text className="text-slate-500">Giờ đến dự kiến:</Text>
                  <Text strong>{selectedBookingToCancel.arrivalTime}</Text>
                </div>
                <div className="flex justify-between mb-2 border-b border-dashed border-slate-300 pb-2">
                  <Text className="text-slate-500">Tiền đặt chỗ ban đầu:</Text>
                  <Text strong>{amount.toLocaleString()} ₫</Text>
                </div>
                <div className="flex justify-between mb-2">
                  <Text className="text-red-500">Phí phạt hủy ({100 - percent}%):</Text>
                  <Text strong className="text-red-600">- {penalty.toLocaleString()} ₫</Text>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-300">
                  <Text strong className="text-green-600">SỐ TIỀN ĐƯỢC HOÀN:</Text>
                  <Text strong className="text-xl text-green-600">{refund.toLocaleString()} ₫</Text>
                </div>
              </Card>

              {refund > 0 && (
                <div className="space-y-4">
                  <Title level={5}>Nhập thông tin nhận hoàn tiền</Title>
                  <Alert 
                    message="Lưu ý quan trọng" 
                    description="Vui lòng nhập chính xác thông tin Tài khoản Ngân hàng. Quá trình xử lý hoàn tiền có thể mất từ 1-2 ngày làm việc." 
                    type="warning" 
                    showIcon 
                    className="text-xs"
                  />
                  
                  <Form layout="vertical">
                    <Form.Item label="Ngân hàng" required>
                      <Select
                        placeholder="Chọn ngân hàng"
                        value={bankName}
                        onChange={setBankName}
                        options={[
                          { value: 'VCB', label: 'Vietcombank' },
                          { value: 'TCB', label: 'Techcombank' },
                          { value: 'MB', label: 'MBBank' },
                          { value: 'VTB', label: 'VietinBank' },
                          { value: 'ACB', label: 'ACB' }
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Số tài khoản" required>
                      <Input 
                        placeholder="Nhập số tài khoản" 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label="Tên Chủ tài khoản" required>
                      <Input 
                        placeholder="Nhập tên in hoa không dấu" 
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      />
                    </Form.Item>
                  </Form>
                </div>
              )}
              
              {refund === 0 && (
                <Alert 
                  message="Không đủ điều kiện hoàn tiền" 
                  description="Do đã quá thời gian quy định, khoản tiền đặt chỗ của bạn sẽ không được hoàn lại theo chính sách của hệ thống." 
                  type="info" 
                  showIcon 
                />
              )}
            </div>
          );
        })()}
      </Drawer>

      <Drawer
        title={<span className="text-blue-600 font-bold"><IdcardOutlined className="mr-2"/>GIA HẠN VÉ THÁNG</span>}
        width={500}
        onClose={() => setRenewDrawerVisible(false)}
        open={renewDrawerVisible}
        className="bg-slate-50"
      >
        {selectedPassToRenew && (() => {
           const isCar = selectedPassToRenew.type === 'Ô TÔ';
           const pricePerMonth = isCar ? 1000000 : 150000;
           const packageConfig = PACKAGES.find(p => p.id === renewDuration);
           const baseFee = pricePerMonth * renewDuration;
           const discountAmount = baseFee * (packageConfig?.discount || 0);
           const totalFee = baseFee - discountAmount;
           const newExpiry = dayjs(selectedPassToRenew.expiryDate, 'DD/MM/YYYY').add(renewDuration, 'month').format('DD/MM/YYYY');

           return (
             <div className="space-y-6">
               <Card size="small" className="shadow-sm border-slate-200">
                 <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
                   <Text className="text-slate-500">Mã thẻ:</Text>
                   <Text strong className="text-slate-800">{selectedPassToRenew.id}</Text>
                 </div>
                 <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
                   <Text className="text-slate-500">Biển số xe:</Text>
                   <Text strong className="text-slate-800 tracking-widest">{selectedPassToRenew.plateNumber}</Text>
                 </div>
                 <div className="flex justify-between items-center">
                   <Text className="text-slate-500">Ngày hết hạn hiện tại:</Text>
                   <Text strong className={dayjs(selectedPassToRenew.expiryDate, 'DD/MM/YYYY').isBefore(dayjs().add(7, 'day')) ? 'text-red-500' : 'text-slate-800'}>{selectedPassToRenew.expiryDate}</Text>
                 </div>
               </Card>

               <div>
                 <Text className="block font-bold mb-3 text-slate-700">Chọn gói gia hạn:</Text>
                 <div className="grid grid-cols-2 gap-3">
                   {PACKAGES.map(p => (
                     <div
                       key={p.id}
                       onClick={() => setRenewDuration(p.id)}
                       className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${renewDuration === p.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                     >
                       {p.discount > 0 && (
                         <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                           -{p.discount * 100}%
                         </div>
                       )}
                       <span className="font-bold">{p.name}</span>
                     </div>
                   ))}
                 </div>
               </div>

               <Card className="shadow-sm border-slate-200 bg-white">
                 <Space direction="vertical" className="w-full">
                   <div className="flex justify-between">
                     <Text className="text-slate-500">Ngày hết hạn mới:</Text>
                     <Text strong className="text-green-600">{newExpiry}</Text>
                   </div>
                   <Divider className="my-2" />
                   <div className="flex justify-between">
                     <Text className="text-slate-500">Phí cơ bản:</Text>
                     <Text strong>{baseFee.toLocaleString()} ₫</Text>
                   </div>
                   {discountAmount > 0 && (
                     <div className="flex justify-between">
                       <Text className="text-green-500">Chiết khấu ưu đãi:</Text>
                       <Text strong className="text-green-600">- {discountAmount.toLocaleString()} ₫</Text>
                     </div>
                   )}
                   <div className="bg-slate-50 p-3 rounded-lg mt-2 flex justify-between items-center border border-slate-200">
                     <Text strong className="text-slate-600">TỔNG THANH TOÁN:</Text>
                     <Text className="text-xl font-black text-blue-600">{totalFee.toLocaleString()} ₫</Text>
                   </div>
                 </Space>
               </Card>

               <div>
                 <Text className="block font-bold mb-3 text-slate-700">Phương thức thanh toán:</Text>
                 <Radio.Group 
                   onChange={e => setRenewGateway(e.target.value)} 
                   value={renewGateway}
                   className="w-full flex flex-col space-y-3"
                 >
                   {GATEWAYS.map(gw => (
                     <Radio.Button 
                       key={gw.id} 
                       value={gw.id}
                       className={`h-14 flex items-center px-4 rounded-xl border-2 transition-all ${renewGateway === gw.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                     >
                       <div className="flex items-center space-x-3 w-full">
                         <img src={gw.icon} alt={gw.name} className="h-6 object-contain" />
                         <span className="font-bold text-slate-700">{gw.name}</span>
                       </div>
                     </Radio.Button>
                   ))}
                 </Radio.Group>
               </div>

               <Button 
                 type="primary" 
                 size="large" 
                 className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 animate-pulse mt-4"
                 onClick={() => handleConfirmRenew(totalFee)}
               >
                 THANH TOÁN GIA HẠN
               </Button>
             </div>
           );
        })()}
      </Drawer>

      <Modal
        open={isRenewQRModalVisible}
        footer={null}
        closable={!isRenewSuccess}
        onCancel={() => !isRenewSuccess && setIsRenewQRModalVisible(false)}
        centered
        maskClosable={false}
        width={400}
      >
        <div className="text-center py-6">
          {!isRenewSuccess ? (
            <>
              <Title level={4} className="mb-2 text-slate-800">Quét mã QR để thanh toán</Title>
              <Text className="block mb-6 text-slate-500">Mở ứng dụng Ngân hàng hoặc Ví điện tử</Text>
              
              <div className="relative inline-block mb-6">
                <div className="bg-white p-4 border-2 border-dashed border-slate-300 rounded-2xl shadow-sm relative z-10 flex justify-center items-center h-[240px] w-[240px]">
                  {renewPaymentUrl ? <QRCode value={renewPaymentUrl} size={200} /> : <Spin size="large" />}
                </div>
                <style>
                  {`
                    @keyframes scan {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(220px); }
                      100% { transform: translateY(0); }
                    }
                  `}
                </style>
                {renewPaymentUrl && <div className="absolute top-2 left-2 w-[calc(100%-16px)] h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] z-20" style={{ animation: 'scan 2s ease-in-out infinite' }}></div>}
              </div>
              
              <Text className="block text-slate-500 mb-6 font-mono bg-slate-100 py-2 rounded-lg break-all px-2 text-xs">
                {renewGateway === 'PAYPAL' ? (
                  <a href={renewPaymentUrl} target="_blank" rel="noreferrer">Mở PayPal Checkout</a>
                ) : (
                  <a href={renewPaymentUrl} target="_blank" rel="noreferrer">Mở PayOS Checkout</a>
                )}
              </Text>
              
              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Spin size="small" />
                <Text>Đang chờ thanh toán ({renewCountdown}s)...</Text>
              </div>
            </>
          ) : (
            <div className="animate-fade-in py-8">
              <CheckCircleOutlined className="text-[80px] text-green-500 mb-6" />
              <Title level={3} className="text-slate-800">Gia hạn thành công!</Title>
              <Text className="block text-slate-500 mb-2">Ngày hết hạn vé tháng đã được cập nhật.</Text>
            </div>
          )}
        </div>
      </Modal>

      <Drawer
        title={<span className="text-blue-600 font-bold"><IdcardOutlined className="mr-2"/>ĐĂNG KÝ VÉ THÁNG MỚI</span>}
        width={500}
        onClose={() => setRegisterDrawerVisible(false)}
        open={registerDrawerVisible}
        className="bg-slate-50"
      >
        {(() => {
           const isCar = newSelectedVehicle === 'CAR';
           const pricePerMonth = isCar ? 1000000 : 150000;
           const packageConfig = PACKAGES.find(p => p.id === newSelectedDuration);
           const baseFee = pricePerMonth * newSelectedDuration;
           const discountAmount = baseFee * (packageConfig?.discount || 0);
           const totalFee = baseFee - discountAmount;
           const newExpiry = newStartDate.add(newSelectedDuration, 'month').format('DD/MM/YYYY');

           return (
             <div className="space-y-6">
               <Card size="small" title={<><UserOutlined className="mr-2 text-blue-500"/>1. Thông tin đăng ký</>} className="shadow-sm border-slate-200">
                 <div className="space-y-4">
                   <div>
                     <Text className="block font-bold mb-1 text-slate-700">Họ và tên:</Text>
                     <Input 
                       placeholder="Nhập họ và tên" 
                       value={newFullName}
                       onChange={e => setNewFullName(e.target.value)}
                       className="rounded-lg h-10"
                     />
                   </div>
                   <div>
                     <Text className="block font-bold mb-1 text-slate-700">Biển số xe:</Text>
                     <Input 
                       placeholder="Ví dụ: 51H-123.45" 
                       value={newPlateNumber}
                       onChange={e => setNewPlateNumber(e.target.value.toUpperCase())}
                       className="rounded-lg h-10 font-mono font-bold uppercase"
                     />
                   </div>
                 </div>
               </Card>

               <div>
                 <Text className="block font-bold mb-3 text-slate-700">2. Loại phương tiện:</Text>
                 <div className="grid grid-cols-2 gap-3">
                   {VEHICLES.map(v => (
                     <div
                       key={v.id}
                       onClick={() => setNewSelectedVehicle(v.id)}
                       className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${newSelectedVehicle === v.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white hover:border-green-300'}`}
                     >
                       <CarOutlined className="text-2xl mb-1" />
                       <span className="font-bold">{v.name}</span>
                       <span className="text-xs text-slate-500">{v.pricePerMonth.toLocaleString()} ₫/th</span>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <Text className="block font-bold mb-3 text-slate-700">3. Chọn gói thời gian & Hiệu lực:</Text>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   {PACKAGES.map(p => (
                     <div
                       key={p.id}
                       onClick={() => setNewSelectedDuration(p.id)}
                       className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${newSelectedDuration === p.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white hover:border-orange-300'}`}
                     >
                       {p.discount > 0 && (
                         <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                           -{p.discount * 100}%
                         </div>
                       )}
                       <span className="font-bold">{p.name}</span>
                     </div>
                   ))}
                 </div>
                 <div>
                   <Text className="block font-bold mb-1 text-slate-700">Ngày bắt đầu hiệu lực:</Text>
                   <DatePicker 
                     format="DD/MM/YYYY" 
                     value={newStartDate}
                     onChange={(val) => val && setNewStartDate(val)} 
                     className="w-full h-10 rounded-lg" 
                     minDate={dayjs()}
                   />
                 </div>
               </div>

               <Card className="shadow-sm border-slate-200 bg-white">
                 <Space direction="vertical" className="w-full">
                   <div className="flex justify-between">
                     <Text className="text-slate-500">Ngày hết hạn dự kiến:</Text>
                     <Text strong className="text-green-600">{newExpiry}</Text>
                   </div>
                   <Divider className="my-2" />
                   <div className="flex justify-between">
                     <Text className="text-slate-500">Phí cơ bản:</Text>
                     <Text strong>{baseFee.toLocaleString()} ₫</Text>
                   </div>
                   {discountAmount > 0 && (
                     <div className="flex justify-between">
                       <Text className="text-green-500">Chiết khấu ưu đãi:</Text>
                       <Text strong className="text-green-600">- {discountAmount.toLocaleString()} ₫</Text>
                     </div>
                   )}
                   <div className="bg-slate-50 p-3 rounded-lg mt-2 flex justify-between items-center border border-slate-200">
                     <Text strong className="text-slate-600">TỔNG THANH TOÁN:</Text>
                     <Text className="text-xl font-black text-blue-600">{totalFee.toLocaleString()} ₫</Text>
                   </div>
                 </Space>
               </Card>

               <div>
                 <Text className="block font-bold mb-3 text-slate-700">Phương thức thanh toán:</Text>
                 <Radio.Group 
                   onChange={e => setNewGateway(e.target.value)} 
                   value={newGateway}
                   className="w-full flex flex-col space-y-3"
                 >
                   {GATEWAYS.map(gw => (
                     <Radio.Button 
                       key={gw.id} 
                       value={gw.id}
                       className={`h-14 flex items-center px-4 rounded-xl border-2 transition-all ${newGateway === gw.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                     >
                       <div className="flex items-center space-x-3 w-full">
                         <img src={gw.icon} alt={gw.name} className="h-6 object-contain" />
                         <span className="font-bold text-slate-700">{gw.name}</span>
                       </div>
                     </Radio.Button>
                   ))}
                 </Radio.Group>
               </div>

               <Button 
                 type="primary" 
                 size="large" 
                 className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 animate-pulse mt-4"
                 onClick={() => handleConfirmRegister(totalFee)}
               >
                 THANH TOÁN ĐĂNG KÝ
               </Button>
             </div>
           );
        })()}
      </Drawer>

      <Modal
        open={isRegQRModalVisible}
        footer={null}
        closable={!isRegSuccess}
        onCancel={() => !isRegSuccess && setIsRegQRModalVisible(false)}
        centered
        maskClosable={false}
        width={400}
      >
        <div className="text-center py-6">
          {!isRegSuccess ? (
            <>
              <Title level={4} className="mb-2 text-slate-800">Quét mã QR để thanh toán</Title>
              <Text className="block mb-6 text-slate-500">Mở ứng dụng Ngân hàng hoặc Ví điện tử</Text>
              
              <div className="relative inline-block mb-6">
                <div className="bg-white p-4 border-2 border-dashed border-slate-300 rounded-2xl shadow-sm relative z-10 flex justify-center items-center h-[240px] w-[240px]">
                  {regPaymentUrl ? <QRCode value={regPaymentUrl} size={200} /> : <Spin size="large" />}
                </div>
                <style>
                  {`
                    @keyframes scanReg {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(220px); }
                      100% { transform: translateY(0); }
                    }
                  `}
                </style>
                {regPaymentUrl && <div className="absolute top-2 left-2 w-[calc(100%-16px)] h-1 bg-green-500 shadow-[0_0_15px_#22c55e] z-20" style={{ animation: 'scanReg 2s ease-in-out infinite' }}></div>}
              </div>
              
              <Text className="block text-slate-500 mb-6 font-mono bg-slate-100 py-2 rounded-lg break-all px-2 text-xs">
                {newGateway === 'PAYPAL' ? (
                  <a href={regPaymentUrl} target="_blank" rel="noreferrer">Mở PayPal Checkout</a>
                ) : (
                  <a href={regPaymentUrl} target="_blank" rel="noreferrer">Mở PayOS Checkout</a>
                )}
              </Text>
              
              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Spin size="small" />
                <Text>Đang chờ thanh toán ({regCountdown}s)...</Text>
              </div>
            </>
          ) : (
            <div className="animate-fade-in py-8">
              <CheckCircleOutlined className="text-[80px] text-green-500 mb-6" />
              <Title level={3} className="text-slate-800">Đăng ký thành công!</Title>
              <Text className="block text-slate-500 mb-2">Vé tháng của bạn đã được kích hoạt.</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
    </>
  );
};
