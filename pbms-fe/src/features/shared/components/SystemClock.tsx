import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useSystemTime } from '../../../core/utils/timeProvider';

const { Text } = Typography;

export const SystemClock: React.FC = () => {
  const time = useSystemTime();

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
      <ClockCircleOutlined className="text-blue-600" />
      <Text strong className="text-slate-700 font-mono tracking-wide">
        {time.format('HH:mm:ss')}
      </Text>
      <Text className="text-slate-500 text-xs hidden sm:inline-block ml-1">
        {time.format('DD/MM/YYYY')}
      </Text>
    </div>
  );
};
