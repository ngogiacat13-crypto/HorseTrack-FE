import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/tokens.css';
import './styles/ht.css';
import './styles/trainer.css';
import './styles/vet.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/ui/Ht';
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
import { ManagerMedicalMonitoring } from './pages/manager/ManagerMedicalMonitoring';
import { ManagerInvoices } from './pages/manager/ManagerInvoices';
import { ManagerFinanceReport } from './pages/manager/ManagerFinanceReport';
import { ManagerUsers } from './pages/manager/ManagerUsers';
import { ManagerAuditLogs } from './pages/manager/ManagerAuditLogs';
import { TrainerHerdOverview } from './pages/trainer/HerdOverview';
import { StableMap } from './pages/trainer/StableMap';
import { TrainerHorseRecord } from './pages/trainer/TrainerHorseRecord';
import { TrainerPlans } from './pages/trainer/TrainerPlans';
import { TrainerPlanCreate } from './pages/trainer/TrainerPlanCreate';
import { TrainerSchedule } from './pages/trainer/TrainerSchedule';
import { TrainerSessionDetail } from './pages/trainer/TrainerSessionDetail';
import { TrainerRaces } from './pages/trainer/TrainerRaces';
import { TrainerProposalCreate } from './pages/trainer/TrainerProposalCreate';
import { VetHerd } from './pages/vet/VetHerd';
import { VetInbox } from './pages/vet/VetInbox';
import { VetHorseHealth } from './pages/vet/VetHorseHealth';
import { VetProtocols } from './pages/vet/VetProtocols';
import { VetProtocolCreate } from './pages/vet/VetProtocolCreate';
import { VetProtocolDetail } from './pages/vet/VetProtocolDetail';
import { VetVaccinations } from './pages/vet/VetVaccinations';
import { VetRaceExams } from './pages/vet/VetRaceExams';
import { VetMedicines } from './pages/vet/VetMedicines';
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
        <Route path="/manager/medical-monitoring" element={<RoleGuard role="ClubManager"><ManagerMedicalMonitoring /></RoleGuard>} />
        <Route path="/manager/protocols/*" element={<Navigate to="/manager/medical-monitoring" replace />} />
        <Route path="/manager/invoices" element={<RoleGuard role="ClubManager"><ManagerInvoices /></RoleGuard>} />
        <Route path="/manager/reports" element={<RoleGuard role="ClubManager"><ManagerFinanceReport /></RoleGuard>} />
        <Route path="/manager/users" element={<RoleGuard role="ClubManager"><ManagerUsers /></RoleGuard>} />
        <Route path="/manager/audit-logs" element={<RoleGuard role="ClubManager"><ManagerAuditLogs /></RoleGuard>} />

        {/* Trainer */}
        <Route path="/trainer" element={<RoleGuard role="HeadTrainer"><TrainerHerdOverview /></RoleGuard>} />
        <Route path="/trainer/horses/:id" element={<RoleGuard role="HeadTrainer"><TrainerHorseRecord /></RoleGuard>} />
        <Route path="/trainer/plans" element={<RoleGuard role="HeadTrainer"><TrainerPlans /></RoleGuard>} />
        <Route path="/trainer/plans/new" element={<RoleGuard role="HeadTrainer"><TrainerPlanCreate /></RoleGuard>} />
        <Route path="/trainer/schedule" element={<RoleGuard role="HeadTrainer"><TrainerSchedule /></RoleGuard>} />
        <Route path="/trainer/sessions/:id" element={<RoleGuard role="HeadTrainer"><TrainerSessionDetail /></RoleGuard>} />
        <Route path="/trainer/races" element={<RoleGuard role="HeadTrainer"><TrainerRaces /></RoleGuard>} />
        <Route path="/trainer/races/new" element={<RoleGuard role="HeadTrainer"><TrainerProposalCreate /></RoleGuard>} />
        <Route path="/trainer/stable" element={<RoleGuard role="HeadTrainer"><StableMap /></RoleGuard>} />

        {/* Groom */}
        <Route path="/groom" element={<RoleGuard role="Groom"><GroomTodayTasks /></RoleGuard>} />

        {/* Owner */}
        <Route path="/owner" element={<RoleGuard role="HorseOwner"><OwnerInvoices /></RoleGuard>} />

        {/* Veterinarian */}
        <Route path="/vet" element={<RoleGuard role="Veterinarian"><VetHerd /></RoleGuard>} />
        <Route path="/vet/cases" element={<RoleGuard role="Veterinarian"><VetInbox /></RoleGuard>} />
        <Route path="/vet/horses/:id" element={<RoleGuard role="Veterinarian"><VetHorseHealth /></RoleGuard>} />
        <Route path="/vet/protocols" element={<RoleGuard role="Veterinarian"><VetProtocols /></RoleGuard>} />
        <Route path="/vet/protocols/new" element={<RoleGuard role="Veterinarian"><VetProtocolCreate /></RoleGuard>} />
        <Route path="/vet/protocols/:id" element={<RoleGuard role="Veterinarian"><VetProtocolDetail /></RoleGuard>} />
        <Route path="/vet/vaccinations" element={<RoleGuard role="Veterinarian"><VetVaccinations /></RoleGuard>} />
        <Route path="/vet/race-exams" element={<RoleGuard role="Veterinarian"><VetRaceExams /></RoleGuard>} />
        <Route path="/vet/medicines" element={<RoleGuard role="Veterinarian"><VetMedicines /></RoleGuard>} />

        <Route path="/warehouse" element={<RoleGuard role="WarehouseManager"><Placeholder title="Danh sách tồn kho" /></RoleGuard>} />
      </Route>

      {/* Mặc định */}
      <Route path="*" element={<Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;