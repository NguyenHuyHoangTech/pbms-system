import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Typography, Card, Tag, Modal, Button } from 'antd';
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
  oldValue: string | null;
  newValue: string | null;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    action: 'UPDATE',
    entityName: 'SystemConfig',
    entityId: 'SMTP_EMAIL',
    performedBy: 'admin@pbms.com',
    timestamp: '2026-06-18 10:00:00',
    oldValue: '{"configValue": "old@pbms.com"}',
    newValue: '{"configValue": "no-reply@pbms.com"}'
  },
  {
    id: 2,
    action: 'CREATE',
    entityName: 'User',
    entityId: 'manager@pbms.com',
    performedBy: 'admin@pbms.com',
    timestamp: '2026-06-18 10:15:00',
    oldValue: null,
    newValue: '{"email": "manager@pbms.com", "role": "ROLE_MANAGER"}'
  },
  {
    id: 3,
    action: 'DELETE',
    entityName: 'VehicleType',
    entityId: 'VT_004',
    performedBy: 'manager@pbms.com',
    timestamp: '2026-06-18 11:30:00',
    oldValue: '{"name": "Light Truck", "isActive": false}',
    newValue: null
  }
];

export const AuditLogScreen = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      // MOCK DATA BYPASS
      return new Promise<AuditLog[]>(resolve => setTimeout(() => resolve(MOCK_AUDIT_LOGS), 500));
    }
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { 
      title: 'Action', 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => {
        let color = 'default';
        if (action === 'CREATE') color = 'success';
        if (action === 'UPDATE') color = 'processing';
        if (action === 'DELETE') color = 'error';
        return <Tag color={color}>{action}</Tag>;
      }
    },
    { title: 'Entity', dataIndex: 'entityName', key: 'entityName', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Record ID', dataIndex: 'entityId', key: 'entityId' },
    { title: 'Performed By', dataIndex: 'performedBy', key: 'performedBy' },
    { title: 'Time', dataIndex: 'timestamp', key: 'timestamp' },
    {
      title: 'Details',
      key: 'details',
      render: (_: any, record: AuditLog) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => setSelectedLog(record)}
        >
          View Diff
        </Button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <HistoryOutlined className="mr-3 text-blue-600" /> System Audit Logs
          </Title>
          <Text type="secondary" className="mt-1 block">Track all system changes and administrative actions.</Text>
        </div>

        <Card className="shadow-sm rounded-xl border-gray-200">
          <Table 
            dataSource={logs} 
            columns={columns} 
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 15 }}
          />
        </Card>

        <Modal
          title="Audit Log Detail (Diff Viewer)"
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={[<Button key="close" onClick={() => setSelectedLog(null)}>Close</Button>]}
          width={700}
        >
          {selectedLog && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Text strong className="text-red-700 block mb-2">Old Value</Text>
                  <pre className="text-xs overflow-auto text-red-900 bg-red-100/50 p-2 rounded">
                    {selectedLog.oldValue ? JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2) : 'NULL'}
                  </pre>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Text strong className="text-green-700 block mb-2">New Value</Text>
                  <pre className="text-xs overflow-auto text-green-900 bg-green-100/50 p-2 rounded">
                    {selectedLog.newValue ? JSON.stringify(JSON.parse(selectedLog.newValue), null, 2) : 'NULL'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
