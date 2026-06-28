import React, { useState } from 'react';
import { 
  Typography, Table, Tag, Button, InputNumber, message, 
  DatePicker, Input, Tabs, Badge, Drawer, Space, Divider,
  Row, Col, Image, Form, Alert, Steps, Timeline, Avatar, List,
  Card, Descriptions
} from 'antd';
import { 
  CustomerServiceOutlined, 
  SearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EnvironmentOutlined,
  BellOutlined,
  UserOutlined,
  SendOutlined,
  StopOutlined,
  CameraOutlined,
  IdcardOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { TextArea } = Input;

export const TicketCenterScreen = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // States for specific tab logic
  const [feeAdjustStep, setFeeAdjustStep] = useState(0); // 0: Locked, 1: Paused, 2: Done
  const [overrideFee, setOverrideFee] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const queryClient = useQueryClient();

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axiosClient.get('/incidents');
      return res.data.data;
    }
  });

  const incidents = incidentsData || [];
  
  const lprData = incidents.filter((i: any) => i.type === 'LPR_MISMATCH');
  const lostCardData = incidents.filter((i: any) => i.type === 'LOST_CARD');
  const feeAdjustData = incidents.filter((i: any) => i.type === 'FEE_ADJUSTMENT');
  const zoneViolationData = incidents.filter((i: any) => i.type === 'ZONE_VIOLATION');
  const overstayData = incidents.filter((i: any) => i.type === 'OVERSTAY');
  const ghostData = incidents.filter((i: any) => i.type === 'GHOST_VEHICLE');
  const feedbackData = incidents.filter((i: any) => i.type === 'CUSTOMER_FEEDBACK');

  const resolveMutation = useMutation({
    mutationFn: async (data: { id: string, notes: string }) => {
      await axiosClient.put(`/incidents/${data.id}/resolve`, { resolutionNotes: data.notes });
    },
    onSuccess: () => {
      message.success('Incident resolved');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      closeDrawer();
    }
  });

  const reportLostCardMutation = useMutation({
    mutationFn: async (data: { plate: string, fee: number }) => {
      await axiosClient.post(`/incidents/lost-card`, data);
    },
    onSuccess: () => {
      message.success('Reported card lost and charged');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      closeDrawer();
    }
  });

  const adjustFeeMutation = useMutation({
    mutationFn: async (data: { plate: string, liveFee: number }) => {
      await axiosClient.post(`/incidents/adjust-fee`, data);
    },
    onSuccess: () => {
      message.success('Fees have been adjusted');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      closeDrawer();
    }
  });

  const openDrawer = (record: any) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
    // Reset specific tab states
    setFeeAdjustStep(0);
    setOverrideFee(null);
    setOverrideReason('');
    setChatMessage('');
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedRecord(null);
  };

  // --- RENDER TABLES ---

  const renderLprTable = () => (
    <Table dataSource={lprData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="Time" dataIndex="time" />
      <Table.Column title="Gate" dataIndex="gate" />
      <Table.Column title="Staff" dataIndex="staff" />
      <Table.Column title="License Plate AI" dataIndex="aiPlate" render={(val: string) => <Text delete className="text-gray-400">{val}</Text>} />
      <Table.Column title="Staff edited" dataIndex="staffPlate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Status" dataIndex="status" render={(val: string) => <Tag color="warning">{val}</Tag>} />
      <Table.Column title="Actions" render={(rec: any) => <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Post-check</Button>} />
    </Table>
  );

  const renderLostCardTable = () => (
    <Table dataSource={lostCardData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="Time" dataIndex="time" />
      <Table.Column title="License Plate" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Card code" dataIndex="cardId" />
      <Table.Column title="Status" dataIndex="status" render={(val: string) => <Tag color="error">{val}</Tag>} />
      <Table.Column title="Penalty fee" dataIndex="fee" render={(val: number) => <Text strong className="text-orange-600">{(val || 0).toLocaleString()}  VND</Text>} />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Auditing</Button>} />
    </Table>
  );

  const renderFeeAdjustTable = () => (
    <Table dataSource={feeAdjustData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="ID Incidents" dataIndex="id" />
      <Table.Column title="License Plate" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Adjustment fee" dataIndex="liveFee" render={(val: number) => <Text strong className="text-red-500">{(val || 0).toLocaleString()}  VND</Text>} />
      <Table.Column title="Status" dataIndex="status" render={(val: string) => <Tag color="cyan">{val}</Tag>} />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Resolve</Button>} />
    </Table>
  );

  const renderZoneTable = () => (
    <Table dataSource={zoneViolationData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="Time" dataIndex="time" />
      <Table.Column title="License Plate" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Zone Regulations" dataIndex="expectedZone" />
      <Table.Column title="Do Sai Reality" dataIndex="actualZone" render={(val: string) => <Text type="danger" strong>{val}</Text>} />
      <Table.Column title="Reporter" dataIndex="reporter" />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Details</Button>} />
    </Table>
  );

  const renderOverstayTable = () => (
    <Table dataSource={overstayData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="License Plate" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Check-in time" dataIndex="checkIn" />
      <Table.Column title="Number of days remaining" dataIndex="days" render={(val: number) => <Text type="danger" strong>{val}  Day</Text>} />
      <Table.Column title="Slot Location" dataIndex="slot" />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>View information</Button>} />
    </Table>
  );

  const renderGhostTable = () => (
    <Table dataSource={ghostData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="License Plate" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Time to Enter" dataIndex="timeIn" />
      <Table.Column title="Out time" dataIndex="timeOut" render={() => <Text type="secondary" italic>NULL (Ticket evasion)</Text>} />
      <Table.Column title="Freight debt" dataIndex="currentFee" render={(val: number) => <Text type="danger" strong>{(val || 0).toLocaleString()}  VND</Text>} />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>View information</Button>} />
    </Table>
  );

  const renderFeedbackTable = () => (
    <Table dataSource={feedbackData} rowKey="id" pagination={false} loading={isLoading}>
      <Table.Column title="ID Incidents" dataIndex="id" />
      <Table.Column title="Guest name" dataIndex="customer" />
      <Table.Column title="Classify" dataIndex="category" />
      <Table.Column title="Status" dataIndex="status" render={(val: string) => <Tag color={val === 'OPEN' ? 'orange' : 'success'}>{val}</Tag>} />
      <Table.Column title="Actions" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Feedback</Button>} />
    </Table>
  );

  // --- RENDER DRAWER CONTENTS ---

  const renderDrawerContent = () => {
    if (!selectedRecord) return null;

    switch (activeTab) {
      case '1': // LPR Corrections
        return (
          <div className="space-y-6">
            <Alert message="Purpose: Post-check Staff hand-types License Platee" type="info" showIcon />
            <div className="bg-gray-100 p-4 rounded flex items-center justify-center h-64 border border-dashed border-gray-300">
               <div className="text-center text-gray-400">
                 <CameraOutlined className="text-4xl mb-2" />
                 <p>[Snapshot Camera License Plate IN/OUT]</p>
               </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="AI Identification" className="bg-red-50 border-red-200">
                  <Text delete className="text-lg text-gray-500 font-mono">{selectedRecord.aiPlate}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Staff Hand Typing" className="bg-green-50 border-green-200">
                  <Text strong className="text-lg text-green-700 font-mono">{selectedRecord.staffPlate}</Text>
                </Card>
              </Col>
            </Row>
            <div className="flex gap-2">
              <Button type="primary" className="flex-1" onClick={() => resolveMutation.mutate({ id: selectedRecord.id, notes: 'Staff is correct' })}>Browse (Staff correct)</Button>
              <Button danger className="flex-1" onClick={() => resolveMutation.mutate({ id: selectedRecord.id, notes: 'Staff type lies' })}>Penalty (Staff typing falsely)</Button>
            </div>
          </div>
        );

      case '2': // Lost/Damaged Cards
        return (
          <div className="space-y-6">
            <Alert message="Purpose: Confirm evidence that Staff collects card compensation" type="info" showIcon />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="License Plate"><Text strong>{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Card collection fee"><Text type="danger" strong>{selectedRecord.fee.toLocaleString()}  D</Text></Descriptions.Item>
            </Descriptions>
            
            <div>
              <Text strong className="block mb-2"><IdcardOutlined />  Digital proof (Vehicle documents / CCCD):</Text>
              <div className="bg-gray-100 p-4 rounded flex items-center justify-center h-64 border border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <CameraOutlined className="text-4xl mb-2" />
                  <p>[Photo of Documents taken by Staff and Uploaded]</p>
                </div>
              </div>
            </div>
            <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={() => resolveMutation.mutate({ id: selectedRecord.id, notes: 'Audited' })}>
              
                                  Mark Audited
                                </Button>
          </div>
        );

      case '3': // Fee Adjustments
        return (
          <div className="space-y-6">
            <Alert message="Required processing flow: Charges must be Paused before entering the adjustment order" type="warning" showIcon />
            
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded border">
              <div>
                <Text type="secondary" className="block text-xs uppercase">Computer fee (Live)</Text>
                <Text className="text-xl font-bold text-red-600">{selectedRecord.liveFee.toLocaleString()}  D</Text>
              </div>
              <Button 
                type={feeAdjustStep === 0 ? "primary" : "default"}
                danger={feeAdjustStep === 0}
                icon={feeAdjustStep === 0 ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => setFeeAdjustStep(feeAdjustStep === 0 ? 1 : 0)}
              >
                {feeAdjustStep === 0 ? 'PAUSE OF CHARGING' : 'CHARGES CONTINUE'}
              </Button>
            </div>

            <Divider className="my-2" />

            <Form layout="vertical">
              <Form.Item label={<Text strong>Actual Fees Collected (VND)</Text>} required>
                <InputNumber 
                  disabled={feeAdjustStep === 0}
                  className="w-full text-lg" 
                  size="large" 
                  value={overrideFee} 
                  onChange={v => setOverrideFee(v)} 
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                  placeholder="Enter the amount (leave blank if Reject)eee"
                />
              </Form.Item>
              <Form.Item label={<Text strong>Reason (Exemption / Reject)</Text>} required={feeAdjustStep === 0}>
                <Input.TextArea 
                  rows={3} 
                  value={overrideReason} 
                  onChange={e => setOverrideReason(e.target.value)} 
                  placeholder="For example: Incidents of underground traffic jams, VeIeP Guests or Reason Rejecteee"
                  disabled={feeAdjustStep > 0}
                />
              </Form.Item>
              <div className="flex gap-3">
                <Button 
                  danger
                  size="large" 
                  className="flex-1 font-bold"
                  disabled={feeAdjustStep > 0 || !overrideReason}
                  onClick={() => resolveMutation.mutate({ id: selectedRecord.id, notes: 'Reject: ' + overrideReason })}
                >
                  
                                              Reject request
                                            </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  className="flex-1 font-bold"
                  disabled={feeAdjustStep === 0 || overrideFee === null}
                  onClick={() => adjustFeeMutation.mutate({ plate: selectedRecord.plate, liveFee: overrideFee || 0 })}
                >
                  
                                              Approve & Issue Orders
                                            </Button>
              </div>
            </Form>
          </div>
        );

      case '4': // Zone Violations
        return (
          <div className="space-y-6">
            <Alert message="The system automatically notifies customers via the app and when the car arrives at Gate Management, they just need to see the Details" type="info" showIcon />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="License Plate xe"><Text strong>{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Regulations"><Text>{selectedRecord.expectedZone}</Text></Descriptions.Item>
              <Descriptions.Item label="Reality"><Text type="danger" strong>{selectedRecord.actualZone}</Text></Descriptions.Item>
            </Descriptions>
            
            <div className="bg-gray-100 rounded flex items-center justify-center h-48 border border-gray-300 relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="text-center z-10 text-red-500 flex flex-col items-center">
                 <EnvironmentOutlined className="text-4xl mb-1 drop-shadow-md" />
                 <Text strong className="bg-white/80 px-2 rounded">Wrong parking position</Text>
               </div>
            </div>
          </div>
        );

      case '5': // Overstaying
        return (
          <div className="space-y-6">
            <Alert message="The system automatically sends out a notification to dispatch staff to the scene to remove vehicles and clear the parking lot" type="info" showIcon />
            <div className="flex justify-between items-center bg-red-50 p-4 rounded border border-red-200">
              <Text strong className="text-red-700 text-lg">{selectedRecord.plate}</Text>
              <Tag color="red">TON {selectedRecord.days}  SWEET</Tag>
            </div>
            
            <Divider plain>Automatic Resolve Log</Divider>
            <Timeline>
               <Timeline.Item color="gray">System detects more than 72 hours ({selectedRecord.checkIn})</Timeline.Item>
               <Timeline.Item color="blue" dot={<BellOutlined />}>Automatically send Push Notification to Staff on patrol</Timeline.Item>
               <Timeline.Item color="orange">Staff is handling the process of moving the car to the violation area</Timeline.Item>
            </Timeline>
          </div>
        );

      case '6': // Ghost Sessions
        return (
          <div className="space-y-6">
            <Alert 
              message={<Text strong className="text-red-700">Slot is EMPTY BUT CAR STILL RECORDED INSIDE!</Text>} 
              description="Customer may have followed another car to escape the tunnel. The current fare has become a BAD DEBT" 
              type="error" 
              showIcon 
              icon={<WarningOutlined />}
            />
            
            <Descriptions column={1} bordered size="small" className="bg-white">
              <Descriptions.Item label="License Plate"><Text strong className="text-lg">{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Time to Enter">{selectedRecord.timeIn}</Descriptions.Item>
              <Descriptions.Item label="Estimated Freight Debt"><Text type="danger" strong className="text-lg">{selectedRecord.currentFee.toLocaleString()}  D</Text></Descriptions.Item>
            </Descriptions>

            <Alert 
              message="Resolve Automatically" 
              description="The System has automatically closed the ghost session and added this License Plate to the Blackliste" 
              type="info" 
              showIcon 
            />
          </div>
        );

      case '7': // Feedbacks
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="bg-gray-50 p-4 rounded border">
              <Text type="secondary" className="block mb-1">Customer: <Text strong>{selectedRecord.customer}</Text></Text>
              <Text strong className="text-gray-800">{selectedRecord.content}</Text>
            </div>
            
            <div className="flex-1"></div>

            <div className="border-t pt-4">
              <TextArea 
                rows={4} 
                value={chatMessage} 
                onChange={e => setChatMessage(e.target.value)} 
                placeholder="Enter the response content apologizing / explainingeee" 
                className="mb-2"
              />
              <Button type="primary" icon={<SendOutlined />} block disabled={!chatMessage} onClick={() => resolveMutation.mutate({ id: selectedRecord.id, notes: chatMessage })}>
                
                                        Send Feedback & Close Ticket
                                      </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getDrawerTitle = () => {
    switch (activeTab) {
      case '1': return 'Edit License Plate (LPR)';
      case '2': return 'Resolve Lost/Damaged Card';
      case '3': return 'Adjusting Fees';
      case '4': return 'Report Sai Zone';
      case '5': return 'Parking Vehicle Control';
      case '6': return 'Debt Collection / Fare Evasion';
      case '7': return 'Customer Response';
      default: return 'Details';
    }
  };

  // --- TABS DEFINITION ---

  const items = [
    { key: '1', label: <span><Badge dot offset={[5, 0]}>License Plate LPR deviation</Badge></span>, children: renderLprTable() },
    { key: '2', label: <span><Badge count={1} offset={[10, 0]}>Lost & Damaged Cards</Badge></span>, children: renderLostCardTable() },
    { key: '3', label: <span><Badge count={1} offset={[10, 0]}>Wrong Fees & Discounts</Badge></span>, children: renderFeeAdjustTable() },
    { key: '4', label: 'Car parked in wrong Zone', children: renderZoneTable() },
    { key: '5', label: <span><Badge count={1} offset={[10, 0]}>Overdue &gt; 72H</Badge></span>, children: renderOverstayTable() },
    { key: '6', label: <span><Badge count={1} offset={[10, 0]} className="[&_.ant-badge-count]:bg-red-600">Fare Debt / Fare Evasion</Badge></span>, children: renderGhostTable() },
    { key: '7', label: 'Feedback from Guests', children: renderFeedbackTable() },
  ];

  return (
    <div className="p-6 md:p-8 min-h-[calc(100vh-64px)] bg-white flex flex-col">
      {/* HEADER & FILTER */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <WarningOutlined className="mr-3 text-red-600" /> Incident Management (Incident Center)
          </Title>
          <Text type="secondary">Resolve exceptions, fraud, collections and freight complaints</Text>
        </div>
        
        <div className="flex gap-3">
          <RangePicker className="w-64" />
          <Search placeholder="License Plate / Ticket Code" className="w-64" onSearch={() => {}} enterButton />
          <Button icon={<DownloadOutlined />}>Export Excel</Button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-1 border rounded-lg overflow-hidden flex bg-white">
        <Tabs 
          tabPosition="left" 
          activeKey={activeTab}
          onChange={k => setActiveTab(k)}
          items={items}
          className="w-full [&_.ant-tabs-nav]:w-[240px] [&_.ant-tabs-nav]:bg-gray-50 [&_.ant-tabs-tab]:py-4 [&_.ant-tabs-tab]:px-6 [&_.ant-tabs-tab-active]:bg-white [&_.ant-tabs-content-holder]:p-6 [&_.ant-tabs-content-holder]:bg-white"
        />
      </div>

      {/* DETAIL DRAWER */}
      <Drawer
        title={<span className="font-bold text-gray-800 uppercase">{getDrawerTitle()}</span>}
        placement="right"
        width={450}
        onClose={closeDrawer}
        open={drawerVisible}
        destroyOnClose
      >
        {renderDrawerContent()}
      </Drawer>
    </div>
  );
};
