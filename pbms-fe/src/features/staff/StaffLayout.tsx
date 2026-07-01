import React from 'react';
import { Layout, Typography, Avatar, Dropdown, Button, Modal, Badge } from 'antd';
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
import { NotificationDropdown } from '../shared/components/NotificationDropdown';
import { ReservationConflictModal } from './ReservationConflictModal';
import { MonthlyZoneConflictModal } from './MonthlyZoneConflictModal';
import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { notification } from 'antd';
import axiosClient from '../../core/api/axiosClient';

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
  
  // Conflict state
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [pendingConflicts, setPendingConflicts] = useState<any[]>([]);

  const [monthlyConflictVisible, setMonthlyConflictVisible] = useState(false);
  const [monthlyConflictData, setMonthlyConflictData] = useState<any>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws-pbms',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function () {
      client.subscribe('/topic/staff/notifications', (message) => {
        try {
            const data = JSON.parse(message.body);
            if (data.type === 'ZONE_CONFLICT') {
                setPendingConflicts((prev) => {
                  if (prev.find(p => p.reservationId === data.reservationId)) return prev;
                  return [...prev, data];
                });
                notification.error({
                    message: '🚨 Zone Capacity Conflict!',
                    description: data.message + ' (Click to resolve)',
                    placement: 'topRight',
                    duration: 0,
                    onClick: () => {
                        setConflictData(data);
                        setConflictModalVisible(true);
                    }
                });
            } else if (data.type === 'ZONE_RESERVED') {
                setPendingConflicts((prev) => prev.filter(p => p.reservationId !== data.reservationId));
                notification.success({
                    message: '✅ Virtual Slot Reserved!',
                    description: `Reservation for ${data.plate} in ${data.zoneName} has been successfully assigned.`,
                    placement: 'topRight',
                    duration: 5
                });
                window.dispatchEvent(new CustomEvent('add-notification', { detail: { 
                  message: `[Assigned] ${data.plate} in ${data.zoneName} has been assigned a slot successfully.`,
                  type: 'success'
                }}));
            } else if (data.type === 'RESERVATION_ARRIVED') {
                setPendingConflicts((prev) => prev.filter(p => p.reservationId !== data.reservationId));
            }
        } catch(e) {}
      });

      client.subscribe('/topic/alerts', (message) => {
        try {
            const data = JSON.parse(message.body);
            if (data.type === 'MONTHLY_ZONE_VIOLATION') {
                setMonthlyConflictData(data);
                setMonthlyConflictVisible(true);
            }
        } catch(e) {}
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  const handleResolveConflict = async (reservationId: number) => {
    try {
      await axiosClient.post(`/customer/reservations/${reservationId}/resolve-conflict`);
    } catch (err: any) {
      notification.error({
        message: 'Resolution Failed',
        description: err.response?.data?.message || 'Zone is still full.',
        placement: 'topRight'
      });
    }
  };

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

  const conflictMenu: any = {
    items: pendingConflicts.length === 0 ? [{ key: 'empty', label: <span className="text-gray-400 italic px-2">No capacity conflicts</span> }] : pendingConflicts.map(c => ({
      key: c.reservationId,
      label: (
        <div onClick={() => handleResolveConflict(c.reservationId)} className="flex flex-col gap-1 w-64 py-1 hover:bg-gray-50 rounded px-2 transition-colors cursor-pointer border-b border-gray-100 last:border-0">
          <span className="font-bold text-red-600 flex items-center gap-1"><AlertOutlined /> {c.zoneName} is FULL</span>
          <span className="text-xs text-gray-600">Plate: <b className="font-mono uppercase">{c.plate}</b> - {c.customer}</span>
          <span className="text-xs text-blue-500 font-medium">Click to retry reservation</span>
        </div>
      )
    }))
  };

  const activeGateType = sessionStorage.getItem('activeGateType');

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white px-4 py-2 sm:px-6 flex flex-wrap justify-between items-center gap-y-2 shadow-md z-10 sticky top-0 w-full h-auto min-h-[64px]" style={{ backgroundColor: '#ffffff', lineHeight: 'normal' }}>
        <div className="flex items-center gap-4 shrink-0">
          <Text strong className="text-xl text-gray-800 tracking-widest cursor-pointer whitespace-nowrap" onClick={() => navigate('/staff/shift-management')}>
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

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

          <Dropdown menu={conflictMenu} placement="bottomRight" arrow trigger={['click']}>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors bg-white">
              <Badge count={pendingConflicts.length} showZero size="small">
                <AlertOutlined className="text-red-500 text-lg" />
              </Badge>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-xs font-bold text-red-600 leading-none">Pre-booked Queue</span>
                <span className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
                  {pendingConflicts.length === 0 ? 'No cars in queue' : `${pendingConflicts.length} cars waiting for slot`}
                </span>
              </div>
            </div>
          </Dropdown>

          <NotificationDropdown />

          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded transition-colors border border-gray-200">
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
              <Text strong className="text-gray-700 hidden sm:block">{name || email || 'Staff'}</Text>
            </div>
          </Dropdown>
        </div>
      </Header>
      
      <Content className="bg-gray-100 m-0 w-full flex flex-col h-[calc(100vh-64px)]">
        <Outlet />
      </Content>


      <UserProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <ReservationConflictModal
        visible={conflictModalVisible}
        onClose={() => setConflictModalVisible(false)}
        conflictData={conflictData}
      />

      <MonthlyZoneConflictModal
        visible={monthlyConflictVisible}
        onClose={() => setMonthlyConflictVisible(false)}
        conflictData={monthlyConflictData}
      />
    </Layout>
  );
};
