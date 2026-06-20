import React, { useState, useEffect } from 'react';
import { Card, Typography, Menu, Input, Button, Table, message, Select, Tag, Modal, Form, List, Avatar, Dropdown } from 'antd';
import { 
  WarningOutlined, IdcardOutlined, CameraOutlined, AppstoreOutlined, ClockCircleOutlined,
  ToolOutlined, SearchOutlined, CheckCircleOutlined, CarOutlined, FileProtectOutlined,
  VideoCameraOutlined, PlusOutlined, LockOutlined, CreditCardOutlined, EnvironmentOutlined,
  UserOutlined, PhoneOutlined, MessageOutlined, CheckOutlined, CloseCircleOutlined, MenuOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Mock Data Grouped by Zones
const ZONES = ['A', 'B', 'C', 'D'];
const INITIAL_SLOTS = ZONES.flatMap(zone => 
  Array.from({length: 8}).map((_, i) => ({
    id: `${zone}${i+1}`,
    zone: `Zone ${zone}`,
    isOccupied: (zone === 'A' && i === 2) || (zone === 'B' && i === 5) || (zone === 'C' && i === 1),
    plate: (zone === 'A' && i === 2) ? '51G-123.45' : 
           (zone === 'B' && i === 5) ? '60C-333.22' : 
           (zone === 'C' && i === 1) ? '59A-999.99' : null,
    status: 'ACTIVE'
  }))
);

const MOCK_TICKETS = [
  { id: 'TCK-101', type: 'LOST', phase: 1, plate: '51G-123.45', time: '10:05', status: 'PENDING', uploadedDoc: 'https://via.placeholder.com/300x200.png?text=ANH+CA-VET+APP', baseFee: 120000, inPics: ['https://via.placeholder.com/400x200.png?text=IN+PANORAMA', 'https://via.placeholder.com/200x200.png?text=IN+FACE'], outPics: [] },
  { id: 'TCK-102', type: 'LOST', phase: 2, plate: '60C-333.22', time: '09:15', status: 'WAITING_CHECKOUT', baseFee: 250000, inPics: ['https://via.placeholder.com/400x200.png?text=IN+PANORAMA', 'https://via.placeholder.com/200x200.png?text=IN+FACE'], outPics: ['https://via.placeholder.com/400x200.png?text=OUT+PANORAMA', 'https://via.placeholder.com/200x200.png?text=OUT+PLATE'] },
  { id: 'TCK-103', type: 'DAMAGED', phase: 2, plate: '59A-999.99', time: '11:20', status: 'WAITING_CHECKOUT', baseFee: 50000, inPics: ['https://via.placeholder.com/400x200.png?text=IN+PANORAMA', 'https://via.placeholder.com/200x200.png?text=IN+FACE'], outPics: ['https://via.placeholder.com/400x200.png?text=OUT+PANORAMA', 'https://via.placeholder.com/200x200.png?text=OUT+PLATE'] }
];

const MOCK_FINDER_TICKETS = [
  { id: 'FND-001', plate: '60C-333.22', customerName: 'Nguyễn Văn A', clue: 'Tôi nhớ đỗ gần thang máy khu B', time: '10:15', picCarIn: 'https://via.placeholder.com/400x200.png?text=CAMERA+IN+XONG', uploadedPic: 'https://via.placeholder.com/400x300.png?text=ANH+KHACH+DANG+DUNG' },
  { id: 'FND-002', plate: '59A-999.99', customerName: 'Trần Thị B', clue: 'Gần lối ra tầng hầm thứ 2', time: '10:30', picCarIn: 'https://via.placeholder.com/400x200.png?text=CAMERA+IN+DO', uploadedPic: 'https://via.placeholder.com/400x300.png?text=ANH+KHACH+DANG+DUNG' }
];

export const ExceptionDeskScreen = () => {
  const shiftStatus = useAuthStore(state => state.shiftStatus);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeMenu, setActiveMenu] = useState(isMobile ? 'car_finder' : 'card_dispute');

  // ==========================================
  // PHÂN HỆ 1 & 2
  // ==========================================
  const [tickets, setTickets] = useState<any[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [proofDocUrl, setProofDocUrl] = useState<string | null>(null);
  const [proofCardUrl, setProofCardUrl] = useState<string | null>(null);
  const [damageReason, setDamageReason] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm] = Form.useForm();
  
  const [isRejectTicketModalOpen, setIsRejectTicketModalOpen] = useState(false);
  const [rejectTicketForm] = Form.useForm();

  useEffect(() => { setProofDocUrl(null); setProofCardUrl(null); setDamageReason(null); }, [selectedTicket?.id]);

  const handleTakePhoto = (type: 'doc' | 'card') => {
    setTimeout(() => {
      if (type === 'doc') setProofDocUrl(`https://cloud.pbms.vn/proof/doc_${Date.now()}.jpg`);
      if (type === 'card') setProofCardUrl(`https://cloud.pbms.vn/proof/card_${Date.now()}.jpg`);
      message.success('Đã chụp ảnh bằng chứng.');
    }, 400);
  };

  const handleLockSessionPhase1 = () => {
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, phase: 2, status: 'WAITING_CHECKOUT', outPics: ['https://via.placeholder.com/400x200.png?text=OUT+PANORAMA', 'https://via.placeholder.com/200x200.png?text=OUT+PLATE'] } : t));
    message.success(`Đã khóa phiên đỗ cho xe ${selectedTicket.plate}. Chuyển sang GĐ 2.`);
    setSelectedTicket(null);
  };

  const handleRejectTicket = (values: any) => {
    setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
    message.success(`Đã từ chối yêu cầu ${selectedTicket.id}. Lý do: ${values.reason}`);
    setSelectedTicket(null);
    setIsRejectTicketModalOpen(false);
    rejectTicketForm.resetFields();
  };

  const handleReleaseCarPhase2 = () => {
    setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
    message.success(`Đã xử lý xong và mở Barrier cho xe ${selectedTicket.plate}`);
    setSelectedTicket(null);
  };

  const handleCreateManualIncident = (values: any) => {
    const newTicket = {
      id: `TCK-${Math.floor(Math.random() * 1000) + 200}`, type: values.type, phase: 2, plate: values.plate.toUpperCase(),
      time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}), status: 'WAITING_CHECKOUT', baseFee: 200000,
      inPics: ['https://via.placeholder.com/400x200.png?text=IN+PANORAMA', 'https://via.placeholder.com/200x200.png?text=IN+FACE'],
      outPics: ['https://via.placeholder.com/400x200.png?text=OUT+PANORAMA', 'https://via.placeholder.com/200x200.png?text=OUT+PLATE']
    };
    setTickets([newTicket, ...tickets]);
    setIsManualModalOpen(false);
    manualForm.resetFields();
    setSelectedTicket(newTicket);
    message.success('Đã tạo sự cố mới.');
  };

  const [overstayData, setOverstayData] = useState([{ id: 1, plate: '51F-888.88', timeIn: '2026-06-15 10:00:00', duration: 120, fee: 2999000 }, { id: 2, plate: '60C-123.45', timeIn: '2026-06-12 08:00:00', duration: 190, fee: 3000000 }]);
  useEffect(() => {
    if (activeMenu !== 'overstay') return;
    const timer = setInterval(() => {
      setOverstayData(prev => prev.map(car => car.fee < 3000000 ? { ...car, fee: Math.min(car.fee + 500, 3000000) } : car));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeMenu]);

  // ==========================================
  // PHÂN HỆ 3: GRID WORKSPACE STATE
  // ==========================================
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [selectedFloor, setSelectedFloor] = useState('B1'); 

  const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false);
  const [relocateWrongCarSlotId, setRelocateWrongCarSlotId] = useState<string | null>(null);
  const [relocateTargetZone, setRelocateTargetZone] = useState<string | null>(null);

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintSlotId, setMaintSlotId] = useState<string | null>(null);
  const [maintForm] = Form.useForm();

  const [isUnlockMaintModalOpen, setIsUnlockMaintModalOpen] = useState(false);
  const [unlockMaintSlotId, setUnlockMaintSlotId] = useState<string | null>(null);
  const [unlockMaintForm] = Form.useForm();

  const handleOpenRelocateModal = (slotId: string) => {
    setRelocateWrongCarSlotId(slotId);
    setRelocateTargetZone(null);
    setIsRelocateModalOpen(true);
  };

  const submitRelocate = () => {
    if (!relocateTargetZone) return message.error("Vui lòng chọn Zone đích!");
    setSlots(prev => {
      const newSlots = [...prev];
      const wrongCarIdx = newSlots.findIndex(s => s.id === relocateWrongCarSlotId);
      if (wrongCarIdx === -1) return prev;
      const wrongCarData = newSlots[wrongCarIdx];
      const targetEmptyIdx = newSlots.findIndex(s => s.zone === relocateTargetZone && !s.isOccupied && s.status !== 'MAINTENANCE');
      if (targetEmptyIdx === -1) { message.error(`Khu vực ${relocateTargetZone} đã hết chỗ trống!`); return prev; }

      newSlots[targetEmptyIdx].isOccupied = true;
      newSlots[targetEmptyIdx].plate = wrongCarData.plate;
      newSlots[wrongCarIdx].isOccupied = false;
      newSlots[wrongCarIdx].plate = null;

      message.success(`Đã chuyển xe sang ${relocateTargetZone} thành công!`);
      return newSlots;
    });
    setIsRelocateModalOpen(false);
  };

  const handleOpenMaintModal = (slotId: string) => {
    setMaintSlotId(slotId);
    maintForm.resetFields();
    setIsMaintModalOpen(true);
  };

  const submitMaintenance = (values: any) => {
    setSlots(prev => prev.map(s => s.id === maintSlotId ? { ...s, status: 'MAINTENANCE', isOccupied: false, plate: null } : s));
    message.warning(`Đã khóa ô ${maintSlotId} để bảo trì. Lý do: ${values.reason}`);
    setIsMaintModalOpen(false);
  };

  const submitUnlockMaintenance = (values: any) => {
    setSlots(prev => prev.map(s => s.id === unlockMaintSlotId ? { ...s, status: 'ACTIVE' } : s));
    message.success(`Đã mở khóa ô đỗ ${unlockMaintSlotId}. Báo cáo: ${values.reason}`);
    setIsUnlockMaintModalOpen(false);
    unlockMaintForm.resetFields();
  };

  // ==========================================
  // PHÂN HỆ 4: CAR FINDER STATE (NEW)
  // ==========================================
  const [finderTickets, setFinderTickets] = useState(MOCK_FINDER_TICKETS);
  const [selectedFinderTicket, setSelectedFinderTicket] = useState<any | null>(null);
  const [finderResult, setFinderResult] = useState<any | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleExecuteFinder = () => {
    setIsLocating(true);
    setFinderResult(null);
    
    setTimeout(() => {
      // Giả lập tìm kiếm thành công
      const isB1 = selectedFinderTicket.plate.includes('1') || selectedFinderTicket.plate.includes('2') || selectedFinderTicket.plate.includes('3');
      setFinderResult({
        floor: isB1 ? 'Tầng B1' : 'Tầng B2',
        zone: isB1 ? 'Zone B' : 'Zone C',
        picCarIn: selectedFinderTicket.picCarIn
      });
      setIsLocating(false);
      message.success('Định vị phương tiện thành công!');
    }, 1500);
  };

  const handleCloseFinderTicket = () => {
    setFinderTickets(prev => prev.filter(t => t.id !== selectedFinderTicket.id));
    message.success('Đã hoàn tất hỗ trợ tìm xe.');
    setSelectedFinderTicket(null);
    setFinderResult(null);
  };

  // ==========================================
  // RENDERERS
  // ==========================================

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
          <Text strong className="text-gray-700">Hàng đợi ({tickets.length})</Text>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setIsManualModalOpen(true)}>Tại quầy</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <List dataSource={tickets} renderItem={item => (
              <div className={`p-3 mb-2 rounded-xl cursor-pointer border transition-all ${selectedTicket?.id === item.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-gray-200 hover:border-blue-300'}`} onClick={() => setSelectedTicket(item)}>
                <div className="flex justify-between items-start mb-1"><Text strong className="text-gray-800 tracking-wider">{item.plate}</Text><Text type="secondary" className="text-xs">{item.time}</Text></div>
                <div className="flex gap-2 mb-2"><Tag color={item.type === 'LOST' ? 'volcano' : 'orange'} className="m-0 border-0">{item.type === 'LOST' ? 'MẤT THẺ' : 'HỎNG THẺ'}</Tag><Tag color={item.phase === 1 ? 'processing' : 'warning'} className="m-0 border-0">GĐ {item.phase}</Tag></div>
              </div>
            )} />
        </div>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedTicket ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div><Title level={4} className="m-0 text-slate-800">Chi tiết: {selectedTicket.id}</Title><Text type="secondary">Biển số: <Text strong className="text-lg uppercase ml-1">{selectedTicket.plate}</Text></Text></div>
              <div className="text-right"><Tag color={selectedTicket.phase === 1 ? 'blue' : 'orange'} className="px-3 py-1 text-sm font-bold m-0 border-0">{selectedTicket.phase === 1 ? 'GIAI ĐOẠN 1: BÁO CÁO TỪ XA' : 'GIAI ĐOẠN 2: XỬ LÝ TẠI QUẦY'}</Tag></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTicket.phase === 1 ? (
                <div className="grid grid-cols-2 gap-6 h-full">
                  <Card title={<span className="font-bold text-gray-700"><CameraOutlined className="mr-2"/>Camera IN (Lúc vào)</span>} className="shadow-sm border-gray-200 rounded-xl h-full flex flex-col" styles={{body: {flex: 1, padding: '12px'}}}>
                    <div className="flex flex-col gap-4 h-full">
                      <div className="flex-1 rounded-lg overflow-hidden border"><img src={selectedTicket.inPics[0]} className="w-full h-full object-cover" alt="IN Pano"/></div>
                      <div className="h-40 rounded-lg overflow-hidden border"><img src={selectedTicket.inPics[1]} className="w-full h-full object-cover" alt="IN Face"/></div>
                    </div>
                  </Card>
                  <div className="flex flex-col gap-6">
                    <Card title={<span className="font-bold text-blue-700"><FileProtectOutlined className="mr-2"/>Bằng chứng khách tải lên</span>} className="shadow-sm border-blue-200 rounded-xl flex-1 flex flex-col" styles={{body: {flex: 1, padding: '12px'}}}>
                       <img src={selectedTicket.uploadedDoc} className="w-full h-full object-cover rounded-lg border border-blue-100" alt="Uploaded Document"/>
                    </Card>
                    <Card className="shadow-sm border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2">
                      <Title level={5} className="mb-1">Hành động</Title>
                      <Text className="block text-gray-500 text-sm">Sau khi đối chiếu ảnh hợp lệ, khóa xe để chuyển sang GĐ2. Nếu sai lệch, từ chối yêu cầu.</Text>
                      <Button type="primary" size="large" className="w-full font-bold bg-blue-600 h-12" icon={<LockOutlined />} onClick={handleLockSessionPhase1}>DUYỆT & KHÓA PHIÊN ĐỖ</Button>
                      <Button danger size="large" className="w-full font-bold h-12" icon={<CloseCircleOutlined />} onClick={() => setIsRejectTicketModalOpen(true)}>TỪ CHỐI YÊU CẦU</Button>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 h-full">
                  <div className="grid grid-cols-2 gap-4">
                    <Card title={<span className="font-bold text-blue-700">LÚC VÀO (IN)</span>} size="small" className="border-blue-200 bg-blue-50/30">
                       <div className="flex gap-2 h-32"><img src={selectedTicket.inPics[0]} className="w-2/3 object-cover rounded border" alt="IN"/><img src={selectedTicket.inPics[1]} className="w-1/3 object-cover rounded border" alt="IN Face"/></div>
                    </Card>
                    <Card title={<span className="font-bold text-orange-700">LÚC RA TẠI QUẦY (OUT)</span>} size="small" className="border-orange-200 bg-orange-50/30">
                       <div className="flex gap-2 h-32"><img src={selectedTicket.outPics[0]} className="w-2/3 object-cover rounded border" alt="OUT"/><img src={selectedTicket.outPics[1]} className="w-1/3 object-cover rounded border" alt="OUT Plate"/></div>
                    </Card>
                  </div>
                  <div className="grid grid-cols-2 gap-6 flex-1">
                    <Card title={<span className="font-bold text-indigo-800"><VideoCameraOutlined className="mr-2"/>Bằng chứng (Webcam)</span>} className="border-indigo-200 shadow-sm h-full" styles={{body:{display:'flex', flexDirection:'column', gap:'12px'}}}>
                       <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 bg-gray-50 flex-1 flex flex-col justify-center transition-all" onClick={() => handleTakePhoto('doc')}>
                        {proofDocUrl ? (<div className="text-green-600 font-bold"><CheckCircleOutlined className="mr-2 text-xl block mb-2"/> Đã chụp CCCD</div>) : (<><CameraOutlined className="text-3xl text-gray-400 mb-2 block" /><Text className="font-medium text-gray-600">Chụp CCCD thực tế</Text></>)}
                      </div>
                      {selectedTicket.type === 'DAMAGED' && (
                        <Select size="large" placeholder="Nguyên nhân hỏng thẻ..." value={damageReason} onChange={setDamageReason} options={[{ value: 'natural', label: 'Hao mòn tự nhiên' }, { value: 'user', label: 'Lỗi người dùng (Phạt 50K)' }]} />
                      )}
                      {selectedTicket.type === 'DAMAGED' && damageReason === 'user' && (
                         <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 bg-orange-50 flex-1 flex flex-col justify-center transition-all" onClick={() => handleTakePhoto('card')}>
                          {proofCardUrl ? (<div className="text-green-600 font-bold"><CheckCircleOutlined className="mr-2 text-xl block mb-2"/> Đã chụp Thẻ gãy</div>) : (<><CameraOutlined className="text-3xl text-orange-400 mb-2 block" /><Text className="font-medium text-orange-700">Chụp cận cảnh Thẻ gãy</Text></>)}
                        </div>
                      )}
                    </Card>
                    <Card className="bg-gray-50 border-gray-200 shadow-sm h-full flex flex-col" styles={{body:{flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end'}}}>
                       <div className="space-y-3 mb-6 flex-1">
                          <div className="flex justify-between"><Text className="text-gray-500">Cước đỗ tích lũy:</Text><Text strong>{selectedTicket.baseFee.toLocaleString()} VNĐ</Text></div>
                          {(selectedTicket.type === 'LOST' || (selectedTicket.type === 'DAMAGED' && damageReason === 'user')) && (
                            <div className="flex justify-between text-red-600"><Text>Phí phạt thẻ vật lý:</Text><Text strong>50,000 VNĐ</Text></div>
                          )}
                          <div className="flex justify-between pt-3 border-t border-gray-300">
                            <Text className="font-bold text-lg">TỔNG THU:</Text>
                            <Text className="font-black text-2xl text-blue-700">{((selectedTicket.type === 'LOST' || damageReason === 'user') ? selectedTicket.baseFee + 50000 : selectedTicket.baseFee).toLocaleString()} VNĐ</Text>
                          </div>
                       </div>
                       <Button type="primary" size="large" className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-500" disabled={!proofDocUrl || (selectedTicket.type === 'DAMAGED' && !damageReason) || (selectedTicket.type === 'DAMAGED' && damageReason === 'user' && !proofCardUrl)} onClick={handleReleaseCarPhase2}>THU TIỀN & MỞ BARRIER</Button>
                    </Card>
                  </div>
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

  const renderCarFinder = () => (
    <div className="flex flex-col md:flex-row flex-1 h-full animate-fade-in bg-gray-100 p-4 gap-4 overflow-hidden">
      
      {/* QUEUE SIDEBAR */}
      <div className="w-full md:w-80 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <Text strong className="text-gray-700 block">Yêu Cầu Hỗ Trợ Tìm Xe ({finderTickets.length})</Text>
          <Text type="secondary" className="text-xs">Gửi từ App Khách Hàng</Text>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <List dataSource={finderTickets} renderItem={item => (
              <div className={`p-3 mb-2 rounded-xl cursor-pointer border transition-all ${selectedFinderTicket?.id === item.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-gray-200 hover:border-blue-300'}`} onClick={() => { setSelectedFinderTicket(item); setFinderResult(null); }}>
                <div className="flex justify-between items-start mb-1"><Text strong className="text-gray-800 tracking-wider">{item.plate}</Text><Text type="secondary" className="text-xs">{item.time}</Text></div>
                <div className="flex gap-2 items-center text-gray-500 text-xs">
                  <UserOutlined /> {item.customerName}
                </div>
              </div>
            )} />
        </div>
      </div>

      {/* DETAIL AREA */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedFinderTicket ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div><Title level={4} className="m-0 text-slate-800">Chi tiết Hỗ Trợ: {selectedFinderTicket.id}</Title></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 md:p-6 rounded-xl relative mt-4 md:mt-0">
                    <div className="absolute -top-3 left-4 bg-blue-600 text-white px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold shadow">THÔNG TIN KHÁCH HÀNG</div>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-3"><UserOutlined className="text-blue-500 text-xl"/><Text className="text-sm md:text-lg font-medium">{selectedFinderTicket.customerName}</Text></div>
                      <div className="flex items-start gap-3 mt-4 pt-4 border-t border-blue-200">
                        <MessageOutlined className="text-blue-500 text-xl mt-1"/>
                        <div><Text className="text-gray-500 block text-[10px] md:text-xs uppercase font-bold mb-1">Manh mối khách cung cấp</Text><Text className="italic text-sm md:text-lg text-gray-700">"{selectedFinderTicket.clue}"</Text></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <Text className="text-gray-500 block text-[10px] md:text-xs uppercase font-bold mb-2">Ảnh khu vực khách đang đứng</Text>
                        <img src={selectedFinderTicket.uploadedPic} className="w-full h-32 object-cover rounded-lg border border-blue-200" alt="Customer Standing Location" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 p-4 md:p-6 rounded-xl relative mt-4 md:mt-0">
                    <div className="absolute -top-3 left-4 bg-gray-600 text-white px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold shadow">THÔNG TIN PHIÊN ĐỖ</div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
                      <Text className="text-gray-500 text-sm">Biển số nhận diện:</Text>
                      <Text className="font-mono text-xl md:text-2xl font-black bg-white px-3 py-1 rounded border shadow-sm self-start">{selectedFinderTicket.plate}</Text>
                    </div>
                  </div>
                </div>

                {/* Tracking Action Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col">
                  {!finderResult ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                      <SearchOutlined className="text-6xl text-blue-400" />
                      <Text className="text-lg text-slate-600">Hệ thống sẽ dựa vào dữ liệu Camera và Cảm biến để tìm vị trí phương tiện hiện tại trong hầm.</Text>
                      <Button type="primary" size="large" className="w-64 h-16 text-xl font-bold rounded-xl shadow-lg" icon={<EnvironmentOutlined />} loading={isLocating} onClick={handleExecuteFinder}>
                        KÍCH HOẠT ĐỊNH VỊ
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col animate-fade-in-up">
                      <div className="bg-green-600 text-white p-4 rounded-t-xl flex items-center justify-center gap-3">
                         <CheckCircleOutlined className="text-2xl" />
                         <span className="text-xl font-bold tracking-wide">Định Vị Thành Công</span>
                      </div>
                      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl p-6 flex-1 flex flex-col justify-center items-center text-center gap-6">
                         <div>
                            <Text className="text-sm text-gray-500 uppercase font-bold tracking-wider block mb-2">Khu Vực (Zone) Ghi Nhận</Text>
                            <Text className="text-4xl font-black text-blue-700">{finderResult.floor} - {finderResult.zone}</Text>
                         </div>
                         <img src={finderResult.picCarIn} className="w-full h-40 object-cover rounded-lg border border-gray-200 shadow-sm" alt="Metadata IN" />
                         <Text className="text-sm text-gray-500 italic">* Staff hãy liên hệ SĐT của khách và hướng dẫn đến đúng Khu vực hiển thị trên.</Text>
                      </div>
                      <Button type="default" size="large" className="mt-4 border-green-600 text-green-700 font-bold hover:bg-green-50" icon={<CheckOutlined />} onClick={handleCloseFinderTicket}>HOÀN TẤT HỖ TRỢ</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-slate-50"><SearchOutlined className="text-6xl text-slate-300 mb-4" /><Title level={4} className="text-slate-400">Chưa chọn yêu cầu tìm xe</Title></div>
        )}
      </div>
    </div>
  );

  const handleRelocateViolationZone = (carId: number) => {
    setOverstayData(prev => prev.filter(c => c.id !== carId));
    message.success('Đã xác nhận điều phối xe vào Zone vi phạm (Khu vực giam giữ).');
  };

  const renderOverstay = () => (
    <div className="flex flex-col h-full animate-fade-in p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div><Title level={3} className="m-0 text-red-800">Cảnh Báo Xe Tồn Đọng &gt; 72 Giờ</Title><Text type="secondary">Cập nhật tự động (Cron Job lúc 02:00 sáng). Đóng băng cước tại giá trần 3.000.000 VNĐ.</Text></div>
      </div>
      <Card className="shadow-sm rounded-xl border-0 overflow-hidden">
        <Table dataSource={overstayData} rowKey="id" pagination={false} columns={[
          { title: 'Biển số', dataIndex: 'plate', key: 'plate', render: t => <Text className="font-mono font-bold text-lg">{t}</Text> }, 
          { title: 'Thời gian Check-in', dataIndex: 'timeIn', key: 'timeIn' }, 
          { title: 'Thời gian lưu bãi (Giờ)', dataIndex: 'duration', key: 'duration', render: t => <Text className="text-red-600 font-bold">{t}h</Text> }, 
          { title: 'Cước tích lũy (Live)', dataIndex: 'fee', key: 'fee', render: (t) => (<span className={`font-mono text-xl font-bold px-3 py-1 rounded-md ${t >= 3000000 ? 'bg-red-100 text-red-600 ring-1 ring-red-400' : 'bg-gray-100 text-gray-800'}`}>{t.toLocaleString()} VNĐ {t >= 3000000 && <span className="text-xs uppercase ml-2 text-red-500 font-black">MAX CAP</span>}</span>) },
          { title: 'Hành động', key: 'action', render: (_, record) => <Button type="primary" danger onClick={() => handleRelocateViolationZone(record.id)}>Đã đưa vào Zone Vi phạm</Button> }
        ]} scroll={{ x: 'max-content' }} />
      </Card>
    </div>
  );

  const renderGridWorkspace = () => {
    const floorZones = selectedFloor === 'B1' ? ['Zone A', 'Zone B'] : ['Zone C', 'Zone D'];

    return (
      <div className="flex flex-col h-full animate-fade-in p-6 bg-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Title level={3} className="m-0 text-gray-800">Sơ Đồ Lưới Điều Phối</Title>
            <Text type="secondary">Nhấp chuột trái vào ô có xe để Dời vùng. Nhấp chuột trái vào ô Trống để Cấu hình bảo trì.</Text>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200 flex items-center h-[52px]">
               <Text strong className="mr-3 text-gray-600 uppercase text-xs tracking-widest">Khu Vực:</Text>
               <Select value={selectedFloor} onChange={setSelectedFloor} options={[{value: 'B1', label: 'Tầng Hầm B1'}, {value: 'B2', label: 'Tầng Hầm B2'}]} className="font-bold min-w-[150px]" bordered={false}/>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-inner border-2 border-gray-300 p-4 md:p-8 flex flex-col overflow-y-auto relative">
          <div className="border-4 border-slate-700 rounded-3xl p-4 md:p-8 bg-slate-100 relative min-h-full flex flex-col gap-8 md:gap-10 mt-4 md:mt-0">
            <div className="absolute -top-4 md:-top-5 left-4 md:left-10 bg-slate-700 text-white px-4 md:px-6 py-1 font-black text-sm md:text-xl uppercase tracking-widest rounded-full shadow-lg border-2 md:border-4 border-white">
               TẦNG {selectedFloor}
            </div>

            {floorZones.map(zoneName => (
              <div key={zoneName} className="border-2 border-dashed border-slate-400 rounded-2xl p-4 md:p-6 bg-white relative shadow-sm mt-4 md:mt-0">
                <div className="absolute -top-4 left-4 md:left-6 bg-blue-100 px-3 md:px-4 py-1 font-bold text-blue-800 uppercase tracking-widest text-[10px] md:text-sm border-2 border-blue-300 rounded-full shadow-sm">
                   KHU VỰC {zoneName}
                </div>
                
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 mt-2">
                  {slots.filter(s => s.zone === zoneName).map(slot => {
                    let slotClasses = "h-28 border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative group ";
                    
                    if (slot.status === 'MAINTENANCE') {
                      slotClasses += "border-gray-400 opacity-70 cursor-not-allowed text-gray-500";
                    } else if (slot.isOccupied) {
                      slotClasses += "border-blue-300 bg-blue-50 hover:border-blue-500 hover:shadow-md";
                    } else {
                      slotClasses += "border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50";
                    }

                    return (
                      <div 
                        key={slot.id}
                        className={slotClasses} 
                        style={slot.status === 'MAINTENANCE' ? { background: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 10px, #f3f4f6 10px, #f3f4f6 20px)' } : {}}
                        onClick={() => {
                          if (slot.status === 'MAINTENANCE') {
                            setUnlockMaintSlotId(slot.id);
                            unlockMaintForm.resetFields();
                            setIsUnlockMaintModalOpen(true);
                          } else if (slot.isOccupied) {
                            handleOpenRelocateModal(slot.id);
                          } else {
                            // Ô trống -> Bật form bảo trì bằng left click
                            handleOpenMaintModal(slot.id);
                          }
                        }}
                      >
                        <span className={`text-sm font-black absolute top-1 left-2 ${slot.status === 'MAINTENANCE' ? 'text-gray-500' : 'text-gray-400'}`}>{slot.id}</span>
                        {slot.status === 'MAINTENANCE' ? <ToolOutlined className="text-3xl text-gray-600 bg-white p-1 rounded-full shadow-sm" /> : slot.isOccupied ? (
                          <>
                            <CarOutlined className="text-5xl text-blue-600 mt-2" />
                            <span className="text-[11px] font-mono font-bold mt-2 bg-white px-2 py-0.5 rounded border shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">{slot.plate}</span>
                          </>
                        ) : <span className="text-gray-300 font-bold text-xs uppercase tracking-widest">Trống</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const menuItems = [
    { key: 'card_dispute', icon: <IdcardOutlined className="text-lg" />, label: 'Xử lý Thẻ' }, 
    { key: 'car_finder', icon: <SearchOutlined className="text-lg text-green-400" />, label: 'Tìm Xe' },
    { key: 'overstay', icon: <ClockCircleOutlined className="text-lg text-orange-400" />, label: 'Tồn đọng' }, 
    { key: 'grid_workspace', icon: <AppstoreOutlined className="text-lg text-blue-400" />, label: 'Lưới Đỗ' }
  ];

  const mobileMenuItems = menuItems.filter(item => item.key !== 'card_dispute').map(item => ({
    key: item.key,
    label: <span className="font-bold uppercase tracking-widest">{item.label}</span>,
    icon: item.icon,
    onClick: () => setActiveMenu(item.key)
  }));

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-gray-50 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 shrink-0 shadow-md z-20">
        <Title level={5} className="!text-white m-0 tracking-tight">Xử Lý Sự Cố</Title>
        <Dropdown menu={{ items: mobileMenuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MenuOutlined className="text-white text-xl" />} />
        </Dropdown>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-2xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800"><Title level={4} className="!text-white m-0 tracking-tight">Hub Xử Lý Sự Cố</Title><Text className="text-slate-400 text-xs uppercase tracking-widest font-bold">Staff Control Center</Text></div>
        <Menu mode="inline" theme="dark" selectedKeys={[activeMenu]} onClick={(e) => setActiveMenu(e.key)} className="bg-transparent border-r-0 mt-4 font-medium" items={menuItems} />
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {activeMenu === 'card_dispute' && !isMobile && renderCardDispute()}
        {activeMenu === 'car_finder' && renderCarFinder()}
        {activeMenu === 'overstay' && renderOverstay()}
        {activeMenu === 'grid_workspace' && renderGridWorkspace()}
      </div>

      {/* RELOCATE MODAL */}
      <Modal title={<span className="font-bold text-lg"><CarOutlined className="mr-2 text-blue-600"/>Chuyển Vùng Phương Tiện</span>} open={isRelocateModalOpen} onCancel={() => setIsRelocateModalOpen(false)} onOk={submitRelocate} okText="Xác nhận chuyển" cancelText="Hủy">
        <div className="py-4 space-y-4">
          <Text className="block text-gray-600">Chọn Khu vực (Zone) mới để cập nhật hệ thống định vị cho phương tiện đỗ sai ô <Text strong>{relocateWrongCarSlotId}</Text>.</Text>
          <div>
            <Text className="block font-bold mb-2">Zone đích:</Text>
            <Select className="w-full" size="large" placeholder="Chọn Zone..." value={relocateTargetZone} onChange={setRelocateTargetZone} options={[{ value: 'Zone A', label: 'Tầng B1 - Zone A' }, { value: 'Zone B', label: 'Tầng B1 - Zone B' }, { value: 'Zone C', label: 'Tầng B2 - Zone C' }, { value: 'Zone D', label: 'Tầng B2 - Zone D' }]} />
          </div>
          <Text className="text-xs text-orange-600 italic block mt-2">* Hệ thống sẽ tự động chuyển xe vào Slot trống đầu tiên (Thứ tự a,b,c) trong Zone đích được chọn.</Text>
        </div>
      </Modal>

      {/* MAINTENANCE MODAL */}
      <Modal title={<span className="font-bold text-lg text-red-600"><ToolOutlined className="mr-2"/>Khóa Ô Đỗ - Đưa vào Bảo trì</span>} open={isMaintModalOpen} onCancel={() => setIsMaintModalOpen(false)} onOk={() => maintForm.submit()} okText="Xác nhận khóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <Form form={maintForm} layout="vertical" onFinish={submitMaintenance} className="mt-4">
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 border border-red-200">
            Hành động này sẽ khóa ô đỗ <Text strong className="text-xl mx-1">{maintSlotId}</Text>. Thuật toán sẽ ngừng cấp phát ô này cho khách hàng mới.
          </div>
          <Form.Item name="reason" label={<Text strong>Lý do bảo trì (Bắt buộc nhập)</Text>} rules={[{required: true, message: 'Vui lòng nhập lý do bảo trì để lưu Audit Log!'}]}><TextArea rows={3} placeholder="Ví dụ: Loang dầu, hỏng đèn báo, sụt lún..." /></Form.Item>
        </Form>
      </Modal>

      <Modal title={<span className="font-bold">Tạo Sự Cố Tại Quầy</span>} open={isManualModalOpen} onCancel={() => setIsManualModalOpen(false)} onOk={() => manualForm.submit()} okText="Tạo & Bắt đầu xử lý" cancelText="Hủy">
        <Form form={manualForm} layout="vertical" onFinish={handleCreateManualIncident}>
          <Form.Item name="plate" label="Biển số xe thực tế" rules={[{required: true, message: 'Nhập biển số!'}]}><Input size="large" className="font-mono uppercase tracking-widest" placeholder="Ví dụ: 51G-12345" /></Form.Item>
          <Form.Item name="type" label="Loại sự cố" rules={[{required: true, message: 'Chọn loại sự cố!'}]}><Select size="large" options={[{value: 'LOST', label: 'Khách báo mất thẻ'}, {value: 'DAMAGED', label: 'Thẻ hỏng không đọc được'}]} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={<span className="font-bold text-lg text-red-600"><CloseCircleOutlined className="mr-2"/>Từ Chối Sự Cố</span>} open={isRejectTicketModalOpen} onCancel={() => setIsRejectTicketModalOpen(false)} onOk={() => rejectTicketForm.submit()} okText="Xác nhận từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <Form form={rejectTicketForm} layout="vertical" onFinish={handleRejectTicket} className="mt-4">
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 border border-red-200">
            Hành động này sẽ hủy yêu cầu hỗ trợ của khách hàng. Khách hàng sẽ nhận được thông báo từ chối.
          </div>
          <Form.Item name="reason" label={<Text strong>Lý do từ chối (Bắt buộc nhập)</Text>} rules={[{required: true, message: 'Vui lòng nhập lý do từ chối!'}]}><TextArea rows={3} placeholder="Ví dụ: Hình ảnh không rõ ràng, không thấy xe trong camera..." /></Form.Item>
        </Form>
      </Modal>

      <Modal title={<span className="font-bold text-lg text-green-600"><ToolOutlined className="mr-2"/>Mở Khóa Ô Đỗ Bảo Trì</span>} open={isUnlockMaintModalOpen} onCancel={() => setIsUnlockMaintModalOpen(false)} onOk={() => unlockMaintForm.submit()} okText="Xác nhận mở khóa" cancelText="Hủy">
        <Form form={unlockMaintForm} layout="vertical" onFinish={submitUnlockMaintenance} className="mt-4">
          <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4 border border-green-200">
            Hành động này sẽ đưa ô đỗ <Text strong className="text-xl mx-1">{unlockMaintSlotId}</Text> trở lại trạng thái Sẵn sàng hoạt động.
          </div>
          <Form.Item name="reason" label={<Text strong>Báo cáo hoàn tất bảo trì (Bắt buộc nhập)</Text>} rules={[{required: true, message: 'Vui lòng nhập báo cáo để lưu Audit Log!'}]}><TextArea rows={3} placeholder="Ví dụ: Đã lau sạch vết dầu loang, Đã thay đèn mới..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
