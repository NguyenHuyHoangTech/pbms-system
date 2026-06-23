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

import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

interface PreBooking {
  id: string;
  plateNumber: string;
  expectedEntryTime: string;
  expectedDurationMinutes: number;
  actualIn: string | null;
  actualOut: string | null;
  reservationFee: number;
  penaltyFee: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  paymentTime: string | null;
  slotName: string | null;
}

export const PreBookingManagementScreen = () => {
  const [selectedRecord, setSelectedRecord] = useState<PreBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: bookingsData } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await axiosClient.get('/customer/reservations');
      return res.data.data;
    }
  });

  const allBookings = bookingsData || [];

  const upcomingCount = allBookings.filter((b: any) => b.status === 'PENDING' || b.status === 'ACTIVE').length;
  const ongoingCount = allBookings.filter((b: any) => b.status === 'ONGOING').length;
  const completedCount = allBookings.filter((b: any) => b.status === 'COMPLETED').length;
  const cancelledCount = allBookings.filter((b: any) => b.status === 'CANCELLED').length;

  const handleOpenDrawer = (record: PreBooking) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    { title: 'Mã Đơn', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Biển số', dataIndex: 'plateNumber', key: 'plateNumber', render: (text: string) => <Tag color="blue" className="font-bold text-base">{text}</Tag> },
    { 
      title: 'Dự kiến (In - Duration)', 
      key: 'expected', 
      render: (_: any, record: PreBooking) => {
        const inTime = record.expectedEntryTime ? dayjs(record.expectedEntryTime).format('HH:mm DD/MM') : 'N/A';
        return <Text><ClockCircleOutlined className="mr-1 text-gray-400"/>{inTime} ({record.expectedDurationMinutes} phút)</Text>;
      } 
    },
    { 
      title: 'Vào thực tế', 
      dataIndex: 'actualIn', 
      key: 'actualIn',
      render: (text: string) => text ? <Text strong className="text-green-600">{text}</Text> : <Text type="secondary">-</Text> 
    },
    { 
      title: 'Ra thực tế', 
      dataIndex: 'actualOut', 
      key: 'actualOut',
      render: (text: string) => text ? <Text strong className="text-green-600">{text}</Text> : <Text type="secondary">-</Text>
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        if (status === 'PENDING') return <Tag color="gold" className="font-bold">PENDING</Tag>;
        if (status === 'ACTIVE') return <Tag color="blue" className="font-bold">ACTIVE (PAID)</Tag>;
        if (status === 'ONGOING') return <Tag color="orange" className="font-bold animate-pulse">ONGOING</Tag>;
        if (status === 'COMPLETED') return <Tag color="green" className="font-bold"><CheckCircleOutlined className="mr-1"/>COMPLETED</Tag>;
        return <Tag color="red" className="font-bold"><CloseCircleOutlined className="mr-1"/>CANCELLED</Tag>;
      }
    },
    { 
      title: 'Phí đặt', 
      dataIndex: 'reservationFee', 
      key: 'reservationFee',
      render: (fee: number) => <Text strong className="text-blue-600">{(fee || 0).toLocaleString()} ₫</Text> 
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: PreBooking) => (
        <Button type="link" onClick={() => handleOpenDrawer(record)} icon={<RightCircleOutlined />}>Chi tiết</Button>
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

      <Card className="shadow-sm rounded-xl border-gray-200" bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={allBookings} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title={<span className="font-bold text-lg">Chi tiết Booking: {selectedRecord?.id}</span>}
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
               <div>
                 <Text type="secondary" className="block text-xs uppercase mb-1">Biển số</Text>
                 <Tag color="blue" className="m-0 font-bold text-lg">{selectedRecord.plateNumber}</Tag>
               </div>
               <div className="text-right">
                 <Text type="secondary" className="block text-xs uppercase mb-1">Vị trí đỗ</Text>
                 {selectedRecord.slotName ? (
                   <Text strong className="text-xl text-indigo-700">{selectedRecord.slotName}</Text>
                 ) : (
                   <Text type="secondary italic">Chưa cấp</Text>
                 )}
               </div>
            </div>

            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">1. Vòng đời đơn hàng</Title>
              <Timeline className="mt-4"
                items={[
                  { 
                    color: 'blue', 
                    children: (
                      <div>
                        <Text strong>Khách tạo đơn Booking</Text><br/>
                        <Text type="secondary" className="text-xs">Lúc {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('HH:mm DD/MM') : 'N/A'}</Text>
                      </div>
                    )
                  },
                  { 
                    color: selectedRecord.status === 'PENDING' ? 'gray' : 'green', 
                    children: (
                      <div>
                        <Text strong>{selectedRecord.status === 'PENDING' ? 'Chưa thanh toán' : 'Đã thanh toán phí đặt chỗ'}</Text><br/>
                      </div>
                    )
                  },
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

            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">2. Đối soát Tài chính</Title>
              <div className="bg-slate-100 p-4 rounded-lg flex flex-col gap-2 mt-4">
                <div className="flex justify-between">
                  <Text>Tiền cọc giữ chỗ (Base Fee):</Text>
                  <Text strong>{(selectedRecord.reservationFee || 0).toLocaleString()} ₫</Text>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <Text type="danger">Phí lố giờ (Penalty):</Text>
                  <Text strong>+ {(selectedRecord.penaltyFee || 0).toLocaleString()} ₫</Text>
                </div>
                {(selectedRecord.penaltyFee || 0) > 0 && (
                  <Text type="secondary" className="text-xs italic text-right mt-[-4px]">
                    (Khách ở quá thời gian dự kiến)
                  </Text>
                )}

                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Text strong className="text-base">Tổng doanh thu đơn:</Text>
                  <Text strong className="text-xl text-green-600">
                    {((selectedRecord.reservationFee || 0) + (selectedRecord.penaltyFee || 0)).toLocaleString()} ₫
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
