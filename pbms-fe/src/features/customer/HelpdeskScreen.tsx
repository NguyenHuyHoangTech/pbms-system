import React, { useState } from 'react';
import { Card, Typography, Select, Input, Button, Form, Table, Tag, message, Alert } from 'antd';
import { 
  CameraOutlined, 
  CustomerServiceOutlined, 
  SafetyCertificateOutlined, 
  CarOutlined,
  QrcodeOutlined,
  CheckCircleFilled,
  WarningOutlined,
  SearchOutlined,
  LockOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MOCK_TICKETS = [
  { id: 'TCK_001', status: 'OPEN', category: 'Sai lệch cước phí', date: '2026-06-18 10:30' },
  { id: 'TCK_002', status: 'CLOSED', category: 'Mất thẻ', date: '2026-06-15 08:15' },
  { id: 'TCK_003', status: 'REJECTED', category: 'Sai lệch cước phí', date: '2026-06-19 14:20', reason: 'Không có minh chứng hợp lệ, hệ thống không ghi nhận kẹt xe trong khung giờ này.' }
];

const columns = [
  { title: 'Mã Ticket', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text}</Text> },
  { title: 'Phân loại', dataIndex: 'category', key: 'category' },
  { title: 'Thời gian tạo', dataIndex: 'date', key: 'date' },
  { 
    title: 'Trạng thái', 
    dataIndex: 'status', 
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'OPEN' ? 'warning' : status === 'CLOSED' ? 'success' : 'error'}>
        {status === 'OPEN' ? 'Đang xử lý' : status === 'CLOSED' ? 'Đã đóng' : 'Bị từ chối'}
      </Tag>
    )
  }
];

export const HelpdeskScreen = () => {
  const [form] = Form.useForm();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [systemMessage, setSystemMessage] = useState<{ type: 'success' | 'warning' | 'info'; title: string; desc: string } | null>(null);

  const handleIncidentSubmit = (values: any) => {
    setSubmitting(true);
    setSystemMessage(null);
    
    // Mock API Call & Backend Automation Logic
    setTimeout(() => {
      setSubmitting(false);
      
      switch (values.category) {
        case 'SLOT_OCCUPIED':
          setSystemMessage({
            type: 'success',
            title: 'Sự cố đã ghi nhận & Xử lý tự động',
            desc: `Hệ thống đã KHÓA ô đỗ bị chiếm dụng. Đã cấp ngay cho phương tiện [${values.plate}] ô đỗ mới: ZONE B - B02. Vui lòng di chuyển xe sang vị trí mới.`
          });
          const bg = document.getElementById('helpdesk-container');
          if (bg) {
            bg.classList.add('bg-green-50');
            setTimeout(() => bg.classList.remove('bg-green-50'), 2000);
          }
          break;
        case 'FIND_CAR':
          setSystemMessage({
            type: 'info',
            title: 'Hệ thống đã điều phối nhân viên',
            desc: `Vui lòng giữ nguyên vị trí và chúng tôi sẽ cử nhân viên đến hỗ trợ bạn.`
          });
          break;
        case 'LOST_CARD':
          setSystemMessage({
            type: 'warning',
            title: 'Khóa cổng Check-OUT khẩn cấp',
            desc: `Phiên đỗ của phương tiện [${values.plate}] đã được đưa vào DANH SÁCH ĐỎ chống trộm. Hệ thống đã lưu lại ảnh bằng chứng của bạn. Vui lòng ra quầy hỗ trợ lúc Check-out để nhân viên xác minh thủ công.`
          });
          break;
        case 'DAMAGED_CARD':
          setSystemMessage({
            type: 'info',
            title: 'Đã tiếp nhận báo cáo thẻ hỏng',
            desc: `Hệ thống đã ghi nhận thẻ của xe [${values.plate}] bị lỗi vật lý. Vui lòng mang thẻ lỗi ra quầy hỗ trợ lúc Check-out để nhân viên đối chiếu ảnh chụp và thanh toán.`
          });
          break;
        case 'FEE_DISPUTE':
          setSystemMessage({
            type: 'info',
            title: 'Yêu cầu kiểm tra cước phí đã được gửi',
            desc: 'Ticket đã được chuyển lên Quản lý để đối soát. Lưu ý: Cước phí vẫn đang được tính cho đến khi Quản lý ra quyết định đóng băng hoặc giảm trừ.'
          });
          break;
        default:
          setSystemMessage({
            type: 'success',
            title: 'Cảm ơn bạn đã góp ý',
            desc: 'Phản hồi của bạn đã được gửi đến Ban quản lý để cải thiện dịch vụ.'
          });
      }
      
      form.resetFields(['description', 'plate', 'code']);
    }, 1500);
  };

  return (
    <div id="helpdesk-container" className="min-h-screen bg-gray-50/50 p-4 md:p-6 transition-colors duration-700 ease-in-out">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <CustomerServiceOutlined className="text-2xl text-white" />
            </div>
            <div>
              <Title level={2} className="m-0 text-gray-800 tracking-tight">Hỗ Trợ Sự Cố</Title>
              <Text type="secondary" className="text-gray-500">Trung tâm tiếp nhận và xử lý ngoại lệ tự động</Text>
            </div>
          </div>
        </div>

        {/* Form Yêu Cầu */}
        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
          {systemMessage ? (
            <div className="animate-fade-in-up p-4">
              <Alert
                message={<span className="font-semibold text-lg">{systemMessage.title}</span>}
                description={<span className="text-base mt-1 block">{systemMessage.desc}</span>}
                type={systemMessage.type}
                showIcon
                icon={systemMessage.type === 'success' ? <CheckCircleFilled className="mt-1" /> : undefined}
                className="rounded-xl border-2 py-4 px-5 shadow-sm"
                action={
                  <Button onClick={() => setSystemMessage(null)} type="link" className="font-medium">
                    Tạo Yêu Cầu Mới
                  </Button>
                }
              />
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleIncidentSubmit} className="animate-fade-in p-2">
              <Form.Item 
                name="category" 
                label={<span className="font-medium text-gray-700 text-base">Bạn đang gặp vấn đề gì?</span>}
                rules={[{ required: true, message: 'Vui lòng chọn loại sự cố' }]}
              >
                <Select 
                  size="large"
                  placeholder="Chọn loại sự cố..."
                  onChange={(val) => setSelectedCategory(val)}
                  className="h-14 font-medium"
                  options={[
                    { value: 'LOST_CARD', label: 'Báo Mất Thẻ (Yêu cầu khóa xe)', icon: <LockOutlined className="text-red-500" /> },
                    { value: 'DAMAGED_CARD', label: 'Báo Hư Thẻ / Không đọc được', icon: <WarningOutlined className="text-orange-500" /> },
                    { value: 'SLOT_OCCUPIED', label: 'Ô đỗ đặt trước bị chiếm dụng', icon: <CarOutlined className="text-blue-500" /> },
                    { value: 'FIND_CAR', label: 'Không tìm thấy xe', icon: <SearchOutlined className="text-green-500" /> },
                    { value: 'FEE_DISPUTE', label: 'Sai lệch cước phí', icon: <ClockCircleOutlined className="text-purple-500" /> },
                    { value: 'OTHER_FEEDBACK', label: 'Góp ý chất lượng dịch vụ', icon: <MessageOutlined className="text-gray-500" /> },
                  ]}
                  optionRender={(option) => (
                    <div className="flex items-center gap-3 text-base">
                      {option.data.icon} {option.data.label}
                    </div>
                  )}
                />
              </Form.Item>

              <div className="transition-all duration-300">
                
                {/* DYNAMIC FIELDS BASED ON CATEGORY */}
                {selectedCategory && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in-up">
                    
                    {/* BIỂN SỐ XE - Always required */}
                    <Form.Item 
                      name="plate" 
                      label="Biển số xe thực tế"
                      rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
                      className="mb-0"
                    >
                      <Input size="large" prefix={<CarOutlined className="text-gray-400 mr-2" />} placeholder="VD: 51G-123.45" className="h-12 font-mono uppercase" />
                    </Form.Item>

                    {/* MÃ THẺ / BOOKING - Required for OTHERS, Hidden for LOST/DAMAGED */}
                    {(selectedCategory !== 'LOST_CARD' && selectedCategory !== 'DAMAGED_CARD') && (
                      <Form.Item 
                        name="code" 
                        label="Mã thẻ / Mã Booking"
                        rules={[{ required: true, message: 'Vui lòng nhập mã thẻ để xác thực' }]}
                        className="mb-0"
                      >
                        <Input size="large" prefix={<QrcodeOutlined className="text-gray-400 mr-2" />} placeholder="Nhập mã in trên thẻ..." className="h-12" />
                      </Form.Item>
                    )}

                    {/* ẢNH BẰNG CHỨNG - Displayed for ALL categories */}
                    <Form.Item label={`Tải lên hình ảnh đính kèm (${
                      selectedCategory === 'SLOT_OCCUPIED' ? 'Xe vi phạm' : 
                      selectedCategory === 'FEE_DISPUTE' ? 'Minh chứng sai cước' : 
                      selectedCategory === 'FIND_CAR' ? 'Ảnh khu vực đang đứng' : 
                      selectedCategory === 'OTHER_FEEDBACK' ? 'Ảnh góp ý nếu có' : 
                      'Cà-vẹt / Hình thẻ lỗi'
                    })`} className="mb-0 col-span-2">
                        <div className="w-full h-32 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center bg-white text-blue-500 hover:bg-blue-50 hover:border-blue-500 cursor-pointer transition-colors group">
                          <CameraOutlined className="text-3xl mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">Click mở Camera / Tải ảnh lên</span>
                        </div>
                    </Form.Item>

                    {/* MÔ TẢ CHI TIẾT */}
                    <Form.Item 
                      name="description" 
                      label={selectedCategory === 'FIND_CAR' ? "Manh mối vị trí (Tầng, Gần cột nào...)" : "Mô tả chi tiết sự cố"} 
                      rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                      className="mb-0 col-span-2 mt-2"
                    >
                      <TextArea rows={3} placeholder={selectedCategory === 'FIND_CAR' ? "VD: Tôi đang đứng gần thang máy khu C..." : "Giải thích rõ nguyên nhân để nhân viên hỗ trợ nhanh nhất..."} className="rounded-lg text-base p-3" />
                    </Form.Item>

                  </div>
                )}
              </div>

              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                disabled={!selectedCategory}
                className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center ${
                  selectedCategory === 'LOST_CARD' ? 'bg-red-600 hover:bg-red-700' :
                  selectedCategory === 'SLOT_OCCUPIED' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
                icon={selectedCategory === 'LOST_CARD' ? <SafetyCertificateOutlined /> : undefined}
              >
                {selectedCategory === 'LOST_CARD' ? 'GỬI YÊU CẦU & KHÓA XE KHẨN CẤP' : 
                 selectedCategory === 'SLOT_OCCUPIED' ? 'BÁO CÁO & ĐỔI CHỖ NGAY' : 
                 'GỬI YÊU CẦU XỬ LÝ'}
              </Button>
            </Form>
          )}
        </Card>

        {/* Lịch sử Ticket */}
        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden mt-6 md:mt-8">
          <Title level={5} className="mb-4 text-gray-600 uppercase text-xs tracking-wider font-bold">Lịch sử Yêu cầu Gần đây</Title>
          <div className="overflow-x-auto">
            <Table 
              dataSource={MOCK_TICKETS} 
              columns={columns} 
              rowKey="id" 
              pagination={false} 
              size="small" 
              className="min-w-[600px]"
              expandable={{
                expandedRowRender: (record: any) => (
                  record.status === 'REJECTED' && record.reason ? (
                    <div className="bg-red-50 p-3 rounded border border-red-100 flex items-start space-x-2">
                      <WarningOutlined className="text-red-500 mt-1" />
                      <div>
                        <Text strong className="text-red-700 block">Lý do từ chối từ Quản lý:</Text>
                        <Text className="text-red-600">{record.reason}</Text>
                      </div>
                    </div>
                  ) : null
                ),
                rowExpandable: (record: any) => record.status === 'REJECTED' && !!record.reason,
                defaultExpandAllRows: true
              }}
            />
          </div>
        </Card>

      </div>
    </div>
  );
};
