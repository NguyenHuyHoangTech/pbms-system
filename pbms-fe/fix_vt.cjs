const fs = require('fs');
let c1 = fs.readFileSync('src/features/manager/VehicleTypeScreen.tsx', 'utf8');

c1 = c1.replace(
`    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>VT-{text}</Text> },
    { 
      title: 'Icon', 
      dataIndex: 'iconUrl', 
      key: 'iconUrl',
      render: (iconUrl: string) => iconUrl ? <Avatar src={getImageUrl(iconUrl)} shape="square" size="large" /> : <Avatar icon={<CarOutlined />} shape="square" size="large" />
    },
    { title: 'Display Name', dataIndex: 'typeName', key: 'typeName', render: (text: string) => <span className="font-semibold text-blue-700">{text}</span> },`,
`    { title: 'ID', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong>VT-{text}</Text> },
    { 
      title: 'Icon', 
      key: 'icon', 
      render: (_: any, r: any) => (
        <Avatar src={r.iconUrl ? getImageUrl(r.iconUrl) : undefined} icon={!r.iconUrl && <CarOutlined />} shape="square" size="large" />
      )
    },
    { title: 'Display Name', dataIndex: 'typeName', key: 'typeName', render: (text: string) => <span className="font-semibold text-blue-700">{text}</span> },`
);

c1 = c1.replace(
`            {editingRecord && (
              <Form.Item label="Vehicle Icon (Upload Image)">
                <Upload
                  name="file"
                  showUploadList={false}
                  customRequest={async (options) => {
                    const { file, onSuccess, onError } = options;
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      await axiosClient.post(\`/operation/vehicle-types/\${editingRecord.id}/icon\`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      message.success('Icon uploaded successfully');
                      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
                      if (onSuccess) onSuccess("ok");
                    } catch (err: any) {
                      message.error(err.response?.data?.message || 'Failed to upload icon');
                      if (onError) onError(err);
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload New Icon</Button>
                </Upload>
              </Form.Item>
            )}`,
`            {editingRecord && (
              <Form.Item label="Vehicle Icon (Upload Image)">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar src={editingRecord.iconUrl ? getImageUrl(editingRecord.iconUrl) : undefined} icon={!editingRecord.iconUrl && <CarOutlined />} shape="square" size={64} className="bg-gray-100" />
                  <Upload
                    name="file"
                    showUploadList={false}
                    customRequest={async (options) => {
                      const { file, onSuccess, onError } = options;
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await axiosClient.post(\`/operation/vehicle-types/\${editingRecord.id}/icon\`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        message.success('Icon uploaded successfully');
                        setEditingRecord(res.data.data);
                        queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
                        if (onSuccess) onSuccess("ok");
                      } catch (err: any) {
                        message.error(err.response?.data?.message || 'Failed to upload icon');
                        if (onError) onError(err);
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload New Icon</Button>
                  </Upload>
                </div>
              </Form.Item>
            )}`
);

fs.writeFileSync('src/features/manager/VehicleTypeScreen.tsx', c1);
