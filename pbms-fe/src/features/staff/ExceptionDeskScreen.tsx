import { useState, useEffect } from 'react';
import { Card, Typography, Input, Button, message, Select, Tag, Modal, Form, List, Upload, InputNumber } from 'antd';
import { 
  WarningOutlined, CameraOutlined, LockOutlined, CreditCardOutlined,
  CloseCircleOutlined, PlusOutlined, UploadOutlined, CheckCircleOutlined, MessageOutlined, SearchOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { getImageUrl } from '../../core/utils/imageHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ExceptionDeskScreen = () => {
  const shiftStatus = useAuthStore(state => state.shiftStatus);
  const role = useAuthStore(state => state.role);
  const isManager = role === 'ROLE_MANAGER';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeMenu, setActiveMenu] = useState('card_dispute');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [docFile, setDocFile] = useState<File | null>(null);
  const [picOutFile, setPicOutFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm] = Form.useForm();
  const [isManualPlateVerified, setIsManualPlateVerified] = useState(false);
  const [isCheckingManualPlate, setIsCheckingManualPlate] = useState(false);
  const [manualCheckedVehicleType, setManualCheckedVehicleType] = useState<string>('');
  
  const [isRejectTicketModalOpen, setIsRejectTicketModalOpen] = useState(false);
  const [rejectTicketForm] = Form.useForm();
  
  const [searchBlacklistForm] = Form.useForm();
  const [blacklistEvidenceFile, setBlacklistEvidenceFile] = useState<File | null>(null);
  const [isCheckingBlacklistPlate, setIsCheckingBlacklistPlate] = useState(false);
  const [checkedBlacklistVehicle, setCheckedBlacklistVehicle] = useState<any | null>(null);

  const [isCheckingZonePlate, setIsCheckingZonePlate] = useState(false);
  const [checkedZoneVehicle, setCheckedZoneVehicle] = useState<any | null>(null);

  // Reset local state when selected ticket changes
  useEffect(() => { 
    setDocFile(null); 
    setPicOutFile(null);
    setCardFile(null); 
  }, [selectedTicket?.id]);

  // QUERY: GET /api/v1/system/configs
  const { data: configsData = [] } = useQuery({
    queryKey: ['system_configs'],
    queryFn: async () => {
      const res = await axiosClient.get('/system/configs');
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getPenaltyConfig = (key: string, fallback: number) => {
    const config = configsData.find((c: any) => c.configKey === key);
    if (config && config.configValue) {
       return parseInt(config.configValue, 10) || fallback;
    }
    return fallback;
  };

  const { data: mapConfigData } = useQuery({
    queryKey: ['mapConfig'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/map/config');
      return res.data?.data || null;
    }
  });

  const [zoneViolationForm] = Form.useForm();
  const [zoneViolationFile, setZoneViolationFile] = useState<File | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const handleCheckBlacklistPlate = async () => {
    try {
      const plate = searchBlacklistForm.getFieldValue('plate');
      if (!plate) {
        message.warning('Please enter a license plate to check');
        return;
      }
      setIsCheckingBlacklistPlate(true);
      const res = await axiosClient.get(`/operation/vehicles/check?plate=${plate}`);
      if (res.data && res.data.data) {
        setCheckedBlacklistVehicle(res.data.data);
        message.success('Vehicle found in system!');
      } else {
        setCheckedBlacklistVehicle(null);
        message.warning('Vehicle not found in system. You can still add it to blacklist.');
      }
    } catch (e: any) {
      setCheckedBlacklistVehicle(null);
      message.warning('Vehicle not found in system. You can still add it to blacklist.');
    } finally {
      setIsCheckingBlacklistPlate(false);
    }
  };

  const handleCheckZoneViolationPlate = async () => {
    try {
      const plate = zoneViolationForm.getFieldValue('plate');
      if (!plate) {
        message.warning('Please enter a license plate to check');
        return;
      }
      setIsCheckingZonePlate(true);
      const res = await axiosClient.get(`/operation/vehicles/check?plate=${plate}`);
      if (res.data && res.data.data) {
        setCheckedZoneVehicle(res.data.data);
        message.success(`Vehicle found: Type ${res.data.data.vehicleType}`);
      } else {
        setCheckedZoneVehicle(null);
        message.warning('Vehicle not found in system.');
      }
    } catch (e: any) {
      setCheckedZoneVehicle(null);
      message.warning('Vehicle not found in system.');
    } finally {
      setIsCheckingZonePlate(false);
    }
  };

  // QUERY: GET /api/v1/incidents
  const { data: ticketsData = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axiosClient.get('/incidents');
      return res.data?.data || [];
    },
    refetchInterval: 3000 // Poll every 3 seconds
  });

  const { data: vehiclesData = [] } = useQuery({
    queryKey: ['vehicles_blacklist'],
    queryFn: async () => {
      const res = await axiosClient.get('/operation/vehicles');
      return res.data?.data || [];
    },
    enabled: activeMenu === 'blacklist'
  });

  const blacklistedVehicles = vehiclesData.filter((v: any) => v.isBlacklisted);

  // Sync selectedTicket when ticketsData updates
  useEffect(() => {
    if (selectedTicket && ticketsData) {
      const updated = ticketsData.find((t: any) => t.id === selectedTicket.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTicket)) {
        setSelectedTicket(updated);
      }
    }
  }, [ticketsData, selectedTicket]);

  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadedCardFile, setUploadedCardFile] = useState<any>(null);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // MUTATIONS
  const createIncidentMutation = useMutation({
    mutationFn: async (values: any) => {
      let mockUrl = '';
      if (uploadedFile) {
        mockUrl = await getBase64(uploadedFile);
      }
      if (uploadedCardFile) {
        const cardUrl = await getBase64(uploadedCardFile);
        mockUrl = uploadedFile ? `${mockUrl}|${cardUrl}` : cardUrl;
      }

      let res;
      if (values.type === 'LOST_CARD') {
        res = await axiosClient.post('/incidents/lost-card', { 
          plate: values.plate?.toUpperCase(), 
          fee: getPenaltyConfig('PENALTY_LOST_CARD', 200000), 
          description: values.description,
          uploadedDocUrl: mockUrl
        });
      } else {
        res = await axiosClient.post('/incidents', {
          issueType: values.type,
          plate: values.plate?.toUpperCase(),
          fineAmount: values.fineAmount,
          description: values.description,
          priority: values.type === 'LOST_CARD' ? 'HIGH' : 'MEDIUM',
          uploadedDocUrl: mockUrl
        });
      }
      return res;
    },
    onSuccess: () => {
      message.success('Created Incident Success Report!');
      setIsManualModalOpen(false);
      manualForm.resetFields();
      setUploadedFile(null);
      setUploadedCardFile(null);
      setIsManualPlateVerified(false);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const handleCheckManualPlate = async () => {
    try {
      const plate = manualForm.getFieldValue('plate');
      if (!plate) {
        message.warning('Please enter the License Plate of the vehicle to be checked');
        return;
      }
      const category = manualForm.getFieldValue('type');
      const isLostOrDamaged = category === 'LOST_CARD' || category === 'DAMAGED_CARD' || category === 'ZONE_VIOLATION';
      let rfid = '';
      if (!isLostOrDamaged) {
          rfid = manualForm.getFieldValue('code');
          if (!rfid) {
              message.warning('Please enter the card code to check');
              return;
          }
      }

      setIsCheckingManualPlate(true);
      let res;
      if (isLostOrDamaged) {
          res = await axiosClient.get('/incidents/check-plate', { params: { plate: plate.toUpperCase() } });
      } else {
          res = await axiosClient.get('/incidents/check-plate-rfid', { params: { plate: plate.toUpperCase(), rfid } });
      }

      if (res.data?.data?.isActive) {
        if (category === 'ZONE_VIOLATION') {
          message.success(`Vehicle found! Redirecting to Penalty Issuance...`);
          setIsManualModalOpen(false);
          setSelectedCategory('ZONE_VIOLATION');
          
          const vehicleTypeName = res.data.data.vehicleType || '';
          const is2W = vehicleTypeName === 'Xe máy' || vehicleTypeName === 'Xe Đạp' || vehicleTypeName.includes('2') || vehicleTypeName.toLowerCase().includes('two');
          const categoryVal = is2W ? 'TWO_WHEEL' : 'FOUR_WHEEL';
          
          const defaultFee = getPenaltyConfig(is2W ? 'PENALTY_ZONE_VIOLATION_2W' : 'PENALTY_ZONE_VIOLATION_4W', is2W ? 50000 : 100000);
          
          zoneViolationForm.setFieldsValue({ 
            plate: plate.toUpperCase(),
            vehicleCategory: categoryVal,
            fee: defaultFee
          });
          setCheckedZoneVehicle({ vehicleType: vehicleTypeName });
          
          manualForm.resetFields();
          setIsManualPlateVerified(false);
        } else {
          message.success(`Authentication successfully. Type: ${res.data.data.vehicleType}`);
          setManualCheckedVehicleType(res.data.data.vehicleType);
          setIsManualPlateVerified(true);
        }
      } else {
        message.error(isLostOrDamaged ? `Vehicle not found ${plate} parking in lot!` : `License Plate and Card Code do not match or are not in stock!`);
        setIsManualPlateVerified(false);
        setManualCheckedVehicleType('');
      }
    } catch (error) {
      message.error('Error checking vehicle information');
      setIsManualPlateVerified(false);
    } finally {
      setIsCheckingManualPlate(false);
    }
  };

  const updatePhase1Mutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/process-phase1`);
    },
    onSuccess: () => {
      message.success('Locked session Move to Phase 2e processing');
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const [phase2SessionInfo, setPhase2SessionInfo] = useState<any>(null);
  const [damagedCardFault, setDamagedCardFault] = useState<'WEAR_TEAR' | 'CUSTOMER_FAULT'>('WEAR_TEAR');

  // When ticket switches to phase 2, or if it's phase 1 FEE_DISPUTE, fetch its checkout session info
  useEffect(() => {
    if ((selectedTicket?.phase === 2 || (selectedTicket?.phase === 1 && selectedTicket?.type === 'FEE_DISPUTE')) && selectedTicket?.plate) {
      axiosClient.get('/operation/gates/checkout-session-info', {
        params: { plate: selectedTicket.plate }
      }).then(res => {
        setPhase2SessionInfo(res.data?.data || null);
      }).catch(() => setPhase2SessionInfo(null));
    } else {
      setPhase2SessionInfo(null);
    }
  }, [selectedTicket?.id, selectedTicket?.phase]);

  const getBase64Phase2 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const moveToOverstayMutation = useMutation({
    mutationFn: async (id: number) => {
      let uploadedDocUrl: string | undefined;
      if (docFile) {
        uploadedDocUrl = await getBase64Phase2(docFile);
      }
      await axiosClient.put(`/incidents/${id}/move-to-overstay`, {
        uploadedDocUrl
      });
    },
    onSuccess: () => {
      message.success('✅ Vehicle moved to overstay zone!');
      setSelectedTicket(null);
      setDocFile(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error moving vehicle');
    }
  });

  const blacklistMutation = useMutation({
    mutationFn: async (plate: string) => {
      await axiosClient.post(`/operation/vehicles/blacklist-by-plate`, {
        plate,
        reason: 'Frequent overstay or abandoned vehicle'
      });
    },
    onSuccess: () => {
      message.success('✅ Vehicle added to Blacklist!');
      queryClient.invalidateQueries({ queryKey: ['vehicles_blacklist'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error adding to Blacklist');
    }
  });

  const manualBlacklistMutation = useMutation({
    mutationFn: async (values: any) => {
      let evidenceUrl = '';
      if (blacklistEvidenceFile) {
        evidenceUrl = await getBase64(blacklistEvidenceFile);
      }
      await axiosClient.post(`/operation/vehicles/blacklist-by-plate`, {
        plate: values.plate?.toUpperCase(),
        reason: values.reason,
        evidenceUrl
      });
    },
    onSuccess: () => {
      message.success('🎉 Vehicle added to Blacklist successfully!');
      searchBlacklistForm.resetFields();
      setBlacklistEvidenceFile(null);
      setCheckedBlacklistVehicle(null);
      queryClient.invalidateQueries({ queryKey: ['vehicles_blacklist'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error adding to Blacklist');
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number, value: string }) => {
      await axiosClient.put(`/system/configs/${id}`, {
        configValue: value
      });
    },
    onSuccess: () => {
      message.success('Configuration updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['system_configs'] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      let uploadedDocUrl: string | undefined;
      let uploadedPicOutUrl: string | undefined;
      if (docFile) {
        const newDocUrl = await getBase64Phase2(docFile);
        uploadedDocUrl = selectedTicket?.uploadedDocUrl ? `${selectedTicket.uploadedDocUrl}|${newDocUrl}` : newDocUrl;
      }
      if (cardFile) {
        const newCardUrl = await getBase64Phase2(cardFile);
        uploadedDocUrl = uploadedDocUrl ? `${uploadedDocUrl}|${newCardUrl}` : (selectedTicket?.uploadedDocUrl ? `${selectedTicket.uploadedDocUrl}|${newCardUrl}` : newCardUrl);
      }
      if (picOutFile) {
        uploadedPicOutUrl = await getBase64Phase2(picOutFile);
      }
      
      const parkingFee = selectedTicket?.feePausedAt 
        ? selectedTicket?.sessionParkingFee 
        : (phase2SessionInfo?.expectedFee || 0);
      const penaltyFee = selectedTicket?.fineAmount || 0;
      const totalFee = Number(parkingFee) + Number(penaltyFee);
      
      await axiosClient.put(`/incidents/${id}/resolve`, {
        resolutionNotes: `[GD2] Thu phi: ${totalFee.toLocaleString()} VND (phi do xe: ${Number(parkingFee).toLocaleString()} + phi phat: ${Number(penaltyFee).toLocaleString()})${selectedTicket?.type === 'DAMAGED_CARD' ? (damagedCardFault === 'CUSTOMER_FAULT' ? ' - Damaged card due to customer' : ' - Card damage due to wear and tear') : ''}`,
        uploadedDocUrl,
        uploadedPicOutUrl,
        totalFee
      });
    },
    onSuccess: () => {
      message.success('✅ Fees have been collected and gates of Success opened!');
      setSelectedTicket(null);
      setPhase2SessionInfo(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error handling stage 2');
    }
  });

  const [nonCardResolutionNotes, setNonCardResolutionNotes] = useState('');

  const resolveNonCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/resolve-non-card`, {
        resolutionNotes: nonCardResolutionNotes
      });
    },
    onSuccess: () => {
      message.success('✅ Incident Success resolved!');
      setSelectedTicket(null);
      setPhase2SessionInfo(null);
      setNonCardResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error resolved Incident');
    }
  });

  const [feeDisputeAmount, setFeeDisputeAmount] = useState<number>(0);
  const [feeDisputeNotes, setFeeDisputeNotes] = useState('');

  const adjustFeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/adjust-fee-dispute`, {
        discountAmount: feeDisputeAmount,
        resolutionNotes: feeDisputeNotes
      });
    },
    onSuccess: () => {
      message.success('✅ Success fee has been adjusted!');
      setSelectedTicket(null);
      setPhase2SessionInfo(null);
      setFeeDisputeAmount(0);
      setFeeDisputeNotes('');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error adjusting fee');
    }
  });

  const cancelIncidentMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/cancel`, {
        reason: 'The customer found the card, canceled Incident and let the car go normally'
      });
    },
    onSuccess: () => {
      message.success('✅ Incidente canceled Vehicles can go out normally via gatee');
      setSelectedTicket(null);
      setPhase2SessionInfo(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error cancel Incident');
    }
  });

  const pauseFeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.put(`/incidents/${id}/pause-fee`);
    },
    onSuccess: () => {
      message.success('✅ Time and parking fees have been fixed');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Error closing fee');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      await axiosClient.put(`/incidents/${id}/reject?reason=${encodeURIComponent(reason)}`);
    },
    onSuccess: () => {
      message.success('Rejected Incident handling');
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

  const handleCreateManualIncident = (values: any) => {
    createIncidentMutation.mutate(values);
  };

  const handleRejectTicket = (values: any) => {
    if (selectedTicket) rejectMutation.mutate({ id: selectedTicket.id, reason: values.reason });
  };

  if (!isManager && shiftStatus !== 'OPEN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <WarningOutlined className="text-6xl text-orange-400 mb-4" />
          <Title level={3} className="text-slate-800">Not Open On Duty yet</Title>
          <Button type="primary" size="large" onClick={() => navigate('/staff/shift-management')}>Back to Shift Management</Button>
        </div>
      </div>
    );
  }

  const filteredTickets = ticketsData.filter((t: any) => selectedCategory === 'ALL' || t.type === selectedCategory);

  const renderCardDispute = () => (
    <div className="flex flex-col lg:flex-row flex-1 lg:h-full animate-fade-in bg-gray-100 p-2 lg:p-4 gap-4 overflow-y-auto lg:overflow-hidden">
      {/* Pane 1: Category Sidebar */}
      <div className="w-full lg:w-64 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center shrink-0">
          <Text strong className="text-gray-700 text-base">Incident classification</Text>
        </div>
        <div className="flex-1 overflow-x-auto lg:overflow-y-auto p-3 flex flex-row lg:flex-col gap-2 pb-1 lg:pb-3">
          {[
            { id: 'ALL', label: 'All Incidents', icon: '📋' },
            { id: 'ZONE_VIOLATION', label: 'Wrong Zone Parking', icon: '🚨' },
            { id: 'OVERSTAY', label: 'Overstay Vehicles', icon: '🕒' },
            { id: 'LOST_CARD', label: 'Lost Card Report', icon: '🔥' },
            { id: 'DAMAGED_CARD', label: 'Damaged / Unreadable Card', icon: '💳' },
            { id: 'LPR_MISMATCH', label: 'LPR Mismatch', icon: '🤖' },
            { id: 'SLOT_OCCUPIED', label: 'Slot Occupied', icon: '🚗' },
            { id: 'FIND_CAR', label: 'Find Car', icon: '🔍' },
            { id: 'FEE_DISPUTE', label: 'Fee Dispute', icon: '💰' },
            { id: 'OTHER_FEEDBACK', label: 'Other Feedback', icon: '💬' },
            { id: 'BLACKLIST', label: 'Blacklist', icon: '🚫' }
          ].map(cat => (
             <div 
               key={cat.id} 
               className={`p-3 rounded-xl cursor-pointer transition-all font-medium flex items-center gap-3 shrink-0 ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`} 
               onClick={() => { setSelectedCategory(cat.id); setSelectedTicket(null); }}
             >
               <span className="text-lg">{cat.icon}</span>
               <span className="whitespace-nowrap">{cat.label}</span>
             </div>
          ))}
        </div>
      </div>

      {selectedCategory === 'BLACKLIST' ? (
        renderBlacklist()
      ) : (
        <>
          {/* Pane 2: Ticket Queue */}
          <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <Text strong className="text-gray-700 text-sm lg:text-base">Queue ({filteredTickets.length})</Text>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setIsManualModalOpen(true)}>At the counter</Button>
        </div>
        <div className="flex-1 max-h-48 lg:max-h-none overflow-y-auto p-2">
          <List dataSource={filteredTickets} renderItem={(item: any) => (
              <div className={`p-3 mb-2 rounded-xl cursor-pointer border transition-all ${selectedTicket?.id === item.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-gray-200 hover:border-blue-300'}`} onClick={() => setSelectedTicket(item)}>
                <div className="flex justify-between items-start mb-1"><Text strong className="text-gray-800 tracking-wider">{item.plate || item.rfid || 'HOLLOW'}</Text><Text type="secondary" className="text-xs">{item.time}</Text></div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Tag color={item.type === 'LOST_CARD' ? 'volcano' : 'orange'} className="m-0 border-0 text-[10px] sm:text-xs">{item.type}</Tag>
                  <Tag color={item.phase === 1 ? 'processing' : (item.phase === 2 ? 'warning' : 'success')} className="m-0 border-0 text-[10px] sm:text-xs">Director {item.phase}</Tag>
                </div>
              </div>
            )} />
        </div>
      </div>

      {/* Pane 3: Details */}
      <div className="w-full lg:flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedCategory === 'OVERSTAY' && (
          <div className="p-4 border-b border-gray-200 bg-blue-50/50 flex items-center justify-between shrink-0">
            <div>
              <Text strong className="text-gray-700 block text-sm">Overstay Configuration</Text>
              <Text className="text-xs text-gray-500">The system scans overstay vehicles at 2:00 AM daily.</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text className="text-sm text-gray-600">Threshold (Hours):</Text>
              <InputNumber 
                style={{ width: 100 }}
                defaultValue={getPenaltyConfig('OVERSTAY_HOURS_LIMIT', 72)}
                min={1}
                onPressEnter={(e: any) => {
                  const config = configsData.find((c: any) => c.configKey === 'OVERSTAY_HOURS_LIMIT');
                  if (config) {
                    updateConfigMutation.mutate({ id: config.id, value: e.target.value });
                  }
                }}
                onBlur={(e: any) => {
                  const config = configsData.find((c: any) => c.configKey === 'OVERSTAY_HOURS_LIMIT');
                  if (config && e.target.value) {
                    updateConfigMutation.mutate({ id: config.id, value: e.target.value });
                  }
                }}
              />
            </div>
          </div>
        )}
        {selectedTicket ? (
          <div className="flex flex-col h-full lg:overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-start lg:items-center shrink-0 flex-col lg:flex-row gap-2 lg:gap-0">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><WarningOutlined className="text-xl" /></div>
                <div>
                  <Title level={4} className="m-0 text-gray-800">
                    {selectedTicket.type === 'LOST_CARD' ? 'Report Lost Card' : 
                     selectedTicket.type === 'DAMAGED_CARD' ? 'Damaged / Unreadable Card' :
                     selectedTicket.type === 'LPR_MISMATCH' ? 'Error Deviation License Plate (aI)' :
                     selectedTicket.type}
                  </Title>
                  <Text type="secondary">Ticket ID: #{selectedTicket.id} | BKS: <span className="font-bold text-gray-800">{selectedTicket.plate}</span></Text>
                </div>
              </div>
              <Tag color={selectedTicket.phase === 1 ? 'blue' : (selectedTicket.phase === 2 ? 'orange' : 'green')} className="text-sm py-1 px-3">Stage {selectedTicket.phase}: {selectedTicket.status}</Tag>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
              {selectedTicket.phase === 1 ? (
                <div className="flex flex-col gap-6 h-full justify-center">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card title={<span className="font-bold text-blue-700">CUSTOMER INFORMATION SUBMITTED</span>} size="small" className="border-blue-200 bg-blue-50/30 h-full">
                       <div className="flex flex-col sm:flex-row gap-4 h-full items-start">
                         <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-32 shrink-0 overflow-x-auto pb-2 sm:pb-0">
                           {/* Vehicle In Image */}
                           {selectedTicket.sessionPicInPanorama ? (
                             <div className="w-32 h-20 shrink-0 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                               <img src={getImageUrl(selectedTicket.sessionPicInPanorama)} alt="Photo of the car entering" className="w-full h-full object-cover" />
                               <div className="text-[10px] text-center bg-gray-100 text-gray-500 py-0.5">PHOTO OF CAR ENTERING</div>
                             </div>
                           ) : (
                             <div className="w-32 h-20 shrink-0 border border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm">
                               <CameraOutlined className="text-xl text-gray-300 mb-1" />
                               <div className="text-[10px] text-gray-400">No photos available</div>
                             </div>
                           )}
                           {/* Customer Report Image */}
                           {selectedTicket.uploadedDocUrl ? selectedTicket.uploadedDocUrl.split('|').map((url: string, idx: number) => (
                             <div key={idx} className="w-32 h-20 shrink-0 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                               <img src={getImageUrl(url)} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                               <div className="text-[10px] text-center bg-gray-100 text-gray-500 py-0.5">PROOF {idx + 1}</div>
                             </div>
                           )) : (
                             <div className="w-32 h-20 shrink-0 border border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm">
                               <CameraOutlined className="text-xl text-gray-300 mb-1" />
                               <div className="text-[10px] text-gray-400">There is no evidence</div>
                             </div>
                           )}
                         </div>
                         <div className="flex-1 flex flex-col h-full">
                           <div className="mb-2"><Text strong>Incident Type:</Text> <Tag color="blue" className="ml-2">{selectedTicket.type}</Tag></div>
                           <Text strong>Guest notes:</Text>
                           <div className="bg-white p-3 rounded-lg border border-gray-200 mt-1 flex-1 text-gray-700 text-sm overflow-y-auto max-h-24 shadow-inner">
                             {selectedTicket.description || <span className="text-gray-400 italic">Guests don't leave noteseee</span>}
                           </div>
                           {selectedTicket.type !== 'LOST_CARD' && selectedTicket.type !== 'DAMAGED_CARD' && (
                             <div className="mt-2 text-sm bg-blue-50 border border-blue-200 p-2 rounded-lg text-blue-800">
                               <Text strong>Arrival time:</Text> {selectedTicket.sessionTimeIn ? new Date(selectedTicket.sessionTimeIn).toLocaleString('vi-VN') : '---'}<br/>
                               <Text strong>Parking Zone expected:</Text> {selectedTicket.sessionSuggestedZone || '---'}
                             </div>
                           )}
                         </div>
                       </div>
                    </Card>
                    <Card className="shadow-sm border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2 justify-center">
                      <Title level={5} className="mb-1">Action</Title>
                      <Text className="block text-gray-500 text-sm mb-4">
                        {selectedTicket.type === 'LOST_CARD' || selectedTicket.type === 'DAMAGED_CARD' 
                          ? 'After comparing valid photos, lock the vehicle to transfer to phase 2e. If incorrect, Reject request'
                          : 'Confirm information from System to move to Phase 2, guide vehicle or coordinate location'}
                      </Text>
                      {selectedTicket.type === 'FEE_DISPUTE' && (
                        <Button
                          type="default"
                          size="large"
                          className="w-full font-bold h-12 mb-2 border-blue-500 text-blue-600"
                          icon={<SearchOutlined />}
                          onClick={() => {
                            Modal.info({
                              title: 'Look up vehicle information',
                              width: 600,
                              content: (
                                <div className="mt-4 flex flex-col gap-3">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                      <Text type="secondary" className="block text-xs">Fees are being charged</Text>
                                      <Text className="font-bold text-lg text-green-700">{(phase2SessionInfo?.expectedFee || selectedTicket?.sessionParkingFee || 0).toLocaleString()} ₫</Text>
                                    </div>
                                    <div>
                                      <Text type="secondary" className="block text-xs">Now come in</Text>
                                      <Text strong>{phase2SessionInfo?.timeIn || selectedTicket.sessionTimeIn ? new Date(phase2SessionInfo?.timeIn || selectedTicket.sessionTimeIn).toLocaleString('vi-VN') : '---'}</Text>
                                    </div>
                                  </div>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 text-center py-1 text-xs font-bold text-gray-500">PHOTO OF CAR ENTERING</div>
                                    <img src={getImageUrl(phase2SessionInfo?.picInPanorama || selectedTicket.sessionPicInPanorama)} alt="Photo in" className="w-full h-48 object-cover" />
                                  </div>
                                </div>
                              )
                            });
                          }}
                        >
                          
                                                                            LOOK UP VEHICLE INFORMATION
                                                                          </Button>
                      )}
                      {selectedTicket.type === 'OVERSTAY' ? (
                        <>
                          <div className="mb-2">
                            <Text className="text-xs text-gray-500 mb-1 block">Upload photo of car in overstay zone:</Text>
                            <Upload
                              beforeUpload={(file) => { setDocFile(file); return false; }}
                              onRemove={() => setDocFile(null)}
                              maxCount={1}
                              listType="picture"
                            >
                              <Button icon={<UploadOutlined />} className="w-full">Upload vehicle photo</Button>
                            </Upload>
                          </div>
                          <Button 
                            type="primary" 
                            size="large" 
                            className="w-full font-bold bg-blue-600 h-12 mb-2" 
                            icon={<CheckCircleOutlined />} 
                            onClick={() => moveToOverstayMutation.mutate(selectedTicket.id)}
                            loading={moveToOverstayMutation.isPending}
                          >
                            Confirm vehicle moved
                          </Button>
                          <Button 
                            danger 
                            type="primary"
                            size="large" 
                            className="w-full font-bold h-12 mb-2" 
                            icon={<CloseCircleOutlined />} 
                            onClick={() => {
                              Modal.confirm({
                                title: 'Confirm Blacklist',
                                content: `Are you sure you want to add license plate ${selectedTicket.plate} to the blacklist?`,
                                onOk: () => blacklistMutation.mutate(selectedTicket.plate)
                              });
                            }}
                            loading={blacklistMutation.isPending}
                          >
                            Add to Blacklist
                          </Button>
                        </>
                      ) : !(selectedTicket.type === 'FEE_DISPUTE' && !isManager) && (
                        <Button type="primary" size="large" className="w-full font-bold bg-blue-600 h-12 mb-2" icon={<LockOutlined />} onClick={handleLockSessionPhase1}>
                          {selectedTicket.type === 'LOST_CARD' || selectedTicket.type === 'DAMAGED_CARD' ? 'BROWSE & LOCK SESSION' : 'Confirm Incident'}
                        </Button>
                      )}
                      <Button danger size="large" className="w-full font-bold h-12" icon={<CloseCircleOutlined />} onClick={() => setIsRejectTicketModalOpen(true)}>Reject o REQUEST</Button>
                    </Card>
                  </div>
                </div>
              ) : selectedTicket.phase === 2 ? (() => {
                const isCardIncident = selectedTicket.type === 'LOST_CARD' || selectedTicket.type === 'DAMAGED_CARD';
                const isPaused = !!selectedTicket.feePausedAt;
                const parkingFee = isPaused ? Number(selectedTicket.sessionParkingFee ?? 0) : Number(phase2SessionInfo?.expectedFee ?? selectedTicket?.sessionParkingFee ?? 0);
                
                let penaltyFee = Number(selectedTicket?.fineAmount ?? 0);
                if (selectedTicket.type === 'DAMAGED_CARD' && damagedCardFault === 'CUSTOMER_FAULT') {
                  penaltyFee = getPenaltyConfig('PENALTY_DAMAGED_CARD', 50000);
                } else if (selectedTicket.type === 'DAMAGED_CARD' && damagedCardFault === 'WEAR_TEAR') {
                  penaltyFee = 0;
                }

                const totalFee = parkingFee + penaltyFee;
                const timeIn = selectedTicket?.sessionTimeIn || phase2SessionInfo?.timeIn;
                const entryImg = selectedTicket?.sessionPicInPanorama || phase2SessionInfo?.picInPanorama;

                return (
                  <div className="flex flex-col gap-4 h-full overflow-y-auto">
                    {/* Row 1: Entry info + Upload proof */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Entry Info Card */}
                      <Card
                        title={<span className="font-bold text-indigo-700 flex items-center gap-2"><CameraOutlined />Vehicle information when entering</span>}
                        className="border-indigo-200 shadow-sm"
                        size="small"
                      >
                        <div className="flex gap-3">
                          <div className="w-32 h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center">
                            {entryImg ? (
                              <img src={getImageUrl(entryImg)} alt="Photo in" className="w-full h-full object-cover" />
                            ) : (
                              <CameraOutlined className="text-2xl text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col gap-1 text-sm">
                            <div><Text type="secondary">License Plate:</Text> <Text strong className="font-mono text-base text-blue-700">{selectedTicket.plate || '---'}</Text></div>
                            <div><Text type="secondary">Vehicle Type:</Text> <Text strong>{selectedTicket?.sessionVehicleType || phase2SessionInfo?.vehicleType || '---'}</Text></div>
                            <div><Text type="secondary">Entry time:</Text> <Text strong className="text-green-700">{timeIn ? new Date(timeIn).toLocaleString('vi-VN') : '---'}</Text></div>
                            <div><Text type="secondary">Guest type:</Text> <Tag color="blue">{phase2SessionInfo?.customerType || 'Haunt'}</Tag></div>
                          </div>
                        </div>
                        {/* Customer's submitted photo */}
                        {selectedTicket.uploadedDocUrl && (
                          <div className="mt-3 border-t pt-3">
                            <Text type="secondary" className="text-xs block mb-1">Guest Report photo:</Text>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {selectedTicket.uploadedDocUrl.split('|').map((url: string, idx: number) => (
                                 <img key={idx} src={getImageUrl(url)} alt={`Customer Image ${idx + 1}`} className="max-h-20 rounded border border-gray-200 object-contain" />
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Upload Proof or Non-Card notes */}
                      <Card
                        title={<span className="font-bold text-purple-700 flex items-center gap-2">{isCardIncident ? <UploadOutlined /> : <MessageOutlined />} {isCardIncident ? 'Proof of handling' : 'Enter a resolution message'}</span>}
                        className="border-purple-200 shadow-sm"
                        size="small"
                      >
                        {isCardIncident ? (
                          <div className="flex flex-col gap-3">
                            <Upload
                              beforeUpload={(file) => { setDocFile(file); return false; }}
                              onRemove={() => setDocFile(null)}
                              maxCount={1}
                              listType="picture"
                              disabled={!isPaused}
                            >
                              <Button icon={<UploadOutlined />} className="w-full" disabled={!isPaused}>1e Download Cavet photo / ID</Button>
                            </Upload>
                            <Upload
                              beforeUpload={(file) => { setPicOutFile(file); return false; }}
                              onRemove={() => setPicOutFile(null)}
                              maxCount={1}
                              listType="picture"
                              disabled={!isPaused}
                            >
                              <Button icon={<UploadOutlined />} className="w-full" disabled={!isPaused}>2e Upload photo of car to gate</Button>
                            </Upload>
                            {selectedTicket?.type === 'DAMAGED_CARD' && (
                              <Upload
                                beforeUpload={(file) => { setCardFile(file); return false; }}
                                onRemove={() => setCardFile(null)}
                                maxCount={1}
                                listType="picture"
                                disabled={!isPaused}
                              >
                                <Button icon={<UploadOutlined />} className="w-full" disabled={!isPaused}>3e Upload photo of damaged card condition</Button>
                              </Upload>
                            )}
                            {!isPaused && (
                              <div className="text-xs text-orange-600 mt-2">
                                <WarningOutlined className="mr-1" />  Please <b>Closing Time</b>  below before uploading
                                                                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col h-full gap-2">
                            <Text type="secondary" className="text-sm">Please enter a processing notification message (will be sent back to the customer):</Text>
                            <Input.TextArea 
                              rows={4} 
                              placeholder="For example: Staff helped you bring your car to the right place, you can rest assured that you go to the right Zone to pick up your car" 
                              value={nonCardResolutionNotes}
                              onChange={(e) => setNonCardResolutionNotes(e.target.value)}
                            />
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Row 2: Fee breakdown + Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Fee Breakdown */}
                      {isCardIncident ? (
                        <Card
                          title={<span className="font-bold text-slate-700">Fee table</span>}
                          className="border-slate-200 shadow-sm"
                          size="small"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <Text type="secondary">Accumulated parking fees:</Text>
                              <Text strong className="text-slate-700">
                                {parkingFee.toLocaleString()} ₫
                                {isPaused && <Tag color="green" className="ml-2 text-[10px]">CLOSED</Tag>}
                              </Text>
                            </div>
                            {isPaused && selectedTicket.feePausedAt && (
                              <div className="text-xs text-gray-400 italic">
                                
                                                                                Closing time: {new Date(selectedTicket.feePausedAt).toLocaleString('vi-VN')}
                              </div>
                            )}
                              {selectedTicket.type === 'DAMAGED_CARD' && (
                                <div className="mb-2 p-2 bg-orange-50 border border-orange-100 rounded-lg">
                                  <Text type="secondary" className="text-xs block mb-1">Cause of card damage (Penalty applied):</Text>
                                  <Select 
                                    value={damagedCardFault} 
                                    onChange={(val) => setDamagedCardFault(val)}
                                    className="w-full"
                                    options={[
                                      { value: 'WEAR_TEAR', label: 'Natural wear and tear (0 VND)' },
                                      { value: 'CUSTOMER_FAULT', label: 'Error do Customer (50,000₫)' }
                                    ]}
                                  />
                                </div>
                              )}
                              <div className="flex justify-between items-center text-sm">
                                <Text type="secondary">Incident penalty fee:</Text>
                                <Text strong className="text-red-600">+ {penaltyFee.toLocaleString()} ₫</Text>
                              </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                              <Text className="font-bold text-base">TOTAL REVENUE:</Text>
                              <Text className="font-black text-2xl text-green-700">{totalFee.toLocaleString()} ₫</Text>
                            </div>
                          </div>
                        </Card>
                      ) : selectedTicket.type === 'FEE_DISPUTE' ? (
                        <Card
                          title={<span className="font-bold text-slate-700">Resolve the wrong fee</span>}
                          className="border-slate-200 shadow-sm"
                          size="small"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <Text type="secondary">Fees being charged:</Text>
                              <Text strong className="text-slate-700">
                                {parkingFee.toLocaleString()} ₫
                                {isPaused && <Tag color="green" className="ml-2 text-[10px]">CLOSED</Tag>}
                              </Text>
                            </div>
                            {isPaused && selectedTicket.feePausedAt && (
                              <div className="text-xs text-gray-400 italic">
                                
                                                                                    Closing time: {new Date(selectedTicket.feePausedAt).toLocaleString('vi-VN')}
                              </div>
                            )}
                            {isPaused && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="mb-4">
                                  <Text type="secondary" className="block text-xs mb-1">Reduced entry fee (Deducted at exit gate):</Text>
                                  <InputNumber 
                                    className="w-full" 
                                    size="large"
                                    min={0}
                                    max={parkingFee}
                                    value={feeDisputeAmount}
                                    onChange={(val: any) => setFeeDisputeAmount(val || 0)}
                                    addonAfter="VND"
                                  />
                                </div>
                                <div className="mb-2">
                                  <Text type="secondary" className="block text-xs mb-1">Message (sent to guests):</Text>
                                  <Input.TextArea
                                    rows={2}
                                    value={feeDisputeNotes}
                                    onChange={(e) => setFeeDisputeNotes(e.target.value)}
                                  />
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                  
                                                                                          * New fees customers must pay: <span className="font-bold text-lg">{(parkingFee - feeDisputeAmount).toLocaleString()} ₫</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ) : (
                        <Card className="border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
                           <div className="text-center text-slate-400">
                             <CheckCircleOutlined className="text-4xl mb-2" />
                             <p>These incidents do not require a fee</p>
                           </div>
                        </Card>
                      )}

                      {/* Action Buttons */}
                      <Card className="border-slate-200 shadow-sm" size="small" title={<span className="font-bold text-slate-700">Action</span>}>
                        {selectedTicket.type === 'FEE_DISPUTE' && !isManager ? (
                           <div className="text-center text-red-500 font-bold p-4 bg-red-50 rounded">
                             
                                                                     Only Management (Manager) has the right to handle this Incident
                                                                   </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {isCardIncident ? (
                              !isPaused ? (
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<LockOutlined />}
                                  className="w-full font-bold h-12 bg-blue-600 hover:bg-blue-500 border-blue-700"
                                  loading={pauseFeeMutation.isPending}
                                  onClick={() => pauseFeeMutation.mutate(selectedTicket.id)}
                                >
                                  
                                                                                          LOCK TIME & STOP CHARGING
                                                                                        </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<CheckCircleOutlined />}
                                  className="w-full font-bold h-12 bg-green-600 hover:bg-green-500 border-green-700"
                                  loading={resolveMutation.isPending}
                                  disabled={!docFile || !picOutFile}
                                  onClick={() => resolveMutation.mutate(selectedTicket.id)}
                                >
                                  THU {totalFee.toLocaleString()}  VND & OPEN BaRRIER
                                                                                            </Button>
                              )
                            ) : selectedTicket.type === 'FEE_DISPUTE' ? (
                              !isPaused ? (
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<LockOutlined />}
                                  className="w-full font-bold h-12 bg-blue-600 hover:bg-blue-500 border-blue-700"
                                  loading={pauseFeeMutation.isPending}
                                  onClick={() => pauseFeeMutation.mutate(selectedTicket.id)}
                                >
                                  
                                                                                              Confirm Wrong Charge & STOP CHARGING
                                                                                            </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<CheckCircleOutlined />}
                                  className="w-full font-bold h-12 bg-green-600 hover:bg-green-500 border-green-700"
                                  loading={adjustFeeMutation.isPending}
                                  onClick={() => adjustFeeMutation.mutate(selectedTicket.id)}
                                >
                                  
                                                                                                  COMPLETION & UPDATE FEE (15 MINUTES)
                                                                                                </Button>
                              )
                            ) : (
                              <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                className="w-full font-bold h-12 bg-green-600 hover:bg-green-500 border-green-700"
                                loading={resolveNonCardMutation.isPending}
                                disabled={!nonCardResolutionNotes.trim()}
                                onClick={() => resolveNonCardMutation.mutate(selectedTicket.id)}
                              >
                                
                                                                                            SEND RESULTS & COMPLETE
                                                                                          </Button>
                            )}
                            
                            <Button
                              size="large"
                              icon={<CloseCircleOutlined />}
                              className="w-full font-bold h-12 border-orange-400 text-orange-600 hover:bg-orange-50"
                              loading={cancelIncidentMutation.isPending}
                              onClick={() => Modal.confirm({
                                title: 'Confirm cancel Incident',
                                content: 'These Incidents will be canceled and no longer processed',
                                okText: 'Cancel Incident',
                                cancelText: 'Come back',
                                okButtonProps: { className: 'bg-orange-500 border-orange-600 hover:bg-orange-600' },
                                onOk: () => cancelIncidentMutation.mutate(selectedTicket.id)
                              })}
                            >
                              
                                                                              Reject / CAUTION Incident
                                                                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircleOutlined className="text-5xl mb-2 text-green-600" />
                    <Title level={4} className="text-green-700 m-0">Incidents have been resolved</Title>
                    <Text className="text-green-600 mt-1">At {new Date(selectedTicket.resolvedAt).toLocaleString('vi-VN')}</Text>
                  </div>
                  
                  <Card title="Incident information" size="small" className="shadow-sm border-slate-200">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedTicket.description || 'No detailed description available'}
                    </div>
                  </Card>
                  
                  <Card title="Processing information" size="small" className="shadow-sm border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Text type="secondary" className="block text-xs mb-1">Resolution note:</Text>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded text-sm text-slate-700">
                          {selectedTicket.resolutionNotes || 'No notes'}
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" className="block text-xs mb-1">Amount collected (if any):</Text>
                        <Text strong className="text-xl text-green-700">
                          {Number(selectedTicket.fineAmount || 0).toLocaleString()} ₫
                        </Text>
                      </div>
                    </div>
                  </Card>

                  {(() => {
                    const docUrls = selectedTicket.uploadedDocUrl ? selectedTicket.uploadedDocUrl.split('|') : [];
                    const allImages = [
                      ...(selectedTicket.sessionPicInPanorama ? [{ url: selectedTicket.sessionPicInPanorama, label: 'Vehicle Camera Entering' }] : []),
                      ...docUrls.map((url: string, idx: number) => ({ url, label: `Proof ${idx + 1}` })),
                      ...(selectedTicket.sessionPicOutPanorama ? [{ url: selectedTicket.sessionPicOutPanorama, label: 'Camera Xe Ra' }] : [])
                    ];

                    return allImages.length > 0 && (
                      <Card title={<span className="font-bold text-blue-700">All Incident images (Phase 1 - Phase 2 - Phase 3)</span>} size="small" className="shadow-sm border-blue-200 bg-blue-50/20">
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {allImages.map((img: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1 items-center shrink-0 w-56">
                              <div className="h-36 w-full border border-gray-300 rounded overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                <img src={getImageUrl(img.url)} alt={img.label} className="w-full h-full object-cover" />
                              </div>
                              <Text className="text-xs text-gray-600 font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">{img.label}</Text>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        ) : selectedCategory === 'ZONE_VIOLATION' ? (
          <div className="p-4 overflow-y-auto flex-1 flex flex-col xl:flex-row gap-4 bg-gray-50/50">
            {/* Form */}
            <Card title={<span className="text-red-600 font-bold">Issue Wrong Zone Penalty</span>} className="flex-1 shadow-sm border-red-200">
               <Form 
                 layout="vertical" 
                 form={zoneViolationForm} 
                 onFinish={(values) => createIncidentMutation.mutate({...values, type: 'ZONE_VIOLATION'})}
                 onValuesChange={(changedValues) => {
                   if (changedValues.plate) setCheckedZoneVehicle(null);
                   if (changedValues.vehicleCategory) {
                     const is2W = changedValues.vehicleCategory === 'TWO_WHEEL';
                     const key = is2W ? 'PENALTY_ZONE_VIOLATION_2W' : 'PENALTY_ZONE_VIOLATION_4W';
                     const config = configsData.find((c: any) => c.configKey === key);
                     const fee = config ? Number(config.configValue) : (is2W ? 50000 : 100000);
                     zoneViolationForm.setFieldsValue({ fee });
                   }
                 }}
                 initialValues={{ vehicleCategory: 'FOUR_WHEEL', fee: 100000 }}
               >
                 <Form.Item label="License Plate" required>
                   <div className="flex gap-2">
                     <Form.Item name="plate" noStyle rules={[{ required: true, message: 'Please enter license plate' }]}>
                       <Input size="large" className="font-mono uppercase font-bold" placeholder="E.g., 30A-123.45" />
                     </Form.Item>
                     <Button size="large" onClick={handleCheckZoneViolationPlate} loading={isCheckingZonePlate}>Check</Button>
                   </div>
                 </Form.Item>
                 {checkedZoneVehicle && (
                   <div className="mb-4">
                     <Tag color="green" className="text-sm px-3 py-1 font-bold">
                       VEHICLE FOUND: {checkedZoneVehicle.vehicleType}
                     </Tag>
                   </div>
                 )}
                 <Form.Item name="vehicleCategory" label="Vehicle Type" rules={[{ required: true }]}>
                   <Select size="large">
                     <Select.Option value="TWO_WHEEL">2-Wheeler (Motorbike/Bicycle)</Select.Option>
                     <Select.Option value="FOUR_WHEEL">4-Wheeler (Car/Truck)</Select.Option>
                   </Select>
                 </Form.Item>
                 <Form.Item name="fee" label="Penalty Fee">
                   <InputNumber size="large" className="w-full font-bold text-red-600" />
                 </Form.Item>
                 <Form.Item name="description" label="Message / Notes" rules={[{ required: true, message: 'Please enter notes' }]}>
                   <TextArea rows={3} placeholder="Describe the violation..." />
                 </Form.Item>
                 <Form.Item label="Photo Evidence (Required)" required>
                   <Upload
                     beforeUpload={(file) => { setUploadedFile(file); return false; }}
                     onRemove={() => setUploadedFile(null)}
                     maxCount={1}
                     listType="picture"
                   >
                     <Button icon={<UploadOutlined />}>Upload Photo</Button>
                   </Upload>
                 </Form.Item>
                 <Button type="primary" danger htmlType="submit" size="large" className="w-full font-bold mt-4" loading={createIncidentMutation.isPending}>
                   Create Penalty Incident
                 </Button>
               </Form>
            </Card>

            {/* Map check */}
            <Card title={<span className="font-bold text-blue-600">Zone Cross-Check</span>} className="flex-1 shadow-sm border-blue-200">
              <div className="flex gap-4 mb-4">
                <Select
                  placeholder="Select Floor"
                  className="flex-1"
                  options={mapConfigData?.floors?.map((f: any) => ({ label: f.name, value: f.id })) || []}
                  value={selectedFloorId}
                  onChange={(val) => { setSelectedFloorId(val); setSelectedZoneId(null); }}
                />
                <Select
                  placeholder="Select Zone"
                  className="flex-1"
                  options={mapConfigData?.zones?.filter((z: any) => z.floorId === selectedFloorId).map((z: any) => ({ label: z.name, value: z.id })) || []}
                  value={selectedZoneId}
                  onChange={(val) => setSelectedZoneId(val)}
                  disabled={!selectedFloorId}
                />
              </div>
              <div className="bg-slate-100 p-4 rounded-xl min-h-[300px] border border-slate-200 shadow-inner">
                {selectedZoneId ? (() => {
                  const zone = mapConfigData?.zones?.find((z: any) => z.id === selectedZoneId);
                  const occupiedSlots = zone?.slots?.filter((s: any) => s.status === 'OCCUPIED') || [];
                  const suggestedVehicles = zone?.suggestedVehicles || [];
                  
                  if (occupiedSlots.length === 0 && suggestedVehicles.length === 0) {
                      return <div className="text-slate-400 text-center mt-10 italic">No vehicles suggested or parked in this zone</div>;
                  }
                  
                  return (
                    <div className="flex flex-col gap-4">
                      {suggestedVehicles.length > 0 && (
                        <div>
                          <div className="text-sm font-bold text-gray-500 mb-2 uppercase">Suggested Vehicles for this Zone</div>
                          <div className="flex flex-wrap gap-2">
                            {suggestedVehicles.map((plate: string, idx: number) => (
                              <Tag key={`sug-${idx}`} color="blue" className="text-base py-1.5 px-3 m-0 cursor-pointer hover:opacity-80 shadow-sm" onClick={() => zoneViolationForm.setFieldsValue({ plate })}>
                                <span className="font-mono font-bold">{plate}</span>
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {occupiedSlots.length > 0 && (
                        <div>
                          <div className="text-sm font-bold text-gray-500 mb-2 uppercase">Occupied Slots</div>
                          <div className="flex flex-wrap gap-2">
                            {occupiedSlots.map((s: any) => (
                              <Tag key={s.id} color={s.plate ? 'red' : 'default'} className="text-base py-1.5 px-3 m-0 cursor-pointer hover:opacity-80 shadow-sm" onClick={() => zoneViolationForm.setFieldsValue({ plate: s.plate })}>
                                {s.name}: <span className="font-mono font-bold ml-1">{s.plate || 'Unknown Plate'}</span>
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="text-slate-400 text-center mt-10 italic">Select a floor and zone to view parked vehicles</div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-slate-50"><CreditCardOutlined className="text-6xl text-slate-300 mb-4" /><Title level={4} className="text-slate-400">No Incident selected</Title><Text>Please select a Ticket from the Queue</Text></div>
        )}
      </div>
        </>
      )}
    </div>
  );

  const renderBlacklist = () => (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Title level={3}>Blacklisted Vehicles</Title>
          <Text type="secondary">Vehicles that are not allowed to enter or have frequent overstays.</Text>
        </div>

        <Card className="mb-6 shadow-sm border-gray-200 rounded-xl" title="Search & Add to Blacklist">
          <Form 
            form={searchBlacklistForm} 
            layout="vertical" 
            onFinish={(values) => manualBlacklistMutation.mutate(values)}
            onValuesChange={(changedValues) => {
              if (changedValues.plate) setCheckedBlacklistVehicle(null);
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item 
                name="plate" 
                label="License Plate" 
                rules={[{ required: true, message: 'Please enter a license plate' }]}
              >
                <div className="flex gap-2">
                  <Input size="large" className="font-mono font-bold uppercase" placeholder="Enter License Plate (e.g., 51G-123.45)" />
                  <Button size="large" onClick={handleCheckBlacklistPlate} loading={isCheckingBlacklistPlate}>Check</Button>
                </div>
              </Form.Item>
              <Form.Item 
                name="reason" 
                label="Reason" 
                rules={[{ required: true, message: 'Please enter a reason' }]}
                className="md:col-span-2"
              >
                <Input size="large" placeholder="E.g., Abandoned vehicle, repeated overstay" />
              </Form.Item>
            </div>
            {checkedBlacklistVehicle && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm flex flex-wrap gap-x-4">
                <div><strong>Status:</strong> <Tag color={checkedBlacklistVehicle.isBlacklisted ? 'red' : 'green'}>{checkedBlacklistVehicle.isBlacklisted ? 'BLACKLISTED' : 'ACTIVE'}</Tag></div>
                {checkedBlacklistVehicle.vehicleType && <div><strong>Type:</strong> {checkedBlacklistVehicle.vehicleType}</div>}
                {checkedBlacklistVehicle.rfidCard && <div><strong>RFID:</strong> <Tag>{checkedBlacklistVehicle.rfidCard}</Tag></div>}
                {checkedBlacklistVehicle.monthlyTicketStatus && <div><strong>Monthly Pass:</strong> <Tag color="blue">{checkedBlacklistVehicle.monthlyTicketStatus}</Tag></div>}
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Form.Item label="Upload Evidence (Optional)" className="mb-0 flex-1">
                <Upload 
                  maxCount={1} 
                  beforeUpload={(file) => { setBlacklistEvidenceFile(file); return false; }}
                  onRemove={() => setBlacklistEvidenceFile(null)}
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />} className="w-full">Upload photo evidence</Button>
                </Upload>
              </Form.Item>
              <Button 
                type="primary" 
                danger 
                size="large" 
                htmlType="submit" 
                loading={manualBlacklistMutation.isPending}
                className="w-full md:w-auto font-bold px-8"
              >
                Add to Blacklist
              </Button>
            </div>
          </Form>
        </Card>
        
        <Card className="shadow-sm border-gray-200 rounded-xl">
          <List
            dataSource={blacklistedVehicles}
            locale={{ emptyText: 'No blacklisted vehicles' }}
            renderItem={(item: any) => (
              <List.Item className="border-b border-gray-100 py-4">
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center w-full gap-4">
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-16 h-16 shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {item.plate?.substring(0, 2) || 'XX'}
                    </div>
                    <div>
                      <Title level={4} className="m-0 text-gray-800 tracking-wider">{item.plate}</Title>
                      <Text className="text-gray-500 block mt-1">Vehicle Type: {item.vehicleTypeName || 'Unknown'}</Text>
                      {item.blacklistReason && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md inline-block">
                          <WarningOutlined className="mr-1" /> {item.blacklistReason}
                        </div>
                      )}
                      {item.blacklistEvidenceUrl && (
                        <div className="mt-2">
                          <img src={getImageUrl(item.blacklistEvidenceUrl)} alt="Evidence" className="h-20 w-auto rounded border border-gray-200 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <Button 
                      type="default" 
                      danger
                      className="w-full md:w-auto mt-2 md:mt-0"
                      onClick={() => {
                        Modal.confirm({
                          title: 'Remove from Blacklist',
                          content: `Are you sure you want to remove ${item.plate} from the blacklist?`,
                          onOk: async () => {
                            try {
                              await axiosClient.post(`/operation/vehicles/${item.id}/unblacklist`);
                              message.success('Vehicle removed from Blacklist');
                              queryClient.invalidateQueries({ queryKey: ['vehicles_blacklist'] });
                            } catch (e: any) {
                              message.error(e.response?.data?.message || 'Error removing from blacklist');
                            }
                          }
                        });
                      }}
                    >
                      Remove from Blacklist
                    </Button>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {renderCardDispute()}

      <Modal 
        title="Create a Manual Incident at the Counter" 
        open={isManualModalOpen} 
        onCancel={() => { setIsManualModalOpen(false); setIsManualPlateVerified(false); manualForm.resetFields(); setUploadedFile(null); setUploadedCardFile(null); }} 
        onOk={() => manualForm.submit()} 
        okText="Create Tickets" 
        cancelText="Cancel" 
        width={600}
        okButtonProps={{ disabled: !isManualPlateVerified }}
      >
        <Form form={manualForm} layout="vertical" onFinish={handleCreateManualIncident} onValuesChange={(changed) => { if(changed.type) setIsManualPlateVerified(false); }}>
          <Form.Item name="type" label="Incident type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="LOST_CARD">Customer reports lost card</Select.Option>
              <Select.Option value="DAMAGED_CARD">Customer reported damaged card</Select.Option>
              <Select.Option value="SLOT_OCCUPIED">Slot is occupied</Select.Option>
              <Select.Option value="FIND_CAR">Car not found</Select.Option>
              <Select.Option value="FEE_DISPUTE">Fee discrepancies</Select.Option>
              <Select.Option value="OTHER_FEEDBACK">Other comments</Select.Option>
              <Select.Option value="ZONE_VIOLATION">Wrong Zone Parking</Select.Option>
            </Select>
          </Form.Item>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Form.Item label="License Plate declaration" required className="col-span-1">
              <Form.Item name="plate" rules={[{ required: true }]} noStyle>
                <Input size="large" className="font-mono font-bold uppercase" placeholder="51G-123.45" disabled={isCheckingManualPlate} onChange={() => setIsManualPlateVerified(false)} />
              </Form.Item>
            </Form.Item>
            
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) => {
                const type = getFieldValue('type');
                if (type && type !== 'LOST_CARD' && type !== 'DAMAGED_CARD' && type !== 'ZONE_VIOLATION') {
                  return (
                    <Form.Item label="Card code / RFID" name="code" rules={[{ required: true, message: 'Card code is required for authentication' }]} className="col-span-1">
                      <Input size="large" placeholder="Enter cardeee code" disabled={isCheckingManualPlate} onChange={() => setIsManualPlateVerified(false)} />
                    </Form.Item>
                  );
                }
                return <div className="col-span-1" />;
              }}
            </Form.Item>
          </div>
          
          <Button type="primary" size="large" className="w-full mb-4" loading={isCheckingManualPlate} onClick={handleCheckManualPlate}>
            
                                  Check vehicle information
                                </Button>

          {isManualPlateVerified && (
            <>
              <div className="mb-4 text-center">
                <Tag color="green" className="text-sm px-4 py-1 font-bold">
                  VEHICLE FOUND: {manualCheckedVehicleType}
                </Tag>
              </div>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const manualCategory = getFieldValue('type');
                  return (manualCategory === 'LOST_CARD' || manualCategory === 'DAMAGED_CARD') ? (
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                      <Form.Item label="1e Photo proving vehicle owner (Ca parrot/CCCD)" required className="flex-1">
                        <Upload 
                          maxCount={1} 
                          beforeUpload={(file) => { setUploadedFile(file); return false; }}
                          onRemove={() => setUploadedFile(null)}
                          listType="picture"
                        >
                          <Button icon={<UploadOutlined />} className="w-full">Download Ca parrot / CCCD</Button>
                        </Upload>
                      </Form.Item>
                      {manualCategory === 'DAMAGED_CARD' && (
                        <Form.Item label="2e Photo of damaged card condition" required className="flex-1">
                          <Upload 
                            maxCount={1} 
                            beforeUpload={(file) => { setUploadedCardFile(file); return false; }}
                            onRemove={() => setUploadedCardFile(null)}
                            listType="picture"
                          >
                            <Button icon={<UploadOutlined />} className="w-full">Upload damaged card photo</Button>
                          </Upload>
                        </Form.Item>
                      )}
                    </div>
                  ) : manualCategory === 'ZONE_VIOLATION' ? (
                    <>
                      <Form.Item name="fineAmount" label="Penalty Fee (Optional)" className="mb-4">
                        <InputNumber size="large" className="w-full font-bold text-red-600" placeholder="Default fee will be applied if left blank" />
                      </Form.Item>
                      <Form.Item label="Attached photo" required className="mb-4">
                        <Upload 
                          maxCount={1} 
                          beforeUpload={(file) => { setUploadedFile(file); return false; }}
                          onRemove={() => setUploadedFile(null)}
                          listType="picture"
                        >
                          <Button icon={<UploadOutlined />} className="w-full">Download proof photos</Button>
                        </Upload>
                      </Form.Item>
                    </>
                  ) : (
                    <Form.Item label="Attached photo" required className="mb-4">
                      <Upload 
                        maxCount={1} 
                        beforeUpload={(file) => { setUploadedFile(file); return false; }}
                        onRemove={() => setUploadedFile(null)}
                        listType="picture"
                      >
                        <Button icon={<UploadOutlined />} className="w-full">Download proof photos</Button>
                      </Upload>
                    </Form.Item>
                  );
                }}
              </Form.Item>
              <Form.Item name="description" label="Incident Description / Notes" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="Detail description of the incidenteee" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal title="Reject requires processing" open={isRejectTicketModalOpen} onCancel={() => setIsRejectTicketModalOpen(false)} onOk={() => rejectTicketForm.submit()} okText="Confirm Reject" cancelText="Cancel" okButtonProps={{ danger: true }}>
        <Form form={rejectTicketForm} layout="vertical" onFinish={handleRejectTicket}>
          <Form.Item name="reason" label="Reason Reject" rules={[{ required: true, message: 'Please enter a reason' }]}>
            <TextArea rows={4} placeholder="For example: Cavet image does not match License Plate Systemeee" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
