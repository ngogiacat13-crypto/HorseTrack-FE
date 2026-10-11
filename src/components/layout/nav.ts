import type { Role } from '../../api/mockData';
import type { IconName } from '../ui/Icon';

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
    { title: 'Tổng quan', items: [{ path: '/manager', icon: 'grid', label: 'Bảng điều khiển', end: true }] },
    { title: 'Vận hành', items: [
      { path: '/manager/registrations', icon: 'clip', label: 'Đăng ký ngựa', count: 3 },
      { path: '/manager/medical-monitoring', icon: 'heart', label: 'Theo dõi y tế', count: 2 },
    ] },
    { title: 'Tài chính', items: [
      { path: '/manager/invoices', icon: 'receipt', label: 'Hóa đơn', count: 4, tone: 'danger' },
      { path: '/manager/reports', icon: 'chart', label: 'Báo cáo tài chính' },
    ] },
    { title: 'Quản trị', items: [
      { path: '/manager/users', icon: 'users', label: 'Người dùng & quyền' },
      { path: '/manager/audit-logs', icon: 'shield', label: 'Nhật ký hệ thống' },
    ] },
  ],
  HeadTrainer: [
    { title: 'Huấn luyện', items: [
      { path: '/trainer', icon: 'grid', label: 'Tổng quan đàn ngựa', end: true },
      { path: '/trainer/stable', icon: 'stable', label: 'Sơ đồ chuồng' },
      { path: '/trainer/plans', icon: 'calendar', label: 'Giáo án huấn luyện' },
      { path: '/trainer/sessions', icon: 'pulse', label: 'Phiên tập' },
    ] },
  ],
  Veterinarian: [
    { title: 'Y tế', items: [
      { path: '/vet', icon: 'heart', label: 'Sức khỏe đàn ngựa', end: true },
      { path: '/vet/cases', icon: 'clip', label: 'Hộp thư ca khám' },
      { path: '/vet/protocols', icon: 'file', label: 'Phác đồ' },
    ] },
  ],
  Groom: [
    { title: 'Chăm sóc', items: [
      { path: '/groom', icon: 'task', label: 'Công việc hôm nay', end: true },
      { path: '/groom/stable', icon: 'stable', label: 'Sơ đồ chuồng' },
    ] },
  ],
  HorseOwner: [
    { title: 'Của tôi', items: [
      { path: '/owner', icon: 'receipt', label: 'Hóa đơn', end: true },
      { path: '/owner/horses', icon: 'pulse', label: 'Ngựa của tôi' },
    ] },
  ],
  WarehouseManager: [
    { title: 'Kho', items: [
      { path: '/warehouse', icon: 'box', label: 'Tồn kho', end: true },
      { path: '/warehouse/requisitions', icon: 'send', label: 'Yêu cầu cấp phát' },
      { path: '/warehouse/shipments', icon: 'truck', label: 'Đơn nhập hàng' },
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
