import React, { useState } from 'react';
import { Card, Typography, Button, Table, Modal, Form, Input, InputNumber, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, CarOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

export const VehicleTypeScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: vehicleTypes, isLoading } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const res = await axiosClient.get('/operation/vehicle-types');
      return res.data.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingRecord) {
        return await axiosClient.put(`/operation/vehicle-types/${editingRecord.id}`, values);
      } else {
        return await axiosClient.post('/operation/vehicle-types', values);
      }
    },
    onSuccess: () => {
      message.success(`Đã ${editingRecord ? 'cập nhật' : 'thêm mới'} loại phương tiện thành công!`);
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await axiosClient.delete(`/operation/vehicle-types/${id}`);
    },
    onSuccess: () => {
      message.success('Đã xóa loại phương tiện thành công!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa.');
    }
  });

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue(record);
    } else {
      setEditingRecord(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      saveMutation.mutate(values);
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa loại phương tiện này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id)
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>VT-{text}</Text> },
    { title: 'Tên Hiển Thị', dataIndex: 'typeName', key: 'typeName', render: (text: string) => <span className="font-semibold text-blue-700">{text}</span> },
    { 
      title: 'Phân Loại', 
      dataIndex: 'category', 
      key: 'category',
      render: (cat: string) => cat === 'FOUR_WHEEL' ? <Space><CarOutlined className="text-blue-600"/> Ô tô 4 bánh</Space> : <Space><AppstoreOutlined className="text-green-600"/> Xe 2 bánh</Space>
    },
    { 
      title: 'Kích thước Ma trận', 
      key: 'dimensions', 
      render: (_: any, r: any) => `${r.matrixWidth} ô (Ngang) x ${r.matrixHeight} ô (Dọc)` 
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
            Sửa
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
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
            rowKey="id" 
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
          confirmLoading={saveMutation.isPending}
        >
          <Form form={form} layout="vertical" className="mt-4" initialValues={{ category: 'FOUR_WHEEL' }}>
            <Form.Item name="typeName" label="Tên hiển thị (VD: Ô tô 4 chỗ, Xe tay ga)" rules={[{ required: true }]}>
              <Input placeholder="Nhập tên hiển thị..." />
            </Form.Item>
            
            <Form.Item name="category" label="Phân Loại Xe" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="FOUR_WHEEL">Ô tô / Xe 4 bánh</Select.Option>
                <Select.Option value="TWO_WHEEL">Xe máy / Xe 2 bánh</Select.Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="matrixWidth" label="Kích thước chiều ngang (Ô Grid)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={100} placeholder="VD: 3" />
              </Form.Item>
              <Form.Item name="matrixHeight" label="Kích thước chiều dọc (Ô Grid)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={100} placeholder="VD: 5" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
