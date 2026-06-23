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

const { Sider, Content } = Layout;
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

  const menuItems = [
    { key: '/manager/revenue-dashboard', icon: <DashboardOutlined />, label: 'Doanh Thu' },
    { key: '/manager/operational-dashboard', icon: <DashboardOutlined />, label: 'Vận Hành' },
    { key: '/manager/routing', icon: <NodeIndexOutlined />, label: 'Điều Phối Tuyến' },
    { key: '/manager/pre-bookings', icon: <ScheduleOutlined />, label: 'Quản Lý Đặt Trước' },
    { key: '/manager/space-map', icon: <BlockOutlined />, label: 'Sơ Đồ Bãi Đỗ' },
    { key: '/manager/vehicle-types', icon: <CarOutlined />, label: 'Loại Phương Tiện' },
    { key: '/manager/pricing-config', icon: <DollarOutlined />, label: 'Cấu Hình Giá' },
    { key: '/manager/refund-management', icon: <DollarOutlined />, label: 'Quản Lý Hoàn Tiền' },
    { key: '/manager/monthly-passes', icon: <IdcardOutlined />, label: 'Vé Tháng' },
    { key: '/manager/building-profile', icon: <BankOutlined />, label: 'Hồ Sơ Tòa Nhà' },
    { key: '/manager/card-management', icon: <CreditCardOutlined />, label: 'Kho Thẻ (RFID)' },
    { key: '/manager/ticket-center', icon: <CustomerServiceOutlined />, label: 'Trung Tâm Xử Lý' },
    { key: '/manager/incidents', icon: <WarningOutlined />, label: 'Quản Lý Sự Cố' },
  ];

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt', onClick: () => setIsSettingsOpen(true) },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
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
            selectedKeys={[location.pathname]}
            items={menuItems}
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
                  <Text type="secondary" className="text-xs">Quản lý</Text>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>
      
      <Layout className="h-screen">
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
