import React from 'react';
import { Layout, Typography, Avatar, Dropdown, Button, Modal } from 'antd';
import { 
  LogoutOutlined,
  UserOutlined,
  AlertOutlined,
  DollarOutlined,
  SettingOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import { UserProfileSettingsModal } from '../shared/components/UserProfileSettingsModal';
import { useState } from 'react';

const { Header, Content } = Layout;
const { Text } = Typography;

export const StaffLayout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const email = useAuthStore((state) => state.email);
  const shiftStatus = useAuthStore((state) => state.shiftStatus);
  const name = useAuthStore((state) => state.name);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    if (shiftStatus === 'OPEN') {
      Modal.warning({
        title: 'Chưa chốt ca trực!',
        content: 'Hệ thống bắt buộc bạn phải xác nhận chốt ca mới có thể đăng xuất an toàn.',
        okText: 'Đi đến trang Chốt ca',
        onOk: () => navigate('/staff/shift-management')
      });
      return;
    }
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt', onClick: () => setIsSettingsOpen(true) },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
    ],
  };

  const activeGateType = sessionStorage.getItem('mockActiveGateType');

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
                ? "Vui lòng mở ca trực để thực hiện tác vụ này" 
                : activeGateType === 'PATROL' 
                  ? "Nhân viên tuần tra không có quyền truy cập bốt trực cổng" 
                  : ""
            }
          >
            Trực Cổng
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<AlertOutlined />} 
            onClick={() => navigate('/staff/exception-desk')}
            className="font-bold shadow-lg"
            disabled={shiftStatus !== 'OPEN'}
            title={shiftStatus !== 'OPEN' ? "Vui lòng mở ca trực để thực hiện tác vụ này" : ""}
          >
            Xử lý sự cố
          </Button>
          <Button 
            type="primary" 
            className="bg-green-600 hover:bg-green-500 font-bold shadow-lg"
            icon={<DollarOutlined />} 
            onClick={() => navigate('/staff/shift-management')}
            disabled={shiftStatus !== 'OPEN'}
            title={shiftStatus !== 'OPEN' ? "Vui lòng mở ca trực để thực hiện tác vụ này" : ""}
          >
            Chốt ca trực
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded transition-colors border border-gray-200">
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
              <Text strong className="text-gray-700 hidden sm:block">{name || email || 'Nhân viên'}</Text>
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
