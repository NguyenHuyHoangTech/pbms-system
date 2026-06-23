import React, { useState } from 'react';
import { Card, Typography, Button, Modal, InputNumber, Tag, message, Spin, Radio, Space } from 'antd';
import { LoginOutlined, LogoutOutlined, DollarOutlined, CarOutlined, SafetyCertificateOutlined, SelectOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

interface Gate {
  id: number;
  name: string;
  status: string;
  type: string;
  floor: string;
  staffName?: string;
}

export const ShiftManagementScreen = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const shiftStatus = useAuthStore(state => state.shiftStatus);
  const setAuthShiftStatus = useAuthStore(state => state.setShiftStatus);
  
  const [isStartModalVisible, setIsStartModalVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedPostType, setSelectedPostType] = useState<'GATE' | 'PATROL'>('GATE');
  const [selectedGateId, setSelectedGateId] = useState<number>(0);
  
  // Trí nhớ tạm cho việc hiển thị khi đang trực
  const activeGateName = sessionStorage.getItem('activeGateName') || 'Chưa xác định';
  const activeGateType = sessionStorage.getItem('activeGateType') || 'GATE';
  
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [declaredCash, setDeclaredCash] = useState<number | null>(null);

  const { data: gates = [] } = useQuery({
    queryKey: ['gates'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/infrastructure/gates');
        return res.data.data || [];
      } catch (err) {
        return [];
      }
    }
  });

  React.useEffect(() => {
    if (gates.length > 0 && isStartModalVisible && !selectedFloor) {
      const floors = Array.from(new Set(gates.map((g: Gate) => g.floor))).filter(Boolean) as string[];
      if (floors.length > 0) {
        const firstFloor = floors[0];
        setSelectedFloor(firstFloor);
        const firstGate = gates.find((g: Gate) => g.floor === firstFloor && (g.type === 'IN' || g.type === 'OUT'));
        if (firstGate) setSelectedGateId(firstGate.id);
      }
    }
  }, [gates, isStartModalVisible, selectedFloor]);

  // Fetch the current preview settlement
  const { data: settlementPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['shift-settlement-preview'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/work-sessions/current/preview-settlement');
        return res.data;
      } catch (e) {
        return null;
      }
    },
    enabled: shiftStatus === 'OPEN' && isCloseModalVisible
  });

  const startShiftMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/work-sessions/start', { gateId: selectedGateId }); 
      return res.data;
    },
    onSuccess: () => {
      message.success('Đã mở ca trực thành công!');
      
      const gate = gates.find((g: Gate) => g.id === selectedGateId);
      if (gate) {
        sessionStorage.setItem('activeGateId', String(gate.id));
        sessionStorage.setItem('activeGateName', gate.name);
        sessionStorage.setItem('activeGateType', gate.type);
      }
      
      setAuthShiftStatus('OPEN');
      setIsStartModalVisible(false);
      
      if (selectedPostType === 'PATROL') {
        navigate('/staff/exception-desk');
      } else {
        navigate('/staff/gate-console');
      }
    },
    onError: (error) => {
      message.error('Lỗi khi mở ca trực: ' + (error as any)?.response?.data?.message || 'Unknown error');
    }
  });

  const endShiftMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.put('/work-sessions/end', {
        declaredCash,
        varianceReason: variance !== 0 ? 'User declared difference' : null
      });
      return res.data;
    },
    onSuccess: () => {
      message.success('Đã chốt ca và bàn giao tài chính thành công!');
      setAuthShiftStatus('CLOSED');
      sessionStorage.removeItem('activeGateId');
      sessionStorage.removeItem('activeGateName');
      sessionStorage.removeItem('activeGateType');
      setIsCloseModalVisible(false);
      setDeclaredCash(null);
      queryClient.invalidateQueries({ queryKey: ['shift-settlement-preview'] });
    },
    onError: (error) => {
      message.error('Lỗi khi chốt ca: ' + (error as any)?.response?.data?.message || 'Unknown error');
    }
  });

  const systemCash = settlementPreview?.sysTotalCash || 0;
  const variance = (declaredCash || 0) - systemCash;

  const handleOpenShift = () => {
    startShiftMutation.mutate();
  };

  const handleCloseShift = () => {
    if (activeGateType === 'OUT' && declaredCash === null) {
      message.error('Vui lòng nhập số tiền mặt thực tế thu được.');
      return;
    }
    endShiftMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Title level={2} className="m-0 text-gray-800">Quản lý Ca Trực & Phân Công</Title>
            <Text type="secondary">Chọn Vị trí Trực cổng hoặc Nhiệm vụ Tuần tra</Text>
          </div>
          <Tag color={shiftStatus === 'OPEN' ? 'success' : 'default'} className="px-4 py-1 text-sm font-bold rounded-full">
            {shiftStatus === 'OPEN' ? 'ĐANG TRONG CA' : 'CHƯA VÀO CA'}
          </Tag>
        </div>

        <Card className="shadow-sm border-gray-200 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
            <div className="mb-4 md:mb-0">
              <Text className="block text-blue-600 font-medium mb-1">Thời gian hiện tại:</Text>
              <Title level={3} className="m-0 text-blue-800">{dayjs().format('HH:mm - DD/MM/YYYY')}</Title>
            </div>
            
            {shiftStatus === 'CLOSED' ? (
              <Button 
                type="primary" 
                size="large" 
                icon={<LoginOutlined />} 
                onClick={() => setIsStartModalVisible(true)}
                className="bg-blue-600 px-8 h-12 font-medium shadow-md"
              >
                BẮT ĐẦU CA TRỰC MỚI
              </Button>
            ) : (
              <Button 
                type="primary" 
                danger 
                size="large" 
                icon={<LogoutOutlined />} 
                onClick={() => setIsCloseModalVisible(true)}
                className="px-8 h-12 font-medium animate-pulse"
              >
                CHỐT CA & BÀN GIAO
              </Button>
            )}
          </div>
          
          {shiftStatus === 'OPEN' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <Text className="block text-green-700 font-bold uppercase tracking-widest text-xs mb-1">Ca trực hiện tại</Text>
              <div className="flex items-center space-x-3">
                {activeGateType === 'PATROL' ? <SafetyCertificateOutlined className="text-2xl text-green-600"/> : <CarOutlined className="text-2xl text-green-600"/>}
                <Title level={4} className="m-0 text-green-800">{activeGateName}</Title>
              </div>
            </div>
          )}

          <Title level={4} className="mb-4">Trạng thái Làn xe & Tuần tra</Title>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {gates.map((gate: Gate) => (
              <div 
                key={gate.id} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  gate.status === 'IDLE' ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  {gate.type === 'IN' || gate.type === 'OUT' ? (
                    <CarOutlined className={`text-xl ${gate.status === 'IDLE' ? 'text-green-600' : 'text-gray-400'}`} />
                  ) : (
                    <SafetyCertificateOutlined className={`text-xl ${gate.status === 'IDLE' ? 'text-green-600' : 'text-gray-400'}`} />
                  )}
                  <Text strong className="text-base truncate">{gate.name}</Text>
                </div>
                <Tag color={gate.status === 'IDLE' ? 'success' : 'default'}>{gate.status}</Tag>
                {gate.status === 'OCCUPIED' && gate.staffName && (
                  <Text className="block mt-2 text-xs text-gray-500">Đang trực: <span className="font-medium text-gray-800">{gate.staffName}</span></Text>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Modal Chọn Vị Trí Bắt Đầu Ca */}
        <Modal
          title={<span className="text-xl font-bold"><SelectOutlined className="mr-2 text-blue-600"/>Chọn Vị Trí Làm Việc</span>}
          open={isStartModalVisible}
          onCancel={() => setIsStartModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsStartModalVisible(false)}>Hủy</Button>,
            <Button key="submit" type="primary" className="bg-blue-600 font-bold px-6" loading={startShiftMutation.isPending} onClick={handleOpenShift}>
              Xác nhận Bắt Đầu
            </Button>,
          ]}
          width={600}
        >
          <div className="py-4">
            <Text className="block mb-4 text-gray-600">Bạn đang được phân công vào ca. Hãy chọn một vị trí hoặc nhiệm vụ để bắt đầu xử lý công việc trong hệ thống.</Text>
            
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <Text className="block mb-2 font-bold text-gray-700">1. Chọn Tầng Làm Việc:</Text>
              <Radio.Group 
                value={selectedFloor} 
                onChange={e => {
                  setSelectedFloor(e.target.value);
                  // Reset selected gate
                  const firstGate = gates.find((g: Gate) => g.floor === e.target.value && (g.type === 'IN' || g.type === 'OUT'));
                  if (firstGate) setSelectedGateId(firstGate.id);
                }}
                buttonStyle="solid"
                size="large"
              >
                {Array.from(new Set(gates.map((g: Gate) => g.floor))).filter(Boolean).map((floor: any) => (
                  <Radio.Button key={floor} value={floor}>{floor}</Radio.Button>
                ))}
              </Radio.Group>
            </div>

            <Text className="block mb-2 font-bold text-gray-700">2. Chọn Nhiệm Vụ:</Text>
            <div className="w-full flex flex-col gap-4">
              <div 
                className={`cursor-pointer h-auto p-4 rounded-xl border-2 flex items-center transition-all ${selectedPostType === 'GATE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => {
                  setSelectedPostType('GATE');
                  const firstGate = gates.find((g: Gate) => g.floor === selectedFloor && (g.type === 'IN' || g.type === 'OUT'));
                  if (firstGate) setSelectedGateId(firstGate.id);
                }}
              >
                <div className="flex items-start w-full">
                  <CarOutlined className={`text-3xl mt-1 mr-4 ${selectedPostType === 'GATE' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <Text strong className="block text-lg mb-1">Trực Làn Xe (Gate IN / OUT)</Text>
                    <Text type="secondary" className="text-sm">Xử lý vé, thu tiền, kiểm soát xe ra vào trực tiếp tại các bốt.</Text>
                    {selectedPostType === 'GATE' && (
                      <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg" onClick={e => e.stopPropagation()}>
                        <Text className="block mb-2 text-xs font-bold text-gray-500 uppercase">Chọn Làn Cụ Thể:</Text>
                        <Radio.Group onChange={(e) => setSelectedGateId(e.target.value)} value={selectedGateId}>
                          <Space direction="vertical">
                            {gates.filter((g: Gate) => g.floor === selectedFloor && (g.type === 'IN' || g.type === 'OUT')).map((g: Gate) => (
                              <Radio key={g.id} value={g.id} disabled={g.status !== 'IDLE'}>
                                {g.name} {g.status !== 'IDLE' && <Text type="danger" className="text-xs ml-2">(Đã có người trực)</Text>}
                              </Radio>
                            ))}
                          </Space>
                        </Radio.Group>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className={`cursor-pointer h-auto p-4 rounded-xl border-2 flex items-center transition-all ${selectedPostType === 'PATROL' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                onClick={() => {
                  setSelectedPostType('PATROL');
                  const patrolGate = gates.find((g: Gate) => g.floor === selectedFloor && g.type === 'PATROL');
                  if (patrolGate) setSelectedGateId(patrolGate.id);
                }}
              >
                <div className="flex items-start">
                  <SafetyCertificateOutlined className={`text-3xl mt-1 mr-4 ${selectedPostType === 'PATROL' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <Text strong className="block text-lg mb-1">Nhiệm Vụ Tuần Tra (Patrol)</Text>
                    <Text type="secondary" className="text-sm">Xử lý các sự cố ngoại lệ trong bãi (đỗ sai chỗ, mất thẻ, barie lỗi).</Text>
                    {selectedPostType === 'PATROL' && (
                      <div className="mt-2">
                        <Tag color="green" className="mt-2 font-bold">Truy cập: Bàn Xử Lý Ngoại Lệ (Exception Desk)</Tag>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Modal>

        {/* Modal Chốt Ca */}
        <Modal
          title={<span className="text-xl font-bold"><DollarOutlined className="mr-2 text-green-600"/>Bàn giao Tài chính</span>}
          open={isCloseModalVisible}
          onCancel={() => setIsCloseModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsCloseModalVisible(false)}>Hủy</Button>,
            <Button key="submit" type="primary" danger loading={endShiftMutation.isPending} onClick={handleCloseShift} disabled={activeGateType === 'OUT' && declaredCash === null}>
              Xác nhận Bàn giao & Đóng ca
            </Button>,
          ]}
          width={500}
        >
          {isLoadingPreview ? <Spin className="block mx-auto my-8" /> : (
            <div className="py-4">
              {activeGateType === 'OUT' ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 text-center">
                    <Text className="text-gray-500 font-medium">Tiền mặt hệ thống ghi nhận (VND)</Text>
                    <Title level={2} className="m-0 text-gray-800 mt-1">{systemCash.toLocaleString()}</Title>
                  </div>

                  <div className="mb-6">
                    <Text className="block font-bold mb-2">Nhập số tiền mặt thực tế kiểm đếm (VND):</Text>
                    <InputNumber 
                      className="w-full" 
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value?.replace(/\$\s?|(,*)/g, ''))}
                      value={declaredCash}
                      onChange={value => setDeclaredCash(value as number)}
                      placeholder="VD: 450,000"
                    />
                  </div>

                  {declaredCash !== null && (
                    <div className={`p-4 rounded-lg flex justify-between items-center ${variance === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <Text strong className={variance === 0 ? 'text-green-700' : 'text-red-700'}>
                        Chênh lệch (Thực tế - Hệ thống):
                      </Text>
                      <Text strong className={`text-xl ${variance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                      </Text>
                    </div>
                  )}
                  
                  {variance !== 0 && declaredCash !== null && (
                    <Text className="block mt-2 text-xs text-red-500">
                      * Nếu có chênh lệch, vui lòng báo cáo lý do vào Biên bản Giao ca.
                    </Text>
                  )}
                </>
              ) : (
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <SafetyCertificateOutlined className="text-4xl text-green-500 mb-4" />
                  <Title level={4} className="m-0 text-green-700">Xác nhận Đóng Ca</Title>
                  <Text className="text-green-600 block mt-2">Vị trí ({activeGateName}) không phát sinh doanh thu tiền mặt. Có thể đóng ca trực tiếp.</Text>
                </div>
              )}
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};
