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
  { value: 'CUSTOMER',    label: 'Khách hàng',  color: 'default' },
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
  const currentEmail   = useAuthStore((s) => s.user?.email ?? '');
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
      message.success('Tạo tài khoản thành công. Mật khẩu tạm đã được gửi qua email.');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 409 || msg.includes('already exists') || msg.includes('Email')) {
        form.setFields([{ name: 'email', errors: ['Email này đã được sử dụng.'] }]);
      }
      message.error(msg || 'Tạo tài khoản thất bại.');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      axiosClient.put(`/users/${id}`, values).then(r => r.data),
    onSuccess: () => {
      message.success('Cập nhật thông tin thành công.');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Cập nhật thất bại.');
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      axiosClient.put(`/users/${id}/status`, null, { params: { activate } }).then(r => r.data),
    onSuccess: (_, vars) => {
      message.success(`Tài khoản đã được ${vars.activate ? 'mở khóa' : 'khóa'} thành công.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Thao tác thất bại.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) =>
      axiosClient.put(`/users/${id}/reset-password`).then(r => r.data),
    onSuccess: () => message.success('Mật khẩu mới đã được gửi qua email.'),
    onError:   () => message.error('Reset mật khẩu thất bại.'),
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
      title: 'Họ Tên',
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const r = getRoleDisplay(role);
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) =>
        isActive
          ? <Tag color="success">Hoạt động</Tag>
          : <Tag color="error">Đã khóa</Tag>,
    },
    {
      title: 'Xác thực',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (v: boolean) => v ? <Tag color="cyan">Đã xác thực</Tag> : <Tag>Chưa xác thực</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 260,
      render: (_: any, record: User) => {
        const isSelf = record.email === currentEmail;
        return (
          <Space size={4}>
            <Tooltip title="Chỉnh sửa thông tin & vai trò">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              >
                Sửa
              </Button>
            </Tooltip>

            {record.isActive ? (
              <Tooltip title={isSelf ? 'Không thể tự khóa tài khoản' : 'Khóa tài khoản'}>
                <Popconfirm
                  title="Khóa tài khoản?"
                  description={`Khóa tài khoản của ${record.name || record.email}?`}
                  onConfirm={() => changeStatusMutation.mutate({ id: record.id, activate: false })}
                  okText="Khóa"
                  cancelText="Hủy"
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
                    Khóa
                  </Button>
                </Popconfirm>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Mở khóa tài khoản?"
                description={`Mở khóa tài khoản của ${record.name || record.email}?`}
                onConfirm={() => changeStatusMutation.mutate({ id: record.id, activate: true })}
                okText="Mở khóa"
                cancelText="Hủy"
              >
                <Button
                  size="small"
                  icon={<UnlockOutlined />}
                  style={{ color: '#16a34a', borderColor: '#16a34a' }}
                  loading={changeStatusMutation.isPending}
                >
                  Mở khóa
                </Button>
              </Popconfirm>
            )}

            <Tooltip title="Reset mật khẩu & gửi qua email">
              <Popconfirm
                title="Reset mật khẩu?"
                description={`Mật khẩu mới sẽ được gửi đến ${record.email}.`}
                onConfirm={() => resetPasswordMutation.mutate(record.id)}
                okText="Reset"
                cancelText="Hủy"
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
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản Nội bộ</h1>
            <p className="text-sm text-gray-400 mt-1">Quản trị viên · Quản lý · Nhân viên · Khách hàng</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Thêm tài khoản
            </Button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded-lg hover:bg-red-100 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input.Search
              placeholder="Tìm kiếm Tên, Email..."
              allowClear
              onSearch={setKeyword}
              style={{ width: 300 }}
              enterButton={<Button icon={<SearchOutlined />} type="primary">Tìm</Button>}
            />
            <Select
              placeholder="Lọc theo Vai trò"
              allowClear
              style={{ width: 200 }}
              onChange={setRoleFilter}
              options={ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))}
            />
            <Select
              placeholder="Lọc theo Trạng thái"
              allowClear
              style={{ width: 200 }}
              onChange={setStatusFilter}
              options={[
                { value: 'ACTIVE',   label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Đã khóa' },
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
              showTotal: (total) => `Tổng ${total} tài khoản`,
              onChange: (page, size) => setPagination({ current: page, pageSize: size }),
            }}
            bordered
            size="middle"
          />
        </div>

        {/* Modal: Tạo mới */}
        <Modal
          title="Tạo tài khoản mới"
          open={isModalVisible}
          onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={(v) => createUserMutation.mutate(v)} className="mt-4">
            <Form.Item name="name" label="Họ Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>

            <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
              <Select placeholder="Chọn vai trò">
                {ROLE_OPTIONS.filter(r => r.value !== 'SUPER_ADMIN').map(r => (
                  <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button onClick={() => { setIsModalVisible(false); form.resetFields(); }} className="mr-2">Hủy</Button>
              <Button type="primary" htmlType="submit" loading={createUserMutation.isPending}>
                Tạo tài khoản
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal: Chỉnh sửa */}
        <Modal
          title="Chỉnh sửa tài khoản"
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
            <Form.Item name="name" label="Họ Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item name="email" label="Email (Không được sửa)">
              <Input disabled />
            </Form.Item>

            <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
              <Select 
                placeholder="Chọn vai trò" 
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
              <Button onClick={() => { setIsEditModalVisible(false); editForm.resetFields(); }} className="mr-2">Hủy</Button>
              <Button type="primary" htmlType="submit" loading={updateUserMutation.isPending}>
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
};
