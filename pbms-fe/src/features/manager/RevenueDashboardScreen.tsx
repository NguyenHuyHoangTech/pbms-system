import React, { useState } from 'react';
import { Typography, Card, Row, Col, DatePicker, Button, Table, Radio, Statistic } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const RevenueDashboardScreen = () => {
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'day'), dayjs()]);
  const [compareMode, setCompareMode] = useState('vehicle');

  const { data: dashboardData } = useQuery({
    queryKey: ['revenueDashboard', dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const res = await axiosClient.get(`/dashboard/revenue?startDate=${dateRange[0].format('YYYY-MM-DD')} 00:00:00&endDate=${dateRange[1].format('YYYY-MM-DD')} 23:59:59`);
      return res.data.data;
    },
    enabled: !!dateRange[0] && !!dateRange[1]
  });

  const masterData = dashboardData?.dailyRevenue || [];
  const overview = dashboardData?.overview || { totalRevenue: 0, totalTransactions: 0 };

  const handleApply = () => {
    // Handled by useQuery dependency
  };

  const handleExportCSV = () => {
    let csvContent = "Date;Total Revenue\n";
    masterData.forEach((row: any) => {
      csvContent += `${row.date};${row.revenue}\n`;
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
  const totalRevenue = overview.totalRevenue || 0;
  const totalTransactions = overview.totalTransactions || 0;
  const arpu = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  const vehiclePieData = dashboardData?.byVehicle || [];
  const sourcePieData = dashboardData?.bySource || [];
  const paymentPieData = dashboardData?.byPayment || [];



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
                <BarChart data={masterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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



      {/* DataTable & Export */}
      <Card title="Dữ Liệu Chi Tiết" className="shadow-sm" extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
      }>
        <Table 
          columns={columns} 
          dataSource={masterData.map((d: any, i: number) => ({ ...d, key: i }))} 
          pagination={{ pageSize: 5 }} 
        />
      </Card>
    </div>
  );
};
