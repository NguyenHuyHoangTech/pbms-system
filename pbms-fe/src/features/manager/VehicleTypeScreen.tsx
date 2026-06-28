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
      message.success(`Successfully ${editingRecord ? 'updated' : 'added'} vehicle type!`);
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'An error occurred.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await axiosClient.delete(`/operation/vehicle-types/${id}`);
    },
    onSuccess: () => {
      message.success('Successfully deleted vehicle type!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'An error occurred while deleting.');
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
      title: 'Confirm delete',
      content: 'Are you sure you want to delete this vehicle type?',
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(id)
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>VT-{text}</Text> },
    { title: 'Display Name', dataIndex: 'typeName', key: 'typeName', render: (text: string) => <span className="font-semibold text-blue-700">{text}</span> },
    { 
      title: 'Category', 
      dataIndex: 'category', 
      key: 'category',
      render: (cat: string) => cat === 'FOUR_WHEEL' ? <Space><CarOutlined className="text-blue-600"/> 4-wheel Car</Space> : <Space><AppstoreOutlined className="text-green-600"/> 2-wheel Vehicle</Space>
    },
    { 
      title: 'Matrix Size', 
      key: 'dimensions', 
      render: (_: any, r: any) => `${r.matrixWidth} cells (W) x ${r.matrixHeight} cells (H)` 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
            Sửa
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Delete
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
            <Text type="secondary">Define standard matrix size for each vehicle type</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => handleOpenModal()} className="bg-blue-600">
            Thêm Vehicle Type
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
          title={editingRecord ? "Edit Vehicle Type" : "Add New Vehicle Type"}
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => setIsModalOpen(false)}
          okText="Save config"
          cancelText="Cancel"
          width={600}
          confirmLoading={saveMutation.isPending}
        >
          <Form form={form} layout="vertical" className="mt-4" initialValues={{ category: 'FOUR_WHEEL' }}>
            <Form.Item name="typeName" label="Display Name (E.g. 4-seat car, Scooter)" rules={[{ required: true }]}>
              <Input placeholder="Enter display name..." />
            </Form.Item>
            
            <Form.Item name="category" label="Vehicle Category" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="FOUR_WHEEL">Car / 4-wheel vehicle</Select.Option>
                <Select.Option value="TWO_WHEEL">Motorbike / 2-wheel vehicle</Select.Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="matrixWidth" label="Width (Grid cells)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={100} placeholder="VD: 3" />
              </Form.Item>
              <Form.Item name="matrixHeight" label="Height (Grid cells)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} max={100} placeholder="VD: 5" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
