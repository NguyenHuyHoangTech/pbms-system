import React, { useState } from 'react';
import { Card, Typography, Row, Col, Form, Input, Button, Slider, Select, message, Spin, Tag } from 'antd';
import { ApiOutlined, SendOutlined, BulbOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;

const MOCK_SLOTS = Array.from({ length: 48 }, (_, i) => ({
  id: `A${i + 1}`,
  isOccupied: Math.random() > 0.6
}));

export const IotMockingScreen = () => {
  const [form] = Form.useForm();
  const [slots, setSlots] = useState(MOCK_SLOTS);

  const triggerApiMutation = useMutation({
    mutationFn: async (values: any) => {
      // Map form values to CameraScanDTO
      const payload = {
        gateId: values.gateType === 'GATE_IN' ? 1 : 3, // Assuming 1 is IN and 3 is OUT based on MOCK_GATES
        plateNumber: values.plate,
        confidence: values.confidence / 100, // Slider is 0-100, backend expects Double 0.0-1.0
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' // 1x1 transparent pixel mock
      };
      return axiosClient.post('/api/v1/iot/cameras/scan', payload).then(res => res.data);
    },
    onSuccess: (_, variables) => {
      message.success(`[${variables.gateType}] Bắn API thành công! Biển số: ${variables.plate || 'N/A'}`);
    },
    onError: () => {
      message.error('Lỗi khi bắn API IoT');
    }
  });

  const toggleSlot = (id: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, isOccupied: !s.isOccupied } : s));
    message.info(`Đã đổi trạng thái slot ${id} (Mock IoT Sensor)`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-gray-700 pb-4">
          <Title level={2} className="m-0 text-green-400 flex items-center font-mono">
            <ApiOutlined className="mr-3" /> Hardware Simulation Terminal (IoT Mock)
          </Title>
          <Text className="text-gray-400 font-mono mt-2 block">Cung cấp công cụ giả lập phần cứng (Camera LPR, Đầu đọc thẻ, Cảm biến siêu âm) để test luồng không cần thiết bị thật.</Text>
        </div>

        <Row gutter={32}>
          {/* LPR & RFID TRIGGER */}
          <Col span={12}>
            <Card className="bg-gray-800 border-gray-700 rounded-xl" title={<span className="text-blue-400 font-mono">Camera LPR & RFID Trigger</span>}>
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={values => triggerApiMutation.mutate(values)}
                initialValues={{ gateType: 'GATE_IN', confidence: 95 }}
              >
                <Form.Item name="gateType" label={<span className="text-gray-300">Cổng (Gate)</span>}>
                  <Select className="bg-gray-700 text-white border-none rounded">
                    <Select.Option value="GATE_IN">Gate IN (Đầu vào)</Select.Option>
                    <Select.Option value="GATE_OUT">Gate OUT (Đầu ra)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="plate" label={<span className="text-gray-300">Biển số (License Plate)</span>}>
                  <Input placeholder="51G-123.45" className="bg-gray-700 text-white border-gray-600 font-mono text-lg" />
                </Form.Item>

                <Form.Item name="rfid" label={<span className="text-gray-300">Mã thẻ RFID (Tùy chọn)</span>}>
                  <Input placeholder="RFID-100001" className="bg-gray-700 text-white border-gray-600 font-mono" />
                </Form.Item>

                <Form.Item name="confidence" label={<span className="text-gray-300">Độ tin cậy OCR (Confidence Score)</span>}>
                  <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} className="mx-2" />
                </Form.Item>

                <div className="mt-8">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large" 
                    icon={<SendOutlined />} 
                    loading={triggerApiMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-500 border-none font-bold"
                  >
                    FIRE EVENT (Bắn API)
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          {/* SENSOR GRID */}
          <Col span={12}>
            <Card className="bg-gray-800 border-gray-700 rounded-xl h-full" title={<span className="text-yellow-400 font-mono">Ultrasonic Sensor Grid</span>}>
              <div className="mb-4 flex gap-4 text-sm text-gray-400">
                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Có xe (Occupied)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Trống (Available)</div>
              </div>
              
              <div className="grid grid-cols-6 gap-3">
                {slots.map(slot => (
                  <div 
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={`
                      cursor-pointer h-16 rounded flex items-center justify-center font-bold transition-all duration-300 select-none
                      ${slot.isOccupied 
                        ? 'bg-red-900 border-2 border-red-500 text-red-200 shadow-[inset_0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-green-900 border-2 border-green-500 text-green-200 shadow-[inset_0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-800'
                      }
                    `}
                  >
                    {slot.id}
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};
