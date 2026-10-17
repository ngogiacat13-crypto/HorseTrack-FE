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
import { NotFound } from '../pages/shared/NotFound';

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

import { WarehouseInventory } from '../pages/warehouse/WarehouseInventory';
import { WarehouseMedical } from '../pages/warehouse/WarehouseMedical';
import { WarehouseMedicalDetail } from '../pages/warehouse/WarehouseMedicalDetail';
import { WarehouseShipments } from '../pages/warehouse/WarehouseShipments';
import { WarehouseRequisitions } from '../pages/warehouse/WarehouseRequisitions';
import { WarehouseStockCheck } from '../pages/warehouse/WarehouseStockCheck';
import { WarehouseLog } from '../pages/warehouse/WarehouseLog';

import { GroomTodayTasks } from '../pages/groom/GroomTodayTasks';
import { GroomStable } from '../pages/groom/GroomStable';
import { GroomSessions } from '../pages/groom/GroomSessions';
import { GroomSessionRun } from '../pages/groom/GroomSessionRun';
import { GroomIncidents } from '../pages/groom/GroomIncidents';
import { GroomRequests } from '../pages/groom/GroomRequests';
import { Landing } from '../pages/public/Landing';
import { OwnerHorses } from '../pages/owner/OwnerHorses';
import { OwnerHorseDetail } from '../pages/owner/OwnerHorseDetail';
import { OwnerRaces } from '../pages/owner/OwnerRaces';
import { OwnerInvoices } from '../pages/owner/OwnerInvoices';
import { OwnerInvoiceDetail } from '../pages/owner/OwnerInvoiceDetail';
import { OwnerPayments } from '../pages/owner/OwnerPayments';
import { OwnerRegistrations } from '../pages/owner/OwnerRegistrations';
import { OwnerRegistrationCreate } from '../pages/owner/OwnerRegistrationCreate';
import { VNPayMock } from '../pages/owner/VNPayMock';


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
  {
    role: 'Groom',
    routes: [
      [PATH.groom.home, <GroomTodayTasks />],
      [PATH.groom.stable, <GroomStable />],
      [PATH.groom.sessions, <GroomSessions />],
      [PATH.groom.session, <GroomSessionRun />],
      [PATH.groom.incidents, <GroomIncidents />],
      [PATH.groom.requests, <GroomRequests />],
    ],
  },
  { role: 'HorseOwner', routes: [
    [PATH.owner.home, <OwnerHorses />],
    [PATH.owner.horse, <OwnerHorseDetail />],
    [PATH.owner.races, <OwnerRaces />],
    [PATH.owner.invoices, <OwnerInvoices />],
    [PATH.owner.invoice, <OwnerInvoiceDetail />],
    [PATH.owner.payments, <OwnerPayments />],
    [PATH.owner.registrations, <OwnerRegistrations />],
    [PATH.owner.registrationCreate, <OwnerRegistrationCreate />],
  ] },
  { role: 'WarehouseManager', routes: [
    [PATH.warehouse.home, <WarehouseInventory />],
    [PATH.warehouse.medical, <WarehouseMedical />],
    [PATH.warehouse.medicalDetail, <WarehouseMedicalDetail />],
    [PATH.warehouse.requisitions, <WarehouseRequisitions />],
    [PATH.warehouse.shipments, <WarehouseShipments />],
    [PATH.warehouse.check, <WarehouseStockCheck />],
    [PATH.warehouse.log, <WarehouseLog />],
  ] },
];

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const home = user ? ROLE_HOME[user.role] : PATH.landing;
  // Public pages bounce a signed-in user back to their home page.
  const publicOnly = (page: React.ReactElement) => (user ? <Navigate to={home} replace /> : page);

  return (
    <Routes>
      {/* Opening localhost goes straight to the login page (or the workspace when already signed in). */}
      <Route path={PATH.root} element={<Navigate to={user ? home : PATH.login} replace />} />

      {/* Public */}
      <Route path={PATH.landing} element={<Landing />} />
      <Route path={PATH.login} element={publicOnly(<Login />)} />
      <Route path={PATH.register} element={publicOnly(<Register />)} />
      <Route path={PATH.forgotPassword} element={publicOnly(<ForgotPassword />)} />

      {/* VNPay sandbox MOCK — full page, outside the app layout */}
      <Route path={PATH.vnpay} element={user ? <RoleGuard role="HorseOwner"><VNPayMock /></RoleGuard> : <Navigate to={PATH.login} replace />} />

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

      {/* 404: unknown address */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
