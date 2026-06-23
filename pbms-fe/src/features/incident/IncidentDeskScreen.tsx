import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Input, message, Alert, Spin } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

interface IncidentTicket {
  id: number;
  issueType: string;
  priority: string;
  description: string;
  status: string;
  plateNumber?: string;
  fineAmount?: number;
  resolutionNotes?: string;
  createdAt: string;
}

export const IncidentDeskScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newAlert, setNewAlert] = useState<string | null>(null);

  const { data: tickets = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axiosClient.get('/incidents');
      return res.data?.data || [];
    },
    refetchInterval: 5000
  });

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe('/topic/alerts', (msg) => {
          setNewAlert(msg.body);
          refetch(); // Auto-refresh when new incident arrives
        });
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [refetch]);

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketId || !resolutionNotes.trim()) {
        throw new Error('Vui lòng nhập ghi chú xử lý');
      }
      await axiosClient.put(`/incidents/${selectedTicketId}/resolve`, { resolutionNotes });
    },
    onSuccess: () => {
      message.success('Đã xử lý sự cố');
      setResolveModalVisible(false);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (e: any) => {
      message.error(e.message || 'Lỗi khi lưu ghi chú xử lý');
    }
  });

  const handleResolve = () => resolveMutation.mutate();

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Biển số',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Loại Lỗi',
      dataIndex: 'issueType',
      key: 'issueType',
      render: (type: string) => {
        const colors: any = {
          LPR_MISMATCH: 'orange',
          LOST_CARD: 'red',
          ZONE_VIOLATION: 'purple',
          OVERSTAY: 'magenta'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (pri: string) => (
        <Tag color={pri === 'HIGH' ? 'red' : pri === 'MEDIUM' ? 'orange' : 'green'}>
          {pri}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'RESOLVED' ? 'success' : 'processing'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: IncidentTicket) => (
        record.status === 'PENDING' ? (
          <Button 
            type="primary" 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedTicketId(record.id);
              setResolveModalVisible(true);
            }}
          >
            Giải quyết
          </Button>
        ) : (
          <span>Đã xử lý</span>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {newAlert && (
        <Alert
          message="Phát hiện sự cố mới"
          description={newAlert}
          type="error"
          showIcon
          closable
          onClose={() => setNewAlert(null)}
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <Card 
        title={
          <div>
            <ExclamationCircleOutlined style={{ color: 'red', marginRight: '8px' }} />
            Tổng Đài Ngoại Lệ (Exception Desk)
          </div>
        }
      >
        <Table 
          columns={columns} 
          dataSource={tickets} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Xử lý Sự Cố"
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModalVisible(false);
          setResolutionNotes('');
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: '16px' }}>
          Ghi chú xử lý cho Ticket #{selectedTicketId}:
        </div>
        <Input.TextArea
          rows={4}
          placeholder="Nhập ghi chú giải quyết (VD: Đã cập nhật lại biển số, đã thu tiền phạt...)"
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
        />
      </Modal>
    </div>
  );
};
