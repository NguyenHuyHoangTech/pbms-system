import React, { useState } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Input, DatePicker, Select, 
  Row, Col, Statistic, Drawer, Timeline, Divider 
} from 'antd';
import { 
  ScheduleOutlined, SearchOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SyncOutlined, ClockCircleOutlined, 
  DollarOutlined, RightCircleOutlined, FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PreBooking {
  id: string;
  plate: string;
  expectedIn: string;
  expectedOut: string;
  actualIn: string | null;
  actualOut: string | null;
  baseFee: number;
  penaltyFee: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  creationTime: string;
  paymentTime: string | null;
  slotId: string | null;
}

const MOCK_BOOKINGS: PreBooking[] = [
  {
    id: 'BK-2023-001', plate: '51G-123.45', expectedIn: '10:00', expectedOut: '14:00',
    actualIn: '09:55', actualOut: null, baseFee: 50000, penaltyFee: 0,
    status: 'ONGOING', creationTime: '08:00', paymentTime: '08:05', slotId: 'A-05'
  },
  {
    id: 'BK-2023-002', plate: '29A-678.90', expectedIn: '15:00', expectedOut: '18:00',
    actualIn: null, actualOut: null, baseFee: 40000, penaltyFee: 0,
    status: 'UPCOMING', creationTime: '11:00', paymentTime: '11:02', slotId: 'B-12'
  },
  {
    id: 'BK-2023-003', plate: '60C-333.22', expectedIn: '08:00', expectedOut: '10:00',
    actualIn: '08:10', actualOut: '12:00', baseFee: 30000, penaltyFee: 20000,
    status: 'COMPLETED', creationTime: '07:00', paymentTime: '07:05', slotId: 'A-01'
  },
  {
    id: 'BK-2023-004', plate: '51H-555.66', expectedIn: '12:00', expectedOut: '15:00',
    actualIn: null, actualOut: null, baseFee: 50000, penaltyFee: 0,
    status: 'CANCELLED', creationTime: '09:00', paymentTime: '09:05', slotId: null
  }
];

export const PreBookingManagementScreen = () => {
  const [selectedRecord, setSelectedRecord] = useState<PreBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const upcomingCount = MOCK_BOOKINGS.filter(b => b.status === 'UPCOMING').length;
  const ongoingCount = MOCK_BOOKINGS.filter(b => b.status === 'ONGOING').length;
  const completedCount = MOCK_BOOKINGS.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = MOCK_BOOKINGS.filter(b => b.status === 'CANCELLED').length;

  const handleOpenDrawer = (record: PreBooking) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    { title: 'Mã Đơn', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Biển số', dataIndex: 'plate', key: 'plate', render: (text: string) => <Tag color="blue" className="font-bold text-base">{text}</Tag> },
    { 
      title: 'Dự kiến (In - Out)', 
      key: 'expected', 
      render: (_: any, record: PreBooking) => (
        <Text><ClockCircleOutlined className="mr-1 text-gray-400"/>{record.expectedIn} - {record.expectedOut}</Text>
      ) 
    },
    { 
      title: 'Vào thực tế', 
      dataIndex: 'actualIn', 
      key: 'actualIn',
      render: (val: string | null) => val ? <Text className="text-green-600 font-bold">{val}</Text> : <Text type="secondary">Chưa vào</Text>
    },
    { 
      title: 'Đã thanh toán', 
      dataIndex: 'baseFee', 
      key: 'baseFee',
      render: (val: number) => <Text strong>{val.toLocaleString()} đ</Text>
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        if (status === 'UPCOMING') return <Tag color="processing" icon={<SyncOutlined spin />}>Sắp Tới</Tag>;
        if (status === 'ONGOING') return <Tag color="warning" icon={<RightCircleOutlined />}>Đang Trong Bãi</Tag>;
        if (status === 'COMPLETED') return <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn Thành</Tag>;
        if (status === 'CANCELLED') return <Tag color="default" icon={<CloseCircleOutlined />}>Đã Hủy</Tag>;
        return <Tag>{status}</Tag>;
      }
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: PreBooking) => (
        <Button type="primary" size="small" onClick={() => handleOpenDrawer(record)}>Chi tiết</Button>
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <ScheduleOutlined className="mr-3 text-indigo-600" /> Quản lý Đặt Trước (Pre-booking)
          </Title>
          <Text type="secondary">Giám sát luồng xe dự kiến đổ về bãi theo thời gian thực (Real-time Radar)</Text>
        </div>
      </div>

      {/* KPI CARDS */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500 bg-blue-50/30">
            <Statistic title="Sắp Tới (UPCOMING)" value={upcomingCount} suffix="Xe" valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500 bg-orange-50/30">
            <Statistic 
              title={<span className="text-orange-600 animate-pulse font-semibold">Đang Trong Bãi (ONGOING)</span>} 
              value={ongoingCount} suffix="Xe" valueStyle={{ color: '#d97706', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic title="Hoàn Thành (COMPLETED)" value={completedCount} suffix="Đơn" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-gray-400">
            <Statistic title="Đã Hủy (CANCELLED)" value={cancelledCount} suffix="Đơn" valueStyle={{ color: '#6b7280', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* FILTER BAR */}
      <Card className="shadow-sm mb-6">
        <div className="flex gap-4">
          <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="w-48" allowClear={false} />
          <Select defaultValue="ALL" className="w-48" options={[
            {label: 'Tất cả Trạng thái', value: 'ALL'},
            {label: 'Sắp tới', value: 'UPCOMING'},
            {label: 'Đang trong bãi', value: 'ONGOING'},
            {label: 'Hoàn thành', value: 'COMPLETED'},
            {label: 'Đã hủy', value: 'CANCELLED'}
          ]} />
          <Button type="primary" icon={<FilterOutlined />}>Lọc</Button>
          <Input 
            placeholder="Gõ Mã Booking hoặc Biển số xe..." 
            prefix={<SearchOutlined />} 
            className="w-80" 
            allowClear
          />
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="shadow-sm rounded-xl border-gray-200" bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={MOCK_BOOKINGS} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* RIGHT DRAWER: BOOKING LIFECYCLE */}
      <Drawer
        title={<span className="font-bold text-lg">Chi tiết Booking: {selectedRecord?.id}</span>}
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            
            {/* Header Info */}
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
               <div>
                 <Text type="secondary" className="block text-xs uppercase mb-1">Biển số</Text>
                 <Tag color="blue" className="m-0 font-bold text-lg">{selectedRecord.plate}</Tag>
               </div>
               <div className="text-right">
                 <Text type="secondary" className="block text-xs uppercase mb-1">Vị trí đỗ</Text>
                 {selectedRecord.slotId ? (
                   <Text strong className="text-xl text-indigo-700">{selectedRecord.slotId}</Text>
                 ) : (
                   <Text type="secondary italic">Chưa cấp</Text>
                 )}
               </div>
            </div>

            {/* Timeline */}
            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">1. Vòng đời Đơn hàng</Title>
              <Timeline className="mt-4"
                items={[
                  { 
                    color: 'blue', 
                    children: (
                      <div>
                        <Text strong>Khách tạo đơn Booking</Text><br/>
                        <Text type="secondary" className="text-xs">Lúc {selectedRecord.creationTime}</Text>
                      </div>
                    )
                  },
                  selectedRecord.paymentTime ? { 
                    color: 'green', 
                    children: (
                      <div>
                        <Text strong>Thanh toán thành công (VNPay)</Text><br/>
                        <Text type="secondary" className="text-xs">Lúc {selectedRecord.paymentTime}</Text>
                      </div>
                    )
                  } : { color: 'gray', children: <Text type="secondary">Chưa thanh toán</Text> },
                  
                  selectedRecord.status === 'CANCELLED' ? {
                    color: 'red',
                    children: <Text strong className="text-red-600">Đơn bị hủy bỏ</Text>
                  } : selectedRecord.actualIn ? { 
                    color: 'orange', 
                    children: (
                      <div>
                        <Text strong>Xe vào bãi (Check-in)</Text><br/>
                        <Text type="secondary" className="text-xs">Lúc {selectedRecord.actualIn}</Text>
                      </div>
                    )
                  } : { color: 'gray', children: <Text type="secondary">Chờ xe vào bãi</Text> },

                  (selectedRecord.status !== 'CANCELLED' && selectedRecord.actualOut) ? { 
                    color: 'green', 
                    children: (
                      <div>
                        <Text strong>Xe rời bãi (Check-out)</Text><br/>
                        <Text type="secondary" className="text-xs">Lúc {selectedRecord.actualOut}</Text>
                      </div>
                    )
                  } : (selectedRecord.status !== 'CANCELLED') ? { color: 'gray', children: <Text type="secondary">Chờ xe ra bãi</Text> } : null,
                ].filter(Boolean) as any}
              />
            </div>

            {/* Financial Breakdown */}
            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">2. Đối soát Tài chính</Title>
              <div className="bg-slate-100 p-4 rounded-lg flex flex-col gap-2 mt-4">
                <div className="flex justify-between">
                  <Text>Tiền cọc giữ chỗ (Base Fee):</Text>
                  <Text strong>{selectedRecord.baseFee.toLocaleString()} đ</Text>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <Text type="danger">Phí lố giờ (Penalty):</Text>
                  <Text strong>+ {selectedRecord.penaltyFee.toLocaleString()} đ</Text>
                </div>
                {selectedRecord.penaltyFee > 0 && (
                  <Text type="secondary" className="text-xs italic text-right mt-[-4px]">
                    (Khách ở quá giờ đăng ký: {selectedRecord.expectedOut})
                  </Text>
                )}

                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Text strong className="text-base">Tổng doanh thu Đơn:</Text>
                  <Text strong className="text-xl text-green-600">
                    {(selectedRecord.baseFee + selectedRecord.penaltyFee).toLocaleString()} đ
                  </Text>
                </div>
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
};
