import React, { useState } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, Input, Select, 
  Alert, Statistic, Row, Col, Drawer, Tabs, Timeline, Divider 
} from 'antd';
import { 
  IdcardOutlined, SearchOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, FilterOutlined, MoreOutlined, 
  ExclamationCircleOutlined, HistoryOutlined, UserOutlined, CarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface MonthlyPass {
  id: string;
  user: string;
  email: string;
  phone: string;
  plate: string;
  type: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELED' | 'PENDING';
  startDate: string;
  endDate: string;
}

const MOCK_PASSES: MonthlyPass[] = [
  { id: 'MP-1001', user: 'Nguyen Van A', email: 'nva@gmail.com', phone: '0901234567', plate: '51G-123.45', type: 'Ô tô', status: 'PENDING', startDate: '-', endDate: '-' },
  { id: 'MP-1002', user: 'Tran Thi B', email: 'ttb@gmail.com', phone: '0912345678', plate: '59A-999.99', type: 'Ô tô', status: 'ACTIVE', startDate: '2023-09-18', endDate: '2026-07-18' },
  { id: 'MP-1003', user: 'Le Van C', email: 'lvc@gmail.com', phone: '0987654321', plate: '60B-111.22', type: 'Xe máy', status: 'EXPIRED', startDate: '2023-05-10', endDate: '2023-06-10' },
  { id: 'MP-1004', user: 'Pham D', email: 'phamd@gmail.com', phone: '0922334455', plate: '51H-555.66', type: 'Xe điện', status: 'EXPIRING_SOON', startDate: '2023-09-25', endDate: '2023-10-25' },
];

export const MonthlyPassScreen = () => {
  const [selectedRecord, setSelectedRecord] = useState<MonthlyPass | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeCount = MOCK_PASSES.filter(p => p.status === 'ACTIVE').length;
  const expiringCount = MOCK_PASSES.filter(p => p.status === 'EXPIRING_SOON').length;
  const inactiveCount = MOCK_PASSES.filter(p => p.status === 'EXPIRED' || p.status === 'CANCELED').length;
  
  // Fake capacity metric
  const currentCapacityPercent = 85;

  const handleOpenDrawer = (record: MonthlyPass) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    { title: 'Biển số xe', dataIndex: 'plate', key: 'plate', render: (text: string) => <Tag color="blue" className="text-base font-bold">{text}</Tag> },
    { 
      title: 'Chủ sở hữu', 
      key: 'owner', 
      render: (_: any, record: MonthlyPass) => (
        <div>
          <Text strong>{record.user}</Text>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ) 
    },
    { title: 'Loại xe', dataIndex: 'type', key: 'type', render: (text: string) => <Text>{text}</Text> },
    { 
      title: 'Chu kỳ hiện tại', 
      key: 'cycle', 
      render: (_: any, record: MonthlyPass) => (
        <Text className="text-xs">{record.startDate} <br/> {record.endDate !== '-' ? 'đến' : ''} {record.endDate}</Text>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        if (status === 'ACTIVE') return <Tag color="success" icon={<CheckCircleOutlined />}>Đang Hoạt Động</Tag>;
        if (status === 'EXPIRING_SOON') return <Tag color="warning" icon={<ExclamationCircleOutlined />}>Sắp Hết Hạn</Tag>;
        if (status === 'EXPIRED') return <Tag color="error">Đã Hết Hạn</Tag>;
        if (status === 'CANCELED') return <Tag color="default">Đã Hủy</Tag>;
        if (status === 'PENDING') return <Tag color="processing">Chờ Duyệt</Tag>;
        return <Tag>{status}</Tag>;
      }
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: MonthlyPass) => (
        <Button type="text" icon={<MoreOutlined />} onClick={() => handleOpenDrawer(record)} />
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      {/* CẢNH BÁO TOÀN CỤC */}
      {currentCapacityPercent > 80 && (
        <Alert
          message="CẢNH BÁO SỨC CHỨA: Tỷ lệ lấp đầy vé tháng đang ở mức rủi ro!"
          description={`Hiện tại lượng khách đăng ký vé tháng đã chiếm ${currentCapacityPercent}% tổng số slot quy hoạch. Vui lòng mở rộng thêm Zone Vé tháng hoặc tạm ngưng nhận đăng ký mới để tránh Overbook.`}
          type="warning"
          showIcon
          className="mb-6 font-semibold"
          action={
            <Button size="small" type="primary" danger>Khóa Đăng ký Mới</Button>
          }
        />
      )}

      <div className="mb-6">
        <Title level={2} className="m-0 text-gray-800 flex items-center">
          <IdcardOutlined className="mr-3 text-indigo-600" /> Quản lý Khách Hàng Vé Tháng
        </Title>
        <Text type="secondary">Hệ thống CRM quản lý thuê bao, duy trì dòng tiền và kiểm soát dung lượng dài hạn</Text>
      </div>

      {/* KPI CARDS */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic title="Đang Hoạt Động (ACTIVE)" value={activeCount} suffix="Thuê bao" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-orange-500 bg-orange-50/30">
            <Statistic 
              title={<span className="text-orange-600 animate-pulse font-semibold">Sắp Hết Hạn (&lt; 7 Ngày)</span>} 
              value={expiringCount} 
              suffix="Thuê bao" 
              valueStyle={{ color: '#d97706', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-gray-400">
            <Statistic title="Đã Hết Hạn / Hủy" value={inactiveCount} suffix="Thuê bao" valueStyle={{ color: '#6b7280', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* FILTER BAR */}
      <Card className="shadow-sm mb-6">
        <div className="flex gap-4">
          <Select defaultValue="ALL" className="w-40" options={[
            {label: 'Tất cả Loại Xe', value: 'ALL'},
            {label: 'Ô tô', value: 'CAR'},
            {label: 'Xe máy', value: 'MOTO'}
          ]} />
          <Select defaultValue="ALL" className="w-48" options={[
            {label: 'Tất cả Trạng thái', value: 'ALL'},
            {label: 'Đang hoạt động', value: 'ACTIVE'},
            {label: 'Sắp hết hạn', value: 'EXPIRING_SOON'},
            {label: 'Đã hết hạn/Khóa', value: 'EXPIRED'},
            {label: 'Chờ duyệt', value: 'PENDING'}
          ]} />
          <Button type="primary" icon={<FilterOutlined />}>Lọc</Button>
          <Input 
            placeholder="Gõ Biển số xe, Email, Số ĐT..." 
            prefix={<SearchOutlined />} 
            className="w-80" 
            allowClear
          />
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="shadow-sm rounded-xl border-gray-200" bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={MOCK_PASSES} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => record.status === 'EXPIRING_SOON' ? 'bg-yellow-50' : ''}
        />
      </Card>

      {/* RIGHT DRAWER: CRM DETAIL */}
      <Drawer
        title={<span className="font-bold text-lg">Hồ Sơ Thuê Bao: {selectedRecord?.id}</span>}
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: <span><UserOutlined /> Hồ sơ Khách hàng</span>,
              children: (
                <div className="flex flex-col gap-4 mt-2">
                  {selectedRecord.status === 'EXPIRING_SOON' && (
                    <Alert message="Vé sắp hết hạn! Hãy gọi điện nhắc nhở khách hàng gia hạn để tránh gián đoạn dịch vụ." type="warning" showIcon />
                  )}
                  <Card size="small" title="Thông tin Cá nhân" className="bg-slate-50">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between"><Text type="secondary">Họ tên:</Text> <Text strong>{selectedRecord.user}</Text></div>
                      <div className="flex justify-between"><Text type="secondary">Email:</Text> <Text strong>{selectedRecord.email}</Text></div>
                      <div className="flex justify-between"><Text type="secondary">Điện thoại:</Text> <Text strong>{selectedRecord.phone}</Text></div>
                    </div>
                  </Card>
                  <Card size="small" title="Thông tin Phương tiện" className="bg-slate-50">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between"><Text type="secondary">Biển số:</Text> <Tag color="blue" className="m-0 font-bold">{selectedRecord.plate}</Tag></div>
                      <div className="flex justify-between"><Text type="secondary">Loại xe:</Text> <Text strong><CarOutlined className="mr-1"/>{selectedRecord.type}</Text></div>
                    </div>
                  </Card>
                  {selectedRecord.status === 'PENDING' && (
                    <div className="mt-4 flex gap-3">
                      <Button type="primary" className="flex-1 bg-green-600">Duyệt Yêu Cầu</Button>
                      <Button danger className="flex-1">Từ Chối</Button>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: '2',
              label: <span><HistoryOutlined /> Lịch sử Thanh toán</span>,
              children: (
                <div className="mt-4">
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: (
                          <div className="mb-4">
                            <Text strong>Gia hạn 1 Tháng</Text>
                            <div className="text-xs text-gray-500">25/09/2023 09:30 AM</div>
                            <div className="mt-1"><Tag color="success">Thành công (VNPay)</Tag> <Text strong>+ 150.000đ</Text></div>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div className="mb-4">
                            <Text strong>Gia hạn 1 Tháng</Text>
                            <div className="text-xs text-gray-500">25/08/2023 10:15 AM</div>
                            <div className="mt-1"><Tag color="success">Thành công (Tiền mặt)</Tag> <Text strong>+ 150.000đ</Text></div>
                          </div>
                        ),
                      },
                      {
                        color: 'red',
                        children: (
                          <div className="mb-4">
                            <Text strong>Gia hạn 1 Tháng</Text>
                            <div className="text-xs text-gray-500">24/08/2023 15:00 PM</div>
                            <div className="mt-1"><Tag color="error">Thất bại (Lỗi thẻ)</Tag></div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              )
            }
          ]} />
        )}
      </Drawer>
    </div>
  );
};
