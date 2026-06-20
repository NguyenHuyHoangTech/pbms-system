import React, { useState } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, Input, Select, 
  Modal, Row, Col, Statistic, Drawer, Upload, message, Alert, Divider, Tooltip 
} from 'antd';
import { 
  CreditCardOutlined, PlusOutlined, SearchOutlined, 
  CheckCircleOutlined, FilterOutlined, MoreOutlined, 
  InboxOutlined, StopOutlined, RetweetOutlined, 
  UnlockOutlined, WarningOutlined, SyncOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface RfidCard {
  uid: string;
  visualId: string;
  status: 'AVAILABLE' | 'IN_USE' | 'LOST' | 'DAMAGED';
  location: string;
}

const MOCK_CARDS: RfidCard[] = [
  { uid: 'A1B2C3D4', visualId: 'CARD-VL-001', status: 'AVAILABLE', location: 'Nằm trống' },
  { uid: 'E5F6G7H8', visualId: 'CARD-VL-002', status: 'IN_USE', location: 'Đang gán cho xe 51G-123.45 (Trong bãi)' },
  { uid: 'I9J0K1L2', visualId: 'CARD-VL-003', status: 'IN_USE', location: 'Đang gán cho xe 29A-678.90 (Trong bãi)' },
  { uid: 'M3N4O5P6', visualId: 'CARD-VL-004', status: 'LOST', location: 'Không xác định' },
  { uid: 'Q7R8S9T0', visualId: 'CARD-VL-005', status: 'DAMAGED', location: 'Kho phế liệu' },
  { uid: 'U1V2W3X4', visualId: 'CARD-VL-006', status: 'AVAILABLE', location: 'Nằm trống' },
];

export const CardManagementScreen = () => {
  const [data, setData] = useState<RfidCard[]>(MOCK_CARDS);
  const [selectedRecord, setSelectedRecord] = useState<RfidCard | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalCards = 5000; // Mock total
  const availableCount = 45; // Hardcoded < 50 for flashing effect
  const inUseCount = 4850;
  const lostDamagedCount = 105;

  const handleOpenDrawer = (record: RfidCard) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleAction = (id: string, newStatus: RfidCard['status'], newLocation: string, successMsg: string) => {
    setData(prev => prev.map(item => 
      item.uid === id ? { ...item, status: newStatus, location: newLocation } : item
    ));
    message.success(successMsg);
    setIsDrawerOpen(false);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: ({ onSuccess }) => {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        onSuccess?.('ok');
        message.success('Nhập lô thẻ thành công!');
        setIsModalVisible(false);
      }, 1500);
    },
  };

  const columns = [
    { title: 'Mã UID (Hex)', dataIndex: 'uid', key: 'uid', render: (text: string) => <Text strong className="font-mono text-gray-600">{text}</Text> },
    { title: 'Mã Nhận Diện', dataIndex: 'visualId', key: 'visualId', render: (text: string) => <Tag color="blue" className="text-base font-bold">{text}</Tag> },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        if (status === 'AVAILABLE') return <Tag color="success" icon={<CheckCircleOutlined />}>Sẵn sàng (Trống)</Tag>;
        if (status === 'IN_USE') return <Tag color="processing" icon={<SyncOutlined spin />}>Đang Lưu Hành</Tag>;
        if (status === 'LOST') return <Tag color="error" icon={<StopOutlined />}>Báo Mất</Tag>;
        if (status === 'DAMAGED') return <Tag color="warning" icon={<WarningOutlined />}>Báo Hỏng</Tag>;
        return <Tag>{status}</Tag>;
      }
    },
    { 
      title: 'Vị trí hiện tại', 
      dataIndex: 'location', 
      key: 'location',
      render: (text: string, record: RfidCard) => (
        <Text className={record.status === 'IN_USE' ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>
          {text}
        </Text>
      )
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: RfidCard) => (
        <Button type="primary" size="small" onClick={() => handleOpenDrawer(record)}>Xử lý</Button>
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      <div className="mb-6">
        <Title level={2} className="m-0 text-gray-800 flex items-center">
          <CreditCardOutlined className="mr-3 text-indigo-600" /> Quản lý Kho Thẻ (RFID)
        </Title>
        <Text type="secondary">Trung tâm kiểm soát vòng đời của hàng nghìn thẻ điện tử trong hệ thống.</Text>
      </div>

      {/* KHU VỰC 1: KPI CARDS */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic title="Tổng Thẻ Trong Hệ Thống" value={totalCards} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={`shadow-sm border-l-4 ${availableCount < 50 ? 'border-l-red-500 bg-red-50/50' : 'border-l-green-500'}`}>
            <Statistic 
              title={<span className={availableCount < 50 ? 'text-red-600 font-bold animate-pulse' : ''}>Thẻ Đang Trống (AVAILABLE)</span>} 
              value={availableCount} 
              valueStyle={{ color: availableCount < 50 ? '#cf1322' : '#3f8600', fontWeight: 'bold' }} 
            />
            {availableCount < 50 && (
              <Text type="danger" className="text-xs font-bold animate-pulse">⚠️ RỦI RO THIẾU THẺ TẠI CỔNG!</Text>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <Statistic title="Đang Lưu Hành (IN_USE)" value={inUseCount} valueStyle={{ color: '#d97706', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-gray-600">
            <Statistic title="Thẻ Hỏng & Mất" value={lostDamagedCount} valueStyle={{ color: '#4b5563', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* KHU VỰC 2: ACTION BAR */}
      <Card className="shadow-sm mb-6">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Select defaultValue="ALL" className="w-48" options={[
              {label: 'Tất cả Trạng thái', value: 'ALL'},
              {label: 'Sẵn sàng (Trống)', value: 'AVAILABLE'},
              {label: 'Đang lưu hành', value: 'IN_USE'},
              {label: 'Báo mất', value: 'LOST'},
              {label: 'Báo hỏng', value: 'DAMAGED'}
            ]} />
            <Button type="primary" icon={<FilterOutlined />} ghost>Lọc</Button>
            <Input 
              placeholder="Gõ UID hoặc Mã In trên thẻ..." 
              prefix={<SearchOutlined />} 
              className="w-80" 
              allowClear
            />
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-md"
            onClick={() => setIsModalVisible(true)}
          >
            + Nhập Lô Thẻ Mới
          </Button>
        </div>
      </Card>

      {/* KHU VỰC 3: DATA TABLE */}
      <Card className="shadow-sm rounded-xl border-gray-200" bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={data} 
          columns={columns} 
          rowKey="uid" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* KHU VỰC 4: RIGHT DRAWER */}
      <Drawer
        title={<span className="font-bold text-lg">Khám Bệnh & Xử Lý Thẻ</span>}
        placement="right"
        width={400}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            
            {/* Identity Banner */}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-center">
              <Text type="secondary" className="block text-xs uppercase mb-1">Mã Nhận Diện</Text>
              <div className="text-2xl font-black text-slate-800 tracking-wider">{selectedRecord.visualId}</div>
              <div className="mt-2 text-sm text-gray-500 font-mono">UID: {selectedRecord.uid}</div>
            </div>

            {/* Current Status */}
            <div>
              <Text strong className="block mb-2">Trạng Thái & Vị Trí:</Text>
              <div className="flex flex-col gap-2 p-3 bg-white border rounded-md">
                <div className="flex justify-between">
                  <Text type="secondary">Trạng thái:</Text>
                  {selectedRecord.status === 'AVAILABLE' && <Tag color="success">Trống</Tag>}
                  {selectedRecord.status === 'IN_USE' && <Tag color="processing">Đang Dùng</Tag>}
                  {selectedRecord.status === 'LOST' && <Tag color="error">Báo Mất</Tag>}
                  {selectedRecord.status === 'DAMAGED' && <Tag color="warning">Báo Hỏng</Tag>}
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Vị trí:</Text>
                  <Text strong className="text-right">{selectedRecord.location}</Text>
                </div>
              </div>
            </div>

            <Divider className="my-0" />

            {/* Action Tools */}
            <div>
              <Title level={5} className="text-gray-800 mb-4">Công Cụ Trị Liệu</Title>
              <div className="flex flex-col gap-3">
                
                <Tooltip title="Thẻ sẽ bị khóa hoàn toàn. Barrier không mở nếu ai đó dùng thẻ này." placement="left">
                  <Button 
                    danger 
                    type="primary" 
                    icon={<StopOutlined />} 
                    className="w-full text-left flex justify-start items-center h-10"
                    disabled={selectedRecord.status === 'LOST'}
                    onClick={() => handleAction(selectedRecord.uid, 'LOST', 'Không xác định', 'Đã đưa thẻ vào Blacklist báo mất!')}
                  >
                    [Báo Mất Thẻ / Đưa vào Blacklist]
                  </Button>
                </Tooltip>

                <Button 
                  danger 
                  icon={<WarningOutlined />} 
                  className="w-full text-left flex justify-start items-center h-10 border-orange-400 text-orange-500 hover:text-orange-600 hover:border-orange-500"
                  disabled={selectedRecord.status === 'DAMAGED'}
                  onClick={() => handleAction(selectedRecord.uid, 'DAMAGED', 'Kho phế liệu', 'Đã đánh dấu thẻ bị hỏng vật lý.')}
                >
                  [Đánh Dấu Thẻ Hỏng]
                </Button>

                <Tooltip title="Tẩy não thẻ, cắt đứt liên kết với xe cũ để sẵn sàng tái sử dụng." placement="left">
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<RetweetOutlined />} 
                    className="w-full text-left flex justify-start items-center h-10"
                    onClick={() => handleAction(selectedRecord.uid, 'AVAILABLE', 'Nằm trống', 'Đã Xóa trắng dữ liệu (Format) thẻ thành công!')}
                  >
                    [Xóa Trắng Dữ Liệu (Format Card)]
                  </Button>
                </Tooltip>

                {selectedRecord.status === 'LOST' && (
                  <Button 
                    type="primary" 
                    className="w-full bg-green-600 hover:bg-green-500 text-left flex justify-start items-center h-10 mt-4"
                    icon={<UnlockOutlined />}
                    onClick={() => handleAction(selectedRecord.uid, 'AVAILABLE', 'Nằm trống', 'Đã mở khóa thẻ thành công!')}
                  >
                    [Mở Khóa Thẻ] (Khách trả lại)
                  </Button>
                )}

              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* IMPORT MODAL */}
      <Modal
        title={<span className="font-bold text-lg"><PlusOutlined className="mr-2"/> Nhập Lô Thẻ Mới</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="py-4">
          <Alert 
            message="Hướng dẫn Import" 
            description="Vui lòng upload file Excel (.xlsx, .csv) do nhà máy sản xuất cung cấp. Hệ thống sẽ tự động quét cột UID và Visual ID để lưu vào CSDL." 
            type="info" 
            showIcon 
            className="mb-4"
          />
          <Dragger {...uploadProps} disabled={isUploading}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined className={isUploading ? "text-gray-400" : "text-indigo-500"} />
            </p>
            <p className="ant-upload-text font-semibold">Click hoặc Kéo thả file Excel vào đây</p>
            <p className="ant-upload-hint px-4 text-xs">
              Hỗ trợ nhập tối đa 10,000 dòng UID cùng lúc.
            </p>
          </Dragger>
        </div>
      </Modal>

    </div>
  );
};
