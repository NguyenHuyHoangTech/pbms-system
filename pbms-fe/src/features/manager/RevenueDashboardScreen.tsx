import React, { useState, useMemo } from 'react';
import { Card, DatePicker, Button, Typography, Table, Space, Row, Col, Statistic, Radio } from 'antd';
import { SearchOutlined, DownloadOutlined, DollarOutlined, TransactionOutlined, AreaChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import axiosClient from '../../core/api/axiosClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Types
interface RevenueRecord {
  date: string;
  vehicleType: string;
  gateName: string;
  revenueSource: string;
  paymentMethod: string;
  totalRevenue: number;
  totalTransactions: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const RevenueDashboardScreen: React.FC = () => {
  // State for Global Control Panel
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'days'), dayjs()]);
  const [appliedDateRange, setAppliedDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  
  // State for Toggle Comparison Chart
  const [comparisonMode, setComparisonMode] = useState<'vehicleType' | 'revenueSource' | 'paymentMethod' | 'gateName'>('vehicleType');

  // Fetch Master Dataset
  const { data: masterData = [], isLoading } = useQuery({
    queryKey: ['revenue-dashboard', appliedDateRange],
    queryFn: async () => {
      const res = await axiosClient.get(`/revenue/dashboard?startDate=${appliedDateRange[0]}&endDate=${appliedDateRange[1]}`);
      return res.data.data as RevenueRecord[];
    }
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    return masterData.reduce((acc, curr) => {
      acc.totalRevenue += curr.totalRevenue;
      acc.totalTransactions += curr.totalTransactions;
      return acc;
    }, { totalRevenue: 0, totalTransactions: 0 });
  }, [masterData]);

  const arpu = kpis.totalTransactions > 0 ? kpis.totalRevenue / kpis.totalTransactions : 0;

  // Process data for Hero Chart (Group by Date)
  const heroChartData = useMemo(() => {
    const map = new Map<string, number>();
    masterData.forEach(r => {
      map.set(r.date, (map.get(r.date) || 0) + r.totalRevenue);
    });
    return Array.from(map.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
  }, [masterData]);

  // Helper for Pie Charts
  const processPieData = (key: keyof RevenueRecord) => {
    const map = new Map<string, number>();
    masterData.forEach(r => {
      const val = String(r[key]);
      map.set(val, (map.get(val) || 0) + Number(r.totalRevenue));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  };

  const paymentData = useMemo(() => processPieData('paymentMethod'), [masterData]);
  const sourceData = useMemo(() => processPieData('revenueSource'), [masterData]);
  const vehicleData = useMemo(() => processPieData('vehicleType'), [masterData]);
  const gateData = useMemo(() => processPieData('gateName'), [masterData]);

  // Process data for Toggle Comparison Chart
  const comparisonChartData = useMemo(() => {
    const dates = Array.from(new Set(masterData.map(d => d.date))).sort();
    // Collect ALL unique category values across ALL dates first
    const allCategories = Array.from(new Set(masterData.map(r => String(r[comparisonMode]))));
    
    return dates.map(date => {
      // Pre-fill ALL categories with 0 so every line has a point on every date
      const row: any = { date };
      allCategories.forEach(cat => { row[cat] = 0; });
      
      // Then add actual values
      masterData.filter(d => d.date === date).forEach(r => {
        const category = String(r[comparisonMode]);
        row[category] = (row[category] || 0) + Number(r.totalRevenue);
      });
      return row;
    });
  }, [masterData, comparisonMode]);

  // Extract unique keys for lines in Comparison Chart
  const comparisonKeys = useMemo(() => {
    const keys = new Set<string>();
    masterData.forEach(r => keys.add(String(r[comparisonMode])));
    return Array.from(keys);
  }, [masterData, comparisonMode]);

  // Export CSV
  const handleExportCSV = () => {
    if (!masterData.length) return;
    const headers = ['Day', 'Vehicle Type', 'Gate', 'Revenue source', 'Payment method', 'Total amount', 'Total turn'];
    const rows = masterData.map(r => [
      r.date,
      r.vehicleType,
      r.gateName,
      r.revenueSource,
      r.paymentMethod,
      r.totalRevenue.toString(),
      r.totalTransactions.toString()
    ]);
    
    // CSV string using semicolon separator
    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bao-cao-doanh-thu-${appliedDateRange[0]}-to-${appliedDateRange[1]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for Currency
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} ₫
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50 pb-24">
      {/* Global Control Panel (Sticky) */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
        <div>
          <Title level={4} className="m-0 text-slate-800">Report Revenue</Title>
          <Text type="secondary">Multi-dimensional analysis by day, vehicle type and revenue source</Text>
        </div>
        <Space size="large">
          <RangePicker 
            size="large"
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
            format="DD/MM/YYYY"
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<SearchOutlined />}
            onClick={() => setAppliedDateRange([dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')])}
            loading={isLoading}
            className="bg-blue-600"
          >
            
                                  Apply
                                </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={24} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm rounded-xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>}
              value={kpis.totalRevenue} 
              precision={0} 
              suffix="₫"
              styles={{ content: { color: '#fff', fontWeight: 'bold', fontSize: '2rem' } }}
              prefix={<DollarOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Transactions</span>}
              value={kpis.totalTransactions} 
              styles={{ content: { color: '#fff', fontWeight: 'bold', fontSize: '2rem' } }}
              prefix={<TransactionOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none' }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>aRPU (Revenue TB/Turn)</span>}
              value={arpu} 
              precision={0}
              suffix="₫"
              styles={{ content: { color: '#fff', fontWeight: 'bold', fontSize: '2rem' } }}
              prefix={<AreaChartOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Hero & Sidebar */}
      <Row gutter={24} className="mb-6">
        {/* Left 70%: Hero Chart */}
        <Col span={16}>
          <Card className="shadow-sm border-slate-200 rounded-xl h-full" title="TOTAL REVENUE BY YEAR">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heroChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        {/* Right 30%: Sidebar Pies */}
        <Col span={8}>
          <Card className="shadow-sm border-slate-200 rounded-xl h-full flex flex-col">
            <Title level={5} className="mb-4 text-slate-700 text-center">Revenue STRUCTURE</Title>
            
            <div className="flex-1 flex flex-col justify-around">
              {/* Pie 1: Payment Method */}
              <div className="h-32 mb-4">
                <Text strong className="block text-center text-xs text-slate-500 mb-1">Payment method</Text>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {paymentData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `${val.toLocaleString()} ₫`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie 2: Revenue Source */}
              <div className="h-32 mb-4">
                <Text strong className="block text-center text-xs text-slate-500 mb-1">Revenue source</Text>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {sourceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `${val.toLocaleString()} ₫`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie 3: Vehicle Type */}
              <div className="h-32">
                <Text strong className="block text-center text-xs text-slate-500 mb-1">Vehicle Type</Text>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vehicleData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {vehicleData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+4) % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `${val.toLocaleString()} ₫`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Pie 4: Gate */}
              <div className="h-32">
                <Text strong className="block text-center text-xs text-slate-500 mb-1">Gate</Text>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gateData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {gateData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+1) % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `${val.toLocaleString()} ₫`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        className="shadow-sm border-slate-200 rounded-xl mb-6" 
        title="Detail Fluctuations OVER TIME"
        extra={
          <Radio.Group value={comparisonMode} onChange={e => setComparisonMode(e.target.value)} buttonStyle="solid">
            <Radio.Button value="vehicleType">Compare Vehicle Types</Radio.Button>
            <Radio.Button value="gateName">Compare Gates</Radio.Button>
            <Radio.Button value="revenueSource">Compare Revenue Sources</Radio.Button>
            <Radio.Button value="paymentMethod">Compare Methods</Radio.Button>
          </Radio.Group>
        }
      >
        {comparisonKeys.length <= 1 ? (
          // Only 1 category → show a simple bar chart with note
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                {comparisonKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4,4,0,0]} maxBarSize={60} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {comparisonKeys.length <= 1 && (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>
                
                                              💡 There is only 1 group in this direction. Try switching to "Compare Revenue Sources" to see more directions.
                                            </p>
            )}
          </div>
        ) : (
          // Multiple categories → show multi-line chart
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                {comparisonKeys.map((key, index) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    name={key}
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }} 
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Data Table & Export */}
      <Card 
        className="shadow-sm border-slate-200 rounded-xl"
        title="GENERAL DATA TABLE Detail"
        extra={
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 border-none"
          >
            
                            Export Excel (CSV)
                          </Button>
        }
      >
        <Table 
          dataSource={masterData} 
          rowKey={(r, i) => `${r.date}-${i}`}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          bordered
          size="middle"
        >
          <Table.Column title="Day" dataIndex="date" render={(_, r: any) => <strong>{dayjs(r.date).format('DD/MM/YYYY')}</strong>} />
          <Table.Column title="Vehicle Type" dataIndex="vehicleType" />
          <Table.Column title="Gate" dataIndex="gateName" render={(val) => <span className="text-gray-600 font-medium">{val || 'N/A'}</span>} />
          <Table.Column title="Revenue source" dataIndex="revenueSource" />
          <Table.Column title="Method" dataIndex="paymentMethod" />
          <Table.Column 
            title="Total Revenue" 
            dataIndex="totalRevenue" 
            align="right"
            render={(val) => <span className="font-bold text-blue-600">{val.toLocaleString()} ₫</span>}
          />
          <Table.Column title="Number of transactions" dataIndex="totalTransactions" align="center" />
        </Table>
      </Card>
    </div>
  );
};

export { RevenueDashboardScreen };
