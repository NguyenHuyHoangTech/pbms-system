const fs = require('fs');

const path = 'd:/0_Semester_5/pbms-system/pbms-fe/src/features/manager/PricingConfigScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport axiosClient from '../../core/api/axiosClient';"
);

// 2. Remove mockDataByVehicle
content = content.replace(/const mockDataByVehicle: Record<string, VehicleConfig> = \{[\s\S]*?\};\s*export const PricingConfigScreen = \(\) => \{/, 'export const PricingConfigScreen = () => {');

// 3. Update tabs
content = content.replace(
  /const tabs = \[\s*\{\s*key:\s*'car4'[\s\S]*?\];/m,
  "const tabs = [\n    { key: 'CAR', label: '🚗 Ô tô' },\n    { key: 'MOTORBIKE', label: '🛵 Xe máy' }\n  ];"
);

// 4. Update state initializations and queries
const newInit = `
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('CAR');
  
  // Default Empty Config
  const defaultEmptyConfig = (type: string): VehicleConfig => ({
    globalBaseGuardEnabled: false,
    globalBaseGuardTime: 0,
    globalBaseGuardPrice: 0,
    globalMaxCapEnabled: false,
    globalMaxCapPrice: null,
    shifts: [{
      id: \`shift_\${Date.now()}\`,
      name: 'Ca Mặc Định',
      startTime: '00:00',
      endTime: '23:59',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      slices: [{ id: \`slice_\${Date.now()}\`, duration: null, price: 10000, isTail: true }]
    }]
  });

  const [config, setConfig] = useState<VehicleConfig>(defaultEmptyConfig('CAR'));
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | string[]>(['1', '2']);

  // Calculator State
  const [timeIn, setTimeIn] = useState<Dayjs | null>(dayjs('08:00', 'HH:mm'));
  const [timeOut, setTimeOut] = useState<Dayjs | null>(dayjs('10:30', 'HH:mm'));
  const [calcResult, setCalcResult] = useState<{ total: number, breakdown: string[], minutes: number } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['pricing-policies'],
    queryFn: async () => {
      const res = await axiosClient.get('/manager/pricing');
      return res.data.data; // List of PricingPolicyDTO
    }
  });

  useEffect(() => {
    if (policiesData) {
      const policy = policiesData.find((p: any) => p.vehicleType === activeTab);
      if (policy) {
        // Map DTO back to VehicleConfig
        const mappedConfig: VehicleConfig = {
          id: policy.id,
          policyName: policy.policyName,
          vehicleType: policy.vehicleType,
          globalBaseGuardEnabled: policy.globalBaseMins > 0,
          globalBaseGuardTime: policy.globalBaseMins,
          globalBaseGuardPrice: policy.globalBaseFee,
          globalMaxCapEnabled: policy.maxParkingCap < 3000000,
          globalMaxCapPrice: policy.maxParkingCap,
          shifts: policy.shifts.map((s: any, idx: number) => {
            const slices: Slice[] = s.blocks.map((b: any, bIdx: number) => {
               return {
                  id: b.id || \`slice_\${bIdx}_\${Date.now()}\`,
                  duration: b.durationMins,
                  price: b.fee,
                  isTail: bIdx === s.blocks.length - 1
               };
            });
            // If the last block is tail, set duration to null to match UI logic
            if (slices.length > 0) {
               slices[slices.length - 1].isTail = true;
               slices[slices.length - 1].duration = null;
            }
            return {
              id: s.id || \`shift_\${idx}_\${Date.now()}\`,
              name: s.shiftName,
              startTime: s.startTime.substring(0, 5),
              endTime: s.endTime.substring(0, 5),
              color: idx % 2 === 0 ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-indigo-100 border-indigo-300 text-indigo-800',
              slices
            };
          })
        };
        setConfig(mappedConfig);
        setSelectedShiftId(mappedConfig.shifts[0]?.id || null);
      } else {
        const empty = defaultEmptyConfig(activeTab);
        setConfig(empty);
        setSelectedShiftId(empty.shifts[0]?.id || null);
      }
      setSelectedSliceId(null);
      setCalcResult(null);
    }
  }, [activeTab, policiesData]);
`;

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('car4'\);[\s\S]*?const \[isConfirmModalOpen, setIsConfirmModalOpen\] = useState\(false\);/,
  newInit
);

// 5. Update handleSave
const newSave = `
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await axiosClient.post('/manager/pricing', payload);
    },
    onSuccess: () => {
      message.success('Đã lưu cấu hình bảng giá thành công!');
      setIsConfirmModalOpen(false);
      setConfirmInput('');
      queryClient.invalidateQueries({ queryKey: ['pricing-policies'] });
    },
    onError: (error: any) => {
      message.error('Lỗi khi lưu bảng giá: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleSave = () => {
    if (confirmInput === 'XACNHAN') {
      // Map VehicleConfig to DTO
      const payload = {
        id: (config as any).id,
        policyName: \`Bảng giá \${activeTab}\`,
        vehicleType: activeTab,
        globalBaseMins: config.globalBaseGuardEnabled ? config.globalBaseGuardTime : 0,
        globalBaseFee: config.globalBaseGuardEnabled ? config.globalBaseGuardPrice : 0,
        maxParkingCap: config.globalMaxCapEnabled && config.globalMaxCapPrice ? config.globalMaxCapPrice : 3000000,
        status: 'ACTIVE',
        shifts: config.shifts.map(s => {
          
          let totalDurationMins = getShiftDuration(s);
          
          const blocks = s.slices.map((sl, idx) => {
             const isTail = sl.isTail;
             return {
                id: typeof sl.id === 'number' ? sl.id : null,
                blockOrder: idx + 1,
                durationMins: isTail ? getTailDuration(s) : sl.duration,
                fee: sl.price
             };
          });

          return {
             id: typeof s.id === 'number' ? s.id : null,
             shiftName: s.name,
             startTime: s.startTime,
             endTime: s.endTime,
             totalDurationMins: totalDurationMins,
             blocks: blocks
          };
        })
      };

      saveMutation.mutate(payload);
    } else {
      message.error('Mã xác nhận không hợp lệ!');
    }
  };
`;

content = content.replace(
  /const handleSave = \(\) => \{[\s\S]*?\};\s*const updateConfig =/m,
  newSave + '\n\n  const updateConfig ='
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated PricingConfigScreen.tsx');
