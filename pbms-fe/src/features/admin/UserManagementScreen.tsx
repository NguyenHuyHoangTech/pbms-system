import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Popconfirm, Space, Tooltip } from 'antd';
import { SearchOutlined, LockOutlined, UnlockOutlined, EditOutlined, KeyOutlined, UserAddOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'volcano' },
  { value: 'MANAGER',     label: 'Manager',     color: 'blue' },
  { value: 'STAFF',       label: 'Staff',       color: 'geekblue' },
  { value: 'CUSTOMER',    label: 'Customer',  color: 'default' },
];

const getRoleDisplay = (role: string) => {
  // Normalize: strip ROLE_ prefix for display lookup
  const key = role?.replace(/^ROLE_/, '');
  const found = ROLE_OPTIONS.find(r => r.value === key);
  return found || { value: key, label: key, color: 'default' };
};

export const UserManagementScreen = () => {
  const [isModalVisible, setIsModalVisible]     = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser]           = useState<User | null>(null);
  const [keyword, setKeyword]                   = useState('');
  const [roleFilter, setRoleFilter]             = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter]         = useState<string | undefined>(undefined);
  const [pagination, setPagination]             = useState({ current: 1, pageSize: 10 });

  const [form]     = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient    = useQueryClient();
  const logout         = useAuthStore((s) => s.logout);
  const token          = useAuthStore((s) => s.token);
  const currentEmail   = useAuthStore((s: any) => s.account?.email ?? '');
  const navigate       = useNavigate();

  // ── WebSocket real-time sync ─────────────────────────────────────────────
  useEffect(() => {
    const stomp = new Client({
      brokerURL: 'ws://localhost:8080/ws-pbms',
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        stomp.subscribe('/topic/users', () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        });
      },
    });
    stomp.activate();
    return () => { stomp.deactivate(); };
  }, [queryClient, token]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['users', keyword, roleFilter, statusFilter, pagination.current, pagination.pageSize],
    queryFn: async () => {
      const res = await axiosClient.get('/users', {
        params: {
          keyword:  keyword    || undefined,
          role:     roleFilter || undefined,
          status:   statusFilter || undefined,
          page:     pagination.current - 1,
          size:     pagination.pageSize,
        },
      });
      return res.data.data;
    },
  });

  const users: User[]    = data?.content      || [];
  const totalElements    = data?.totalElements || 0;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createUserMutation = useMutation({
    mutationFn: (values: any) => axiosClient.post('/users', values).then(r => r.data),
    onSuccess: () => {
      message.success('Account created successfully. Temporary password sent via email.');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 409 || msg.includes('already exists') || msg.includes('Email')) {
        form.setFields([{ name: 'email', errors: ['This email is already in use.'] }]);
      }
      message.error(msg || 'Failed to create account.');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      axiosClient.put(`/users/${id}`, values).then(r => r.data),
    onSuccess: () => {
      message.success('Information updated successfully.');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Update failed.');
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      axiosClient.put(`/users/${id}/status`, null, { params: { activate } }).then(r => r.data),
    onSuccess: (_, vars) => {
      message.success(`Account has been ${vars.activate ? 'unlocked' : 'locked'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Actions Failed.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) =>
      axiosClient.put(`/users/${id}/reset-password`).then(r => r.data),
    onSuccess: () => message.success('New password sent via email.'),
    onError:   () => message.error('Failed to reset password.'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openEdit = (record: User) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      name:  record.name,
      email: record.email,
      role:  record.role?.replace(/^ROLE_/, ''), // strip prefix for selector
    });
    setIsEditModalVisible(true);
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: User) => (
        <div>
          <div className="font-medium text-gray-800">{name || '—'}</div>
          <div className="text-xs text-gray-400">{r.email}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const r = getRoleDisplay(role);
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) =>
        isActive
          ? <Tag color="success">Active</Tag>
          : <Tag color="error">Locked</Tag>,
    },
    {
      title: 'Authentication',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (v: boolean) => v ? <Tag color="cyan">Verified</Tag> : <Tag>Unverified</Tag>,
    },
    {
      title: 'Action',
      key: 'actions',
      width: 260,
      render: (_: any, record: User) => {
        const isSelf = record.email === currentEmail;
        return (
          <Space size={4}>
            <Tooltip title="Edit info & role">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              >
                Edit
              </Button>
            </Tooltip>

            {record.isActive ? (
              <Tooltip title={isSelf ? 'Cannot lock own account' : 'Lock account'}>
                <Popconfirm
                  title="Lock account?"
                  description={`Lock account ${record.name || record.email}?`}
                  onConfirm={() => changeStatusMutation.mutate({ id: record.id, activate: false })}
                  okText="Lock"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  disabled={isSelf}
                >
                  <Button
                    size="small"
                    danger
                    disabled={isSelf}
                    icon={<LockOutlined />}
                    loading={changeStatusMutation.isPending}
                  >
                    Lock
                  </Button>
                </Popconfirm>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Unlock account?"
                description={`Unlock account ${record.name || record.email}?`}
                onConfirm={() => changeStatusMutation.mutate({ id: record.id, activate: true })}
                okText="Unlock"
                cancelText="Cancel"
              >
                <Button
                  size="small"
                  icon={<UnlockOutlined />}
                  style={{ color: '#16a34a', borderColor: '#16a34a' }}
                  loading={changeStatusMutation.isPending}
                >
                  Unlock
                </Button>
              </Popconfirm>
            )}

            <Tooltip title="Reset password & send via email">
              <Popconfirm
                title="Reset password?"
                description={`A new password will be sent to ${record.email}.`}
                onConfirm={() => resetPasswordMutation.mutate(record.id)}
                okText="Reset"
                cancelText="Cancel"
              >
                <Button
                  size="small"
                  icon={<KeyOutlined />}
                  loading={resetPasswordMutation.isPending}
                >
                  Reset PW
                </Button>
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Internal User Management</h1>
            <p className="text-sm text-gray-400 mt-1">Administrator · Management · Staff · Customer</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Add User
            </Button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded-lg hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input.Search
              placeholder="Search Name, Emaileee"
              allowClear
              onSearch={setKeyword}
              style={{ width: 300 }}
              enterButton={<Button icon={<SearchOutlined />} type="primary">Search</Button>}
            />
            <Select
              placeholder="Filter by Role"
              allowClear
              style={{ width: 200 }}
              onChange={setRoleFilter}
              options={ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))}
            />
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 200 }}
              onChange={setStatusFilter}
              options={[
                { value: 'ACTIVE',   label: 'Active' },
                { value: 'INACTIVE', label: 'Locked' },
              ]}
            />
          </div>

          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current:  pagination.current,
              pageSize: pagination.pageSize,
              total:    totalElements,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} Account`,
              onChange: (page, size) => setPagination({ current: page, pageSize: size }),
            }}
            bordered
            size="middle"
          />
        </div>

        {/* Modal: Create New */}
        <Modal
          title="Create new account"
          open={isModalVisible}
          onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={(v) => createUserMutation.mutate(v)} className="mt-4">
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
              <Input placeholder="Nguyen Van A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ required: true, type: 'email', message: 'Invalid email' }]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>

            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a Role' }]}>
              <Select placeholder="Select role">
                {ROLE_OPTIONS.filter(r => r.value !== 'SUPER_ADMIN').map(r => (
                  <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button onClick={() => { setIsModalVisible(false); form.resetFields(); }} className="mr-2">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createUserMutation.isPending}>
                
                                              Create an account
                                            </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit account"
          open={isEditModalVisible}
          onCancel={() => { setIsEditModalVisible(false); setEditingUser(null); editForm.resetFields(); }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={(values) => {
              if (editingUser) updateUserMutation.mutate({ id: editingUser.id, values });
            }}
            className="mt-4"
          >
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
              <Input placeholder="Nguyen Van A" />
            </Form.Item>

            <Form.Item name="email" label="Email (Not Edited)">
              <Input disabled />
            </Form.Item>

            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a Role' }]}>
              <Select 
                placeholder="Select role" 
                disabled={editingUser?.role?.includes('SUPER_ADMIN')}
              >
                {ROLE_OPTIONS
                  .filter(r => r.value !== 'SUPER_ADMIN' || editingUser?.role?.includes('SUPER_ADMIN'))
                  .map(r => (
                    <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button onClick={() => { setIsEditModalVisible(false); editForm.resetFields(); }} className="mr-2">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updateUserMutation.isPending}>
                Update
              </Button>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
};
