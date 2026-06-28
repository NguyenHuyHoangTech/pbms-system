import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { Typography, Row, Col, Alert, Spin, Modal } from 'antd';
import { useWebSocket } from '../../core/websocket/useWebSocket';
import axiosClient from '../../core/api/axiosClient';
import { GateInConsoleScreen } from './GateInConsoleScreen';
import { GateOutConsoleScreen } from './GateOutConsoleScreen';

const { Title } = Typography;

class InlineErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any, info: any}> {
  state: {hasError: boolean, error: any, info: any} = { hasError: false, error: null, info: null };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { this.setState({ error, info: errorInfo }); console.error("GateConsoleScreen Error:", String(error), (errorInfo as any).componentStack); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 50, background: 'red', color: 'white', minHeight: '100vh', width: '100vw', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
        <h1>CRASH REPORT</h1>
        <h2>{this.state.error?.toString()}</h2>
        <pre style={{ background: 'black', padding: 20 }}>{this.state.info?.componentStack}</pre>
      </div>
    );
    return this.props.children;
  }
}

export const GateConsoleScreen = () => {
  const { data: gatesData, isLoading } = useQuery({
    queryKey: ['gates'],
    queryFn: async () => {
      const res = await axiosClient.get('/infrastructure/gates');
      return res.data.data;
    }
  });

  const [isShiftActive, setIsShiftActive] = useState(false);
  const [activeGate, setActiveGate] = useState<any>(null);

    const { connected, stompClient } = useWebSocket();
  const shiftStatus = useAuthStore((state) => state.shiftStatus);
  const setAuthShiftStatus = useAuthStore((state) => state.setShiftStatus);


  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-work-session'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/work-sessions/current');
        return res.data?.data;
      } catch (e) {
        return null;
      }
    }
  });

  useEffect(() => {
    let activeGateIdStr = sessionStorage.getItem('activeGateId');

    if (sessionData?.hasActiveSession && sessionData?.gateId) {
      activeGateIdStr = String(sessionData.gateId);
      sessionStorage.setItem('activeGateId', activeGateIdStr);
      sessionStorage.setItem('activeGateName', sessionData.gateName || '');
      sessionStorage.setItem('activeGateType', sessionData.gateType || '');

      if (shiftStatus !== 'OPEN') {
        setAuthShiftStatus('OPEN');
      }
    }

    if ((shiftStatus === 'OPEN' || sessionData?.hasActiveSession) && activeGateIdStr && gatesData) {
      const gate = gatesData.find((g: any) => String(g.id) === activeGateIdStr);
      if (gate) {
        setActiveGate(gate);
        setIsShiftActive(true);
      } else {
        setIsShiftActive(false);
      }
    } else {
      setIsShiftActive(false);
    }
  }, [shiftStatus, gatesData, sessionData, setAuthShiftStatus]);

  if (isLoading || isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-slate-100">
        <Spin size="large" tip="Loading gate data..." />
      </div>
    );
  }

  const isPatrolMode = sessionStorage.getItem('activeGateType') === 'PATROL';

  if (isPatrolMode) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-100 p-4">
        <Alert
          message="YOU ARE ON PATROL DUTY"
          description="Patrol duty does not require gate monitoring. Please switch to the Exception Desk tab."
          type="info"
          showIcon
          className="shadow-md text-lg"
        />
      </div>
    );
  }

  if (!isShiftActive || !activeGate) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-100 p-4">
        <Alert
          message="Shift not started or gate not selected!"
          description="Please click 'Start Shift' and select a gate to control the Console."
          type="warning"
          showIcon
          className="shadow-md"
        />
        <div className="mt-4 p-4 bg-white shadow rounded text-sm text-gray-500 w-full max-w-2xl text-left overflow-auto">
          <p><strong>Debug Info:</strong></p>
          <p>shiftStatus: {shiftStatus}</p>
          <p>hasSessionData: {sessionData ? 'Yes' : 'No'}</p>
          <p>session.hasActiveSession: {sessionData?.hasActiveSession ? 'Yes' : 'No'}</p>
          <p>session.gateId: {sessionData?.gateId}</p>
          <p>activeGateIdStr (sessionStorage): {sessionStorage.getItem('activeGateId')}</p>
          <p>gatesData loaded: {gatesData ? 'Yes (' + gatesData.length + ' gates)' : 'No'}</p>
          <p>gate IDs in gatesData: {gatesData?.map((g: any) => g.id).join(', ')}</p>
        </div>
      </div>
    );
  }

  const selectedGateType = sessionStorage.getItem('activeGateType');
  const isEntryMode = ['ENTRY', 'IN'].includes(selectedGateType || '') 
    ? true 
    : ['EXIT', 'OUT'].includes(selectedGateType || '') 
      ? false 
      : activeGate.type === 'IN';

  return (
    <InlineErrorBoundary>
      {isEntryMode ? (
        <GateInConsoleScreen activeGate={activeGate} />
      ) : (
        <GateOutConsoleScreen activeGate={activeGate} />
      )}
    </InlineErrorBoundary>
  );
};
