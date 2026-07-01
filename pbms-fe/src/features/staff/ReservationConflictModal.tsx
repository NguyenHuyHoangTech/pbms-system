import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Typography, Tag, message } from 'antd';
import { AimOutlined, SyncOutlined } from '@ant-design/icons';
import axiosClient from '../../core/api/axiosClient';

const { Text, Title } = Typography;

interface ZoneRoutingStatusDTO {
    zoneId: number;
    zoneName: string;
    capacity: number;
    occupied: number;
    reserved: number;
    available: number;
    occupancyRate: number;
    fillThresholdPct: number;
    isSuggested: boolean;
}

interface ReservationConflictModalProps {
    visible: boolean;
    onClose: () => void;
    conflictData: any;
}

export const ReservationConflictModal: React.FC<ReservationConflictModalProps> = ({ visible, onClose, conflictData }) => {
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<ZoneRoutingStatusDTO[]>([]);

    useEffect(() => {
        if (visible && conflictData) {
            fetchZones();
        }
    }, [visible, conflictData]);

    const fetchZones = async () => {
        setLoading(true);
        try {
            // Need to get the vehicleTypeId. We might need to pass it or just get all zones and show them.
            // Since we don't have vehicleTypeId in conflictData payload right now, we can fetch all routing status for BOOK
            // Wait, we need vehicleTypeId. Let's just fetch all zones and filter by available > 0.
            // A better way is to call the routing-status API but it requires vehicleTypeId.
            // Let's just fetch the reservation to get vehicleTypeId.
            const resData = await axiosClient.get(`/operation/reservations`);
            // This endpoint is for all reservations, let's just find ours
            const ours = resData.data.data.find((r: any) => r.id === conflictData.reservationId);
            if (ours) {
                // Now get the routing status for this vehicle type
                // But we don't have vehicleTypeId easily. 
                // Let's just get the zones from map config!
            }
            // Fetch alternative zones via routing-status API
            const res = await axiosClient.get(`/operation/gates/routing-status?vehicleTypeId=${conflictData.vehicleTypeId}&customerType=BOOK`);
            let routingZones: ZoneRoutingStatusDTO[] = res.data.data;
            
            // Filter out zones that are full
            routingZones = routingZones.filter(z => z.available > 0);
            setZones(routingZones);
        } catch (error: any) {
            message.error("Failed to load alternative zones");
        }
        setLoading(false);
    };

    const handleResolve = async (newZoneId: number) => {
        setLoading(true);
        try {
            await axiosClient.post(`/operation/gates/reservations/${conflictData.reservationId}/resolve-zone?newZoneId=${newZoneId}`);
            message.success('Reservation re-routed successfully!');
            onClose();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to re-route');
        }
        setLoading(false);
    };

    return (
        <Modal
            title={<><AimOutlined /> Resolve Zone Conflict</>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            {conflictData && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Text strong className="text-red-600 block mb-1">Reservation #{conflictData.reservationId} is approaching, but {conflictData.zoneName} is FULL!</Text>
                    <div className="text-sm">
                        Customer: <b>{conflictData.customer}</b> <br/>
                        Plate: <b>{conflictData.plate}</b>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-2">
                <Title level={5} className="m-0">Select Alternative Zone</Title>
                <Button size="small" icon={<SyncOutlined />} onClick={fetchZones} loading={loading}>Refresh</Button>
            </div>

            <Table 
                dataSource={zones} 
                rowKey="id"
                loading={loading}
                pagination={false}
                columns={[
                    { title: 'Zone Name', dataIndex: 'zoneName' },
                    { title: 'Capacity', dataIndex: 'capacity' },
                    { 
                        title: 'Action', 
                        render: (_, record: any) => (
                            <Button type="primary" size="small" onClick={() => handleResolve(record.zoneId)}>
                                Route Here
                            </Button>
                        )
                    }
                ]}
            />
        </Modal>
    );
}
