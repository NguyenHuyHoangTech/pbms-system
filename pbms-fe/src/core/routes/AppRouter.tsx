import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { BuildingProfileScreen } from '../../features/system/BuildingProfileScreen';
import { SystemConfigScreen } from '../../features/system/SystemConfigScreen';
import { AuditLogScreen } from '../../features/admin/AuditLogScreen';
import { GateConsoleScreen } from '../../features/staff/GateConsoleScreen';
import { ShiftManagementScreen } from '../../features/staff/ShiftManagementScreen';
import { ExceptionDeskScreen } from '../../features/staff/ExceptionDeskScreen';
import { HomeScreen } from '../../features/customer/HomeScreen';
import { PreBookingScreen } from '../../features/customer/PreBookingScreen';
import { MyParkingScreen } from '../../features/customer/MyParkingScreen';
import { HelpdeskScreen } from '../../features/customer/HelpdeskScreen';
import { CustomerMonthlyPassScreen } from '../../features/customer/CustomerMonthlyPassScreen';
import { UserManagementScreen } from '../../features/admin/UserManagementScreen';

import { VehicleTypeScreen } from '../../features/manager/VehicleTypeScreen';
import { SpaceMapScreen } from '../../features/manager/SpaceMapScreen';
import { PricingConfigScreen } from '../../features/manager/PricingConfigScreen';
import { MonthlyPassScreen } from '../../features/manager/MonthlyPassScreen';
import { RevenueDashboardScreen } from '../../features/manager/RevenueDashboardScreen';
import { OperationalDashboardScreen } from '../../features/manager/OperationalDashboardScreen';
import { RefundManagementScreen } from '../../features/manager/RefundManagementScreen';
import { CardManagementScreen } from '../../features/manager/CardManagementScreen';
import { TicketCenterScreen } from '../../features/manager/TicketCenterScreen';
import { VehicleRoutingScreen } from '../../features/manager/VehicleRoutingScreen';
import { PreBookingManagementScreen } from '../../features/manager/PreBookingManagementScreen';
import { IotMockingScreen } from '../../features/system/IotMockingScreen';

import { ManagerLayout } from '../../features/manager/ManagerLayout';
import { StaffLayout } from '../../features/staff/StaffLayout';
import { CustomerLayout } from '../../features/customer/CustomerLayout';
import { AdminLayout } from '../../features/admin/AdminLayout';

import { useAuthStore } from '../store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />; // or to a forbidden page
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        
        {/* TESTER IOT MOCK ROUTE */}
        <Route path="/tester/iot-mock" element={<IotMockingScreen />} />

        {/* ADMIN LAYOUT ROUTES */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="system-configs" element={<SystemConfigScreen />} />
          <Route path="audit-logs" element={<AuditLogScreen />} />
          <Route path="users" element={<UserManagementScreen />} />
        </Route>

        {/* MANAGER LAYOUT ROUTES */}
        <Route 
          path="/manager" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="building-profile" element={<BuildingProfileScreen />} />
          <Route path="vehicle-types" element={<VehicleTypeScreen />} />
          <Route path="space-map" element={<SpaceMapScreen />} />
          <Route path="pricing-config" element={<PricingConfigScreen />} />
          <Route path="monthly-passes" element={<MonthlyPassScreen />} />
          <Route path="refund-management" element={<RefundManagementScreen />} />
          <Route path="revenue-dashboard" element={<RevenueDashboardScreen />} />
          <Route path="operational-dashboard" element={<OperationalDashboardScreen />} />
          <Route path="card-management" element={<CardManagementScreen />} />
          <Route path="ticket-center" element={<TicketCenterScreen />} />
          <Route path="routing" element={<VehicleRoutingScreen />} />
          <Route path="pre-bookings" element={<PreBookingManagementScreen />} />
        </Route>

        {/* CUSTOMER LAYOUT ROUTES */}
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<HomeScreen />} />
          <Route path="pre-booking" element={<PreBookingScreen />} />
          <Route path="my-parking" element={<MyParkingScreen />} />
          <Route path="monthly-pass" element={<CustomerMonthlyPassScreen />} />
          <Route path="helpdesk" element={<HelpdeskScreen />} />
        </Route>

        {/* STAFF LAYOUT ROUTES */}
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STAFF']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route path="gate-console" element={<GateConsoleScreen />} />
          <Route path="shift-management" element={<ShiftManagementScreen />} />
          <Route path="exception-desk" element={<ExceptionDeskScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
