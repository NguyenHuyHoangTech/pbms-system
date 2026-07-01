import React, { useState } from 'react';
import { Card, Typography, Select, Input, Button, Form, Table, Tag, message, Alert, Upload } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import dayjs from 'dayjs';
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



const columns = [
  { title: 'Ticket code', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>{text || 'NEW'}</Text> },
  { title: 'Classify', dataIndex: 'type', key: 'type' },
  { title: 'License Plate', dataIndex: 'plate', key: 'plate' },
  { title: 'Describe', dataIndex: 'description', key: 'description' },
  { title: 'Time created', dataIndex: 'time', key: 'time', render: (text: string) => <Text>{text ? dayjs(text).format('HH:mm DD/MM/YYYY') : '-'}</Text> },
  { 
    title: 'Resolution note', 
    dataIndex: 'resolutionNotes', 
    key: 'resolutionNotes',
    render: (text: string) => <Text type="secondary" italic>{text || '-'}</Text> 
  },
  { 
    title: 'Status', 
    dataIndex: 'status', 
    key: 'status',
    render: (status: string) => {
      let color = 'default';
      let label = status;
      if (status === 'PENDING') { color = 'warning'; label = 'Pending'; }
      else if (status === 'WAITING_CHECKOUT') { color = 'processing'; label = 'Processing'; }
      else if (status === 'RESOLVED') { color = 'success'; label = 'Resolved'; }
      else if (status === 'REJECTED') { color = 'error'; label = 'Rejected'; }
      return <Tag color={color}>{label}</Tag>;
    }
  }
];

export const HelpdeskScreen = () => {
  const [form] = Form.useForm();
  
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isPlateVerified, setIsPlateVerified] = useState<boolean>(false);
  const [isCheckingPlate, setIsCheckingPlate] = useState<boolean>(false);
  const [systemMessage, setSystemMessage] = useState<{ type: 'success' | 'warning' | 'info'; title: string; desc: string } | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/incidents');
        return res.data.data || [];
      } catch (err) {
        return [];
      }
    }
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (payload: any) => {
      let res;
      if (payload.issueType === 'LOST_CARD') {
        res = await axiosClient.post('/incidents/lost-card', { 
          plate: payload.plate, 
          description: payload.description,
          uploadedDocUrl: payload.uploadedDocUrl
        });
      } else {
        res = await axiosClient.post('/incidents', payload);
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const handleCheckPlate = async () => {
    const plate = form.getFieldValue('plate');
    if (!plate) {
      message.warning('Please enter vehicle License Plate to check');
      return;
    }
    
    const isLostOrDamaged = selectedCategory === 'LOST_CARD' || selectedCategory === 'DAMAGED_CARD';
    let rfid = '';
    if (!isLostOrDamaged) {
      rfid = form.getFieldValue('code');
      if (!rfid) {
        message.warning('Please enter card code to check');
        return;
      }
    }

    setIsCheckingPlate(true);
    try {
      let res;
      if (isLostOrDamaged) {
        res = await axiosClient.get(`/incidents/check-plate?plate=${encodeURIComponent(plate)}`);
      } else {
        res = await axiosClient.get(`/incidents/check-plate-rfid?plate=${encodeURIComponent(plate)}&rfid=${encodeURIComponent(rfid)}`);
      }
      
      if (res.data?.data) {
        setIsPlateVerified(true);
        message.success('authentication successfullye Please provide Detail Incident belowe');
      } else {
        setIsPlateVerified(false);
        message.error(isLostOrDamaged ? 'No vehicles with this License Plate found in the lot!' : 'License Plate and Card Code do not match or not found in the yard!');
      }
    } catch (err) {
      setIsPlateVerified(false);
      message.error('Error when checking vehicle information!');
    } finally {
      setIsCheckingPlate(false);
    }
  };

  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadedFile2, setUploadedFile2] = useState<any>(null);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleIncidentSubmit = async (values: any) => {
    setSystemMessage(null);
    let mockUrl = '';
    
    try {
      if (values.category === 'DAMAGED_CARD') {
        const urls = [];
        if (uploadedFile) urls.push(await getBase64(uploadedFile));
        // Omit default URLs in production
        
        if (uploadedFile2) urls.push(await getBase64(uploadedFile2));
        // Omit default URLs in production
        
        mockUrl = urls.join('|');
      } else {
        if (uploadedFile) {
          mockUrl = await getBase64(uploadedFile);
        }
      }

      await createIncidentMutation.mutateAsync({
        issueType: values.category,
        plate: values.plate,
        description: `BKS: ${values.plate} - ${values.description || ''}`,
        priority: values.category === 'LOST_CARD' ? 'HIGH' : 'MEDIUM',
        uploadedDocUrl: mockUrl
      });

      switch (values.category) {
        case 'SLOT_OCCUPIED':
          setSystemMessage({
            type: 'warning',
            title: 'Record Report - Please move to Waiting Zone',
            desc: `The System has received the Incident Slote Report. Please move the vehicle to the Temporary Waiting Zonee Staff will verify and regulate the new location and send the results via the tracking table belowe`
          });
          const bg = document.getElementById('helpdesk-container');
          if (bg) {
            bg.classList.add('bg-orange-50');
            setTimeout(() => bg.classList.remove('bg-orange-50'), 2000);
          }
          break;
        case 'FIND_CAR':
          setSystemMessage({
            type: 'info',
            title: 'System coordinated Staff',
            desc: `Please stay where you are and we will send staff to assist you`
          });
          break;
        case 'LOST_CARD':
          setSystemMessage({
            type: 'warning',
            title: 'Lock gate Emergency Check-OUT',
            desc: `Parking session for Vehicle [${values.plate}] has been added to RED LIST for theft prevention. System logged. Please provide evidence to staff at check-out.`
          });
          break;
        case 'DAMAGED_CARD':
          setSystemMessage({
            type: 'info',
            title: 'Report of damaged card has been received',
            desc: `System logged card for vehicle [${values.plate}] as physically damaged. Please bring to counter at check-out for verification.`
          });
          break;
        case 'FEE_DISPUTE':
          setSystemMessage({
            type: 'info',
            title: 'Fee check request has been sent',
            desc: 'Tickets have been transferred to Management for review. Note: Fees are still being calculated until Management decides to freeze or reduce them.'
          });
          break;
        default:
          setSystemMessage({
            type: 'success',
            title: 'Thank you for your comments',
            desc: 'Your feedback has been sent to the Management Board for service improvement'
          });
      }
      
      form.resetFields(['description', 'plate', 'code']);
      setUploadedFile(null);
      setUploadedFile2(null);
      setIsPlateVerified(false);
    } catch (error) {
      message.error('Error when sending support request');
    }
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
              <Title level={2} className="m-0 text-gray-800 tracking-tight">Incident Support</Title>
              <Text type="secondary" className="text-gray-500">Center for receiving and processing exceptions automatically</Text>
            </div>
          </div>
        </div>

        {/* Request Form */}
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
                    
                                            Create New Request
                                          </Button>
                }
              />
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleIncidentSubmit} className="animate-fade-in p-2">
              <Form.Item 
                name="category" 
                label={<span className="font-medium text-gray-700 text-base">What problem are you having?</span>}
                rules={[{ required: true, message: 'Please select Incident type' }]}
              >
                <Select 
                  size="large"
                  placeholder="Select Incidenteee type"
                  onChange={(val) => setSelectedCategory(val)}
                  className="h-14 font-medium"
                  options={[
                    { value: 'LOST_CARD', label: 'Report Lost Card (requires locked vehicle)', icon: <LockOutlined className="text-red-500" /> },
                    { value: 'DAMAGED_CARD', label: 'Report Damaged Card / Unreadable', icon: <WarningOutlined className="text-orange-500" /> },
                    { value: 'SLOT_OCCUPIED', label: 'The reservation slot is occupied', icon: <CarOutlined className="text-blue-500" /> },
                    { value: 'FIND_CAR', label: 'Car not found', icon: <SearchOutlined className="text-green-500" /> },
                    { value: 'FEE_DISPUTE', label: 'Fee discrepancies', icon: <ClockCircleOutlined className="text-purple-500" /> },
                    { value: 'OTHER_FEEDBACK', label: 'Comment on service quality', icon: <MessageOutlined className="text-gray-500" /> },
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
                    
                    {/* License Plate XE - Always required */}
                    <Form.Item 
                      label="Actual vehicle License Plate"
                      required
                      className={`mb-0 col-span-1 ${selectedCategory === 'LOST_CARD' || selectedCategory === 'DAMAGED_CARD' ? 'md:col-span-2' : ''}`}
                    >
                      <div className="flex gap-2">
                        <Form.Item name="plate" rules={[{ required: true, message: 'Please enter vehicle License Plate' }]} noStyle>
                          <Input size="large" prefix={<CarOutlined className="text-gray-400 mr-2" />} placeholder="VD: 51G-123.45" className="h-12 font-mono uppercase" disabled={isCheckingPlate} onChange={() => setIsPlateVerified(false)} />
                        </Form.Item>
                        {(selectedCategory === 'LOST_CARD' || selectedCategory === 'DAMAGED_CARD') && (
                          <Button type="primary" size="large" className="h-12" loading={isCheckingPlate} onClick={handleCheckPlate}>
                            
                                                                                      Check
                                                                                    </Button>
                        )}
                      </div>
                    </Form.Item>

                    {/* CARD ID / BOOKING ID - Required */}
                    {(selectedCategory !== 'LOST_CARD' && selectedCategory !== 'DAMAGED_CARD') && (
                      <Form.Item 
                        label="Card code / Booking code"
                        required
                        className="mb-0 col-span-1"
                      >
                        <div className="flex gap-2">
                          <Form.Item name="code" rules={[{ required: true, message: 'Please enter card code for authentication' }]} noStyle>
                            <Input size="large" prefix={<QrcodeOutlined className="text-gray-400 mr-2" />} placeholder="Enter the code printed on the cardeee" className="h-12" disabled={isCheckingPlate} onChange={() => setIsPlateVerified(false)} />
                          </Form.Item>
                          <Button type="primary" size="large" className="h-12" loading={isCheckingPlate} onClick={handleCheckPlate}>
                            
                                                                                      Check
                                                                                    </Button>
                        </div>
                      </Form.Item>
                    )}

                    {isPlateVerified && (
                      <>

                    {/* PROOF IMAGE */}
                    {selectedCategory === 'DAMAGED_CARD' ? (
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item label="Upload photo Card is damaged" className="mb-0">
                            <Upload maxCount={1} beforeUpload={(file) => { setUploadedFile(file); return false; }} onRemove={() => setUploadedFile(null)} className="w-full block" listType="picture">
                              <div className="w-full h-32 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center bg-white text-orange-500 hover:bg-orange-50 hover:border-orange-500 cursor-pointer transition-colors group">
                                <CameraOutlined className="text-3xl mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Click to open Camera / Download card photo</span>
                              </div>
                            </Upload>
                        </Form.Item>
                        <Form.Item label="Upload a photo of the vehicle owner's ID card" className="mb-0">
                            <Upload maxCount={1} beforeUpload={(file) => { setUploadedFile2(file); return false; }} onRemove={() => setUploadedFile2(null)} className="w-full block" listType="picture">
                              <div className="w-full h-32 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center bg-white text-orange-500 hover:bg-orange-50 hover:border-orange-500 cursor-pointer transition-colors group">
                                <CameraOutlined className="text-3xl mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Click to open Camera / Download CCCD</span>
                              </div>
                            </Upload>
                        </Form.Item>
                      </div>
                    ) : (
                      <Form.Item label={`Upload attached images (${
                        selectedCategory === 'SLOT_OCCUPIED' ? 'Violation vehicle' : 
                        selectedCategory === 'FEE_DISPUTE' ? 'Proof of wrong charges' : 
                        selectedCategory === 'FIND_CAR' ? 'Photo of Zone standing' : 
                        selectedCategory === 'OTHER_FEEDBACK' ? 'Photo comments if available' : 
                        'Parrot / Picture card error'
                      })`} className="mb-0 col-span-2">
                          <Upload 
                            maxCount={1} 
                            beforeUpload={(file) => {
                              setUploadedFile(file);
                              return false;
                            }}
                            onRemove={() => setUploadedFile(null)}
                            className="w-full block" 
                            listType="picture"
                          >
                            <div className="w-full h-32 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center bg-white text-blue-500 hover:bg-blue-50 hover:border-blue-500 cursor-pointer transition-colors group">
                              <CameraOutlined className="text-3xl mb-2 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">Click to open Camera / Upload photo</span>
                            </div>
                          </Upload>
                      </Form.Item>
                    )}

                    {/* Description Details */}
                    <Form.Item 
                      name="description" 
                      label={selectedCategory === 'FIND_CAR' ? "Location clue (Floor, Near any columneee)" : "Description of Detail Incident"} 
                      rules={[{ required: true, message: 'Please enter a description' }]}
                      className="mb-0 col-span-2 mt-2"
                    >
                      <TextArea rows={3} placeholder={selectedCategory === 'FIND_CAR' ? "Example: I'm standing near the Ceee area elevator" : "Explain clearly the reason so that Staff can support you as quickly as possible"} className="rounded-lg text-base p-3" />
                    </Form.Item>

                      </>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="primary" 
                htmlType="submit" 
                loading={createIncidentMutation.isPending}
                disabled={!selectedCategory || !isPlateVerified}
                className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center ${
                  selectedCategory === 'LOST_CARD' ? 'bg-red-600 hover:bg-red-700' :
                  selectedCategory === 'SLOT_OCCUPIED' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
                icon={selectedCategory === 'LOST_CARD' ? <SafetyCertificateOutlined /> : undefined}
              >
                {selectedCategory === 'LOST_CARD' ? 'SEND o REQUEST & EMERGENCY VEHICLE LOCK' : 
                 selectedCategory === 'SLOT_OCCUPIED' ? 'Report & CHANGE PLACE' : 
                 'SEND o REQUEST FOR PROCESSING'}
              </Button>
            </Form>
          )}
        </Card>

        {/* Ticket History */}
        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden mt-6 md:mt-8">
          <Title level={5} className="mb-4 text-gray-600 uppercase text-xs tracking-wider font-bold">Recent Request History</Title>
          <div className="overflow-x-auto">
            <Table 
              dataSource={tickets} 
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
                        <Text strong className="text-red-700 block">Reason Reject from Management:</Text>
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
