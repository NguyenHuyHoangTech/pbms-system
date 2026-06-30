import json

content = ``tsx
import { simulatedDayjs } from '../../core/utils/timeProvider';
import React, { useState, useMemo } from 'react';
import { Typography, Card, Row, Col, DatePicker, Button, Table, Statistic, Select, message, Tag } from 'antd';
import { DownloadOutlined, NodeIndexOutlined, CalendarOutlined } from '@ant-design/icons';
import { 
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#1890ff', '#f5222d', '#52c41a', '#faad14'];

export const OperationalDashboardScreen = () => {
  const [dateRange, setDateRange] = useState<any>([simulatedDayjs().subtract(7, 'day'), simulatedDayjs()]);
  const [chartDate, setChartDate] = useState<any>(simulatedDayjs());
  const [chartVehicleType, setChartVehicleType] = useState('ALL');
  const [rangeVehicleType, setRangeVehicleType] = useState('ALL');
  const [macroCategory, setMacroCategory] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const [historySize, setHistorySize] = useState(10);

  // === Operational live data ===
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['parking-history', historyPage, historySize],
    queryFn: async () => {
      const res = await axiosClient.get(\/parking-sessions/all?page=\&size=\\);
      return res.data.data;
    },
    refetchInterval: 5000
  });

  const { data: gatesData, refetch: refetchGates } = useQuery({
    queryKey: ['gates-status-report'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/gates');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['operational-dashboard'],
    queryFn: async () => {
      const res = await axiosClient.get('/dashboard/operational');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  // === Hourly Occupancy ===
  const [selectedOccupancyDate, setSelectedOccupancyDate] = useState<any>(simulatedDayjs());

  const { data: occupancyData = [], isFetching: isOccupancyLoading } = useQuery({
    queryKey: ['hourly-occupancy', selectedOccupancyDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const dateStr = selectedOccupancyDate?.format('YYYY-MM-DD');
      const res = await axiosClient.get(\/dashboard/occupancy?date=\\);
      return res.data.data as Array<{ hour: string; occupied: number; checkIn: number; checkOut: number }>;
    },
    enabled: !!selectedOccupancyDate
  });

  // === Zone 4: HOURLY TRAFFIC FLOW ===
  const [selectedTrafficDate, setSelectedTrafficDate] = useState<any>(simulatedDayjs());
  const { data: hourlyTrafficData = [] } = useQuery({
    queryKey: ['hourly-flow', selectedTrafficDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const dateStr = selectedTrafficDate?.format('YYYY-MM-DD');
      const res = await axiosClient.get(\/dashboard/hourly-flow?date=\\);
      return res.data.data;
    },
    enabled: !!selectedTrafficDate
  });

  // === Zone 5: MACRO TRENDS ===
  const { data: macroTrends = {} } = useQuery({
    queryKey: ['macro-trends', dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD'), macroCategory],
    queryFn: async () => {
      const startDate = dateRange[0]?.format('YYYY-MM-DD');
      const endDate = dateRange[1]?.format('YYYY-MM-DD');
      const res = await axiosClient.get(\/dashboard/macro-trends?startDate=\&endDate=\&category=\\);
      return res.data.data;
    },
    enabled: !!dateRange[0] && !!dateRange[1]
  });

  const dailyData = useMemo(() => dashboardData?.dailyData || [], [dashboardData]);
  const hourlyData = useMemo(() => dashboardData?.hourlyData || [], [dashboardData]);
  const liveData = useMemo(() => {
    if (dashboardData?.liveData) return dashboardData.liveData;
    return { car: { capacity: 200, occupied: 0 }, moto: { capacity: 500, occupied: 0 }, checkIns: 0, checkOuts: 0 };
  }, [dashboardData]);

  // Stats from occupancy data
  const occupancyStats = useMemo(() => {
    if (!occupancyData.length) return { maxOccupied: 0, totalIn: 0, totalOut: 0, peakHour: '--' };
    const maxOccupied = Math.max(...occupancyData.map((d: any) => d.occupied));
    const peakHourObj = occupancyData.find((d: any) => d.occupied === maxOccupied);
    const totalInDay = occupancyData.reduce((sum: number, d: any) => sum + d.checkIn, 0);
    const totalOutDay = occupancyData.reduce((sum: number, d: any) => sum + d.checkOut, 0);
    return { maxOccupied, totalIn: totalInDay, totalOut: totalOutDay, peakHour: peakHourObj?.hour || '--' };
  }, [occupancyData]);

  // Traffic Peak Hour calculation
  const trafficPeakStats = useMemo(() => {
    if (!hourlyTrafficData.length) return { peakHour: '--', maxVolume: 0 };
    let peakHour = '--';
    let maxVolume = 0;
    hourlyTrafficData.forEach((d: any) => {
      const vol = d.fourWheelIn + d.fourWheelOut + d.twoWheelIn + d.twoWheelOut;
      if (vol > maxVolume) {
        maxVolume = vol;
        peakHour = d.hour;
      }
    });
    return { peakHour, maxVolume };
  }, [hourlyTrafficData]);

  const handleExportCSV = () => {
    const dateStr = selectedOccupancyDate?.format('YYYY-MM-DD') || '';
    let csvContent = \Hours;Number of cars in the lot;Vehicles entering;Vehicles leaving\n\;
    occupancyData.forEach((row: any) => {
      csvContent += \\;\;\;\\n\;
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", \occupancy-\.csv\);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderGauge = (occupied: number, capacity: number, title: string) => {
    const percent = capacity > 0 ? Math.min(Math.round((occupied / capacity) * 100), 100) : 0;
    const color = percent > 90 ? '#f5222d' : percent > 70 ? '#faad14' : '#52c41a';
    const data = [{ value: percent }, { value: 100 - percent }];
    return (
      <div className="flex flex-col items-center">
        <Text strong className="mb-2">{title}</Text>
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} innerRadius={40} outerRadius={55} startAngle={180} endAngle={0} dataKey="value" stroke="none">
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

  const columns = [
    { title: 'Hour', dataIndex: 'hour', key: 'hour' },
    { title: 'In parking lot', dataIndex: 'occupied', key: 'occupied', render: (v: number) => <strong>{v}</strong> },
    { title: 'Check In', dataIndex: 'checkIn', key: 'checkIn', render: (v: number) => <span className="text-blue-500">+{v}</span> },
    { title: 'Check Out', dataIndex: 'checkOut', key: 'checkOut', render: (v: number) => <span className="text-orange-500">-{v}</span> },
  ];

  const trafficColumns = [
    { title: 'Hour', dataIndex: 'hour', key: 'hour' },
    { title: 'Car In', dataIndex: 'fourWheelIn', key: 'fourWheelIn', render: (v: number) => <span className="text-blue-500">+{v}</span> },
    { title: 'Car Out', dataIndex: 'fourWheelOut', key: 'fourWheelOut', render: (v: number) => <span className="text-orange-500">-{v}</span> },
    { title: 'Moto In', dataIndex: 'twoWheelIn', key: 'twoWheelIn', render: (v: number) => <span className="text-blue-500">+{v}</span> },
    { title: 'Moto Out', dataIndex: 'twoWheelOut', key: 'twoWheelOut', render: (v: number) => <span className="text-orange-500">-{v}</span> },
    { 
      title: 'Total Vol', 
      key: 'totalVolume', 
      render: (_: any, r: any) => <strong>{r.fourWheelIn + r.fourWheelOut + r.twoWheelIn + r.twoWheelOut}</strong>
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      {/* Header */}
      <Card className="mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <Title level={3} className="m-0 flex items-center">
            <NodeIndexOutlined className="mr-3 text-blue-600" />  Operation Report
          </Title>
        </div>
      </Card>

      {/* Live KPI */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm h-full flex justify-center items-center">
            <div className="flex justify-around w-full">
              {renderGauge(liveData.car.occupied, liveData.car.capacity, "Car")}
              {renderGauge(liveData.moto.occupied, liveData.moto.capacity, "Moto")}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm h-full">
            <Statistic title="Check-in Today (Live)" value={liveData.checkIns} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm h-full">
            <Statistic title="Check-out Today (Live)" value={liveData.checkOuts} valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm h-full bg-blue-50 border-blue-200">
            <Statistic 
              title="Today's Peak Hour" 
              value={trafficPeakStats.peakHour} 
              suffix={\(\ vehicles)\}
              valueStyle={{ color: '#eb2f96', fontWeight: 'bold' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* === HOURLY TRAFFIC FLOW AND PEAK HOURS (MOVED UP) === */}
      <Card
        className="shadow-sm mb-6 border-blue-200"
        title={
          <span className="flex items-center gap-2">
            <NodeIndexOutlined className="text-blue-600 text-lg" />
            <span className="font-bold text-lg text-blue-800">Hourly Traffic Flow & Peak Hours</span>
          </span>
        }
        extra={
          <div className="flex items-center gap-3">
            <DatePicker
              value={selectedTrafficDate}
              onChange={setSelectedTrafficDate}
              format="DD/MM/YYYY"
              allowClear={false}
              size="middle"
            />
          </div>
        }
      >
        <Row gutter={24}>
          <Col span={15}>
            <div style={{ height: 400, minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrafficData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const labels: Record<string, string> = {
                        fourWheelIn: 'Car Enter',
                        fourWheelOut: 'Car Exit',
                        twoWheelIn: 'Moto Enter',
                        twoWheelOut: 'Moto Exit'
                      };
                      return [\\ times\, (labels as any)[name] || name];
                    }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend
                    formatter={(value: string) => ({ fourWheelIn: 'Car In', fourWheelOut: 'Car Out', twoWheelIn: 'Moto In', twoWheelOut: 'Moto Out' } as any)[value as any] || value}
                  />
                  <Line type="monotone" dataKey="fourWheelIn" name="fourWheelIn" stroke="#1890ff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="fourWheelOut" name="fourWheelOut" stroke="#1890ff" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="twoWheelIn" name="twoWheelIn" stroke="#f5222d" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="twoWheelOut" name="twoWheelOut" stroke="#f5222d" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
          <Col span={9}>
            <Title level={5} className="mb-4 text-gray-700">Detailed Hourly Data</Title>
            <Table
              dataSource={hourlyTrafficData.map((d: any, i: number) => ({ ...d, key: i }))}
              columns={trafficColumns}
              pagination={{ pageSize: 7, size: 'small' }}
              size="small"
              className="mt-2 border border-gray-200 rounded-lg"
            />
          </Col>
        </Row>
      </Card>

      {/* === WATERFALL/OCCUPANCY CHART === */}
      <Card
        className="shadow-sm mb-6"
        title={
          <span className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <span>Chart of Saving Number of Vehicles in the Park by Hour</span>
          </span>
        }
        extra={
          <div className="flex items-center gap-3">
            <DatePicker
              value={selectedOccupancyDate}
              onChange={setSelectedOccupancyDate}
              format="DD/MM/YYYY"
              allowClear={false}
              size="middle"
            />
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV} size="middle">
              Export CSV
            </Button>
          </div>
        }
      >
        {/* KPI mini row */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Statistic 
              title="The top takes over" 
              value={occupancyStats.maxOccupied} 
              suffix="xe"
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Rush hour (Occupancy)" 
              value={occupancyStats.peakHour} 
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total visits" 
              value={occupancyStats.totalIn} 
              suffix="turn"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total turn out" 
              value={occupancyStats.totalOut} 
              suffix="turn"
              valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} 
            />
          </Col>
        </Row>

        {/* Area Chart */}
        <div style={{ height: 360, minHeight: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={occupancyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradOccupied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1890ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1890ff" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#52c41a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fa8c16" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fa8c16" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const labels: Record<string, string> = {
                    occupied: 'In parking lot',
                    checkIn: 'Hit enter',
                    checkOut: 'Hit out'
                  };
                  return [\\ xe\, (labels as any)[name] || name];
                }}
                contentStyle={{ borderRadius: 8, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Legend
                formatter={(value: string) => ({ occupied: 'Occupied', checkIn: 'Entries', checkOut: 'Exits' } as any)[value as any] || value}
              />
              <Area type="monotone" dataKey="occupied" name="occupied" stroke="#1890ff" strokeWidth={2.5} fill="url(#gradOccupied)" activeDot={{ r: 6, fill: '#1890ff' }} />
              <Area type="monotone" dataKey="checkIn" name="checkIn" stroke="#52c41a" strokeWidth={2} fill="url(#gradIn)" activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="checkOut" name="checkOut" stroke="#fa8c16" strokeWidth={2} fill="url(#gradOut)" activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* === Zone 5: MACRO ANALYSIS === */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card 
            title="Daily Net Flow Trend" 
            className="shadow-sm h-full"
            extra={
              <div className="flex items-center gap-3">
                <Select
                  value={macroCategory}
                  onChange={setMacroCategory}
                  style={{ width: 120 }}
                  options={[
                    { value: 'ALL', label: 'All Vehicle Types' },
                    { value: 'FOUR_WHEEL', label: 'Car' },
                    { value: 'TWO_WHEEL', label: 'Motorbike' },
                  ]}
                />
                <RangePicker 
                  value={dateRange} 
                  onChange={(dates) => dates && setDateRange(dates)} 
                  format="DD/MM/YYYY" 
                  allowClear={false}
                  style={{ width: 240 }}
                />
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={macroTrends.dailyNetFlow || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend formatter={(value) => ({ totalIn: 'Total In', totalOut: 'Total Out' } as any)[value as any] || value} />
                <Line type="monotone" dataKey="totalIn" stroke="#1890ff" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="totalOut" stroke="#f5222d" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Vehicle structure" className="shadow-sm h-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={macroTrends.vehicleTypeRatio || []} innerRadius={60} outerRadius={80} dataKey="value" stroke="none" label>
                  {
                    (macroTrends.vehicleTypeRatio || []).map((entry: any, index: number) => (
                      <Cell key={\cell-\\} fill={entry.name === 'FOUR_WHEEL' ? '#1890ff' : '#f5222d'} />
                    ))
                  }
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Customer structure" className="shadow-sm h-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={macroTrends.customerSegmentRatio || []} innerRadius={60} outerRadius={80} dataKey="value" stroke="none" label>
                  {
                    (macroTrends.customerSegmentRatio || []).map((entry: any, index: number) => {
                      let color = '#faad14'; // WALK_IN
                      if (entry.name === 'BOOKING') color = '#52c41a';
                      else if (entry.name === 'MONTHLY') color = '#722ed1';
                      return <Cell key={\cell-\\} fill={color} />;
                    })
                  }
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, name === 'WALK_IN' ? 'Walk-in' : name === 'BOOKING' ? 'Pre-booked' : 'Monthly Pass']} />
                <Legend formatter={(value: string) => value === 'WALK_IN' ? 'Walk-in' : value === 'BOOKING' ? 'Pre-booked' : 'Monthly Pass'} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* GATE STATUS REPORT */}
      <Card 
        className="mt-6 shadow-sm border-slate-200 rounded-xl"
        title={
          <div className="flex items-center text-slate-800">
            <span className="mr-2 text-xl">??</span> 
            <span className="font-bold tracking-wide">GATE STATUS MANAGEMENT</span>
          </div>
        }
      >
        <Table 
          dataSource={gatesData || []} 
          rowKey="id"
          pagination={false}
          bordered
          size="middle"
        >
          <Table.Column title="ID" dataIndex="id" width={60} />
          <Table.Column title="Gate name" dataIndex="name" render={(val) => <strong>{val}</strong>} />
          <Table.Column title="Vehicle Type" dataIndex="vehicleTypeId" render={(val) => val === 1 ? 'Car' : val === 2 ? 'Motorbike' : val === 3 ? 'Bicycle' : 'All'} />
          <Table.Column title="Current function" dataIndex="type" render={(val, r: any) => {
            if (r.status !== 'OCCUPIED') return <span className="text-gray-400 italic">Not selected yet</span>;
            return val === 'ENTRY' || val === 'IN' ? <Tag color="blue">GATEWAY</Tag> : <Tag color="green">GATE Out</Tag>;
          }} />
          <Table.Column title="Status" dataIndex="status" render={(val) => {
            if (val === 'OCCUPIED') return <Tag color="green">OPEN</Tag>;
            if (val === 'IDLE') return <Tag color="default">CLOSE</Tag>;
            return <Tag color="red">Maintenance</Tag>;
          }} />
          <Table.Column title="Staff on duty" dataIndex="staffName" render={(val) => val ? <span className="font-medium text-blue-700">{val}</span> : <span className="text-gray-400 italic">Do not have</span>} />
        </Table>
      </Card>

      {/* HISTORY TABLE */}
      <Card 
        className="mt-6 shadow-sm border-slate-200 rounded-xl"
        title={
          <div className="flex items-center text-slate-800">
            <span className="mr-2 text-xl">??</span> 
            <span className="font-bold tracking-wide">VEHICLE ENTRANCE / EXIT HISTORY</span>
          </div>
        }
      >
        <Table 
          dataSource={historyData?.content || []} 
          rowKey="id"
          loading={isLoadingHistory}
          pagination={{ 
            current: historyPage, 
            pageSize: historySize, 
            total: historyData?.totalElements || 0,
            onChange: (page, size) => {
              setHistoryPage(page);
              setHistorySize(size);
            }
          }}
          bordered
          size="middle"
        >
          <Table.Column title="ID" dataIndex="id" width={60} />
          <Table.Column title="License Plate" dataIndex="plate" render={(val) => <strong className="text-blue-700">{val}</strong>} />
          <Table.Column title="Vehicle Type" dataIndex="vehicleType" />
          <Table.Column title="Entry Time" dataIndex="timeIn" render={(val) => val ? simulatedDayjs(val).format('HH:mm:ss DD/MM/YYYY') : '-'} />
          <Table.Column title="Entry Gate" dataIndex="gateInName" render={(val) => val || '-'} />
          <Table.Column title="Exit Time" dataIndex="timeOut" render={(val) => val ? simulatedDayjs(val).format('HH:mm:ss DD/MM/YYYY') : '-'} />
          <Table.Column title="Exit Gate" dataIndex="gateOutName" render={(val) => val || '-'} />
          <Table.Column title="Fees" dataIndex="totalFee" render={(val) => val != null ? <span className="font-bold text-green-600">{val.toLocaleString()}  VND</span> : '-'} />
          <Table.Column title="Status" dataIndex="status" render={(val: string) => {
            if (val === 'ACTIVE') return <Tag color="blue">Parked</Tag>;
            if (val === 'COMPLETED') return <Tag color="green">Completed</Tag>;
            if (val === 'LOCKED') return <Tag color="red">Locked</Tag>;
            return <Tag>{val}</Tag>;
          }} />
        </Table>
      </Card>
    </div>
  );
};
``
with open('pbms-fe/src/features/manager/OperationalDashboardScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
