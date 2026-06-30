import React from 'react';
import { Modal, Typography, Button } from 'antd';
import { WarningOutlined, FileExclamationOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

interface MonthlyZoneConflictModalProps {
    visible: boolean;
    onClose: () => void;
    conflictData: any;
}

export const MonthlyZoneConflictModal: React.FC<MonthlyZoneConflictModalProps> = ({ visible, onClose, conflictData }) => {
    const navigate = useNavigate();

    const handleCreatePenalty = () => {
        onClose();
        navigate('/staff/exception-desk');
    };

    return (
        <Modal
            title={<><WarningOutlined className="text-red-500" /> Monthly Zone Violation Detected</>}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Close
                </Button>,
                <Button 
                    key="penalty" 
                    type="primary" 
                    danger 
                    icon={<FileExclamationOutlined />} 
                    onClick={handleCreatePenalty}
                >
                    Create Penalty Ticket
                </Button>
            ]}
        >
            {conflictData && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Title level={5} className="text-orange-600 m-0 mb-2">Alert from Camera/Sensor System</Title>
                    <Text className="block mb-2 text-base">
                        {conflictData.message}
                    </Text>
                    <Text type="secondary" className="block mt-4 italic">
                        Please check on-site and attach a penalty ticket to the violating vehicle.
                    </Text>
                </div>
            )}
        </Modal>
    );
};
