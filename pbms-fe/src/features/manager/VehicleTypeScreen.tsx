import React, { useState } from 'react';
import { Card, Typography, Button, Table, Tag, Modal, Form, Input, InputNumber, Switch, Space, message, Select } from 'antd';
import { 
  PlusOutlined, EditOutlined, CarOutlined, AppstoreOutlined, 
  ThunderboltOutlined, RocketOutlined 
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

const { Title, Text } = Typography;

const MOCK_VEHICLE_TYPES = [
  { vehicleCode: 'CAR-4S', displayName: 'Ô tô 4 chỗ', gridWidth: 3, gridHeight: 5, icon: 'CarOutlined', isActive: true },
  { vehicleCode: 'CAR-7S', displayName: 'Ô tô 7 chỗ (SUV)', gridWidth: 3, gridHeight: 6, icon: 'CarOutlined', isActive: true },
  { vehicleCode: 'MOTO-G', displayName: 'Xe máy tay ga', gridWidth: 1, gridHeight: 2, icon: 'AppstoreOutlined', isActive: true },
  { vehicleCode: 'MOTO-E', displayName: 'Xe máy điện', gridWidth: 1, gridHeight: 2, icon: 'ThunderboltOutlined', isActive: true },
  { vehicleCode: 'VIP-CAR', displayName: 'Siêu Xe (VIP)', gridWidth: 4, gridHeight: 6, icon: 'RocketOutlined', isActive: true },
  { vehicleCode: 'TRUCK-S', displayName: 'Xe tải nhỏ', gridWidth: 4, gridHeight: 8, icon: 'AppstoreOutlined', isActive: false },
];

export const VehicleTypeScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: vehicleTypes, isLoading } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = { data: { data: MOCK_VEHICLE_TYPES } };
      return new Promise<any[]>(resolve => setTimeout(() => resolve(response.data.data), 500));
    }
  });

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue(record);
    } else {
      setEditingRecord(null);
      form.resetFields();
      const newCode = `VT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      form.setFieldsValue({ vehicleCode: newCode, isActive: true, icon: 'CarOutlined' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      message.success(`Đã ${editingRecord ? 'cập nhật' : 'thêm mới'} loại phương tiện thành công! (Mock)`);
      setIsModalOpen(false);
    });
  };

  const renderIcon = (iconName: string) => {
    switch(iconName) {
      case 'CarOutlined': return <CarOutlined className="text-blue-600 text-lg" />;
      case 'ThunderboltOutlined': return <ThunderboltOutlined className="text-yellow-500 text-lg" />;
      case 'RocketOutlined': return <RocketOutlined className="text-red-500 text-lg" />;
      default: return <AppstoreOutlined className="text-gray-500 text-lg" />;
    }
  };

  const columns = [
    { title: 'Mã Loại Xe', dataIndex: 'vehicleCode', key: 'vehicleCode', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Tên Hiển Thị', dataIndex: 'displayName', key: 'displayName', render: (text: string) => <span className="font-semibold text-blue-700">{text}</span> },
    { 
      title: 'Kích thước Ma trận', 
      key: 'dimensions', 
      render: (_: any, r: any) => `${r.gridWidth} ô (Ngang) x ${r.gridHeight} ô (Dọc)` 
    },
    { 
      title: 'Biểu Tượng', 
      dataIndex: 'icon', 
      key: 'icon',
      render: (icon: string) => renderIcon(icon)
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
          Sửa
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} className="m-0 text-gray-800 flex items-center">
              <CarOutlined className="mr-3 text-blue-600" /> Quản lý Loại Phương Tiện
            </Title>
            <Text type="secondary">Định nghĩa kích thước chuẩn trên ma trận bản đồ cho từng loại xe</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => handleOpenModal()} className="bg-blue-600">
            Thêm Loại Xe
          </Button>
        </div>

        <Card className="shadow-sm rounded-xl border-gray-200">
          <Table 
            dataSource={vehicleTypes || []} 
            columns={columns} 
            rowKey="vehicleCode" 
            pagination={false}
            loading={isLoading}
          />
        </Card>

        <Modal
          title={editingRecord ? "Chỉnh sửa Loại Phương Tiện" : "Thêm Loại Phương Tiện Mới"}
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => setIsModalOpen(false)}
          okText="Lưu cấu hình"
          cancelText="Hủy"
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4" initialValues={{ isActive: true, icon: 'CarOutlined' }}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="vehicleCode" label="Mã loại xe (Vehicle Code)">
                <Input placeholder="Mã tự động sinh..." disabled={true} className="bg-gray-100 font-semibold" />
              </Form.Item>
              <Form.Item name="displayName" label="Tên hiển thị (Display Name)" rules={[{ required: true }]}>
                <Input placeholder="VD: Ô tô 4 chỗ" />
              </Form.Item>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="gridWidth" label="Kích thước chiều ngang (Ô)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={10} placeholder="VD: 3" />
              </Form.Item>
              <Form.Item name="gridHeight" label="Kích thước chiều dọc (Ô)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={10} placeholder="VD: 5" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="icon" label="Biểu tượng (Icon)" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="CarOutlined"><Space><CarOutlined /> Ô tô</Space></Select.Option>
                  <Select.Option value="ThunderboltOutlined"><Space><ThunderboltOutlined /> Điện / EV</Space></Select.Option>
                  <Select.Option value="RocketOutlined"><Space><RocketOutlined /> Siêu xe / Đặc biệt</Space></Select.Option>
                  <Select.Option value="AppstoreOutlined"><Space><AppstoreOutlined /> Khối / Mặc định</Space></Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="isActive" valuePropName="checked" label="Trạng thái">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng hoạt động" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
