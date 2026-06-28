import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  BlockOutlined, 
  CarOutlined, 
  DollarOutlined, 
  IdcardOutlined, 
  BankOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  NodeIndexOutlined,
  ScheduleOutlined,
  SettingOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import { UserProfileSettingsModal } from '../shared/components/UserProfileSettingsModal';
import { SystemClock } from '../shared/components/SystemClock';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

export const ManagerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const email = useAuthStore((state) => state.email);
  const name = useAuthStore((state) => state.name);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

    const menuItems: any[] = [
      {
        key: 'sub-overview',
        label: 'Overview',
        icon: <DashboardOutlined />,
        children: [
          { key: '/manager/revenue-dashboard', label: 'Revenue Dashboard' },
          { key: '/manager/operational-dashboard', label: 'Operate Dashboard' },
        ],
      },
      {
        key: 'sub-operations',
        label: 'Operations',
        icon: <CustomerServiceOutlined />,
        children: [
          { key: '/manager/space-map', label: 'Space Map', icon: <BlockOutlined /> },
          { key: '/manager/routing', label: 'Routing', icon: <NodeIndexOutlined /> },
          { key: '/manager/incidents', label: 'Incident Management', icon: <WarningOutlined /> },
          { key: '/manager/ticket-center', label: 'Processing Center' },
        ],
      },
      {
        key: 'sub-assets-pricing',
        label: 'Asset & Pricing',
        icon: <CarOutlined />,
        children: [
          { key: '/manager/vehicle-types', label: 'Vehicle Type' },
          { key: '/manager/pricing-config', label: 'Price Configuration' },
          { key: '/manager/monthly-passes', label: 'Monthly Passes', icon: <IdcardOutlined /> },
          { key: '/manager/pre-bookings', label: 'Pre-booking Management', icon: <ScheduleOutlined /> },
        ],
      },
      {
        key: 'sub-revenue',
        label: 'Revenue & Financial',
        icon: <DollarOutlined />,
        children: [
          { key: '/manager/shift-revenue', label: 'Shift Revenue' },
          { key: '/manager/refund-management', label: 'Refund Management' },
        ],
      },
      {
        key: 'sub-system',
        label: 'System & Storage',
        icon: <SettingOutlined />,
        children: [
          { key: '/manager/card-management', label: 'Card Warehouse', icon: <CreditCardOutlined /> },
          { key: '/manager/building-profile', label: 'Building Profile', icon: <BankOutlined /> },
        ],
      }
    ];

  const userMenu: any = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Setting', onClick: () => setIsSettingsOpen(true) },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
    ],
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        className="shadow-md z-10 flex flex-col h-screen"
        width={250}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white">
          {!collapsed && (
            <Text strong className="text-blue-600 transition-all text-xl">
              PBMS Manager
            </Text>
          )}
          <div 
            className={`cursor-pointer text-lg text-gray-600 hover:text-blue-600 transition-colors ${collapsed ? 'mx-auto' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Menu
            theme="light"
            mode="inline"
            defaultOpenKeys={['sub-overview', 'sub-operations', 'sub-assets-pricing', 'sub-revenue', 'sub-system']}
            selectedKeys={[location.pathname]}
            items={menuItems as any}
            onClick={({ key }) => navigate(key)}
            className="border-r-0 mt-4"
          />
        </div>

        <div className="border-t border-gray-100 p-4 shrink-0">
          <Dropdown menu={userMenu} placement="topRight" arrow>
            <div className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${collapsed ? 'justify-center' : ''}`}>
              <Avatar icon={<UserOutlined />} className="bg-blue-600 min-w-[32px]" />
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <Text strong className="text-gray-700 truncate">{name || email || 'Manager'}</Text>
                  <Text type="secondary" className="text-xs">Management</Text>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>
      
      <Layout className="h-screen">
        <Header className="bg-white px-6 flex justify-end items-center shadow-sm z-10 sticky top-0 w-full h-16" style={{ backgroundColor: '#ffffff' }}>
          <SystemClock />
        </Header>
        <Content className="bg-gray-50 m-0 h-full overflow-hidden flex flex-col">
          <Outlet />
        </Content>
      </Layout>

      <UserProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </Layout>
  );
};
