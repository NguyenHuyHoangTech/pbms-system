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

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { TextArea } = Input;

// --- MOCK DATA ---

const MOCK_LPR = [
  { id: '1', time: '10:05 19/06/2026', gate: 'IN - Gate 1', staff: 'Nguyễn Văn A', aiPlate: '51G-12345', staffPlate: '51C-12345', status: 'PENDING' }
];

const MOCK_LOST_CARDS = [
  { id: '1', time: '09:30 19/06/2026', plate: '59A-99999', cardId: 'RFID-10023', type: 'MẤT THẺ', fee: 50000, status: 'PENDING' }
];

const MOCK_FEE_ADJUST = [
  { id: 'TCK-002', plate: '60B-55555', liveFee: 120000, status: 'INSIDE', state: 'PENDING' }
];

const MOCK_ZONE_VIOLATIONS = [
  { id: '1', time: '08:15 19/06/2026', plate: '72C-11122', expectedZone: 'Khu B (Xe Tải)', actualZone: 'Khu A (Xe 4 Chỗ)', reporter: 'Hệ thống Camera' }
];

const MOCK_OVERSTAY = [
  { id: '1', plate: '29D-88888', checkIn: '10:00 15/06/2026', days: 4, slot: 'B-05', status: 'PENDING' }
];

const MOCK_GHOST = [
  { id: '1', plate: '61A-33344', timeIn: '07:00 19/06/2026', timeOut: 'NULL', currentFee: 35000, status: 'SUSPICIOUS' }
];

const MOCK_FEEDBACKS = [
  { id: 'FB-101', customer: 'Trần C', category: 'Vệ sinh', status: 'OPEN', content: 'Hầm B mùi rác quá nồng.' }
];

// --- COMPONENT ---

export const TicketCenterScreen = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // States for specific tab logic
  const [feeAdjustStep, setFeeAdjustStep] = useState(0); // 0: Locked, 1: Paused, 2: Done
  const [overrideFee, setOverrideFee] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [chatMessage, setChatMessage] = useState('');

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
    setTimeout(() => setSelectedRecord(null), 300);
  };

  // --- RENDER TABLES ---

  const renderLPRTable = () => (
    <Table dataSource={MOCK_LPR} rowKey="id" pagination={false}>
      <Table.Column title="Thời gian" dataIndex="time" />
      <Table.Column title="Cổng" dataIndex="gate" />
      <Table.Column title="Nhân viên" dataIndex="staff" />
      <Table.Column title="Biển số AI" dataIndex="aiPlate" render={(val: string) => <Text delete className="text-gray-400">{val}</Text>} />
      <Table.Column title="Biển số Staff sửa" dataIndex="staffPlate" render={(val: string) => <Text strong className="text-green-600">{val}</Text>} />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Kiểm tra</Button>} />
    </Table>
  );

  const renderLostCardTable = () => (
    <Table dataSource={MOCK_LOST_CARDS} rowKey="id" pagination={false}>
      <Table.Column title="Thời gian" dataIndex="time" />
      <Table.Column title="Biển số" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Mã thẻ cũ" dataIndex="cardId" />
      <Table.Column title="Trạng thái" dataIndex="type" render={(val: string) => <Tag color="error">{val}</Tag>} />
      <Table.Column title="Phí đền thẻ" dataIndex="fee" render={(val: number) => <Text strong className="text-orange-600">{val.toLocaleString()} đ</Text>} />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Kiểm toán</Button>} />
    </Table>
  );

  const renderFeeAdjustTable = () => (
    <Table dataSource={MOCK_FEE_ADJUST} rowKey="id" pagination={false}>
      <Table.Column title="Mã Ticket" dataIndex="id" />
      <Table.Column title="Biển số" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Phí đang đếm (Live)" dataIndex="liveFee" render={(val: number) => <Text strong className="text-red-500">{val.toLocaleString()} đ</Text>} />
      <Table.Column title="Trạng thái" dataIndex="status" render={(val: string) => <Tag color="cyan">{val}</Tag>} />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Xử lý</Button>} />
    </Table>
  );

  const renderZoneTable = () => (
    <Table dataSource={MOCK_ZONE_VIOLATIONS} rowKey="id" pagination={false}>
      <Table.Column title="Thời gian" dataIndex="time" />
      <Table.Column title="Biển số" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Zone Quy Định" dataIndex="expectedZone" />
      <Table.Column title="Đỗ Sai Thực Tế" dataIndex="actualZone" render={(val: string) => <Text type="danger" strong>{val}</Text>} />
      <Table.Column title="Người báo cáo" dataIndex="reporter" />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Chi tiết</Button>} />
    </Table>
  );

  const renderOverstayTable = () => (
    <Table dataSource={MOCK_OVERSTAY} rowKey="id" pagination={false}>
      <Table.Column title="Biển số" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Giờ Check-in" dataIndex="checkIn" />
      <Table.Column title="Số ngày tồn" dataIndex="days" render={(val: number) => <Text type="danger" strong>{val} Ngày</Text>} />
      <Table.Column title="Vị trí Slot" dataIndex="slot" />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Xem thông tin</Button>} />
    </Table>
  );

  const renderGhostTable = () => (
    <Table dataSource={MOCK_GHOST} rowKey="id" pagination={false}>
      <Table.Column title="Biển số" dataIndex="plate" render={(val: string) => <Tag color="blue">{val}</Tag>} />
      <Table.Column title="Giờ Vào" dataIndex="timeIn" />
      <Table.Column title="Giờ Ra" dataIndex="timeOut" render={() => <Text type="secondary" italic>NULL (Trốn vé)</Text>} />
      <Table.Column title="Nợ cước đếm" dataIndex="currentFee" render={(val: number) => <Text type="danger" strong>{val.toLocaleString()} đ</Text>} />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Xem thông tin</Button>} />
    </Table>
  );

  const renderFeedbackTable = () => (
    <Table dataSource={MOCK_FEEDBACKS} rowKey="id" pagination={false}>
      <Table.Column title="Mã Ticket" dataIndex="id" />
      <Table.Column title="Tên khách" dataIndex="customer" />
      <Table.Column title="Phân loại" dataIndex="category" />
      <Table.Column title="Trạng thái" dataIndex="status" render={(val: string) => <Tag color={val === 'OPEN' ? 'orange' : 'success'}>{val}</Tag>} />
      <Table.Column title="Thao tác" render={(rec: any) => <Button type="dashed" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(rec)}>Phản hồi</Button>} />
    </Table>
  );

  // --- RENDER DRAWER CONTENTS ---

  const renderDrawerContent = () => {
    if (!selectedRecord) return null;

    switch (activeTab) {
      case '1': // LPR Corrections
        return (
          <div className="space-y-6">
            <Alert message="Mục đích: Hậu kiểm nhân viên gõ tay biển số." type="info" showIcon />
            <div className="bg-gray-100 p-4 rounded flex items-center justify-center h-64 border border-dashed border-gray-300">
               <div className="text-center text-gray-400">
                 <CameraOutlined className="text-4xl mb-2" />
                 <p>[Ảnh Snapshot Camera Biển Số IN/OUT]</p>
               </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="AI Nhận Diện" className="bg-red-50 border-red-200">
                  <Text delete className="text-lg text-gray-500 font-mono">{selectedRecord.aiPlate}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Staff Gõ Tay" className="bg-green-50 border-green-200">
                  <Text strong className="text-lg text-green-700 font-mono">{selectedRecord.staffPlate}</Text>
                </Card>
              </Col>
            </Row>
            <div className="flex gap-2">
              <Button type="primary" className="flex-1" onClick={() => { message.success('Đã xác nhận Staff gõ đúng.'); closeDrawer(); }}>Duyệt (Staff đúng)</Button>
              <Button danger className="flex-1" onClick={() => { message.error('Đã cảnh cáo Staff.'); closeDrawer(); }}>Phạt (Staff gõ láo)</Button>
            </div>
          </div>
        );

      case '2': // Lost/Damaged Cards
        return (
          <div className="space-y-6">
            <Alert message="Mục đích: Xác nhận bằng chứng do Staff thu tiền đền thẻ." type="info" showIcon />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Biển số"><Text strong>{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Phí đền thẻ thu"><Text type="danger" strong>{selectedRecord.fee.toLocaleString()} đ</Text></Descriptions.Item>
            </Descriptions>
            
            <div>
              <Text strong className="block mb-2"><IdcardOutlined /> Minh chứng số hóa (Giấy tờ xe / CCCD):</Text>
              <div className="bg-gray-100 p-4 rounded flex items-center justify-center h-64 border border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <CameraOutlined className="text-4xl mb-2" />
                  <p>[Ảnh Giấy tờ do Staff chụp Upload]</p>
                </div>
              </div>
            </div>
            <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={() => { message.success('Kiểm toán hoàn tất.'); closeDrawer(); }}>
              Đánh dấu Đã Kiểm Toán
            </Button>
          </div>
        );

      case '3': // Fee Adjustments
        return (
          <div className="space-y-6">
            <Alert message="Luồng xử lý bắt buộc: Phải Tạm Dừng Tính Phí trước khi nhập lệnh điều chỉnh." type="warning" showIcon />
            
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded border">
              <div>
                <Text type="secondary" className="block text-xs uppercase">Phí máy tính (Live)</Text>
                <Text className="text-xl font-bold text-red-600">{selectedRecord.liveFee.toLocaleString()} đ</Text>
              </div>
              <Button 
                type={feeAdjustStep === 0 ? "primary" : "default"}
                danger={feeAdjustStep === 0}
                icon={feeAdjustStep === 0 ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => setFeeAdjustStep(feeAdjustStep === 0 ? 1 : 0)}
              >
                {feeAdjustStep === 0 ? 'TẠM DỪNG TÍNH PHÍ' : 'TIẾP TỤC TÍNH PHÍ'}
              </Button>
            </div>

            <Divider className="my-2" />

            <Form layout="vertical">
              <Form.Item label={<Text strong>Phí Thực Thu (VNĐ)</Text>} required>
                <InputNumber 
                  disabled={feeAdjustStep === 0}
                  className="w-full text-lg" 
                  size="large" 
                  value={overrideFee} 
                  onChange={v => setOverrideFee(v)} 
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                  placeholder="Nhập số tiền (để trống nếu từ chối)..."
                />
              </Form.Item>
              <Form.Item label={<Text strong>Lý do (Miễn giảm / Từ chối)</Text>} required={feeAdjustStep === 0}>
                <Input.TextArea 
                  rows={3} 
                  value={overrideReason} 
                  onChange={e => setOverrideReason(e.target.value)} 
                  placeholder="VD: Sự cố kẹt xe hầm, Khách V.I.P hoặc Lý do từ chối..."
                  disabled={feeAdjustStep > 0}
                />
              </Form.Item>
              <div className="flex gap-3">
                <Button 
                  danger
                  size="large" 
                  className="flex-1 font-bold"
                  disabled={feeAdjustStep > 0 || !overrideReason}
                  onClick={() => {
                    message.success(`Đã gửi lý do từ chối về màn hình Khách hàng.`);
                    closeDrawer();
                  }}
                >
                  Từ Chối Yêu Cầu
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  className="flex-1 font-bold"
                  disabled={feeAdjustStep === 0 || overrideFee === null}
                  onClick={() => {
                    message.success(`Đã cập nhật phí ${overrideFee?.toLocaleString()} đ và cấp lệnh xuất bến.`);
                    closeDrawer();
                  }}
                >
                  Duyệt & Cấp Lệnh Ra
                </Button>
              </div>
            </Form>
          </div>
        );

      case '4': // Zone Violations
        return (
          <div className="space-y-6">
            <Alert message="Hệ thống tự động thông báo nhắc nhở cho khách qua App và lúc xe ra cổng. Quản lý chỉ cần xem chi tiết." type="info" showIcon />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Biển số xe"><Text strong>{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Quy định"><Text>{selectedRecord.expectedZone}</Text></Descriptions.Item>
              <Descriptions.Item label="Thực tế"><Text type="danger" strong>{selectedRecord.actualZone}</Text></Descriptions.Item>
            </Descriptions>
            
            <div className="bg-gray-100 rounded flex items-center justify-center h-48 border border-gray-300 relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="text-center z-10 text-red-500 flex flex-col items-center">
                 <EnvironmentOutlined className="text-4xl mb-1 drop-shadow-md" />
                 <Text strong className="bg-white/80 px-2 rounded">Vị trí xe đỗ sai</Text>
               </div>
            </div>
          </div>
        );

      case '5': // Overstaying
        return (
          <div className="space-y-6">
            <Alert message="Hệ thống tự động bắn thông báo điều động nhân viên xuống hiện trường dời xe giải phóng bãi." type="info" showIcon />
            <div className="flex justify-between items-center bg-red-50 p-4 rounded border border-red-200">
              <Text strong className="text-red-700 text-lg">{selectedRecord.plate}</Text>
              <Tag color="red">TỒN {selectedRecord.days} NGÀY</Tag>
            </div>
            
            <Divider orientation="left" plain>Nhật ký Xử lý Tự động</Divider>
            <Timeline>
               <Timeline.Item color="gray">Hệ thống phát hiện quá 72h ({selectedRecord.checkIn})</Timeline.Item>
               <Timeline.Item color="blue" dot={<BellOutlined />}>Tự động bắn Push Notification cho Staff đi tuần</Timeline.Item>
               <Timeline.Item color="orange">Staff đang xử lý dời xe sang khu vi phạm...</Timeline.Item>
            </Timeline>
          </div>
        );

      case '6': // Ghost Sessions
        return (
          <div className="space-y-6">
            <Alert 
              message={<Text strong className="text-red-700">Ô ĐỖ TRỐNG NHƯNG XE VẪN GHI NHẬN INSIDE!</Text>} 
              description="Khách hàng có thể đã bám đuôi xe khác trốn vé ra khỏi hầm. Số tiền cước hiện tại đã trở thành NỢ XẤU." 
              type="error" 
              showIcon 
              icon={<WarningOutlined />}
            />
            
            <Descriptions column={1} bordered size="small" className="bg-white">
              <Descriptions.Item label="Biển số"><Text strong className="text-lg">{selectedRecord.plate}</Text></Descriptions.Item>
              <Descriptions.Item label="Giờ Vào">{selectedRecord.timeIn}</Descriptions.Item>
              <Descriptions.Item label="Nợ Cước Ước Tính"><Text type="danger" strong className="text-lg">{selectedRecord.currentFee.toLocaleString()} đ</Text></Descriptions.Item>
            </Descriptions>

            <Alert 
              message="Xử lý Tự động" 
              description="Hệ thống đã tự động Đóng Phiên đỗ ma và thêm biển số này vào Blacklist." 
              type="info" 
              showIcon 
            />
          </div>
        );

      case '7': // Feedbacks
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="bg-gray-50 p-4 rounded border">
              <Text type="secondary" className="block mb-1">Khách hàng: <Text strong>{selectedRecord.customer}</Text></Text>
              <Text strong className="text-gray-800">{selectedRecord.content}</Text>
            </div>
            
            <div className="flex-1"></div>

            <div className="border-t pt-4">
              <TextArea 
                rows={4} 
                value={chatMessage} 
                onChange={e => setChatMessage(e.target.value)} 
                placeholder="Nhập nội dung phản hồi xin lỗi / giải thích..." 
                className="mb-2"
              />
              <Button type="primary" icon={<SendOutlined />} block disabled={!chatMessage} onClick={() => { message.success('Đã phản hồi khách hàng và Đóng Ticket.'); closeDrawer(); }}>
                Gửi Phản Hồi & Đóng Ticket
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
      case '1': return 'Chỉnh sửa Biển Số (LPR)';
      case '2': return 'Xử lý Mất/Hỏng Thẻ';
      case '3': return 'Điều chỉnh Cước Phí';
      case '4': return 'Báo cáo Sai Zone';
      case '5': return 'Kiểm soát Xe Nằm Bãi';
      case '6': return 'Truy thu Nợ / Trốn Vé';
      case '7': return 'Phản hồi Khách hàng';
      default: return 'Chi tiết';
    }
  };

  // --- TABS DEFINITION ---

  const items = [
    { key: '1', label: <span><Badge dot offset={[5, 0]}>Sai lệch Biển số LPR</Badge></span>, children: renderLPRTable() },
    { key: '2', label: <span><Badge count={1} offset={[10, 0]}>Mất & Hỏng Thẻ</Badge></span>, children: renderLostCardTable() },
    { key: '3', label: <span><Badge count={1} offset={[10, 0]}>Sai phí & Giảm giá</Badge></span>, children: renderFeeAdjustTable() },
    { key: '4', label: 'Xe đỗ sai khu vực', children: renderZoneTable() },
    { key: '5', label: <span><Badge count={1} offset={[10, 0]}>Quá hạn &gt; 72H</Badge></span>, children: renderOverstayTable() },
    { key: '6', label: <span><Badge count={1} offset={[10, 0]} className="[&_.ant-badge-count]:bg-red-600">Nợ Cước / Trốn vé</Badge></span>, children: renderGhostTable() },
    { key: '7', label: 'Phản hồi từ Khách', children: renderFeedbackTable() },
  ];

  return (
    <div className="p-6 md:p-8 min-h-[calc(100vh-64px)] bg-white flex flex-col">
      {/* HEADER & FILTER */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <WarningOutlined className="mr-3 text-red-600" /> Quản Lý Sự Cố (Incident Center)
          </Title>
          <Text type="secondary">Xử lý ngoại lệ, gian lận, truy thu và khiếu nại cước phí.</Text>
        </div>
        
        <div className="flex gap-3">
          <RangePicker className="w-64" />
          <Search placeholder="Biển số / Mã Ticket" className="w-64" onSearch={() => {}} enterButton />
          <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
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
