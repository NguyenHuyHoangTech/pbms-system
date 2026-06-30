import React, { useState } from 'react';
import { Card, Typography, Button, Table, Modal, Form, Input, InputNumber, Select, message, Space, Upload, Avatar, Tag } from 'antd';
import { PlusOutlined, EditOutlined, CarOutlined, AppstoreOutlined, DeleteOutlined, UploadOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { getImageUrl } from '../../core/utils/imageHelper';

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

  const toggleStatusMutation = useMutation({
    mutationFn: async (record: any) => {
      const newStatus = record.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      return await axiosClient.put(`/operation/vehicle-types/${record.id}`, { ...record, status: newStatus });
    },
    onSuccess: () => {
      message.success('Successfully updated vehicle type status!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'An error occurred while updating status.');
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

  const handleToggleStatus = (record: any) => {
    Modal.confirm({
      title: record.status === 'INACTIVE' ? 'Confirm Unlock' : 'Confirm Lock',
      content: `Are you sure you want to ${record.status === 'INACTIVE' ? 'unlock' : 'lock'} this vehicle type?`,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: () => toggleStatusMutation.mutate(record)
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>VT-{text}</Text> },
    { 
      title: 'Icon', 
      key: 'icon', 
      render: (_: any, r: any) => (
        <Avatar src={r.iconUrl ? getImageUrl(r.iconUrl) : undefined} icon={!r.iconUrl && <CarOutlined />} shape="square" size="large" />
      )
    },
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
      title: 'Status', 
      key: 'status', 
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'INACTIVE' ? 'error' : 'success'}>
          {status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
        </Tag>
      ) 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
            Sửa
          </Button>
          {record.status !== 'INACTIVE' ? (
            <Button type="text" danger icon={<LockOutlined />} onClick={() => handleToggleStatus(record)}>
              Lock
            </Button>
          ) : (
            <Button type="text" icon={<UnlockOutlined />} className="text-green-600 hover:text-green-800" onClick={() => handleToggleStatus(record)}>
              Unlock
            </Button>
          )}
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
            dataSource={(vehicleTypes || []).sort((a: any, b: any) => {
              if (a.status === 'INACTIVE' && b.status !== 'INACTIVE') return 1;
              if (a.status !== 'INACTIVE' && b.status === 'INACTIVE') return -1;
              return a.id - b.id;
            })}
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

            {editingRecord && (
              <Form.Item label="Vehicle Icon (Upload Image)">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar src={editingRecord.iconUrl ? getImageUrl(editingRecord.iconUrl) : undefined} icon={!editingRecord.iconUrl && <CarOutlined />} shape="square" size={64} className="bg-gray-100" />
                  <Upload
                    name="file"
                    showUploadList={false}
                    customRequest={async (options) => {
                      const { file, onSuccess, onError } = options;
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await axiosClient.post(`/operation/vehicle-types/${editingRecord.id}/icon`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        message.success('Icon uploaded successfully');
                        setEditingRecord(res.data.data);
                        queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
                        if (onSuccess) onSuccess("ok");
                      } catch (err: any) {
                        message.error(err.response?.data?.message || 'Failed to upload icon');
                        if (onError) onError(err);
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload New Icon</Button>
                  </Upload>
                </div>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};
