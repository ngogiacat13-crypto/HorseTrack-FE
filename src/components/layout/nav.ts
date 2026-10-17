import type { Role } from '../../api/mockData';
import type { IconName } from '../ui/Icon';
import { PATH } from '../../routers/routerPath';

export const ROLE_LABEL: Record<Role, string> = {
  ClubManager: 'Quản lý CLB',
  HeadTrainer: 'HLV trưởng',
  Veterinarian: 'Bác sĩ thú y',
  Groom: 'Người chăm ngựa',
  HorseOwner: 'Chủ ngựa',
  WarehouseManager: 'Quản lý kho',
};

export interface NavItem { path: string; icon: IconName; label: string; count?: number; tone?: 'danger'; end?: boolean }
export interface NavGroup { title: string; items: NavItem[] }

/* Sidebar per role. Counts are demo values; wire them to the API when the backend exists. */
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  ClubManager: [
    { title: 'Tổng quan', items: [{ path: PATH.manager.home, icon: 'grid', label: 'Bảng điều khiển', end: true }] },
    { title: 'Vận hành', items: [
      { path: PATH.manager.registrations, icon: 'clip', label: 'Đăng ký ngựa', count: 3 },
      { path: PATH.manager.medicalMonitoring, icon: 'heart', label: 'Theo dõi y tế', count: 2 },
    ] },
    { title: 'Tài chính', items: [
      { path: PATH.manager.invoices, icon: 'receipt', label: 'Hóa đơn', count: 4, tone: 'danger' },
      { path: PATH.manager.reports, icon: 'chart', label: 'Báo cáo tài chính' },
    ] },
    { title: 'Quản trị', items: [
      { path: PATH.manager.users, icon: 'users', label: 'Người dùng & quyền' },
      { path: PATH.manager.auditLogs, icon: 'shield', label: 'Nhật ký hệ thống' },
    ] },
  ],
  HeadTrainer: [
    { title: 'Đàn ngựa', items: [
      { path: PATH.trainer.home, icon: 'grid', label: 'Tổng quan đàn ngựa', end: true },
      { path: PATH.trainer.stable, icon: 'stable', label: 'Sơ đồ chuồng' },
    ] },
    { title: 'Huấn luyện', items: [
      { path: PATH.trainer.plans, icon: 'calendar', label: 'Giáo án' },
      { path: PATH.trainer.schedule, icon: 'pulse', label: 'Lịch tập', count: 1, tone: 'danger' },
    ] },
    { title: 'Thi đấu', items: [
      { path: PATH.trainer.races, icon: 'trend', label: 'Giải đua & đề xuất', count: 1 },
    ] },
  ],
  Veterinarian: [
    { title: 'Khám & điều trị', items: [
      { path: PATH.vet.home, icon: 'heart', label: 'Sức khỏe đàn ngựa', end: true },
      { path: PATH.vet.cases, icon: 'clip', label: 'Hộp thư ca khám', count: 3, tone: 'danger' },
      { path: PATH.vet.protocols, icon: 'file', label: 'Phác đồ điều trị', count: 4 },
      { path: PATH.vet.medicines, icon: 'box', label: 'Danh mục thuốc' },
    ] },
    { title: 'Phòng bệnh', items: [
      { path: PATH.vet.vaccinations, icon: 'calendar', label: 'Tiêm phòng & tẩy giun' },
      { path: PATH.vet.raceExams, icon: 'trend', label: 'Khám trước thi đấu', count: 3 },
    ] },
  ],
  Groom: [
    { title: 'Chăm sóc', items: [
      { path: PATH.groom.home, icon: 'task', label: 'Công việc hôm nay', end: true },
      { path: PATH.groom.stable, icon: 'stable', label: 'Sơ đồ chuồng' },
    ] },
    { title: 'Huấn luyện', items: [
      { path: PATH.groom.sessions, icon: 'pulse', label: 'Phiên tập được giao' },
    ] },
    { title: 'Báo cáo & yêu cầu', items: [
      { path: PATH.groom.incidents, icon: 'alert', label: 'Báo cáo sự cố' },
      { path: PATH.groom.requests, icon: 'box', label: 'Yêu cầu vật tư' },
    ] },
  ],
  HorseOwner: [
    { title: 'Ngựa', items: [
      { path: PATH.owner.home, icon: 'stable', label: 'Ngựa của tôi', end: true },
      { path: PATH.owner.races, icon: 'trend', label: 'Xác nhận thi đấu' },
      { path: PATH.owner.registrations, icon: 'file', label: 'Đăng ký ngựa mới' },
    ] },
    { title: 'Tài chính', items: [
      { path: PATH.owner.invoices, icon: 'receipt', label: 'Hóa đơn' },
      { path: PATH.owner.payments, icon: 'card', label: 'Lịch sử thanh toán' },
    ] },
  ],
  WarehouseManager: [
    { title: 'Kho', items: [
      { path: PATH.warehouse.home, icon: 'box', label: 'Tồn kho', end: true },
      { path: PATH.warehouse.check, icon: 'clip', label: 'Kiểm kê tháng' },
      { path: PATH.warehouse.log, icon: 'file', label: 'Nhật ký kho' },
    ] },
    { title: 'Yêu cầu', items: [
      { path: PATH.warehouse.medical, icon: 'heart', label: 'Thuốc theo phác đồ', count: 3, tone: 'danger' },
      { path: PATH.warehouse.requisitions, icon: 'send', label: 'Vật tư từ Mã phu', count: 3 },
    ] },
    { title: 'Nhập hàng', items: [
      { path: PATH.warehouse.shipments, icon: 'truck', label: 'Đơn nhập hàng', count: 1, tone: 'danger' },
    ] },
  ],
};

export const SEARCH_HINT: Partial<Record<Role, string>> = {
  ClubManager: 'Tìm ngựa, microchip, hóa đơn…',
  HeadTrainer: 'Tìm ngựa, microchip, kế hoạch…',
  Veterinarian: 'Tìm ngựa, ca khám, phác đồ…',
  Groom: 'Tìm công việc, ngựa, chuồng…',
  HorseOwner: 'Tìm ngựa của tôi, hóa đơn…',
  WarehouseManager: 'Tìm vật tư, lô hàng, yêu cầu nhập…',
};
