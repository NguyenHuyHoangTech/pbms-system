import { simulatedDayjs } from '../../core/utils/timeProvider';
import React, { useState } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Input, DatePicker, Select, 
  Row, Col, Statistic, Drawer, Timeline, Divider, InputNumber, message, Space
} from 'antd';
import { 
  ScheduleOutlined, SearchOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SyncOutlined, ClockCircleOutlined, 
  DollarOutlined, RightCircleOutlined, FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  refundAmount?: number;
  refundStatus?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  paymentTime: string | null;
  slotName: string | null;
}

export const PreBookingManagementScreen = () => {
  const [selectedRecord, setSelectedRecord] = useState<PreBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await axiosClient.get('/system/configs');
      return res.data.data;
    }
  });

  const configObj = configs?.find((c: any) => c.configKey === 'RESERVATION_EARLY_ARRIVAL_WINDOW_MINUTES');
  const defaultWindow = configObj ? parseInt(configObj.configValue) : 30;
  const [windowMinutes, setWindowMinutes] = useState<number | null>(null);

  React.useEffect(() => {
    if (configObj && windowMinutes === null) {
      setWindowMinutes(parseInt(configObj.configValue));
    }
  }, [configObj]);

  const updateConfigMutation = useMutation({
    mutationFn: async (val: number) => {
      if (configObj) {
        await axiosClient.put(`/system/configs/${configObj.id}`, { ...configObj, configValue: val.toString() });
      } else {
        await axiosClient.post(`/system/configs`, { configKey: 'RESERVATION_EARLY_ARRIVAL_WINDOW_MINUTES', configValue: val.toString(), description: 'Minutes before reservation time when staff are notified and early arrival is allowed without penalty' });
      }
    },
    onSuccess: () => {
      message.success('Settings updated!');
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
    },
    onError: () => message.error('Failed to update setting')
  });

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
    { title: 'Single Code', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'License Plate', dataIndex: 'plateNumber', key: 'plateNumber', render: (text: string) => <Tag color="blue" className="font-bold text-base">{text}</Tag> },
    { 
      title: 'Expected (In - Duration)', 
      key: 'expected', 
      render: (_: any, record: PreBooking) => {
        const inTime = record.expectedEntryTime ? simulatedDayjs(record.expectedEntryTime).format('HH:mm DD/MM') : 'N/A';
        return <Text><ClockCircleOutlined className="mr-1 text-gray-400"/>{inTime} ({record.expectedDurationMinutes}  minute)</Text>;
      } 
    },
    { 
      title: 'Into reality', 
      dataIndex: 'actualIn', 
      key: 'actualIn',
      render: (text: string) => text ? <Text strong className="text-green-600">{text}</Text> : <Text type="secondary">-</Text> 
    },
    { 
      title: 'Out into reality', 
      dataIndex: 'actualOut', 
      key: 'actualOut',
      render: (text: string) => text ? <Text strong className="text-green-600">{text}</Text> : <Text type="secondary">-</Text>
    },
    { 
      title: 'Status', 
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
      title: 'Booking fee', 
      dataIndex: 'reservationFee', 
      key: 'reservationFee',
      render: (fee: number) => <Text strong className="text-blue-600">{(fee || 0).toLocaleString()} ₫</Text> 
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: PreBooking) => (
        <Button type="link" onClick={() => handleOpenDrawer(record)} icon={<RightCircleOutlined />}>Details</Button>
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <ScheduleOutlined className="mr-3 text-indigo-600" /> Pre-booking Management
          </Title>
          <Text type="secondary">Monitor the expected traffic flow to the parking lot in Real-time</Text>
        </div>
        <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200">
          <Text strong className="mr-2">Reservation Early Arrival Window (mins):</Text>
          <Space>
            <InputNumber 
              min={0} max={120} 
              value={windowMinutes !== null ? windowMinutes : defaultWindow} 
              onChange={val => setWindowMinutes(val as number)} 
            />
            <Button 
              type="primary" 
              onClick={() => windowMinutes !== null && updateConfigMutation.mutate(windowMinutes)}
              loading={updateConfigMutation.isPending}
            >
              Save
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500 bg-blue-50/30">
            <Statistic title="UPCOMING" value={upcomingCount} suffix="Xe" valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500 bg-orange-50/30">
            <Statistic 
              title={<span className="text-orange-600 animate-pulse font-semibold">ONGOING</span>} 
              value={ongoingCount} suffix="Xe" valueStyle={{ color: '#d97706', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic title="COMPLETED" value={completedCount} suffix="Single" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-gray-400">
            <Statistic title="Cancel (CaNCELLED)" value={cancelledCount} suffix="Single" valueStyle={{ color: '#6b7280', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-6">
        <div className="flex gap-4">
          <DatePicker defaultValue={simulatedDayjs()} format="DD/MM/YYYY" className="w-48" allowClear={false} />
          <Select defaultValue="ALL" className="w-48" options={[
            {label: 'All Status', value: 'ALL'},
            {label: 'Upcoming', value: 'UPCOMING'},
            {label: 'In the yard', value: 'ONGOING'},
            {label: 'Complete', value: 'COMPLETED'},
            {label: 'Cancelled', value: 'CANCELLED'}
          ]} />
          <Button type="primary" icon={<FilterOutlined />}>Filter</Button>
          <Input 
            placeholder="Type in Booking Code or License Plate xeeee" 
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
        title={<span className="font-bold text-lg">Details Booking: {selectedRecord?.id}</span>}
        placement="right"
        width={450}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
               <div>
                 <Text type="secondary" className="block text-xs uppercase mb-1">License Plate</Text>
                 <Tag color="blue" className="m-0 font-bold text-lg">{selectedRecord.plateNumber}</Tag>
               </div>
               <div className="text-right">
                 <Text type="secondary" className="block text-xs uppercase mb-1">Parking location</Text>
                 {selectedRecord.slotName ? (
                   <Text strong className="text-xl text-indigo-700">{selectedRecord.slotName}</Text>
                 ) : (
                   <Text type="secondary" className="italic">Not issued yet</Text>
                 )}
               </div>
            </div>

            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">1e Order life cycle</Title>
              <Timeline className="mt-4"
                items={[
                  { 
                    color: 'blue', 
                    children: (
                      <div>
                        <Text strong>Customer creates Booking order</Text><br/>
                        <Text type="secondary" className="text-xs">At the time {selectedRecord.createdAt ? simulatedDayjs(selectedRecord.createdAt).format('HH:mm DD/MM') : 'N/A'}</Text>
                      </div>
                    )
                  },
                  { 
                    color: selectedRecord.status === 'PENDING' ? 'gray' : 'green', 
                    children: (
                      <div>
                        <Text strong>{selectedRecord.status === 'PENDING' ? 'Not yet paid' : 'Reservation fee paid'}</Text><br/>
                      </div>
                    )
                  },
                  selectedRecord.status === 'CANCELLED' ? {
                    color: 'red',
                    children: (
                      <div>
                        <Text strong className="text-red-600">Application was cancelled</Text>
                        {(selectedRecord.refundAmount ?? 0) > 0 && (
                          <div className="mt-1">
                            <Text type="secondary" className="text-xs">Refund: </Text>
                            <Text strong className="text-blue-600">{selectedRecord.refundAmount!.toLocaleString()} ₫</Text>
                            <Tag color={selectedRecord.refundStatus === 'PENDING' ? 'gold' : 'green'} className="ml-2 text-[10px] leading-tight px-1 py-0">
                              {selectedRecord.refundStatus === 'PENDING' ? 'WAIT FOR COMPLETION' : 'DONE'}
                            </Tag>
                          </div>
                        )}
                        {(selectedRecord.refundAmount ?? 0) === 0 && (
                          <div className="mt-1">
                            <Text type="secondary" className="text-xs italic">No refund (Cancel late or invalid)</Text>
                          </div>
                        )}
                      </div>
                    )
                  } : selectedRecord.actualIn ? { 
                    color: 'orange', 
                    children: (
                      <div>
                        <Text strong>Vehicle entering the parking lot (Check-in)</Text><br/>
                        <Text type="secondary" className="text-xs">At the time {selectedRecord.actualIn}</Text>
                      </div>
                    )
                  } : { color: 'gray', children: <Text type="secondary">Wait for the car to enter the parking lot</Text> },

                  (selectedRecord.status !== 'CANCELLED' && selectedRecord.actualOut) ? { 
                    color: 'green', 
                    children: (
                      <div>
                        <Text strong>Check-out</Text><br/>
                        <Text type="secondary" className="text-xs">At the time {selectedRecord.actualOut}</Text>
                      </div>
                    )
                  } : (selectedRecord.status !== 'CANCELLED') ? { color: 'gray', children: <Text type="secondary">Waiting for the car to leave the parking lot</Text> } : null,
                ].filter(Boolean) as any}
              />
            </div>

            <div>
              <Title level={5} className="text-gray-800 border-b pb-2">2e Financial Control</Title>
              <div className="bg-slate-100 p-4 rounded-lg flex flex-col gap-2 mt-4">
                <div className="flex justify-between">
                  <Text>Base Fee:</Text>
                  <Text strong>{(selectedRecord.reservationFee || 0).toLocaleString()} ₫</Text>
                </div>
                
                <div className="flex justify-between text-red-600">
                  <Text type="danger">Overtime fee (Penalty):</Text>
                  <Text strong>+ {(selectedRecord.penaltyFee || 0).toLocaleString()} ₫</Text>
                </div>
                {(selectedRecord.penaltyFee || 0) > 0 && (
                  <Text type="secondary" className="text-xs italic text-right mt-[-4px]">
                    
                                                          (Guests stay beyond the expected time)
                                                        </Text>
                )}

                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Text strong className="text-base">Total Single Revenue:</Text>
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
