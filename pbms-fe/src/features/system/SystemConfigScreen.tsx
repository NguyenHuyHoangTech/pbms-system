import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useWebSocket } from '../../core/websocket/useWebSocket';
import { EyeInvisibleOutlined, EyeTwoTone, SaveOutlined, ApiOutlined } from '@ant-design/icons';
import { Input, Button, Card, Typography, Space, message, Spin } from 'antd';

const { Title, Text } = Typography;

export const SystemConfigScreen = () => {
  const logout = useAuthStore((state) => state.logout);
  const { connected } = useWebSocket();
  const queryClient = useQueryClient();

  // Email Configs
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  // PayOS Configs
  const [payosClientId, setPayosClientId] = useState('');
  const [payosApiKey, setPayosApiKey] = useState('');
  const [payosChecksumKey, setPayosChecksumKey] = useState('');

  // VNPay Configs
  const [vnpayClientId, setVnpayClientId] = useState('');
  const [vnpaySecret, setVnpaySecret] = useState('');

  // Statuses
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testPayosStatus, setTestPayosStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testVnpayStatus, setTestVnpayStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const MOCK_CONFIGS = [
    { id: 1, configKey: 'SMTP_EMAIL', configValue: 'no-reply@pbms.com', description: 'SMTP Email Address' },
    { id: 2, configKey: 'SMTP_APP_PASSWORD', configValue: 'abcdefghijklmnop', description: 'SMTP App Password' },
    { id: 3, configKey: 'PAYOS_CLIENT_ID', configValue: 'client-id-payos', description: 'PayOS Client ID' },
    { id: 4, configKey: 'PAYOS_API_KEY', configValue: 'payos-api-key-xyz', description: 'PayOS API Key' },
    { id: 5, configKey: 'PAYOS_CHECKSUM_KEY', configValue: 'payos-checksum-xyz', description: 'PayOS Checksum Key' },
    { id: 6, configKey: 'VNPAY_CLIENT_ID', configValue: 'vnpay-sandbox-client', description: 'VNPay Sandbox Client ID' },
    { id: 7, configKey: 'VNPAY_SECRET', configValue: 'vnpay-secret-sandbox', description: 'VNPay Sandbox Secret' },
    { id: 8, configKey: 'MAX_LOGIN_ATTEMPTS', configValue: '5', description: 'Max login attempts before lock' },
  ];

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      return new Promise<any[]>(resolve => setTimeout(() => resolve(MOCK_CONFIGS), 500));
    }
  });

  useEffect(() => {
    if (configs) {
      const getVal = (key: string) => configs.find((c: any) => c.configKey === key)?.configValue || '';
      
      setSmtpEmail(getVal('SMTP_EMAIL'));
      setSmtpPassword(getVal('SMTP_APP_PASSWORD'));
      setPayosClientId(getVal('PAYOS_CLIENT_ID'));
      setPayosApiKey(getVal('PAYOS_API_KEY'));
      setPayosChecksumKey(getVal('PAYOS_CHECKSUM_KEY'));
      setVnpayClientId(getVal('VNPAY_CLIENT_ID'));
      setVnpaySecret(getVal('VNPAY_SECRET'));
    }
  }, [configs]);

  const testConnectionMutation = useMutation({
    mutationFn: async (type: 'EMAIL' | 'PAYOS' | 'VNPAY') => {
      return new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
    },
    onMutate: (type) => {
      if (type === 'EMAIL') setTestEmailStatus('testing');
      if (type === 'PAYOS') setTestPayosStatus('testing');
      if (type === 'VNPAY') setTestVnpayStatus('testing');
    },
    onSuccess: (_, type) => {
      message.success('Kết nối thành công! (Mocked)');
      if (type === 'EMAIL') setTestEmailStatus('success');
      if (type === 'PAYOS') setTestPayosStatus('success');
      if (type === 'VNPAY') setTestVnpayStatus('success');
    },
    onError: (_, type) => {
      message.error('Kết nối thất bại.');
      if (type === 'EMAIL') setTestEmailStatus('error');
      if (type === 'PAYOS') setTestPayosStatus('error');
      if (type === 'VNPAY') setTestVnpayStatus('error');
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      return new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
      message.success('Đã lưu cấu hình hệ thống! (Mocked)');
    },
    onError: () => {
      message.error('Lưu cấu hình thất bại.');
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <Title level={2} className="m-0 text-gray-800">Cấu hình Hệ thống</Title>
            <Text type="secondary">Quản lý tham số kết nối cho toàn bộ hệ thống PBMS.</Text>
          </div>
          <div className="flex items-center space-x-4">
             <span className={`px-2 py-1 rounded text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              WS: {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12"><Spin size="large" /></div>
        ) : (
          <div className="space-y-6">
            {/* EMAIL CONFIG */}
            <Card title={<span className="text-gray-700"><ApiOutlined className="mr-2"/>Email Configuration (SMTP)</span>} className="shadow-sm border-gray-200 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Text strong className="block mb-1 text-gray-600">SMTP Email Address</Text>
                  <Input 
                    value={smtpEmail} 
                    onChange={e => { setSmtpEmail(e.target.value); setTestEmailStatus('idle'); }} 
                    size="large"
                  />
                </div>
                <div>
                  <Text strong className="block mb-1 text-gray-600">SMTP App Password</Text>
                  <Input.Password
                    value={smtpPassword}
                    onChange={e => { setSmtpPassword(e.target.value); setTestEmailStatus('idle'); }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    size="large"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <Button 
                  loading={testConnectionMutation.isPending && testConnectionMutation.variables === 'EMAIL'} 
                  onClick={() => testConnectionMutation.mutate('EMAIL')}
                >
                  Test Connection
                </Button>
                {testEmailStatus === 'success' && <Text type="success">Verified</Text>}
              </div>
            </Card>

            {/* PAYOS CONFIG */}
            <Card title={<span className="text-blue-700"><ApiOutlined className="mr-2"/>PayOS Configuration</span>} className="shadow-sm border-gray-200 rounded-xl">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <Text strong className="block mb-1 text-gray-600">Client ID</Text>
                  <Input 
                    value={payosClientId} 
                    onChange={e => { setPayosClientId(e.target.value); setTestPayosStatus('idle'); }} 
                    size="large"
                  />
                </div>
                <div>
                  <Text strong className="block mb-1 text-gray-600">API Key</Text>
                  <Input.Password
                    value={payosApiKey}
                    onChange={e => { setPayosApiKey(e.target.value); setTestPayosStatus('idle'); }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    size="large"
                  />
                </div>
                <div>
                  <Text strong className="block mb-1 text-gray-600">Checksum Key</Text>
                  <Input.Password
                    value={payosChecksumKey}
                    onChange={e => { setPayosChecksumKey(e.target.value); setTestPayosStatus('idle'); }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    size="large"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <Button 
                  loading={testConnectionMutation.isPending && testConnectionMutation.variables === 'PAYOS'} 
                  onClick={() => testConnectionMutation.mutate('PAYOS')}
                >
                  Test Connection
                </Button>
                {testPayosStatus === 'success' && <Text type="success">Verified</Text>}
              </div>
            </Card>

            {/* VNPAY CONFIG */}
            <Card title={<span className="text-green-700"><ApiOutlined className="mr-2"/>VNPay Configuration</span>} className="shadow-sm border-gray-200 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Text strong className="block mb-1 text-gray-600">Sandbox Client ID</Text>
                  <Input 
                    value={vnpayClientId} 
                    onChange={e => { setVnpayClientId(e.target.value); setTestVnpayStatus('idle'); }} 
                    size="large"
                  />
                </div>
                <div>
                  <Text strong className="block mb-1 text-gray-600">Sandbox Secret</Text>
                  <Input.Password
                    value={vnpaySecret}
                    onChange={e => { setVnpaySecret(e.target.value); setTestVnpayStatus('idle'); }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    size="large"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <Button 
                  loading={testConnectionMutation.isPending && testConnectionMutation.variables === 'VNPAY'} 
                  onClick={() => testConnectionMutation.mutate('VNPAY')}
                >
                  Test Connection
                </Button>
                {testVnpayStatus === 'success' && <Text type="success">Verified</Text>}
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button 
                type="primary" 
                size="large" 
                icon={<SaveOutlined />} 
                loading={saveConfigMutation.isPending}
                onClick={() => saveConfigMutation.mutate()}
                className="bg-blue-600"
                disabled={testEmailStatus !== 'success' || testPayosStatus !== 'success' || testVnpayStatus !== 'success'}
              >
                Save All Configurations
              </Button>
            </div>
            { (testEmailStatus !== 'success' || testPayosStatus !== 'success' || testVnpayStatus !== 'success') && (
              <div className="text-right mt-2 text-xs text-red-500">
                * You must successfully test all connections before saving.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
