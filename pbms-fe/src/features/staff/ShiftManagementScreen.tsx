import { simulatedDayjs } from '../../core/utils/timeProvider';
import React, { useState } from 'react';
import { Card, Typography, Button, Modal, InputNumber, Tag, message, Spin, Radio, Space, Input } from 'antd';
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
  staffEmail?: string;
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
  const [selectedGateFunction, setSelectedGateFunction] = useState<string>('ENTRY');
  
  // Trí nhớ tạm cho việc hiển thị khi đang trực
  const activeGateName = sessionStorage.getItem('activeGateName') || 'Unknown';
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

  // Automatically fetch active session on load
  useQuery({
    queryKey: ['active-session-sync'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/work-sessions/current');
        if (res.data?.data?.hasActiveSession) {
          const { gateName, gateId, gateType } = res.data.data;
          setAuthShiftStatus('OPEN');
          const currentGateType = sessionStorage.getItem('activeGateType');
          sessionStorage.setItem('activeGateName', gateName || '');
          if (!currentGateType || (currentGateType !== 'ENTRY' && currentGateType !== 'EXIT')) {
            sessionStorage.setItem('activeGateType', gateType || '');
          }
          if (gateId) {
            sessionStorage.setItem('activeGateId', String(gateId));
          }
        } else if (shiftStatus === 'OPEN') {
           // Wait, don't auto close here unless we are sure, but for now just sync 'OPEN'
        }
        return res.data;
      } catch (e) {
        return null;
      }
    }
  });

  React.useEffect(() => {
    if (gates.length > 0 && isStartModalVisible && !selectedFloor) {
      const floors = Array.from(new Set(gates.map((g: Gate) => g.floor))).filter(Boolean) as string[];
      if (floors.length > 0) {
        const firstFloor = floors[0];
        setSelectedFloor(firstFloor);
        const firstGate = gates.find((g: Gate) => g.floor === firstFloor && (g.type === 'IN' || g.type === 'OUT' || g.type === 'ENTRY' || g.type === 'EXIT' || g.type === 'IN_OUT' || g.type === 'ENTRY_EXIT'));
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
      const res = await axiosClient.post('/work-sessions/start', { gateId: selectedGateId, gateType: selectedGateFunction }); 
      return res.data;
    },
    onSuccess: () => {
      message.success('Shift started successfully!');
      
      const gate = gates.find((g: Gate) => String(g.id) === String(selectedGateId));
      if (gate) {
        sessionStorage.setItem('activeGateId', String(gate.id));
        sessionStorage.setItem('activeGateName', gate.name);
        sessionStorage.setItem('activeGateType', selectedGateFunction || gate.type);
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
      message.error('Error starting shift: ' + (error as any)?.response?.data?.message || 'Unknown error');
    }
  });

  const systemCash = settlementPreview?.data?.totalRevenue || 0;

  const [revenueMode, setRevenueMode] = useState<'MATCH' | 'DISCREPANCY'>('MATCH');
  const [varianceReason, setVarianceReason] = useState<string>('');

  const endShiftMutation = useMutation({
    mutationFn: async () => {
      let finalCash = declaredCash;
      if (revenueMode === 'MATCH') {
        finalCash = systemCash;
      }
      
      const res = await axiosClient.put('/work-sessions/end', {
        declaredCash: finalCash,
        varianceReason: revenueMode === 'DISCREPANCY' ? varianceReason : null
      });
      return res.data;
    },
    onSuccess: () => {
      message.success('Closing the shift and handing over finances Success!');
      setAuthShiftStatus('CLOSED');
      sessionStorage.removeItem('activeGateId');
      sessionStorage.removeItem('activeGateName');
      sessionStorage.removeItem('activeGateType');
      setIsCloseModalVisible(false);
      setDeclaredCash(null);
      setVarianceReason('');
      setRevenueMode('MATCH');
      queryClient.invalidateQueries({ queryKey: ['shift-settlement-preview'] });
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      // Tự động mở form chọn ca mới
      setIsStartModalVisible(true);
    },
    onError: (error) => {
      message.error('Error when closing shift: ' + (error as any)?.response?.data?.message || 'Unknown error');
    }
  });

  const variance = (declaredCash || 0) - systemCash;

  const handleOpenShift = () => {
    if (selectedPostType === 'PATROL') {
      sessionStorage.setItem('activeGateType', 'PATROL');
      sessionStorage.setItem('activeGateName', 'Patrol duty');
      setAuthShiftStatus('OPEN');
      setIsStartModalVisible(false);
      navigate('/staff/exception-desk');
    } else {
      startShiftMutation.mutate();
    }
  };

  const handleCloseShift = () => {
    if (activeGateType === 'PATROL') {
      sessionStorage.removeItem('activeGateId');
      sessionStorage.removeItem('activeGateName');
      sessionStorage.removeItem('activeGateType');
      setAuthShiftStatus('CLOSED');
      setIsCloseModalVisible(false);
      message.success('The patrol shift is over!');
      setIsStartModalVisible(true);
      return;
    }
    if ((activeGateType === 'OUT' || activeGateType === 'EXIT' || activeGateType === 'IN_OUT' || activeGateType === 'ENTRY_EXIT') && revenueMode === 'DISCREPANCY') {
      if (declaredCash === null) {
        message.error('Please enter the actual cash amount received');
        return;
      }
      if (!varianceReason.trim()) {
        message.error('Please clearly state the reason for the difference');
        return;
      }
    }
    endShiftMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Title level={2} className="m-0 text-gray-800">Shift Management & Assignment</Title>
            <Text type="secondary">Select Gate Duty Position or Patrol Duty</Text>
          </div>
          <Tag color={shiftStatus === 'OPEN' ? 'success' : 'default'} className="px-4 py-1 text-sm font-bold rounded-full">
            {shiftStatus === 'OPEN' ? 'ON Shift' : 'NOT IN Shift'}
          </Tag>
        </div>

        <Card className="shadow-sm border-gray-200 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
            <div className="mb-4 md:mb-0">
              <Text className="block text-blue-600 font-medium mb-1">Current time:</Text>
              <Title level={3} className="m-0 text-blue-800">{simulatedDayjs().format('HH:mm - DD/MM/YYYY')}</Title>
            </div>
            
            {shiftStatus === 'CLOSED' ? (
              <Button 
                type="primary" 
                size="large" 
                icon={<LoginOutlined />} 
                onClick={() => setIsStartModalVisible(true)}
                className="bg-blue-600 px-8 h-12 font-medium shadow-md"
              >
                
                                              STARTING NEW ONLINE SHIFT
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
                
                                                  FINAL SHIFT & HANDover
                                                </Button>
            )}
          </div>
          
          {shiftStatus === 'OPEN' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <Text className="block text-green-700 font-bold uppercase tracking-widest text-xs mb-1">Current shift</Text>
              <div className="flex items-center space-x-3">
                {activeGateType === 'PATROL' ? <SafetyCertificateOutlined className="text-2xl text-green-600"/> : <CarOutlined className="text-2xl text-green-600"/>}
                <Title level={4} className="m-0 text-green-800">{activeGateName}</Title>
              </div>
            </div>
          )}

          <Title level={4} className="mb-4">Status Lanes & Patrols</Title>
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
                    <div>
                      <Text className="block mt-2 text-xs text-gray-500">Operator: <span className="font-medium text-gray-800">{gate.staffName}</span></Text>
                      {gate.staffEmail && (
                        <Text className="block text-xs text-gray-400">({gate.staffEmail})</Text>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Card>

        {/* Select Shift Start Location Modal */}
        <Modal
          title={<span className="text-xl font-bold"><SelectOutlined className="mr-2 text-blue-600"/>Choose Work Location</span>}
          open={isStartModalVisible}
          onCancel={() => setIsStartModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsStartModalVisible(false)}>Cancel</Button>,
            <Button key="submit" type="primary" className="bg-blue-600 font-bold px-6" loading={startShiftMutation.isPending} onClick={handleOpenShift}>
              
                              Confirm Start
                            </Button>,
          ]}
          width={600}
        >
          <div className="py-4">
            <Text className="block mb-4 text-gray-600">You are assigned to a shift. Please select a position or task to begin.</Text>
            
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <Text className="block mb-2 font-bold text-gray-700">1. Select Working Floor:</Text>
              <Radio.Group 
                value={selectedFloor} 
                onChange={e => {
                  setSelectedFloor(e.target.value);
                  // Reset selected gate
                  const firstGate = gates.find((g: Gate) => g.floor === e.target.value && (g.type === 'IN' || g.type === 'OUT' || g.type === 'ENTRY' || g.type === 'EXIT' || g.type === 'IN_OUT' || g.type === 'ENTRY_EXIT'));
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

            <Text className="block mb-2 font-bold text-gray-700">2. Select Task:</Text>
            <div className="w-full flex flex-col gap-4">
              <div 
                className={`cursor-pointer h-auto p-4 rounded-xl border-2 flex items-center transition-all ${selectedPostType === 'GATE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => {
                  setSelectedPostType('GATE');
                  const firstGate = gates.find((g: Gate) => g.floor === selectedFloor && (g.type === 'IN' || g.type === 'OUT' || g.type === 'ENTRY' || g.type === 'EXIT' || g.type === 'IN_OUT' || g.type === 'ENTRY_EXIT'));
                  if (firstGate) setSelectedGateId(firstGate.id);
                }}
              >
                <div className="flex items-start w-full">
                  <CarOutlined className={`text-3xl mt-1 mr-4 ${selectedPostType === 'GATE' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <Text strong className="block text-lg mb-1">Manning Gate (IN / OUT)</Text>
                    <Text type="secondary" className="text-sm">Process tickets, collect fees, control vehicle access at booths.</Text>
                    {selectedPostType === 'GATE' && (
                      <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg" onClick={e => e.stopPropagation()}>
                        <Text className="block mb-2 text-xs font-bold text-gray-500 uppercase">Select Specific Gate:</Text>
                        <Radio.Group onChange={(e) => setSelectedGateId(e.target.value)} value={selectedGateId}>
                          <Space direction="vertical">
                            {gates.filter((g: Gate) => g.floor === selectedFloor && (g.type === 'IN' || g.type === 'OUT' || g.type === 'ENTRY' || g.type === 'EXIT' || g.type === 'IN_OUT' || g.type === 'ENTRY_EXIT')).map((g: Gate) => (
                              <Radio key={g.id} value={g.id} disabled={g.status !== 'IDLE'}>
                                {g.name} {g.status !== 'IDLE' && <Text type="danger" className="text-xs ml-2">(Active Operator: {g.staffName} - {g.staffEmail})</Text>}
                              </Radio>
                            ))}
                          </Space>
                        </Radio.Group>
                        
                        <div className="mt-4 pt-3 border-t border-blue-100">
                          <Text className="block mb-2 text-xs font-bold text-gray-500 uppercase">Gate Function:</Text>
                          <Radio.Group 
                            value={selectedGateFunction} 
                            onChange={e => setSelectedGateFunction(e.target.value)}
                            className="flex"
                          >
                            <Radio.Button value="ENTRY" className="flex-1 text-center">AS ENTRY GATE</Radio.Button>
                            <Radio.Button value="EXIT" className="flex-1 text-center">AS EXIT GATE</Radio.Button>
                          </Radio.Group>
                        </div>
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
                    <Text strong className="block text-lg mb-1">Patrol Task</Text>
                    <Text type="secondary" className="text-sm">Handle parking exceptions (wrong parking, lost cards, barrier errors).</Text>
                    {selectedPostType === 'PATROL' && (
                      <div className="mt-2">
                        <Tag color="green" className="mt-2 font-bold">Access: Exception Desk</Tag>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Modal>

        {/* Close Shift Modal */}
        <Modal
          title={<span className="text-xl font-bold"><DollarOutlined className="mr-2 text-green-600"/>Financial handover</span>}
          open={isCloseModalVisible}
          onCancel={() => setIsCloseModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsCloseModalVisible(false)}>Cancel</Button>,
            <Button key="submit" type="primary" danger loading={endShiftMutation.isPending} onClick={handleCloseShift} disabled={(activeGateType === 'OUT' || activeGateType === 'EXIT' || activeGateType === 'IN_OUT' || activeGateType === 'ENTRY_EXIT') && revenueMode === 'DISCREPANCY' && (declaredCash === null || !varianceReason.trim())}>
              
                              Confirm Handover & Close shift
                            </Button>,
          ]}
          width={500}
        >
          {isLoadingPreview ? <Spin className="block mx-auto my-8" /> : (
            <div className="py-4">
              {activeGateType === 'OUT' || activeGateType === 'EXIT' || activeGateType === 'IN_OUT' || activeGateType === 'ENTRY_EXIT' ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 text-center">
                    <Text className="text-gray-500 font-medium">Cash Recorded System (VND)</Text>
                    <Title level={2} className="m-0 text-gray-800 mt-1">{systemCash.toLocaleString()}</Title>
                  </div>

                  <div className="mb-4">
                    <Text className="block font-bold mb-2">Confirm Cash Revenue:</Text>
                    <Radio.Group 
                      value={revenueMode} 
                      onChange={(e) => setRevenueMode(e.target.value)} 
                      className="w-full flex gap-2"
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="MATCH" className="flex-1 text-center h-10 leading-9">
                        
                                                                      Match the amount
                                                                    </Radio.Button>
                      <Radio.Button value="DISCREPANCY" className="flex-1 text-center h-10 leading-9">
                        
                                                                      There is a difference
                                                                    </Radio.Button>
                    </Radio.Group>
                  </div>

                  {revenueMode === 'DISCREPANCY' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4 animate-fade-in">
                      <div className="mb-4">
                        <Text className="block font-bold mb-2 text-orange-800">Enter actual cash amount (VND) <span className="text-red-500">*</span></Text>
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
                        <div className={`p-3 rounded-md flex justify-between items-center mb-4 ${variance === 0 ? 'bg-green-100 text-green-800' : (variance > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800')}`}>
                          <Text strong>Spread:</Text>
                          <Text strong className="text-lg">
                            {variance > 0 ? '+' : ''}{variance.toLocaleString()} VND
                          </Text>
                        </div>
                      )}

                      <div>
                        <Text className="block font-bold mb-2 text-orange-800">Reason difference <span className="text-red-500">*</span></Text>
                        <Input.TextArea 
                          rows={3} 
                          placeholder="For example: Customer lacks change, System calculates time wrong"
                          value={varianceReason}
                          onChange={(e: any) => setVarianceReason(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <SafetyCertificateOutlined className="text-4xl text-green-500 mb-4" />
                  <Title level={4} className="m-0 text-green-700">Confirm Close Ca</Title>
                  <Text className="text-green-600 block mt-2">Location ({activeGateName}) does not generate cash revenuee Can close shifts directlye</Text>
                </div>
              )}
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};
// HMR Trigger
