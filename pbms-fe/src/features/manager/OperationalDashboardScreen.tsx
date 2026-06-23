import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Card, Row, Col, DatePicker, Button, Table, Statistic, Radio } from 'antd';
import { DownloadOutlined, FilterOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const OperationalDashboardScreen = () => {
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'day'), dayjs()]);
  const [chartDate, setChartDate] = useState<any>(dayjs());
  const [chartVehicleType, setChartVehicleType] = useState('ALL');
  const [rangeVehicleType, setRangeVehicleType] = useState('ALL');

  const { data: dashboardData } = useQuery({
    queryKey: ['operational-dashboard', chartDate],
    queryFn: async () => {
      const res = await axiosClient.get('/dashboard/operational');
      return res.data.data;
    },
    refetchInterval: 5000 // Real-time polling as fallback to WebSocket
  });

  const dailyData = useMemo(() => {
    return dashboardData?.dailyData || [];
  }, [dashboardData]);

  const hourlyData = useMemo(() => {
    return dashboardData?.hourlyData || [];
  }, [dashboardData]);

  const liveData = useMemo(() => {
    if (dashboardData?.liveData) return dashboardData.liveData;
    return {
      car: { capacity: 200, occupied: 0 },
      moto: { capacity: 500, occupied: 0 },
      checkIns: 0,
      checkOuts: 0
    };
  }, [dashboardData]);

  const handleApply = () => {
    // Fetch data based on date range
  };

  const handleExportCSV = () => {
    let csvContent = "Date;Hour;Total In;Total Out;Peak Occupancy %\n";
    hourlyData.forEach(row => {
      const totalIn = row.carIn + row.motoIn;
      const totalOut = row.carOut + row.motoOut;
      csvContent += `${chartDate?.format('YYYY-MM-DD')};${row.hour};${totalIn};${totalOut};${row.zoneOccupancy}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "operational_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderGauge = (occupied: number, capacity: number, title: string) => {
    const percent = Math.round((occupied / capacity) * 100);
    const isCritical = percent > 90;
    const color = isCritical ? '#ff4d4f' : '#52c41a';
    
    const data = [
      { name: 'Occupied', value: occupied },
      { name: 'Available', value: capacity - occupied }
    ];

    return (
      <div className="flex flex-col items-center">
        <Text strong className="mb-2">{title}</Text>
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={40}
              outerRadius={55}
              startAngle={180}
              endAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#f0f0f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-[-40px] text-center">
          <Title level={3} className="m-0" style={{ color }}>{percent}%</Title>
          <Text className="text-xs text-gray-500">{occupied} / {capacity}</Text>
        </div>
      </div>
    );
  };

  const totalIn = dailyData.reduce((acc, curr) => acc + curr.carIn + curr.motoIn, 0);
  const totalOut = dailyData.reduce((acc, curr) => acc + curr.carOut + curr.motoOut, 0);
  const totalCarIn = dailyData.reduce((acc, curr) => acc + curr.carIn, 0);
  const totalMotoIn = dailyData.reduce((acc, curr) => acc + curr.motoIn, 0);

  const columns = [
    { title: 'Giờ', dataIndex: 'hour', key: 'hour' },
    { title: 'Lượt Vào', key: 'in', render: (_:any, record:any) => record.carIn + record.motoIn },
    { title: 'Lượt Ra', key: 'out', render: (_:any, record:any) => record.carOut + record.motoOut },
    { title: 'Công suất đỉnh (%)', dataIndex: 'zoneOccupancy', key: 'zoneOccupancy', render: (val: number) => <span className={val > 90 ? 'text-red-500 font-bold' : ''}>{val}%</span> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      {/* Global Control Panel */}
      <Card className="mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <Title level={3} className="m-0 flex items-center">
            <NodeIndexOutlined className="mr-3 text-blue-600" /> Báo cáo Vận Hành
          </Title>
        </div>
      </Card>

      {/* Live KPI Grid */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm h-full flex justify-center items-center">
            <div className="flex justify-around w-full">
              {renderGauge(liveData.car.occupied, liveData.car.capacity, "Sức chứa Ô tô")}
              {renderGauge(liveData.moto.occupied, liveData.moto.capacity, "Sức chứa Xe máy")}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm h-full">
            <Statistic title="Check-in Hôm Nay (Live)" value={liveData.checkIns} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm h-full">
            <Statistic title="Check-out Hôm Nay (Live)" value={liveData.checkOuts} valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        {/* Hourly Traffic Flow */}
        <Col span={12}>
          <Card 
            title="Lưu lượng Giao thông (Theo Giờ)" 
            className="shadow-sm h-full"
            extra={
              <div className="flex gap-2">
                <DatePicker 
                  value={chartDate} 
                  onChange={setChartDate} 
                  format="DD/MM/YYYY" 
                  allowClear={false}
                  size="small"
                />
                <Radio.Group 
                  value={chartVehicleType} 
                  onChange={e => setChartVehicleType(e.target.value)} 
                  size="small"
                >
                  <Radio.Button value="ALL">Tất cả</Radio.Button>
                  <Radio.Button value="CAR">Ô tô</Radio.Button>
                  <Radio.Button value="MOTO">Xe máy</Radio.Button>
                </Radio.Group>
              </div>
            }
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {(chartVehicleType === 'ALL' || chartVehicleType === 'CAR') && (
                    <>
                      <Line type="monotone" dataKey="carIn" name="Ô tô IN" stroke="#1890ff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="carOut" name="Ô tô OUT" stroke="#1890ff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </>
                  )}
                  {(chartVehicleType === 'ALL' || chartVehicleType === 'MOTO') && (
                    <>
                      <Line type="monotone" dataKey="motoIn" name="Xe máy IN" stroke="#f5222d" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="motoOut" name="Xe máy OUT" stroke="#f5222d" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        {/* Daily Traffic Trend */}
        <Col span={12}>
          <Card 
            title="Lượt Check-in / Check-out Theo Ngày" 
            className="shadow-sm h-full"
            extra={
              <div className="flex gap-2">
                <RangePicker 
                  value={dateRange} 
                  onChange={setDateRange} 
                  format="DD/MM" 
                  allowClear={false}
                  size="small"
                  className="w-48"
                />
                <Radio.Group 
                  value={rangeVehicleType} 
                  onChange={e => setRangeVehicleType(e.target.value)} 
                  size="small"
                >
                  <Radio.Button value="ALL">Tất cả</Radio.Button>
                  <Radio.Button value="CAR">Ô tô</Radio.Button>
                  <Radio.Button value="MOTO">Xe máy</Radio.Button>
                </Radio.Group>
              </div>
            }
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateStr" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {(rangeVehicleType === 'ALL' || rangeVehicleType === 'CAR') && (
                    <>
                      <Line type="monotone" dataKey="carIn" name="Ô tô IN" stroke="#1890ff" strokeWidth={2} dot={true} />
                      <Line type="monotone" dataKey="carOut" name="Ô tô OUT" stroke="#1890ff" strokeWidth={2} strokeDasharray="5 5" dot={true} />
                    </>
                  )}
                  {(rangeVehicleType === 'ALL' || rangeVehicleType === 'MOTO') && (
                    <>
                      <Line type="monotone" dataKey="motoIn" name="Xe máy IN" stroke="#f5222d" strokeWidth={2} dot={true} />
                      <Line type="monotone" dataKey="motoOut" name="Xe máy OUT" stroke="#f5222d" strokeWidth={2} strokeDasharray="5 5" dot={true} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Macro Ratios (50/25/25 Layout) */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="Lưu lượng Thực (Theo Khoảng Thời Gian)" className="shadow-sm h-full">
            <div className="flex justify-around items-center h-full">
              <Statistic title="Tổng Lượt Vào" value={totalIn} valueStyle={{ color: '#1890ff' }} />
              <Statistic title="Tổng Lượt Ra" value={totalOut} valueStyle={{ color: '#fa8c16' }} />
              <Statistic 
                title="Lưu lượng Ròng" 
                value={totalIn - totalOut} 
                prefix={totalIn - totalOut > 0 ? '+' : ''}
                valueStyle={{ color: totalIn - totalOut > 0 ? '#cf1322' : '#3f8600' }} 
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Tỷ lệ Phương tiện (Kỳ chọn)" className="shadow-sm h-full">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={[
                  { name: 'Ô tô', value: totalCarIn },
                  { name: 'Xe máy', value: totalMotoIn }
                ]} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                  <Cell fill="#1890ff" />
                  <Cell fill="#f5222d" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Nguồn Khách (Kỳ chọn)" className="shadow-sm h-full">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={[
                  { name: 'Vãng lai', value: totalIn * 0.8 },
                  { name: 'Đặt trước', value: totalIn * 0.2 }
                ]} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                  <Cell fill="#faad14" />
                  <Cell fill="#52c41a" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* DataTable & Export */}
      <Card title="Chi tiết Vận hành Theo Giờ" className="shadow-sm" extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
      }>
        <Table 
          columns={columns} 
          dataSource={hourlyData.map((d, i) => ({ ...d, key: i }))} 
          pagination={{ pageSize: 5 }} 
        />
      </Card>
    </div>
  );
};
