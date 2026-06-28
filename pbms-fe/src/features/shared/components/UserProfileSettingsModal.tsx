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
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../../core/api/axiosClient';
import { GoogleLogin } from '@react-oauth/google';

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
    message.success('Update successful!');
    // Không tự động đóng để người dùng có thể thao tác tiếp nếu muốn
  };

  const linkGoogleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const response = await axiosClient.post('/auth/link-google', { googleIdToken: credential });
      return response.data;
    },
    onSuccess: () => {
      message.success({ content: 'Link your Google Success account!', key: 'google', duration: 2 });
      linkGoogleAccount(); // Updates local Zustand store (authProvider='GOOGLE')
    },
    onError: (error: any) => {
      message.error({ content: error.response?.data?.message || 'Error when linking Google', key: 'google', duration: 3 });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axiosClient.post('/auth/reset-password', {
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      return response.data;
    },
    onSuccess: () => {
      if (!hasPassword) {
        createPassword(); // Update local Zustand state
        message.success({ content: 'New Password created Success!', key: 'pwd', duration: 2 });
      } else {
        message.success({ content: 'Change Password Success!', key: 'pwd', duration: 2 });
      }
      pwdForm.resetFields();
    },
    onError: (error: any) => {
      message.error({ content: error.response?.data?.message || 'Error when changing Password', key: 'pwd', duration: 3 });
    }
  });

  const handleChangePassword = (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      return message.error('Password Confirm does not match!');
    }
    message.loading({ content: 'Processingeee', key: 'pwd' });
    changePasswordMutation.mutate(values);
  };

  return (
    <Modal
      title={<span className="text-xl font-bold">Settings Account</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mt-4">
        
        {/* TAB 1: PERSONAL INFO */}
        <Tabs.TabPane tab={<span><UserOutlined />File</span>} key="1">
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile} className="mt-2">
            <Form.Item label="Email Login">
              <Input disabled value={email || ''} className="bg-gray-50 text-gray-500" />
            </Form.Item>
            <Form.Item 
              name="name" 
              label="Display name" 
              rules={[{ required: true, message: 'Please enter a display name!' }]}
            >
              <Input placeholder="Enter your name" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" className="w-full mt-2">
              
                                        Save Changes
                                      </Button>
          </Form>
        </Tabs.TabPane>

        {/* TAB 2: SECURITY */}
        <Tabs.TabPane tab={<span><SafetyCertificateOutlined />Security & Links</span>} key="2">
          <div className="mt-2 space-y-6">
            
            {/* Account Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-gray-700">Google link status:</Text>
                {authProvider === 'GOOGLE' ? (
                  <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">Linked</span>
                ) : (
                  <span className="text-gray-500 text-sm">Not linked yet</span>
                )}
              </div>
              
              {authProvider !== 'GOOGLE' ? (
                <>
                  <Text className="text-xs text-gray-500 block mb-3">Linking your Google account helps you Login quickly without needing to enter a Password or OTPe code</Text>
                  <div className="flex justify-center mt-2">
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        message.loading({ content: 'Authenticating with servereee', key: 'google' });
                        if (credentialResponse.credential) {
                          linkGoogleMutation.mutate(credentialResponse.credential);
                        }
                      }}
                      onError={() => {
                        message.error('Login Google Failed');
                      }}
                      useOneTap={false}
                      theme="outline"
                      text="continue_with"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <GoogleOutlined className="text-red-500" />
                  <Text>This account is using Login via Google</Text>
                </div>
              )}
            </div>

            <Divider className="my-0" />

            {/* Management Password */}
            <div>
              <Title level={5} className="mb-4">
                <LockOutlined className="mr-2 text-blue-500" />
                {hasPassword ? 'Change Password' : 'Create Password Login'}
              </Title>
              
              {!hasPassword && (
                <Alert 
                  type="info" 
                  showIcon 
                  className="mb-4"
                  message="You don't have a Password yet"
                  description="You are Login with Google. Please create a Password so you can Log in directly by Email without going through Google."
                />
              )}

              <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
                {hasPassword && (
                  <Form.Item 
                    name="oldPassword" 
                    label="Current password"
                    rules={[{ required: true, message: 'Enter current Password' }]}
                  >
                    <Input.Password placeholder="Enter old Passwordeee" />
                  </Form.Item>
                )}
                
                <Form.Item 
                  name="newPassword" 
                  label="New Password "
                  rules={[
                    { required: true, message: 'Enter new Password' },
                    { 
                      pattern: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,20}$/,
                      message: 'Password must be 8-20 characters, including uppercase letters, lowercase letters, numbers and special characters'
                    }
                  ]}
                >
                  <Input.Password placeholder="Enter new Passwordeee" />
                </Form.Item>
                
                <Form.Item 
                  name="confirmPassword" 
                  label="Confirm password"
                  rules={[{ required: true, message: 'Confirm new Password' }]}
                >
                  <Input.Password placeholder="Re-enter the new Password" />
                </Form.Item>

                <Button type="primary" htmlType="submit" className="w-full">
                  {hasPassword ? 'Change Password' : 'Create Password'}
                </Button>
              </Form>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};
