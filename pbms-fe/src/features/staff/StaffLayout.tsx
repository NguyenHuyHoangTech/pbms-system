import React from 'react';
import { Layout, Typography, Avatar, Dropdown, Button, Modal } from 'antd';
import { 
  LogoutOutlined,
  UserOutlined,
  AlertOutlined,
  DollarOutlined,
  SettingOutlined,
  DesktopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import { UserProfileSettingsModal } from '../shared/components/UserProfileSettingsModal';
import { useState } from 'react';
import { useSystemTime } from '../../core/utils/timeProvider';

const { Header, Content } = Layout;
const { Text } = Typography;

export const StaffLayout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const email = useAuthStore((state) => state.email);
  const shiftStatus = useAuthStore((state) => state.shiftStatus);
  const name = useAuthStore((state) => state.name);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const systemTime = useSystemTime();

  const handleLogout = () => {
    if (shiftStatus === 'OPEN') {
      Modal.warning({
        title: 'Shift not ended!',
        content: 'The system requires you to confirm ending the shift before logging out safely.',
        okText: 'Go to End Shift page',
        onOk: () => navigate('/staff/shift-management')
      });
      return;
    }
    logout();
    navigate('/login');
  };

  const userMenu: any = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Setting', onClick: () => setIsSettingsOpen(true) },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
    ],
  };

  const activeGateType = sessionStorage.getItem('activeGateType');

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white px-6 flex justify-between items-center shadow-md z-10 sticky top-0 w-full h-16" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center gap-4">
          <Text strong className="text-xl text-gray-800 tracking-widest cursor-pointer" onClick={() => navigate('/staff/shift-management')}>
            PBMS <span className="text-blue-600">STAFF</span>
          </Text>
        </div>
        
        <div className="flex flex-1 justify-center gap-4">
          <Button 
            type="primary" 
            className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg"
            icon={<DesktopOutlined />} 
            onClick={() => navigate('/staff/gate-console')}
            disabled={shiftStatus !== 'OPEN' || activeGateType === 'PATROL'}
            title={
              shiftStatus !== 'OPEN' 
                ? "Please start a shift to perform this action" 
                : activeGateType === 'PATROL' 
                  ? "Patrol staff do not have access to gate booths" 
                  : ""
            }
          >
            Gate Console
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<AlertOutlined />} 
            onClick={() => navigate('/staff/exception-desk')}
            className="font-bold shadow-lg"
            disabled={shiftStatus !== 'OPEN'}
            title={shiftStatus !== 'OPEN' ? "Please start a shift to perform this action" : ""}
          >
            Resolve Incident
          </Button>
          <Button 
            type="primary" 
            className="bg-green-600 hover:bg-green-500 font-bold shadow-lg"
            icon={<DollarOutlined />} 
            onClick={() => navigate('/staff/shift-management')}
            disabled={shiftStatus !== 'OPEN'}
            title={shiftStatus !== 'OPEN' ? "Please start a shift to perform this action" : ""}
          >
            End Shift
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* System Clock */}
          <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-1.5 rounded-lg shadow font-mono text-sm select-none">
            <ClockCircleOutlined className="text-blue-400 animate-pulse" />
            <div className="flex flex-col leading-tight">
              <span className="text-blue-300 font-bold text-base tracking-widest">
                {systemTime.format('HH:mm:ss')}
              </span>
              <span className="text-slate-400 text-xs">{systemTime.format('DD/MM/YYYY')}</span>
            </div>
          </div>

          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded transition-colors border border-gray-200">
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
              <Text strong className="text-gray-700 hidden sm:block">{name || email || 'Staff'}</Text>
            </div>
          </Dropdown>
        </div>
      </Header>
      
      <Content className="bg-gray-100 m-0 w-full">
        <Outlet />
      </Content>

      <UserProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </Layout>
  );
};
