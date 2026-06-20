import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tabs, message, Typography, Divider, Alert } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  GoogleOutlined, 
  SafetyCertificateOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../../core/store/useAuthStore';

const { Title, Text } = Typography;

interface UserProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileSettingsModal: React.FC<UserProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  
  const email = useAuthStore(state => state.email);
  const name = useAuthStore(state => state.name);
  const authProvider = useAuthStore(state => state.authProvider);
  const hasPassword = useAuthStore(state => state.hasPassword);
  
  const updateProfile = useAuthStore(state => state.updateProfile);
  const linkGoogleAccount = useAuthStore(state => state.linkGoogleAccount);
  const createPassword = useAuthStore(state => state.createPassword);

  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        name: name || '',
        email: email || ''
      });
      pwdForm.resetFields();
      setActiveTab('1');
    }
  }, [isOpen, name, email, form, pwdForm]);

  const handleUpdateProfile = (values: any) => {
    updateProfile(values.name);
    message.success('Cập nhật thông tin thành công!');
    // Không tự động đóng để người dùng có thể thao tác tiếp nếu muốn
  };

  const handleLinkGoogle = () => {
    message.loading({ content: 'Đang kết nối với Google...', key: 'google' });
    setTimeout(() => {
      linkGoogleAccount();
      message.success({ content: 'Liên kết tài khoản Google thành công!', key: 'google', duration: 2 });
    }, 1500);
  };

  const handleChangePassword = (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      return message.error('Mật khẩu xác nhận không khớp!');
    }
    message.loading({ content: 'Đang xử lý...', key: 'pwd' });
    setTimeout(() => {
      if (!hasPassword) {
        createPassword();
        message.success({ content: 'Đã tạo mật khẩu mới thành công!', key: 'pwd', duration: 2 });
      } else {
        message.success({ content: 'Đổi mật khẩu thành công!', key: 'pwd', duration: 2 });
      }
      pwdForm.resetFields();
    }, 1500);
  };

  return (
    <Modal
      title={<span className="text-xl font-bold">Cài Đặt Tài Khoản</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mt-4">
        
        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        <Tabs.TabPane tab={<span><UserOutlined />Hồ sơ</span>} key="1">
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile} className="mt-2">
            <Form.Item label="Email đăng nhập">
              <Input disabled value={email || ''} className="bg-gray-50 text-gray-500" />
            </Form.Item>
            <Form.Item 
              name="name" 
              label="Tên hiển thị" 
              rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
            >
              <Input placeholder="Nhập tên của bạn" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" className="w-full mt-2">
              Lưu Thay Đổi
            </Button>
          </Form>
        </Tabs.TabPane>

        {/* TAB 2: BẢO MẬT */}
        <Tabs.TabPane tab={<span><SafetyCertificateOutlined />Bảo mật & Liên kết</span>} key="2">
          <div className="mt-2 space-y-6">
            
            {/* THÔNG TIN TÀI KHOẢN */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-gray-700">Trạng thái liên kết Google:</Text>
                {authProvider === 'GOOGLE' ? (
                  <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">Đã liên kết</span>
                ) : (
                  <span className="text-gray-500 text-sm">Chưa liên kết</span>
                )}
              </div>
              
              {authProvider !== 'GOOGLE' ? (
                <>
                  <Text className="text-xs text-gray-500 block mb-3">Liên kết tài khoản Google giúp bạn đăng nhập nhanh chóng mà không cần nhập mật khẩu hay mã OTP.</Text>
                  <Button 
                    type="default" 
                    icon={<GoogleOutlined />} 
                    onClick={handleLinkGoogle}
                    className="w-full flex items-center justify-center font-medium"
                  >
                    Liên kết ngay với Google
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <GoogleOutlined className="text-red-500" />
                  <Text>Tài khoản này đang sử dụng đăng nhập qua Google.</Text>
                </div>
              )}
            </div>

            <Divider className="my-0" />

            {/* QUẢN LÝ MẬT KHẨU */}
            <div>
              <Title level={5} className="mb-4">
                <LockOutlined className="mr-2 text-blue-500" />
                {hasPassword ? 'Đổi Mật Khẩu' : 'Tạo Mật Khẩu Đăng Nhập'}
              </Title>
              
              {!hasPassword && (
                <Alert 
                  type="info" 
                  showIcon 
                  className="mb-4"
                  message="Bạn chưa có mật khẩu"
                  description="Bạn đang đăng nhập bằng Google. Hãy tạo một mật khẩu để có thể đăng nhập trực tiếp bằng Email mà không cần thông qua Google."
                />
              )}

              <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
                {hasPassword && (
                  <Form.Item 
                    name="oldPassword" 
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu cũ..." />
                  </Form.Item>
                )}
                
                <Form.Item 
                  name="newPassword" 
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: 'Nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải từ 6 ký tự' }
                  ]}
                >
                  <Input.Password placeholder="Nhập mật khẩu mới..." />
                </Form.Item>
                
                <Form.Item 
                  name="confirmPassword" 
                  label="Xác nhận mật khẩu mới"
                  rules={[{ required: true, message: 'Xác nhận lại mật khẩu mới' }]}
                >
                  <Input.Password placeholder="Nhập lại mật khẩu mới..." />
                </Form.Item>

                <Button type="primary" htmlType="submit" className="w-full">
                  {hasPassword ? 'Đổi Mật Khẩu' : 'Tạo Mật Khẩu'}
                </Button>
              </Form>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};
