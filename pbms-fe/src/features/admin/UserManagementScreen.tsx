import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
}

export const UserManagementScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const MOCK_USERS: User[] = [
    { id: 1, name: 'Super Admin', email: 'admin@pbms.com', phone: '0900000001', role: 'ROLE_SUPER_ADMIN', isVerified: true, isActive: true },
    { id: 2, name: 'Manager B', email: 'manager@pbms.com', phone: '0900000002', role: 'ROLE_MANAGER', isVerified: true, isActive: true },
    { id: 3, name: 'Staff C', email: 'staff@pbms.com', phone: '0900000003', role: 'ROLE_STAFF', isVerified: true, isActive: true },
    { id: 4, name: 'Customer D', email: 'customer@pbms.com', phone: '0900000004', role: 'ROLE_CUSTOMER', isVerified: true, isActive: true },
  ];

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      return new Promise<User[]>(resolve => setTimeout(() => resolve(MOCK_USERS), 500));
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: any) => {
      return new Promise<any>(resolve => setTimeout(() => resolve(values), 500));
    },
    onSuccess: () => {
      message.success('User created successfully. Password sent via email. (Mocked)');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to create user.');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      return new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    },
    onSuccess: () => {
      message.success('User deactivated successfully. (Mocked)');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Failed to deactivate user.');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      return new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    },
    onSuccess: () => {
      message.success('Password reset successfully. New password sent via email. (Mocked)');
    },
    onError: () => {
      message.error('Failed to reset password.');
    }
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <div className="space-x-2 flex">
          <Popconfirm
            title="Deactivate this user?"
            description="Are you sure you want to deactivate this account?"
            onConfirm={() => deactivateMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="primary" danger disabled={!record.isActive}>Deactivate</Button>
          </Popconfirm>
          <Button size="small" type="default" className="text-blue-600 border-blue-600" onClick={() => {
            Modal.confirm({
              title: 'Reset Password',
              content: `Are you sure you want to reset the password for ${record.name}?`,
              onOk: () => resetPasswordMutation.mutate(record.id)
            });
          }}>Reset Password</Button>
        </div>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage system administrators, managers, and staff.</p>
          </div>
          <div className="flex space-x-4">
             <button onClick={() => setIsModalVisible(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Add New User</button>
             <button onClick={handleLogout} className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <Table 
            dataSource={users} 
            columns={columns} 
            rowKey="id" 
            loading={isLoading} 
            pagination={{ pageSize: 10 }}
          />
        </div>

        <Modal
          title="Create New User"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createUserMutation.mutate(values)}
            className="mt-4"
          >
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="user@example.com" />
            </Form.Item>
            
            <Form.Item 
              name="phone" 
              label="Phone Number" 
              rules={[
                { required: true, message: 'Please enter phone number' },
                { pattern: /^\d{10}$/, message: 'Phone must be exactly 10 digits' }
              ]}
            >
              <Input placeholder="0123456789" maxLength={10} />
            </Form.Item>
            
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
              <Select placeholder="Select a role">
                <Select.Option value="ROLE_MANAGER">Manager</Select.Option>
                <Select.Option value="ROLE_STAFF">Staff</Select.Option>
                <Select.Option value="ROLE_CUSTOMER">Khách hàng (Customer)</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item className="mb-0 flex justify-end">
              <Button onClick={() => setIsModalVisible(false)} className="mr-2">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createUserMutation.isPending} className="bg-blue-600">
                Create User
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
