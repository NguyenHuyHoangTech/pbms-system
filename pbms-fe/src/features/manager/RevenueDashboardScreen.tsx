import React, { useState } from 'react';
import { Typography, Card, Row, Col, DatePicker, Button, Table, Radio, Statistic } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Master Dataset Mock
const MASTER_DATA = [
  { date: '2023-10-01', revenue: 12000000, transactions: 400, byVehicle: { CAR: 8000000, MOTORBIKE: 4000000 }, bySource: { WALK_IN: 9000000, BOOKING: 3000000 }, byPayment: { CASH: 5000000, VNPAY: 7000000 } },
  { date: '2023-10-02', revenue: 13500000, transactions: 450, byVehicle: { CAR: 9500000, MOTORBIKE: 4000000 }, bySource: { WALK_IN: 10000000, BOOKING: 3500000 }, byPayment: { CASH: 4500000, VNPAY: 9000000 } },
  { date: '2023-10-03', revenue: 11000000, transactions: 380, byVehicle: { CAR: 7000000, MOTORBIKE: 4000000 }, bySource: { WALK_IN: 8000000, BOOKING: 3000000 }, byPayment: { CASH: 4000000, VNPAY: 7000000 } },
  { date: '2023-10-04', revenue: 15000000, transactions: 500, byVehicle: { CAR: 10000000, MOTORBIKE: 5000000 }, bySource: { WALK_IN: 11000000, BOOKING: 4000000 }, byPayment: { CASH: 6000000, VNPAY: 9000000 } },
  { date: '2023-10-05', revenue: 14500000, transactions: 480, byVehicle: { CAR: 9500000, MOTORBIKE: 5000000 }, bySource: { WALK_IN: 10500000, BOOKING: 4000000 }, byPayment: { CASH: 5500000, VNPAY: 9000000 } },
  { date: '2023-10-06', revenue: 16000000, transactions: 520, byVehicle: { CAR: 11000000, MOTORBIKE: 5000000 }, bySource: { WALK_IN: 12000000, BOOKING: 4000000 }, byPayment: { CASH: 6000000, VNPAY: 10000000 } },
  { date: '2023-10-07', revenue: 18000000, transactions: 600, byVehicle: { CAR: 12000000, MOTORBIKE: 6000000 }, bySource: { WALK_IN: 13000000, BOOKING: 5000000 }, byPayment: { CASH: 8000000, VNPAY: 10000000 } },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const RevenueDashboardScreen = () => {
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'day'), dayjs()]);
  const [compareMode, setCompareMode] = useState('vehicle');

  const handleApply = () => {
    // In a real app, fetch data based on dateRange
  };

  const handleExportCSV = () => {
    let csvContent = "Date;Total Revenue;Transactions;ARPU\n";
    MASTER_DATA.forEach(row => {
      const arpu = Math.round(row.revenue / row.transactions);
      csvContent += `${row.date};${row.revenue};${row.transactions};${arpu}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "revenue_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregations
  const totalRevenue = MASTER_DATA.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalTransactions = MASTER_DATA.reduce((acc, curr) => acc + curr.transactions, 0);
  const arpu = Math.round(totalRevenue / totalTransactions);

  const vehiclePieData = [
    { name: 'Ô tô', value: MASTER_DATA.reduce((acc, curr) => acc + curr.byVehicle.CAR, 0) },
    { name: 'Xe máy', value: MASTER_DATA.reduce((acc, curr) => acc + curr.byVehicle.MOTORBIKE, 0) }
  ];

  const sourcePieData = [
    { name: 'Vãng lai', value: MASTER_DATA.reduce((acc, curr) => acc + curr.bySource.WALK_IN, 0) },
    { name: 'Đặt trước', value: MASTER_DATA.reduce((acc, curr) => acc + curr.bySource.BOOKING, 0) }
  ];

  const paymentPieData = [
    { name: 'Tiền mặt', value: MASTER_DATA.reduce((acc, curr) => acc + curr.byPayment.CASH, 0) },
    { name: 'VNPAY', value: MASTER_DATA.reduce((acc, curr) => acc + curr.byPayment.VNPAY, 0) }
  ];

  // Dynamic Comparison Line Chart Data
  const getLineChartLines = () => {
    if (compareMode === 'vehicle') {
      return (
        <>
          <Line type="monotone" dataKey="byVehicle.CAR" name="Ô tô" stroke="#0088FE" strokeWidth={2} />
          <Line type="monotone" dataKey="byVehicle.MOTORBIKE" name="Xe máy" stroke="#00C49F" strokeWidth={2} />
        </>
      );
    }
    if (compareMode === 'source') {
      return (
        <>
          <Line type="monotone" dataKey="bySource.WALK_IN" name="Vãng lai" stroke="#FFBB28" strokeWidth={2} />
          <Line type="monotone" dataKey="bySource.BOOKING" name="Đặt trước" stroke="#FF8042" strokeWidth={2} />
        </>
      );
    }
    return (
      <>
        <Line type="monotone" dataKey="byPayment.CASH" name="Tiền mặt" stroke="#FF8042" strokeWidth={2} />
        <Line type="monotone" dataKey="byPayment.VNPAY" name="VNPAY" stroke="#0088FE" strokeWidth={2} />
      </>
    );
  };

  const columns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    { title: 'Doanh Thu (VNĐ)', dataIndex: 'revenue', key: 'revenue', render: (val: number) => val.toLocaleString() },
    { title: 'Lượt GD', dataIndex: 'transactions', key: 'transactions' },
    { title: 'ARPU (VNĐ)', key: 'arpu', render: (_: any, record: any) => Math.round(record.revenue / record.transactions).toLocaleString() },
  ];

  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 1000000) return (tickItem / 1000000).toFixed(1) + 'M';
    return tickItem.toString();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      {/* Global Control Panel */}
      <Card className="mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <Title level={3} className="m-0">Báo cáo Doanh thu</Title>
          <div className="flex space-x-4 items-center">
            <RangePicker value={dateRange} onChange={setDateRange} format="DD/MM/YYYY" />
            <Button type="primary" icon={<FilterOutlined />} onClick={handleApply}>Áp dụng</Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards (Row 1) */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm">
            <Statistic title="Tổng Doanh Thu" value={totalRevenue} suffix="VNĐ" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm">
            <Statistic title="Tổng Giao Dịch" value={totalTransactions} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm">
            <Statistic title="Doanh thu TB / Giao dịch (ARPU)" value={arpu} suffix="VNĐ" valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} />
          </Card>
        </Col>
      </Row>

      {/* Hero & Sidebar 70/30 (Row 2) */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="Xu hướng Doanh Thu" className="shadow-sm h-full">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MASTER_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh Thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm h-full flex flex-col justify-between">
            <div className="mb-4">
              <Text strong className="block text-center mb-2">Cơ cấu Phương Tiện</Text>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={vehiclePieData} innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                    {vehiclePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mb-4">
              <Text strong className="block text-center mb-2">Nguồn Khách Hàng</Text>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={sourcePieData} innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                    {sourcePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <Text strong className="block text-center mb-2">Phương Thức Thanh Toán</Text>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={paymentPieData} innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                    {paymentPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Toggle Comparison Chart (Row 3) */}
      <Card title="So sánh Chi Tiết" className="mb-6 shadow-sm" extra={
        <Radio.Group value={compareMode} onChange={e => setCompareMode(e.target.value)} buttonStyle="solid">
          <Radio.Button value="vehicle">Loại Xe</Radio.Button>
          <Radio.Button value="source">Nguồn</Radio.Button>
          <Radio.Button value="payment">Thanh Toán</Radio.Button>
        </Radio.Group>
      }>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MASTER_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'} />
              <Legend />
              {getLineChartLines()}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* DataTable & Export */}
      <Card title="Dữ Liệu Chi Tiết" className="shadow-sm" extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
      }>
        <Table 
          columns={columns} 
          dataSource={MASTER_DATA.map((d, i) => ({ ...d, key: i }))} 
          pagination={{ pageSize: 5 }} 
        />
      </Card>
    </div>
  );
};
