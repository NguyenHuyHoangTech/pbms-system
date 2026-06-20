import React, { useState } from 'react';
import { 
  Card, Typography, Table, Tag, Button, message, Space, Row, Col, 
  Statistic, DatePicker, Select, Input, Drawer, Timeline, Alert, Divider, Upload
} from 'antd';
import { 
  DollarOutlined, CheckCircleOutlined, SyncOutlined, CopyOutlined, 
  WarningOutlined, InboxOutlined, MoreOutlined, CloseCircleOutlined, UploadOutlined, FilterOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Dragger } = Upload;
const { TextArea } = Input;

interface RefundRecord {
  id: string;
  customerName: string;
  registeredName: string; // Tên đăng ký App
  plateNumber: string;
  bookingTime: string;
  expectedInTime: string;
  cancelTime: string;
  paidAmount: number;
  penaltyFee: number;
  refundAmount: number;
  status: 'PENDING' | 'REFUNDED' | 'REJECTED';
  bankName: string;
  accountNumber: string;
  accountName: string;
  rejectReason?: string;
}

const INITIAL_MOCK_DATA: RefundRecord[] = [
  {
    id: 'REF-1001',
    customerName: 'Nguyễn Văn A',
    registeredName: 'Nguyễn Văn A',
    plateNumber: '51G-123.45',
    bookingTime: '2023-10-25 08:00',
    expectedInTime: '2023-10-25 09:00',
    cancelTime: '2023-10-25 08:15',
    paidAmount: 50000,
    penaltyFee: 10000,
    refundAmount: 40000,
    status: 'PENDING',
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountName: 'NGUYEN VAN A'
  },
  {
    id: 'REF-1002',
    customerName: 'Trần Thị B',
    registeredName: 'Trần Thị Bảo', // Mismatch name
    plateNumber: '29A-678.90',
    bookingTime: '2023-10-25 10:00',
    expectedInTime: '2023-10-25 14:00',
    cancelTime: '2023-10-25 11:30',
    paidAmount: 50000,
    penaltyFee: 0,
    refundAmount: 50000,
    status: 'PENDING',
    bankName: 'Techcombank',
    accountNumber: '190333444555',
    accountName: 'TRAN THI B'
  },
  {
    id: 'REF-1003',
    customerName: 'Lê Văn C',
    registeredName: 'Lê Văn C',
    plateNumber: '60C-333.22',
    bookingTime: '2023-10-24 14:00',
    expectedInTime: '2023-10-24 18:00',
    cancelTime: '2023-10-24 14:10',
    paidAmount: 50000,
    penaltyFee: 0,
    refundAmount: 50000,
    status: 'REFUNDED',
    bankName: 'MB Bank',
    accountNumber: '0987654321',
    accountName: 'LE VAN C'
  }
];

export const RefundManagementScreen = () => {
  const [data, setData] = useState<RefundRecord[]>(INITIAL_MOCK_DATA);
  const [selectedRecord, setSelectedRecord] = useState<RefundRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Processing States
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const pendingCount = data.filter(d => d.status === 'PENDING').length;
  const totalPendingAmount = data.filter(d => d.status === 'PENDING').reduce((acc, curr) => acc + curr.refundAmount, 0);
  const totalRefundedToday = data.filter(d => d.status === 'REFUNDED').reduce((acc, curr) => acc + curr.refundAmount, 0);

  const handleOpenDrawer = (record: RefundRecord) => {
    setSelectedRecord(record);
    setProofUploaded(false);
    setIsRejecting(false);
    setRejectReason('');
    setIsDrawerOpen(true);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã copy ${type}!`);
  };

  const handleApprove = () => {
    if (!selectedRecord) return;
    message.loading({ content: 'Đang xử lý đóng đơn...', key: 'process' });
    setTimeout(() => {
      setData(prev => prev.map(item => 
        item.id === selectedRecord.id ? { ...item, status: 'REFUNDED' } : item
      ));
      setIsDrawerOpen(false);
      message.success({ content: `Đã hoàn tiền thành công cho mã ${selectedRecord.id}!`, key: 'process', duration: 3 });
    }, 1000);
  };

  const handleReject = () => {
    if (!selectedRecord) return;
    if (!rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối!');
      return;
    }
    message.loading({ content: 'Đang từ chối yêu cầu...', key: 'process' });
    setTimeout(() => {
      setData(prev => prev.map(item => 
        item.id === selectedRecord.id ? { ...item, status: 'REJECTED', rejectReason } : item
      ));
      setSelectedRecord({ ...selectedRecord, status: 'REJECTED', rejectReason });
      setIsDrawerOpen(false);
      message.success({ content: `Đã từ chối đơn hoàn tiền ${selectedRecord.id}!`, key: 'process', duration: 3 });
    }, 1000);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        setProofUploaded(true);
        onSuccess?.('ok');
        message.success('Tải ảnh minh chứng thành công!');
      }, 1000);
    },
    onRemove: () => {
      setProofUploaded(false);
    }
  };

  const columns = [
    {
      title: 'Mã Yêu Cầu',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: RefundRecord) => (
        <div>
          <Text strong>{text}</Text>
          <div className="text-xs text-gray-500 mt-1">{record.plateNumber}</div>
        </div>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'TG Hủy (Cancel Time)',
      dataIndex: 'cancelTime',
      key: 'cancelTime',
    },
    {
      title: 'Số tiền Cần hoàn',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (amount: number) => <Text strong className="text-orange-600">{amount.toLocaleString()} VND</Text>
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        if (status === 'REFUNDED') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Đã hoàn</Tag>;
        }
        if (status === 'REJECTED') {
          return <Tag color="error" icon={<CloseCircleOutlined />}>Từ chối</Tag>;
        }
        return <Tag color="warning" icon={<SyncOutlined spin />}>Chờ xử lý</Tag>;
      }
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: RefundRecord) => (
        <Button 
          type="text" 
          icon={<MoreOutlined />} 
          onClick={() => handleOpenDrawer(record)}
        />
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 pb-24">
      {/* GLOBAL HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800 flex items-center">
            <DollarOutlined className="mr-3 text-green-600" /> Quản lý Hoàn tiền
          </Title>
          <Text type="secondary">Xử lý các yêu cầu hủy đặt chỗ và hoàn tiền cọc cho khách hàng</Text>
        </div>
      </div>

      {/* KHU VỰC 1: TOP BAR & KPI */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className={`shadow-sm ${pendingCount > 0 ? 'border-orange-300 bg-orange-50/30' : ''}`}>
            <Statistic 
              title={<span className={pendingCount > 0 ? 'text-orange-600 font-semibold animate-pulse' : ''}>Yêu cầu chờ xử lý</span>}
              value={pendingCount} 
              suffix="Tickets" 
              valueStyle={{ color: pendingCount > 0 ? '#d97706' : '#000', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm">
            <Statistic 
              title="Tổng tiền Cần hoàn (Pending)" 
              value={totalPendingAmount} 
              suffix="VNĐ" 
              valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm">
            <Statistic 
              title="Đã hoàn hôm nay" 
              value={totalRefundedToday} 
              suffix="VNĐ" 
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-6">
        <div className="flex gap-4">
          <Select defaultValue="PENDING" className="w-40" options={[
            {label: 'Chờ xử lý', value: 'PENDING'},
            {label: 'Đã hoàn', value: 'REFUNDED'},
            {label: 'Từ chối', value: 'REJECTED'},
            {label: 'Tất cả', value: 'ALL'}
          ]} />
          <RangePicker format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} className="w-64" />
          <Button type="primary" icon={<FilterOutlined />}>Lọc</Button>
          <Search placeholder="Nhập Mã đơn hoặc Biển số xe..." className="w-80" allowClear />
          <Button>Xuất File Excel</Button>
        </div>
      </Card>

      {/* KHU VỰC 2: DATA TABLE */}
      <Card className="shadow-sm rounded-xl border-slate-200" bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => record.status === 'PENDING' ? 'bg-orange-50/50' : ''}
        />
      </Card>

      {/* KHU VỰC 3: RIGHT DRAWER (MASTER-DETAIL) */}
      <Drawer
        title={<span className="font-bold text-lg">Chi tiết Yêu cầu: {selectedRecord?.id}</span>}
        placement="right"
        width={500}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        footer={
          selectedRecord?.status === 'PENDING' && (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex justify-between items-center w-full">
                <Button danger onClick={() => setIsRejecting(!isRejecting)}>
                  Từ chối Hoàn tiền
                </Button>
                <Button 
                  type="primary" 
                  className="bg-green-600 hover:bg-green-500" 
                  disabled={!proofUploaded}
                  onClick={handleApprove}
                >
                  Đã Chuyển Khoản & Đóng Đơn
                </Button>
              </div>
              {isRejecting && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-2">
                  <Text strong className="text-red-600 block mb-2">Lý do từ chối:</Text>
                  <TextArea 
                    rows={3} 
                    placeholder="VD: Sai thông tin tài khoản, đã liên hệ khách..." 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button danger type="primary" onClick={handleReject}>Xác nhận Từ Chối</Button>
                  </div>
                </div>
              )}
            </div>
          )
        }
      >
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            
            {/* Status Banner */}
            {selectedRecord.status === 'REFUNDED' && (
              <Alert message="Đơn này đã được hoàn tiền thành công." type="success" showIcon />
            )}
            {selectedRecord.status === 'REJECTED' && (
              <Alert 
                message="Đơn này đã bị từ chối hoàn tiền." 
                description={<Text className="text-red-700">Lý do: {selectedRecord.rejectReason || 'Không có lý do'}</Text>}
                type="error" 
                showIcon 
              />
            )}



            {/* Phần A: Cancellation Audit */}
            <div>
              <Title level={5} className="text-indigo-800 border-b pb-2">A. Phân tích Chính sách Hủy</Title>
              <Timeline className="mt-4"
                items={[
                  { color: 'green', children: `Giờ khách đặt: ${selectedRecord.bookingTime}` },
                  { color: 'blue', children: `Giờ dự kiến vào: ${selectedRecord.expectedInTime}` },
                  { color: 'red', children: `Giờ khách Hủy: ${selectedRecord.cancelTime}` },
                ]}
              />
              <div className="bg-slate-100 p-4 rounded-lg flex flex-col gap-2">
                <div className="flex justify-between">
                  <Text>Tiền khách đã thanh toán:</Text>
                  <Text strong>{selectedRecord.paidAmount.toLocaleString()} đ</Text>
                </div>
                <div className="flex justify-between text-red-600">
                  <Text type="danger">Phí phạt hủy muộn:</Text>
                  <Text strong>- {selectedRecord.penaltyFee.toLocaleString()} đ</Text>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Text strong className="text-base">Thực nhận (Cần chuyển):</Text>
                  <Text strong className="text-2xl text-red-600">{selectedRecord.refundAmount.toLocaleString()} đ</Text>
                </div>
              </div>
            </div>

            {/* Phần B: Customer Bank Info */}
            <div>
              <Title level={5} className="text-indigo-800 border-b pb-2">B. Thông tin Nhận tiền</Title>
              
              {selectedRecord.customerName !== selectedRecord.registeredName && (
                <Alert 
                  message="Cảnh báo lệch thông tin!" 
                  description={`Tên chủ thẻ không khớp với Tên tài khoản App (${selectedRecord.registeredName}). Vui lòng kiểm tra kỹ trước khi chuyển.`}
                  type="warning" 
                  showIcon 
                  icon={<WarningOutlined />}
                  className="mb-4"
                />
              )}

              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Ngân hàng</div>
                    <div className="font-bold text-gray-800">{selectedRecord.bankName}</div>
                  </div>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(selectedRecord.bankName, 'Ngân hàng')} />
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Số Tài Khoản</div>
                    <div className="font-bold text-lg text-blue-600 font-mono tracking-wider">{selectedRecord.accountNumber}</div>
                  </div>
                  <Button type="primary" ghost icon={<CopyOutlined />} onClick={() => handleCopy(selectedRecord.accountNumber, 'Số tài khoản')} />
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tên Chủ Tài Khoản</div>
                    <div className="font-bold text-gray-800">{selectedRecord.accountName}</div>
                  </div>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(selectedRecord.accountName, 'Tên chủ tài khoản')} />
                </div>
              </div>
            </div>

            {/* Phần C: Proof Upload */}
            {selectedRecord.status === 'PENDING' && (
              <div>
                <Title level={5} className="text-indigo-800 border-b pb-2 mb-4">C. Minh chứng Chuyển khoản</Title>
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined className="text-blue-500" />
                  </p>
                  <p className="ant-upload-text font-semibold">Click hoặc Kéo thả ảnh Ủy nhiệm chi vào đây</p>
                  <p className="ant-upload-hint px-4 text-xs">
                    Để đảm bảo an toàn kiểm toán, Kế toán bắt buộc phải tải lên hình ảnh chụp giao dịch chuyển khoản thành công trước khi đóng đơn.
                  </p>
                </Dragger>
              </div>
            )}

          </div>
        )}
      </Drawer>

    </div>
  );
};
