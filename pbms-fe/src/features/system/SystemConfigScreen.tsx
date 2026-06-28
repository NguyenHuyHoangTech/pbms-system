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

  // PayPal Configs
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');

  // Statuses
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testPaypalStatus, setTestPaypalStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/system/configs');
        return res.data.data;
      } catch (err) {
        return [];
      }
    }
  });

  useEffect(() => {
    if (configs) {
      const getVal = (key: string) => configs.find((c: any) => c.configKey === key)?.configValue || '';
      
      setSmtpEmail(getVal('SMTP_EMAIL'));
      setSmtpPassword(getVal('SMTP_APP_PASSWORD'));
      setPaypalClientId(getVal('PAYPAL_CLIENT_ID'));
      setPaypalSecret(getVal('PAYPAL_SECRET'));
    }
  }, [configs]);

  const testConnectionMutation = useMutation({
    mutationFn: async (type: 'EMAIL' | 'PAYPAL') => {
      if (type === 'EMAIL') {
        await axiosClient.post('/system/configs/test-email', { email: smtpEmail, password: smtpPassword });
      } else if (type === 'PAYPAL') {
        await axiosClient.post('/system/configs/test-paypal', { clientId: paypalClientId, secret: paypalSecret });
      }
    },
    onMutate: (type) => {
      if (type === 'EMAIL') setTestEmailStatus('testing');
      if (type === 'PAYPAL') setTestPaypalStatus('testing');
    },
    onSuccess: (_, type) => {
      message.success('Connect Success!');
      if (type === 'EMAIL') setTestEmailStatus('success');
      if (type === 'PAYPAL') setTestPaypalStatus('success');
    },
    onError: (_, type) => {
      message.error('Failed connection');
      if (type === 'EMAIL') setTestEmailStatus('error');
      if (type === 'PAYPAL') setTestPaypalStatus('error');
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      // In a real scenario, we'd update each config
      const promises: Promise<any>[] = [];
      const updateIfChanged = (key: string, value: string) => {
        const config = configs.find((c: any) => c.configKey === key);
        if (config && config.configValue !== value) {
          promises.push(axiosClient.put(`/system/configs/${config.id}`, { ...config, configValue: value }));
        } else if (!config && value.trim() !== '') {
          promises.push(axiosClient.post(`/system/configs`, { configKey: key, configValue: value, description: 'System Configuration' }));
        }
      };
      
      updateIfChanged('SMTP_EMAIL', smtpEmail);
      updateIfChanged('SMTP_APP_PASSWORD', smtpPassword);
      updateIfChanged('PAYPAL_CLIENT_ID', paypalClientId);
      updateIfChanged('PAYPAL_SECRET', paypalSecret);

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
      message.success('System configuration saved!');
    },
    onError: () => {
      message.error('Save the Failede configuration');
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <Title level={2} className="m-0 text-gray-800">System Config</Title>
            <Text type="secondary">Manage connection parameters for the entire System PBMSe</Text>
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

            {/* PAYPAL CONFIG */}
            <Card title={<span className="text-green-700"><ApiOutlined className="mr-2"/>PayPal Configuration</span>} className="shadow-sm border-gray-200 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Text strong className="block mb-1 text-gray-600">Sandbox Client ID</Text>
                  <Input 
                    value={paypalClientId} 
                    onChange={e => { setPaypalClientId(e.target.value); setTestPaypalStatus('idle'); }} 
                    size="large"
                  />
                </div>
                <div>
                  <Text strong className="block mb-1 text-gray-600">Sandbox Secret</Text>
                  <Input.Password
                    value={paypalSecret}
                    onChange={e => { setPaypalSecret(e.target.value); setTestPaypalStatus('idle'); }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    size="large"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <Button 
                  loading={testConnectionMutation.isPending && testConnectionMutation.variables === 'PAYPAL'} 
                  onClick={() => testConnectionMutation.mutate('PAYPAL')}
                >
                  Test Connection
                </Button>
                {testPaypalStatus === 'success' && <Text type="success">Verified</Text>}
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
                disabled={testEmailStatus !== 'success' || testPaypalStatus !== 'success'}
              >
                Save All Configurations
              </Button>
            </div>
            { (testEmailStatus !== 'success' || testPaypalStatus !== 'success') && (
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
