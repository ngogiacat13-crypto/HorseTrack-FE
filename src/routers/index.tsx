import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_HOME, Role } from '../api/mockData';
import { AppLayout } from '../components/layout/AppLayout';
import { PATH } from './routerPath';
import { RoleGuard } from './RoleGuard';

import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ChangePassword } from '../pages/auth/ChangePassword';
import { MyProfile } from '../pages/auth/MyProfile';
import { HorseProfile } from '../pages/shared/HorseProfile';

import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ManagerRegistrationQueue } from '../pages/manager/ManagerRegistrationQueue';
import { ManagerRegistrationDetail } from '../pages/manager/ManagerRegistrationDetail';
import { ManagerMedicalMonitoring } from '../pages/manager/ManagerMedicalMonitoring';
import { ManagerInvoices } from '../pages/manager/ManagerInvoices';
import { ManagerFinanceReport } from '../pages/manager/ManagerFinanceReport';
import { ManagerUsers } from '../pages/manager/ManagerUsers';
import { ManagerAuditLogs } from '../pages/manager/ManagerAuditLogs';

import { TrainerHerdOverview } from '../pages/trainer/TrainerHerdOverview';
import { StableMap } from '../pages/trainer/StableMap';
import { TrainerHorseRecord } from '../pages/trainer/TrainerHorseRecord';
import { TrainerPlans } from '../pages/trainer/TrainerPlans';
import { TrainerPlanCreate } from '../pages/trainer/TrainerPlanCreate';
import { TrainerSchedule } from '../pages/trainer/TrainerSchedule';
import { TrainerSessionDetail } from '../pages/trainer/TrainerSessionDetail';
import { TrainerRaces } from '../pages/trainer/TrainerRaces';
import { TrainerProposalCreate } from '../pages/trainer/TrainerProposalCreate';

import { VetHerd } from '../pages/vet/VetHerd';
import { VetInbox } from '../pages/vet/VetInbox';
import { VetHorseHealth } from '../pages/vet/VetHorseHealth';
import { VetProtocols } from '../pages/vet/VetProtocols';
import { VetProtocolCreate } from '../pages/vet/VetProtocolCreate';
import { VetProtocolDetail } from '../pages/vet/VetProtocolDetail';
import { VetMedicines } from '../pages/vet/VetMedicines';
import { VetVaccinations } from '../pages/vet/VetVaccinations';
import { VetRaceExams } from '../pages/vet/VetRaceExams';

import { GroomTodayTasks } from '../pages/groom/GroomTodayTasks';
import { OwnerInvoices } from '../pages/owner/OwnerInvoices';

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center mt-5">
    <h2 className="text-muted">{title}</h2>
    <p>Màn hình này đang được phát triển.</p>
  </div>
);

/* Pages of each role — every one of them is wrapped in RoleGuard below. */
const ROLE_ROUTES: { role: Role; routes: [path: string, element: React.ReactElement][] }[] = [
  { role: 'ClubManager', routes: [
    [PATH.manager.home, <ManagerDashboard />],
    [PATH.manager.registrations, <ManagerRegistrationQueue />],
    [PATH.manager.registrationDetail, <ManagerRegistrationDetail />],
    [PATH.manager.medicalMonitoring, <ManagerMedicalMonitoring />],
    [PATH.manager.invoices, <ManagerInvoices />],
    [PATH.manager.reports, <ManagerFinanceReport />],
    [PATH.manager.users, <ManagerUsers />],
    [PATH.manager.auditLogs, <ManagerAuditLogs />],
  ] },
  { role: 'HeadTrainer', routes: [
    [PATH.trainer.home, <TrainerHerdOverview />],
    [PATH.trainer.horse, <TrainerHorseRecord />],
    [PATH.trainer.plans, <TrainerPlans />],
    [PATH.trainer.planCreate, <TrainerPlanCreate />],
    [PATH.trainer.schedule, <TrainerSchedule />],
    [PATH.trainer.session, <TrainerSessionDetail />],
    [PATH.trainer.races, <TrainerRaces />],
    [PATH.trainer.proposalCreate, <TrainerProposalCreate />],
    [PATH.trainer.stable, <StableMap />],
  ] },
  { role: 'Veterinarian', routes: [
    [PATH.vet.home, <VetHerd />],
    [PATH.vet.cases, <VetInbox />],
    [PATH.vet.horse, <VetHorseHealth />],
    [PATH.vet.protocols, <VetProtocols />],
    [PATH.vet.protocolCreate, <VetProtocolCreate />],
    [PATH.vet.protocol, <VetProtocolDetail />],
    [PATH.vet.medicines, <VetMedicines />],
    [PATH.vet.vaccinations, <VetVaccinations />],
    [PATH.vet.raceExams, <VetRaceExams />],
  ] },
  { role: 'Groom', routes: [[PATH.groom.home, <GroomTodayTasks />]] },
  { role: 'HorseOwner', routes: [[PATH.owner.home, <OwnerInvoices />]] },
  { role: 'WarehouseManager', routes: [[PATH.warehouse.home, <Placeholder title="Danh sách tồn kho" />]] },
];

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const home = user ? ROLE_HOME[user.role] : PATH.login;
  // Public pages bounce a signed-in user back to their home page.
  const publicOnly = (page: React.ReactElement) => (user ? <Navigate to={home} replace /> : page);

  return (
    <Routes>
      {/* Auth (public) */}
      <Route path={PATH.login} element={publicOnly(<Login />)} />
      <Route path={PATH.register} element={publicOnly(<Register />)} />
      <Route path={PATH.forgotPassword} element={publicOnly(<ForgotPassword />)} />

      {/* App (signed in) */}
      <Route element={user ? <AppLayout /> : <Navigate to={PATH.login} replace />}>
        <Route path={PATH.horseProfile} element={<HorseProfile />} />
        <Route path={PATH.myProfile} element={<MyProfile />} />
        <Route path={PATH.changePassword} element={<ChangePassword />} />
        <Route path={PATH.manager.oldProtocols} element={<Navigate to={PATH.manager.medicalMonitoring} replace />} />
        {ROLE_ROUTES.flatMap(({ role, routes }) => routes.map(([path, element]) => (
          <Route key={path} path={path} element={<RoleGuard role={role}>{element}</RoleGuard>} />
        )))}
      </Route>

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
};
