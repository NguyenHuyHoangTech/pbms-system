import React, { useState, useEffect } from 'react';
import { Card, Typography, Input, Button, message, Select, Tag, Modal, Form, List, Upload } from 'antd';
import { 
  WarningOutlined, CameraOutlined, LockOutlined, CreditCardOutlined,
  CloseCircleOutlined, PlusOutlined, UploadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ExceptionDeskScreen = () => {
  const shiftStatus = useAuthStore(state => state.shiftStatus);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeMenu, setActiveMenu] = useState('card_dispute');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [damageReason, setDamageReason] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm] = Form.useForm();
  
  const [isRejectTicketModalOpen, setIsRejectTicketModalOpen] = useState(false);
  const [rejectTicketForm] = Form.useForm();

  // Reset local state when selected ticket changes
  useEffect(() => { 
    setDocFile(null); 
    setCardFile(null); 
    setDamageReason(null); 
  }, [selectedTicket?.id]);

  // QUERY: GET /api/v1/incidents
  const { data: ticketsData = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axiosClient.get('/incidents');
      return res.data?.data || [];
    },
    refetchInterval: 3000 // Poll every 3 seconds
  });

  // MUTATIONS
  const createIncidentMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        type: values.type,
        plate: values.plate?.toUpperCase(),
        rfid: values.rfid,
        description: values.description,
        baseFee: values.type === 'LOST_CARD' ? 200000 : 0
      }));
      // Can add files here if needed during creation
      await axiosClient.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      message.success('Đã tạo báo cáo sự cố thành công!');
      setIsManualModalOpen(false);
      manualForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const updatePhase1Mutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/process-phase1`);
    },
    onSuccess: () => {
      message.success('Đã khóa phiên đỗ. Chuyển sang xử lý Giai đoạn 2.');
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const formData = new FormData();
      if (docFile) formData.append('docFile', docFile);
      if (cardFile) formData.append('cardFile', cardFile);
      await axiosClient.put(`/incidents/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      message.success('Đã xử lý xong sự cố và mở cổng/thu tiền thành công!');
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      await axiosClient.put(`/incidents/${id}/reject?reason=${encodeURIComponent(reason)}`);
    },
    onSuccess: () => {
      message.success('Đã từ chối xử lý sự cố.');
      setIsRejectTicketModalOpen(false);
      rejectTicketForm.resetFields();
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  // HANDLERS
  const handleLockSessionPhase1 = () => {
    if (selectedTicket) updatePhase1Mutation.mutate(selectedTicket.id);
  };

  const handleReleaseCarPhase2 = () => {
    if (selectedTicket) resolveMutation.mutate(selectedTicket.id);
  };

  const handleCreateManualIncident = (values: any) => {
    createIncidentMutation.mutate(values);
  };

  const handleRejectTicket = (values: any) => {
    if (selectedTicket) rejectMutation.mutate({ id: selectedTicket.id, reason: values.reason });
  };

  if (shiftStatus !== 'OPEN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <WarningOutlined className="text-6xl text-orange-400 mb-4" />
          <Title level={3} className="text-slate-800">Chưa Mở Ca Trực</Title>
          <Button type="primary" size="large" onClick={() => navigate('/staff/shift-management')}>Về trang Quản lý Ca</Button>
        </div>
      </div>
    );
  }

  const renderCardDispute = () => (
    <div className="flex flex-1 h-full animate-fade-in bg-gray-100 p-4 gap-4 overflow-hidden">
      <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <Text strong className="text-gray-700">Hàng đợi ({ticketsData.length})</Text>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setIsManualModalOpen(true)}>Tại quầy</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <List dataSource={ticketsData} renderItem={(item: any) => (
              <div className={`p-3 mb-2 rounded-xl cursor-pointer border transition-all ${selectedTicket?.id === item.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-gray-200 hover:border-blue-300'}`} onClick={() => setSelectedTicket(item)}>
                <div className="flex justify-between items-start mb-1"><Text strong className="text-gray-800 tracking-wider">{item.plate || item.rfid || 'KHÔNG RÕ'}</Text><Text type="secondary" className="text-xs">{item.time}</Text></div>
                <div className="flex gap-2 mb-2">
                  <Tag color={item.type === 'LOST_CARD' ? 'volcano' : 'orange'} className="m-0 border-0">{item.type}</Tag>
                  <Tag color={item.phase === 1 ? 'processing' : (item.phase === 2 ? 'warning' : 'success')} className="m-0 border-0">GĐ {item.phase}</Tag>
                </div>
              </div>
            )} />
        </div>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedTicket ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><WarningOutlined className="text-xl" /></div>
                <div><Title level={4} className="m-0 text-gray-800">{selectedTicket.type === 'LOST_CARD' ? 'Khách Báo Mất Thẻ' : selectedTicket.type}</Title><Text type="secondary">Ticket ID: #{selectedTicket.id} | BKS: <span className="font-bold text-gray-800">{selectedTicket.plate}</span></Text></div>
              </div>
              <Tag color={selectedTicket.phase === 1 ? 'blue' : (selectedTicket.phase === 2 ? 'orange' : 'green')} className="text-sm py-1 px-3">Giai đoạn {selectedTicket.phase}: {selectedTicket.status}</Tag>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
              {selectedTicket.phase === 1 ? (
                <div className="flex flex-col gap-6 h-full justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <Card title={<span className="font-bold text-blue-700">LÚC VÀO (IN)</span>} size="small" className="border-blue-200 bg-blue-50/30">
                       <div className="flex gap-2 h-32 justify-center items-center text-gray-400">Hình ảnh lúc vào (Từ Camera LPR)</div>
                    </Card>
                    <Card className="shadow-sm border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2 justify-center">
                      <Title level={5} className="mb-1">Hành động</Title>
                      <Text className="block text-gray-500 text-sm mb-4">Sau khi đối chiếu ảnh hợp lệ, khóa xe để chuyển sang GĐ2. Nếu sai lệch, từ chối yêu cầu.</Text>
                      <Button type="primary" size="large" className="w-full font-bold bg-blue-600 h-12 mb-2" icon={<LockOutlined />} onClick={handleLockSessionPhase1}>DUYỆT & KHÓA PHIÊN ĐỖ</Button>
                      <Button danger size="large" className="w-full font-bold h-12" icon={<CloseCircleOutlined />} onClick={() => setIsRejectTicketModalOpen(true)}>TỪ CHỐI YÊU CẦU</Button>
                    </Card>
                  </div>
                </div>
              ) : selectedTicket.phase === 2 ? (
                <div className="flex flex-col gap-6 h-full">
                  <div className="grid grid-cols-2 gap-6 flex-1">
                    <Card title={<span className="font-bold text-indigo-800"><CameraOutlined className="mr-2"/>Bằng chứng (Upload/Webcam)</span>} className="border-indigo-200 shadow-sm h-full" styles={{body:{display:'flex', flexDirection:'column', gap:'12px'}}}>
                       <Upload
                         beforeUpload={(file) => { setDocFile(file); return false; }}
                         maxCount={1}
                         showUploadList={false}
                       >
                         <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 bg-gray-50 transition-all w-full mb-4">
                           {docFile ? (<div className="text-green-600 font-bold">Đã chọn: {docFile.name}</div>) : (<><UploadOutlined className="text-3xl text-gray-400 mb-2 block" /><Text className="font-medium text-gray-600">Chọn ảnh Giấy Tờ Xe (Cavet)</Text></>)}
                         </div>
                       </Upload>

                      {selectedTicket.type === 'DAMAGED_CARD' && (
                        <Select size="large" placeholder="Nguyên nhân hỏng thẻ..." value={damageReason} onChange={setDamageReason} options={[{ value: 'natural', label: 'Hao mòn tự nhiên' }, { value: 'user', label: 'Lỗi người dùng (Phạt 50K)' }]} />
                      )}
                    </Card>
                    <Card className="bg-gray-50 border-gray-200 shadow-sm h-full flex flex-col" styles={{body:{flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end'}}}>
                       <div className="space-y-3 mb-6 flex-1">
                          <div className="flex justify-between"><Text className="text-gray-500">Gốc đỗ tích lũy:</Text><Text strong>{selectedTicket.baseFee?.toLocaleString()} VNĐ</Text></div>
                          <div className="flex justify-between pt-3 border-t border-gray-300">
                            <Text className="font-bold text-lg">TỔNG THU:</Text>
                            <Text className="font-black text-2xl text-blue-700">{selectedTicket.baseFee?.toLocaleString()} VNĐ</Text>
                          </div>
                       </div>
                       <Button type="primary" size="large" className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-500" disabled={!docFile && selectedTicket.type === 'LOST_CARD'} onClick={handleReleaseCarPhase2}>THU TIỀN & MỞ BARRIER</Button>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-green-600">
                  <CheckCircleOutlined className="text-6xl mb-4" />
                  <Title level={4} className="text-green-700">Đã giải quyết xong</Title>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-slate-50"><CreditCardOutlined className="text-6xl text-slate-300 mb-4" /><Title level={4} className="text-slate-400">Chưa chọn sự cố nào</Title><Text>Vui lòng chọn một Ticket trong Hàng đợi bên trái.</Text></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* HEADER TABS */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 shrink-0 flex items-center justify-between">
        <div className="flex space-x-6">
          <div className={`pb-3 px-2 cursor-pointer font-bold text-sm uppercase tracking-wide border-b-2 transition-all ${activeMenu === 'card_dispute' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveMenu('card_dispute')}>
            <WarningOutlined className="mr-2" />Xử lý Sự cố & Khiếu nại
          </div>
        </div>
      </div>

      {activeMenu === 'card_dispute' && renderCardDispute()}

      {/* Manual Incident Modal */}
      <Modal title="Tạo Sự Cố Thủ Công Tại Quầy" open={isManualModalOpen} onCancel={() => setIsManualModalOpen(false)} onOk={() => manualForm.submit()} okText="Tạo Ticket" cancelText="Hủy" width={500}>
        <Form form={manualForm} layout="vertical" onFinish={handleCreateManualIncident}>
          <Form.Item name="type" label="Loại sự cố" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="LOST_CARD">Khách báo mất thẻ</Select.Option>
              <Select.Option value="LPR_MISMATCH">Sai lệch biển số (Hệ thống AI không nhận diện được)</Select.Option>
              <Select.Option value="DAMAGED_CARD">Khách báo hỏng thẻ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="plate" label="Biển số khai báo" rules={[{ required: true }]}>
            <Input size="large" className="font-mono font-bold uppercase" placeholder="51G-123.45" />
          </Form.Item>
          <Form.Item name="rfid" label="Mã thẻ (Nếu có)">
            <Input size="large" placeholder="Ví dụ: AA-11-22" />
          </Form.Item>
          <Form.Item name="description" label="Ghi chú thêm">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal title="Từ chối yêu cầu xử lý" open={isRejectTicketModalOpen} onCancel={() => setIsRejectTicketModalOpen(false)} onOk={() => rejectTicketForm.submit()} okText="Xác nhận Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <Form form={rejectTicketForm} layout="vertical" onFinish={handleRejectTicket}>
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <TextArea rows={4} placeholder="Ví dụ: Hình ảnh cavet không khớp biển số hệ thống..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
