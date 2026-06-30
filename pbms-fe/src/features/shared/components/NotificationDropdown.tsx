import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, MenuProps, notification, Button, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import dayjs from 'dayjs';

const { Text } = Typography;

interface NotificationItem {
  key: string;
  message: string;
  time: Date;
  read: boolean;
}

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws-pbms',
      debug: function (str) {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      client.subscribe('/topic/alerts', (message) => {
        const payload = message.body;
        let displayMessage = payload;
        
        try {
          let parsed = JSON.parse(payload);
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          if (parsed && typeof parsed === 'object') {
            if (parsed.data && parsed.data.message) {
              displayMessage = parsed.data.message;
            } else if (parsed.message) {
              displayMessage = parsed.message;
            }
          }
        } catch (e) {
          // Keep as string if not JSON
        }
        
        notification.warning({
          message: 'System Alert',
          description: displayMessage,
          placement: 'topRight',
          duration: 10,
        });

        const newItem: NotificationItem = {
          key: Date.now().toString(),
          message: displayMessage,
          time: new Date(),
          read: false,
        };

        setNotifications((prev) => [newItem, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const menuItems: MenuProps['items'] = notifications.length === 0
    ? [
        {
          key: 'empty',
          label: <Text type="secondary">No new notifications</Text>,
          disabled: true,
        },
      ]
    : [
        {
          key: 'header',
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '300px' }}>
              <Text strong>Notifications</Text>
              <Button type="link" size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            </div>
          ),
        },
        { type: 'divider' },
        ...notifications.slice(0, 10).map((n) => ({
          key: n.key,
          label: (
            <div style={{ padding: '8px 0', opacity: n.read ? 0.6 : 1 }}>
              <div style={{ whiteSpace: 'normal', marginBottom: '4px' }}>
                <Text strong={!n.read}>{n.message}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(n.time).format('HH:mm DD/MM/YYYY')}
                </Text>
              </div>
            </div>
          ),
          onClick: () => {
            if (!n.read) {
              setNotifications((prev) =>
                prev.map((item) => (item.key === n.key ? { ...item, read: true } : item))
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          },
        })),
      ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount} style={{ cursor: 'pointer', marginRight: 16 }}>
        <BellOutlined style={{ fontSize: '20px', cursor: 'pointer', padding: '4px' }} />
      </Badge>
    </Dropdown>
  );
};
