const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-iot-simulator/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add monthlyTickets extraction
content = content.replace(/const reservations = syncData\?\.reservations \|\| \[\];/, `const reservations = syncData?.reservations || [];\n  const monthlyTickets = syncData?.monthlyTickets || [];`);

// 2. Add states for Special Entry
const stateCode = `
  const [specialEntryType, setSpecialEntryType] = useState<'MONTHLY' | 'RESERVATION'>('MONTHLY');
  const [specialFilterVehicleType, setSpecialFilterVehicleType] = useState<number | null>(null);
  const [specialSelectedItemId, setSpecialSelectedItemId] = useState<number | null>(null);
  const [specialSelectedGate, setSpecialSelectedGate] = useState<number | null>(null);
  const [specialSelectedRfid, setSpecialSelectedRfid] = useState<string | null>(null);
`;
content = content.replace(/const \[coFilterVehicleType/, stateCode + '\n  const [coFilterVehicleType');

// 3. Add renderSpecialEntryTab
const renderSpecialEntryTabCode = `
  const renderSpecialEntryTab = () => {
    const list = specialEntryType === 'MONTHLY' ? monthlyTickets : reservations;
    const filteredList = specialFilterVehicleType 
      ? list.filter((item: any) => item.vehicleType?.id === specialFilterVehicleType)
      : list;

    const selectedItem = list.find((item: any) => item.id === specialSelectedItemId);
    const itemVehicleTypeId = selectedItem?.vehicleType?.id;
    const itemPlate = specialEntryType === 'MONTHLY' ? selectedItem?.plateNumber : selectedItem?.vehicle?.plateNumber; 

    // Lọc cổng
    let validGates = gates.filter((g: any) => g.gateType === 'IN');
    if (itemVehicleTypeId) {
       validGates = validGates.filter((g: any) => !g.vehicleTypeId || g.vehicleTypeId === itemVehicleTypeId);
       if (specialEntryType === 'MONTHLY') {
         // Cổng phải thuộc tầng có zone vé tháng cho loại xe này
         validGates = validGates.filter((g: any) => {
            if (!g.floorId) return true; // Cổng chung
            const hasMonthlyZone = zones.some((z: any) => z.floorId === g.floorId && z.functionType === 'MONTHLY' && z.vehicleTypeId === itemVehicleTypeId);
            return hasMonthlyZone;
         });
       }
    }

    const handleSend = () => {
       if (!specialSelectedGate || !specialSelectedRfid || !selectedItem) {
           message.error('Vui lòng chọn Xe, Cổng và Thẻ RFID');
           return;
       }
       const img = generateSimulatedImages(itemPlate, itemVehicleTypeId ? vehicleTypes.find((v:any)=>v.id===itemVehicleTypeId)?.typeName : '');
       
       triggerApiMutation.mutate({
           gateId: specialSelectedGate,
           actionType: 'IN',
           plate: itemPlate,
           rfid: specialSelectedRfid,
           confidence: 99,
           panoramaImageBase64: img.panorama,
           lprImageBase64: img.lpr
       });
    };

    return (
      <Card className="bg-white border-gray-200 rounded-xl" title={<span className="text-purple-700 font-mono">Mô Phỏng Xe Đặt Trước / Vé Tháng Vào Bãi</span>}>
        <div className="mb-4 bg-slate-50 p-4 rounded-lg flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Text className="text-gray-500 font-bold block mb-1">Loại Hình</Text>
            <Select
              className="w-full"
              value={specialEntryType}
              onChange={(v) => { setSpecialEntryType(v); setSpecialSelectedItemId(null); }}
              options={[
                { label: 'Vé Tháng (Monthly Pass)', value: 'MONTHLY' },
                { label: 'Đặt Trước (Reservation)', value: 'RESERVATION' }
              ]}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Text className="text-gray-500 font-bold block mb-1">Lọc theo Loại Xe</Text>
            <Select
              className="w-full"
              allowClear
              placeholder="-- Tất cả --"
              value={specialFilterVehicleType}
              onChange={setSpecialFilterVehicleType}
              options={vehicleTypes.map((v: any) => ({ label: v.typeName, value: v.id }))}
            />
          </div>
        </div>

        <Table
          dataSource={filteredList}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: specialSelectedItemId ? [specialSelectedItemId] : [],
            onChange: (keys) => setSpecialSelectedItemId(keys[0])
          }}
          columns={[
            { title: 'Biển số', dataIndex: specialEntryType === 'MONTHLY' ? 'plateNumber' : ['vehicle', 'plateNumber'], key: 'plate' },
            { title: 'Loại xe', dataIndex: ['vehicleType', 'typeName'], key: 'vtype' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (text: string) => <Tag color="blue">{text}</Tag> }
          ]}
        />

        {selectedItem && (
          <div className="mt-6 p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <Title level={5} className="text-purple-800 mb-4">Cấu Hình Vào Cổng Cho Biển Số {itemPlate}</Title>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Text className="block mb-1 font-bold">Cổng Vào (Đã lọc theo Tầng/Zone)</Text>
                <Select
                  className="w-full"
                  placeholder="-- Chọn Cổng --"
                  value={specialSelectedGate}
                  onChange={setSpecialSelectedGate}
                  options={validGates.map((g: any) => ({
                    label: g.gateName + (g.floorType ? ' (Tầng ' + g.floorType + ')' : ''),
                    value: g.id
                  }))}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Text className="block mb-1 font-bold">Gán Thẻ RFID (Sẵn sàng)</Text>
                <Select
                  className="w-full"
                  showSearch
                  placeholder="-- Chọn Thẻ AVAILABLE --"
                  value={specialSelectedRfid}
                  onChange={setSpecialSelectedRfid}
                  options={availableCards.map((c: string) => ({ label: c, value: c }))}
                />
              </div>
              <div className="flex items-end">
                <Button type="primary" size="large" className="bg-purple-600" onClick={handleSend} loading={triggerApiMutation.isPending}>
                  Bắn Tín Hiệu Vào Bãi
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };
`;

content = content.replace(/const renderCheckOutTab/, renderSpecialEntryTabCode + '\n  const renderCheckOutTab');

// 4. Add Tab item
const tabItemCode = `
                {
                  key: '6',
                  label: <span className="font-bold text-sm px-2 text-purple-700"><CarOutlined /> Đặt Trước / Vé Tháng</span>,
                  children: <div className="pt-4">{renderSpecialEntryTab()}</div>
                },`;
content = content.replace('items={[', 'items={[' + tabItemCode);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched App.tsx!');
