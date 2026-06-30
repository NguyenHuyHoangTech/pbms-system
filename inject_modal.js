const fs = require('fs');
const file = 'pbms-fe/src/features/staff/StaffLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ReservationConflictModal')) {
    content = content.replace(
        "import { NotificationDropdown } from '../shared/components/NotificationDropdown';",
        "import { NotificationDropdown } from '../shared/components/NotificationDropdown';\nimport { ReservationConflictModal } from './ReservationConflictModal';\nimport { useEffect } from 'react';\nimport { Client } from '@stomp/stompjs';\nimport { notification } from 'antd';"
    );

    const hooks = `  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const systemTime = useSystemTime();
  
  // Conflict state
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);

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
            }
        } catch(e) {}
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);`;

    content = content.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const systemTime = useSystemTime();",
        hooks
    );

    const modalComponent = `
      <UserProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <ReservationConflictModal
        visible={conflictModalVisible}
        onClose={() => setConflictModalVisible(false)}
        conflictData={conflictData}
      />
    </Layout>`;

    content = content.replace(
        "      <UserProfileSettingsModal \n        isOpen={isSettingsOpen} \n        onClose={() => setIsSettingsOpen(false)} \n      />\n    </Layout>",
        modalComponent
    );

    fs.writeFileSync(file, content);
    console.log('Successfully injected ReservationConflictModal into StaffLayout');
} else {
    console.log('Already injected');
}
