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
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

interface MonthlyPass {
  id: string;
  user: string;
  email: string;
  phone: string;
  plate: string;
  type: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELED' | 'PENDING' | string;
  startDate: string;
  endDate: string;
}

export const MonthlyPassScreen = () => {
  const [selectedRecord, setSelectedRecord] = useState<MonthlyPass | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: monthlyPassesData, isLoading } = useQuery({
    queryKey: ['monthlyPasses'],
    queryFn: async () => {
      const res = await axiosClient.get('/operation/monthly-tickets');
      return res.data.data;
    }
  });

  const passes: MonthlyPass[] = monthlyPassesData || [];

  const activeCount = passes.filter(p => p.status === 'ACTIVE').length;
  const expiringCount = passes.filter(p => p.status === 'EXPIRING_SOON').length;
  const inactiveCount = passes.filter(p => p.status === 'EXPIRED' || p.status === 'CANCELED').length;
  

  const handleOpenDrawer = (record: MonthlyPass) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    { title: 'License Plate xe', dataIndex: 'plate', key: 'plate', render: (text: string) => <Tag color="blue" className="text-base font-bold">{text}</Tag> },
    { 
      title: 'Owner', 
      key: 'owner', 
      render: (_: any, record: MonthlyPass) => (
        <div>
          <Text strong>{record.user}</Text>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ) 
    },
    { title: 'Vehicle Type', dataIndex: 'type', key: 'type', render: (text: string) => <Text>{text}</Text> },
    { 
      title: 'Current cycle', 
      key: 'cycle', 
      render: (_: any, record: MonthlyPass) => (
        <Text className="text-xs">{record.startDate} <br/> {record.endDate !== '-' ? 'arrive' : ''} {record.endDate}</Text>
      )
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        if (status === 'ACTIVE') return <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>;
        if (status === 'EXPIRING_SOON') return <Tag color="warning" icon={<ExclamationCircleOutlined />}>Expiring Soon</Tag>;
        if (status === 'EXPIRED') return <Tag color="error">Expired</Tag>;
        if (status === 'CANCELED') return <Tag color="default">Cancel</Tag>;
        if (status === 'PENDING') return <Tag color="processing">Waiting for Approval</Tag>;
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

      <div className="mb-6">
        <Title level={2} className="m-0 text-gray-800 flex items-center">
          <IdcardOutlined className="mr-3 text-indigo-600" /> Customer Management Monthly Passes
        </Title>
        <Text type="secondary">System CRM Manage subscriptions, maintain cash flow and control long-term capacity</Text>
      </div>

      {/* KPI CARDS */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic title="Active (aCTIVE)" value={activeCount} suffix="Subscribe" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-orange-500 bg-orange-50/30">
            <Statistic 
              title={<span className="text-orange-600 animate-pulse font-semibold">Expiring Soon (&lt; 7 Days)</span>} 
              value={expiringCount} 
              suffix="Subscribe" 
              valueStyle={{ color: '#d97706', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm border-l-4 border-l-gray-400">
            <Statistic title="Expired / Cancel" value={inactiveCount} suffix="Subscribe" valueStyle={{ color: '#6b7280', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* FILTER BAR */}
      <Card className="shadow-sm mb-6">
        <div className="flex gap-4">
          <Select defaultValue="ALL" className="w-40" options={[
            {label: 'all Vehicle Types', value: 'ALL'},
            {label: 'Car', value: 'CAR'},
            {label: 'Motorbike', value: 'MOTO'}
          ]} />
          <Select defaultValue="ALL" className="w-48" options={[
            {label: 'All Status', value: 'ALL'},
            {label: 'Active', value: 'ACTIVE'},
            {label: 'About to expire', value: 'EXPIRING_SOON'},
            {label: 'Expired/Lock', value: 'EXPIRED'},
            {label: 'Waiting for approval', value: 'PENDING'}
          ]} />
          <Button type="primary" icon={<FilterOutlined />}>Filter</Button>
          <Input 
            placeholder="Type in Vehicle License Plate, Email, Phone Number" 
            prefix={<SearchOutlined />} 
            className="w-80" 
            allowClear
          />
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="shadow-sm rounded-xl border-gray-200" bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={passes} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          loading={isLoading}
          rowClassName={(record) => record.status === 'EXPIRING_SOON' ? 'bg-yellow-50' : ''}
        />
      </Card>

      {/* RIGHT DRAWER: CRM DETAIL */}
      <Drawer
        title={<span className="font-bold text-lg">Subscriber Profile: {selectedRecord?.id}</span>}
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: <span><UserOutlined />  Customer profile</span>,
              children: (
                <div className="flex flex-col gap-4 mt-2">
                  {selectedRecord.status === 'EXPIRING_SOON' && (
                    <Alert message="Tickets are about to expire! Please call to remind the Customer to renew to avoid service interruption" type="warning" showIcon />
                  )}
                  <Card size="small" title="Personal Information" className="bg-slate-50">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between"><Text type="secondary">Full name:</Text> <Text strong>{selectedRecord.user}</Text></div>
                      <div className="flex justify-between"><Text type="secondary">Email:</Text> <Text strong>{selectedRecord.email}</Text></div>
                      <div className="flex justify-between"><Text type="secondary">Phone:</Text> <Text strong>{selectedRecord.phone}</Text></div>
                    </div>
                  </Card>
                  <Card size="small" title="Vehicle information" className="bg-slate-50">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between"><Text type="secondary">License Plate:</Text> <Tag color="blue" className="m-0 font-bold">{selectedRecord.plate}</Tag></div>
                      <div className="flex justify-between"><Text type="secondary">Vehicle Type:</Text> <Text strong><CarOutlined className="mr-1"/>{selectedRecord.type}</Text></div>
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: '2',
              label: <span><HistoryOutlined />  Payment History</span>,
              children: (
                <div className="mt-4">
                  <div className="text-center py-6 text-gray-400 italic">
                    
                                              (The feature to view payment history is being developed)
                                            </div>
                </div>
              )
            }
          ]} />
        )}
      </Drawer>
    </div>
  );
};
