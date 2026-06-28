import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  HistoryOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import { UserProfileSettingsModal } from '../shared/components/UserProfileSettingsModal';
import { SystemClock } from '../shared/components/SystemClock';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const email = useAuthStore((state) => state.email);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: '/admin/system-configs',
      icon: <SettingOutlined />,
      label: 'System Config',
    },
    {
      key: '/admin/audit-logs',
      icon: <HistoryOutlined />,
      label: 'Active Log',
    },
  ];

  const userMenu: any = {
    items: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Account Settings',
        onClick: () => setIsSettingsOpen(true),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout,
        danger: true,
      },
    ],
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        className="shadow-md z-10"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <Text strong className={`text-blue-600 transition-all ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? 'PBMS' : 'PBMS Admin'}
          </Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0 mt-4"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white px-4 flex justify-between items-center shadow-sm z-0" style={{ backgroundColor: '#ffffff' }}>
          <div 
            className="cursor-pointer text-lg text-gray-600 hover:text-blue-600 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          
          <div className="flex items-center gap-4">
            <SystemClock />
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                <Avatar icon={<UserOutlined />} className="bg-blue-600" />
                <Text strong className="text-gray-700 hidden sm:block">{email || 'Admin'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="bg-gray-50 m-0">
          {/* This renders the nested child routes automatically */}
          <Outlet />
        </Content>
      </Layout>
      <UserProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </Layout>
  );
};
