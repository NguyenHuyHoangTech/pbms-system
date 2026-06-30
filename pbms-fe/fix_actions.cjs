const fs = require('fs');
let c1 = fs.readFileSync('src/features/manager/VehicleTypeScreen.tsx', 'utf8');

c1 = c1.replace(
`  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await axiosClient.delete(\`/operation/vehicle-types/\${id}\`);
    },
    onSuccess: () => {
      message.success('Successfully deleted vehicle type!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'An error occurred while deleting.');
    }
  });

  const handleOpenModal = (record?: any) => {`,
`  const toggleStatusMutation = useMutation({
    mutationFn: async (record: any) => {
      const newStatus = record.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      return await axiosClient.put(\`/operation/vehicle-types/\${record.id}\`, { ...record, status: newStatus });
    },
    onSuccess: () => {
      message.success('Successfully updated vehicle type status!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'An error occurred while updating status.');
    }
  });

  const handleToggleStatus = (record: any) => {
    Modal.confirm({
      title: record.status === 'INACTIVE' ? 'Confirm Unlock' : 'Confirm Lock',
      content: \`Are you sure you want to \${record.status === 'INACTIVE' ? 'unlock' : 'lock'} this vehicle type?\`,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: () => toggleStatusMutation.mutate(record)
    });
  };

  const handleOpenModal = (record?: any) => {`
);

c1 = c1.replace(
`  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Confirm delete',
      content: 'Are you sure you want to delete this vehicle type?',
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(id)
    });
  };

  const columns = [`,
`  const columns = [`
);

c1 = c1.replace(
`    { 
      title: 'Matrix Size', 
      key: 'dimensions', 
      render: (_: any, r: any) => \`\${r.matrixWidth} cells (W) x \${r.matrixHeight} cells (H)\` 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
            Sửa
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      )
    }
  ];`,
`    { 
      title: 'Matrix Size', 
      key: 'dimensions', 
      render: (_: any, r: any) => \`\${r.matrixWidth} cells (W) x \${r.matrixHeight} cells (H)\` 
    },
    { 
      title: 'Status', 
      key: 'status', 
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'INACTIVE' ? 'error' : 'success'}>
          {status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
        </Tag>
      ) 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800">
            Sửa
          </Button>
          {record.status !== 'INACTIVE' ? (
            <Button type="text" danger icon={<LockOutlined />} onClick={() => handleToggleStatus(record)}>
              Lock
            </Button>
          ) : (
            <Button type="text" icon={<UnlockOutlined />} className="text-green-600 hover:text-green-800" onClick={() => handleToggleStatus(record)}>
              Unlock
            </Button>
          )}
        </Space>
      )
    }
  ];`
);

c1 = c1.replace(
`<Table 
            dataSource={vehicleTypes || []} `,
`<Table 
            dataSource={(vehicleTypes || []).sort((a: any, b: any) => {
              if (a.status === 'INACTIVE' && b.status !== 'INACTIVE') return 1;
              if (a.status !== 'INACTIVE' && b.status === 'INACTIVE') return -1;
              return a.id - b.id;
            })} `
);

fs.writeFileSync('src/features/manager/VehicleTypeScreen.tsx', c1);
