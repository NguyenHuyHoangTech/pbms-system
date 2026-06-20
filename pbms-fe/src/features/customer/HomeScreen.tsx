import React, { useState, useEffect } from 'react';
import { Card, Typography, Collapse, List, Tag, Badge, Divider } from 'antd';
import { 
  CarOutlined, 
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  BookOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  AlertOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock data structures
type VehicleType = 'CAR' | 'MOTORBIKE' | 'EBIKE';

interface SlotData {
  type: VehicleType;
  label: string;
  available: number;
  icon: React.ReactNode;
}

export const HomeScreen = () => {
  // 1. STATE CHO KHỐI REAL-TIME
  const [slots, setSlots] = useState<SlotData[]>([
    { type: 'CAR', label: 'Ô TÔ', available: 45, icon: <CarOutlined /> },
    { type: 'MOTORBIKE', label: 'XE MÁY', available: 210, icon: <div className="text-xl leading-none">🛵</div> },
    { type: 'EBIKE', label: 'XE ĐẠP ĐIỆN', available: 15, icon: <ThunderboltOutlined /> },
  ]);

  // Giả lập Real-time WebSockets
  useEffect(() => {
    const interval = setInterval(() => {
      setSlots(prev => prev.map(slot => {
        // Randomly adjust slots by -2, -1, 0, 1, or 2 to simulate movement
        const delta = Math.floor(Math.random() * 5) - 2; 
        let newAvailable = slot.available + delta;
        // Giới hạn không cho xuống dưới 0
        if (newAvailable < 0) newAvailable = 0;
        // Tạo biến động nhỏ để test cảnh báo (Ví dụ xe đạp điện sẽ dễ về 0 hơn để test)
        if (slot.type === 'EBIKE' && Math.random() > 0.7) {
          newAvailable = Math.max(0, newAvailable - 1);
        }
        return { ...slot, available: newAvailable };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Helpers cho UI Cảnh báo
  const renderSlotCard = (slot: SlotData) => {
    const isFull = slot.available === 0;
    const isWarning = slot.available > 0 && slot.available <= 5;
    const isNormal = slot.available > 5;

    let cardClasses = "rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-40";
    let statusBadge = null;

    if (isFull) {
      cardClasses += " bg-red-600 text-white shadow-lg border-2 border-red-700";
      statusBadge = (
        <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full flex items-center animate-pulse">
          <AlertOutlined className="mr-1" />
          <span className="font-bold text-sm tracking-wide">ĐÃ ĐẦY - HẾT CHỖ</span>
        </div>
      );
    } else if (isWarning) {
      cardClasses += " bg-white border-2 border-orange-500 shadow-md ring-4 ring-orange-500/20 animate-pulse";
      statusBadge = (
        <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full flex items-center border border-orange-200">
          <WarningOutlined className="mr-1" />
          <span className="font-bold text-sm tracking-wide">SẮP ĐẦY</span>
        </div>
      );
    } else {
      cardClasses += " bg-white border border-green-200 shadow-sm hover:shadow-md";
    }

    return (
      <div key={slot.type} className={cardClasses}>
        {statusBadge}
        <div className={`flex items-center space-x-3 ${isFull ? 'text-red-100' : 'text-gray-500'}`}>
          <div className={`text-2xl p-2 rounded-xl ${isFull ? 'bg-red-500/50' : 'bg-gray-100'}`}>
            {slot.icon}
          </div>
          <span className="font-bold text-lg tracking-wider">[{slot.label}]</span>
        </div>
        
        <div className="mt-4 flex items-baseline space-x-2">
          {isFull ? (
            <span className="text-4xl font-extrabold">0</span>
          ) : (
            <>
              <span className="text-sm font-medium uppercase tracking-wider opacity-80">Trống</span>
              <span className={`text-5xl font-black ${isWarning ? 'text-orange-600' : 'text-green-600'}`}>
                {slot.available}
              </span>
              <span className="text-sm font-medium opacity-80">chỗ</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // 2. KHỐI BIỂU PHÍ (ACCORDION)
  const pricingItems = [
    {
      key: '1',
      label: <div className="font-bold text-lg flex items-center"><CarOutlined className="mr-2 text-blue-600"/> Biểu phí Ô TÔ</div>,
      children: (
        <div className="space-y-4">
          <div>
            <Text className="font-bold text-blue-800">☀️ Ca Ngày (06:00 - 22:00)</Text>
            <ul className="list-disc pl-5 mt-1 text-gray-600">
              <li>120 phút đầu tiên = <span className="font-bold text-gray-800">20.000 VNĐ</span></li>
              <li>Mỗi 60 phút tiếp theo = <span className="font-bold text-gray-800">10.000 VNĐ</span></li>
            </ul>
          </div>
          <div>
            <Text className="font-bold text-indigo-800">🌙 Ca Đêm (22:00 - 06:00)</Text>
            <p className="pl-5 mt-1 text-gray-600">Đồng giá ca đêm = <span className="font-bold text-gray-800">50.000 VNĐ/lượt</span></p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start">
            <DollarOutlined className="text-red-500 text-lg mt-0.5 mr-2" />
            <div>
              <Text className="font-bold text-red-700">Giá Trần (Max Cap)</Text>
              <p className="text-red-600 text-sm m-0">Tối đa 3.000.000 VNĐ / đợt lưu bãi liên tục.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: <div className="font-bold text-lg flex items-center"><span className="mr-2 text-xl">🛵</span> Biểu phí XE MÁY</div>,
      children: (
        <div className="space-y-4">
          <div>
            <Text className="font-bold text-blue-800">☀️ Ca Ngày (06:00 - 22:00)</Text>
            <p className="pl-5 mt-1 text-gray-600">Đồng giá = <span className="font-bold text-gray-800">5.000 VNĐ/lượt</span></p>
          </div>
          <div>
            <Text className="font-bold text-indigo-800">🌙 Ca Đêm (22:00 - 06:00)</Text>
            <p className="pl-5 mt-1 text-gray-600">Đồng giá = <span className="font-bold text-gray-800">10.000 VNĐ/lượt</span></p>
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: <div className="font-bold text-lg flex items-center"><ThunderboltOutlined className="mr-2 text-green-600"/> Biểu phí XE ĐẠP ĐIỆN</div>,
      children: (
        <div className="space-y-4">
           <p className="text-gray-600">Áp dụng chung biểu phí với Xe Máy. Khách hàng sử dụng trạm sạc sẽ tính thêm phụ phí sạc (Thông báo tại trạm).</p>
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12 font-sans selection:bg-blue-200">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* KHU VỰC 1: HERO SECTION */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <Badge status="processing" color="#10b981" />
              <div className="border border-green-500/50 bg-green-500/10 px-3 py-1 rounded-full inline-flex items-center backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                <span className="text-green-300 text-xs font-bold uppercase tracking-widest">Đang hoạt động</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Hệ thống Bãi xe Thông minh Trung tâm
            </h1>
            
            <div className="flex items-center text-gray-400 mt-4 space-x-4">
              <div className="flex items-center">
                <ClockCircleOutlined className="mr-2 text-blue-400" />
                <span className="font-medium text-lg">Giờ hoạt động: <span className="text-white font-bold">24/7</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* KHỐI 1: THỐNG KÊ CHỖ ĐỖ (KPI CARDS) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Tình trạng chỗ đỗ</h2>
            <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping mr-2"></span>
              Cập nhật trực tiếp
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {slots.map(renderSlotCard)}
          </div>
        </section>

        {/* KHỐI 2: MINH BẠCH BIỂU PHÍ */}
        <section>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Biểu phí gửi xe</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Collapse 
              items={pricingItems} 
              defaultActiveKey={['1']} 
              ghost 
              expandIconPosition="end"
              className="text-lg"
            />
          </div>
        </section>

        {/* KHỐI 3: THÔNG TIN HÀNH CHÍNH & NỘI QUY */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-sm border border-gray-100 h-full" title={<span className="font-bold flex items-center"><SafetyCertificateOutlined className="mr-2 text-indigo-600"/> Loại xe phục vụ</span>}>
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: 'Ô tô chở người', desc: 'Dưới 7 chỗ ngồi, chiều cao lưu thông <= 2.2m' },
                { title: 'Xe máy, Xe tay ga', desc: 'Các loại xe gắn máy 2 bánh' },
                { title: 'Xe đạp điện', desc: 'Hỗ trợ khu vực sạc điện riêng biệt' },
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<span className="font-bold text-gray-800">{item.title}</span>}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card className="rounded-2xl shadow-sm border border-gray-100 h-full bg-orange-50/30" title={<span className="font-bold flex items-center"><BookOutlined className="mr-2 text-orange-600"/> Nội quy bãi xe</span>}>
            <List
              size="small"
              dataSource={[
                'Cảnh báo xe tồn bãi > 72 giờ sẽ bị lập biên bản theo quy định.',
                'Nhắc nhở KHÔNG để lại tài sản có giá trị lớn trên xe (Laptop, tiền mặt...). Ban quản lý từ chối bồi thường trong trường hợp mất mát.',
                'Tuân thủ tốc độ giới hạn 5km/h trong hầm.',
                'Đỗ đúng vạch kẻ, cấm đỗ vào khu vực dành cho người khuyết tật nếu không có thẻ.',
              ]}
              renderItem={(item, index) => (
                <List.Item className="border-b-0 py-2 text-gray-700">
                  <div className="flex items-start">
                    <span className="bg-orange-200 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">{index + 1}</span> 
                    <span>{item}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </section>

      </main>
    </div>
  );
};
