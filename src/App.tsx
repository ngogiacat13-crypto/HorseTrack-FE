import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ROLE_HOME, Role } from './api/mockData';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ChangePassword } from './pages/ChangePassword';

// Các trang chức năng (giữ nguyên import cũ của bạn)
import { ManagerDashboard } from './pages/manager/Dashboard';
import { ManagerRegistrationQueue } from './pages/manager/ManagerRegistrationQueue';
import { ManagerRegistrationDetail } from './pages/manager/ManagerRegistrationDetail';
import { ManagerProtocolQueue } from './pages/manager/ManagerProtocolQueue';
import { ManagerProtocolDetail } from './pages/manager/ManagerProtocolDetail';
import { ManagerInvoices } from './pages/manager/ManagerInvoices';
import { ManagerAuditLogs } from './pages/manager/ManagerAuditLogs';
import { TrainerHerdOverview } from './pages/trainer/HerdOverview';
import { StableMap } from './pages/trainer/StableMap';
import { GroomTodayTasks } from './pages/groom/TodayTasks';
import { OwnerInvoices } from './pages/owner/Invoices';
import { HorseProfile } from './pages/shared/HorseProfile';

const Placeholder = ({ title }: { title: string }) => (
  <div className="text-center mt-5">
    <h2 className="text-muted">{title}</h2>
    <p>Màn hình này đang được phát triển.</p>
  </div>
);

const RoleGuard: React.FC<{ role: Role; children: React.ReactElement }> = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ==================== AUTH (PUBLIC) ==================== */}
      <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <ForgotPassword />} />

      {/* ==================== APP (PROTECTED) ==================== */}
      <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        {/* Shared */}
        <Route path="/horses/:id" element={<HorseProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Manager */}
        <Route path="/manager" element={<RoleGuard role="ClubManager"><ManagerDashboard /></RoleGuard>} />
        <Route path="/manager/registrations" element={<RoleGuard role="ClubManager"><ManagerRegistrationQueue /></RoleGuard>} />
        <Route path="/manager/registrations/:id" element={<RoleGuard role="ClubManager"><ManagerRegistrationDetail /></RoleGuard>} />
        <Route path="/manager/protocols" element={<RoleGuard role="ClubManager"><ManagerProtocolQueue /></RoleGuard>} />
        <Route path="/manager/protocols/:id" element={<RoleGuard role="ClubManager"><ManagerProtocolDetail /></RoleGuard>} />
        <Route path="/manager/invoices" element={<RoleGuard role="ClubManager"><ManagerInvoices /></RoleGuard>} />
        <Route path="/manager/audit-logs" element={<RoleGuard role="ClubManager"><ManagerAuditLogs /></RoleGuard>} />

        {/* Trainer */}
        <Route path="/trainer" element={<RoleGuard role="HeadTrainer"><TrainerHerdOverview /></RoleGuard>} />
        <Route path="/trainer/stable" element={<RoleGuard role="HeadTrainer"><StableMap /></RoleGuard>} />

        {/* Groom */}
        <Route path="/groom" element={<RoleGuard role="Groom"><GroomTodayTasks /></RoleGuard>} />

        {/* Owner */}
        <Route path="/owner" element={<RoleGuard role="HorseOwner"><OwnerInvoices /></RoleGuard>} />

        {/* Vet & Warehouse */}
        <Route path="/vet" element={<RoleGuard role="Veterinarian"><Placeholder title="Sức khỏe đàn ngựa" /></RoleGuard>} />
        <Route path="/warehouse" element={<RoleGuard role="WarehouseManager"><Placeholder title="Danh sách tồn kho" /></RoleGuard>} />
      </Route>

      {/* Mặc định */}
      <Route path="*" element={<Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;