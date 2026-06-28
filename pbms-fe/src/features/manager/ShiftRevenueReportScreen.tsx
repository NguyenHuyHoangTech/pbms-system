import React, { useState } from 'react';
import { Card, DatePicker, Table, Typography, Space, Tag, Input } from 'antd';
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import axiosClient from '../../core/api/axiosClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ShiftRevenueReportScreen: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'days'), dayjs()]);
  const [appliedDateRange, setAppliedDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['shift-revenue-history', appliedDateRange, page, size],
    queryFn: async () => {
      const res = await axiosClient.get(`/work-sessions/history?startDate=${appliedDateRange[0]}&endDate=${appliedDateRange[1]}&page=${page - 1}&size=${size}`);
      return res.data.data;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={2} className="m-0 text-slate-800 flex items-center">
              <SafetyCertificateOutlined className="mr-3 text-blue-600" /> Report Revenue theo Shift
            </Title>
            <Text type="secondary">Manage and control Revenue Detail according to each staff shift</Text>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200 rounded-xl mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <Text strong className="block mb-2 text-slate-700">Shift time</Text>
              <RangePicker
                className="w-full"
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                    setAppliedDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                    setPage(1);
                  }
                }}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 rounded-xl" bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={historyData?.content || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: size,
              total: historyData?.totalElements || 0,
              onChange: (p, s) => {
                setPage(p);
                setSize(s);
              },
              showSizeChanger: true
            }}
            scroll={{ x: 1200 }}
          >
            <Table.Column title="Ma Ca" dataIndex="id" width={80} />
            <Table.Column title="Staff" dataIndex="staffName" width={180} render={(val) => <strong className="text-blue-700">{val}</strong>} />
            <Table.Column title="Gate" dataIndex="gateName" width={150} />
            <Table.Column 
              title="Working time" 
              key="time" 
              width={250}
              render={(_, record: any) => (
                <div>
                  <div><Text type="secondary">Enter:</Text> <Text strong>{record.loginTime ? dayjs(record.loginTime).format('HH:mm DD/MM') : '-'}</Text></div>
                  <div><Text type="secondary">Ra:</Text> <Text strong>{record.logoutTime ? dayjs(record.logoutTime).format('HH:mm DD/MM') : '-'}</Text></div>
                </div>
              )} 
            />
            <Table.Column 
              title="System (VND)" 
              dataIndex="expectedRevenue" 
              width={150}
              align="right"
              render={(val) => val != null ? val.toLocaleString() : '-'} 
            />
            <Table.Column 
              title="Net revenue (VND)" 
              dataIndex="actualRevenue" 
              width={150}
              align="right"
              render={(val) => val != null ? <strong className="text-gray-800">{val.toLocaleString()}</strong> : '-'} 
            />
            <Table.Column 
              title="Difference" 
              dataIndex="revenueVariance" 
              width={150}
              align="right"
              render={(val) => {
                if (val == null) return '-';
                if (val === 0) return <span className="text-gray-400">0</span>;
                return <strong className={val > 0 ? 'text-blue-600' : 'text-red-600'}>{val > 0 ? '+' : ''}{val.toLocaleString()}</strong>;
              }} 
            />
            <Table.Column 
              title="Status" 
              dataIndex="discrepancyStatus" 
              width={120}
              align="center"
              render={(val) => {
                if (val === 'MATCH') return <Tag color="green">Enough money</Tag>;
                if (val === 'SHORT') return <Tag color="red">Lack of money</Tag>;
                if (val === 'OVER') return <Tag color="blue">Excess money</Tag>;
                return <Tag>{val || 'N/A'}</Tag>;
              }} 
            />
            <Table.Column 
              title="Reason" 
              dataIndex="varianceReason" 
              width={250}
              render={(val) => val ? <Text type="secondary" italic>{val}</Text> : '-'} 
            />
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default ShiftRevenueReportScreen;
