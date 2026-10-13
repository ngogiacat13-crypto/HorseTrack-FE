// ====================== TYPES & MOCK DATA ======================
export type Role =
  | 'ClubManager'
  | 'HeadTrainer'
  | 'Veterinarian'
  | 'Groom'
  | 'HorseOwner'
  | 'WarehouseManager';

export type HealthStatus = 'Healthy' | 'UnderObservation' | 'Injured' | 'Quarantined';

export const ROLE_LABELS: Record<Role, string> = {
  ClubManager: 'Quản lý CLB',
  HeadTrainer: 'HLV trưởng',
  Veterinarian: 'Bác sĩ thú y',
  Groom: 'Nhân viên chăm ngựa',
  HorseOwner: 'Chủ ngựa',
  WarehouseManager: 'Quản lý kho',
};

export const ROLE_HOME: Record<Role, string> = {
  ClubManager: '/manager',
  HeadTrainer: '/trainer',
  Veterinarian: '/vet',
  Groom: '/groom',
  HorseOwner: '/owner',
  WarehouseManager: '/warehouse',
};

export interface AuthUser {
  userId: string;
  id?: string;
  username: string;
  fullname: string;
  name?: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  /** Profile picture (data URL, square, 256 px). Empty = show initials. */
  avatarUrl?: string;
}

// Tài khoản và đăng nhập: xem src/api/authApi.ts (gọi json-server /users).

export interface HorseRegistrationRecord {
  horseId: string;
  horseName: string;
  dob: string;
  gender: 'Colt' | 'Filly' | 'Stallion' | 'Mare' | 'Gelding';
  breed: string;
  pedigree: string;
  weightKg: number;
  healthStatus: 'Healthy' | 'Need_Check' | 'Injured' | 'Isolated';
  isLocked: false;
  prizeSharePct: number;
  ownerId: string;
  stallId: number | null;
  createdAt: string;
  registrationStatus: 'Registered';
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: string;
  healthStatus: HealthStatus;
  isLocked: boolean;
  ownerName: string;
  trainerPlan?: string;
}

export interface Task {
  id: string;
  title: string;
  horseName: string;
  time: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  type: string;
  description: string;
}

export interface Invoice {
  id: string;
  horseName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export const MOCK_HORSES: Horse[] = [
  { id: 'h1', name: 'Galaxy', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Hoàng Thị Lan', trainerPlan: 'Sức bền - Giai đoạn 2' },
  { id: 'h2', name: 'Storm', breed: 'Arabian', age: '3 tuổi', gender: 'Cái', healthStatus: 'Injured', isLocked: true, ownerName: 'Đỗ Minh Quân' },
  { id: 'h3', name: 'Bolt', breed: 'Quarter Horse', age: '5 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Vũ Thị Mai', trainerPlan: 'Tốc độ - Giai đoạn 1' },
  { id: 'h4', name: 'Thunder', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'UnderObservation', isLocked: false, ownerName: 'Hoàng Thị Lan' },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Cho ăn sáng', horseName: 'Galaxy', time: '06:00', status: 'Overdue', type: 'Feeding', description: '3kg cám + 2kg cỏ' },
  { id: 't2', title: 'Dọn chuồng', horseName: 'Storm', time: '07:00', status: 'Pending', type: 'MuckingOut', description: 'Vệ sinh toàn bộ chuồng A-03' },
  { id: 't3', title: 'Chải lông', horseName: 'Bolt', time: '06:30', status: 'Completed', type: 'Grooming', description: 'Chải lông và kiểm tra móng' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-0042', horseName: 'Galaxy', amount: 15000000, dueDate: '10/09/2026', status: 'Overdue' },
  { id: 'INV-0043', horseName: 'Storm', amount: 6000000, dueDate: '15/10/2026', status: 'Pending' },
  { id: 'INV-0041', horseName: 'Bolt', amount: 12500000, dueDate: '01/09/2026', status: 'Paid' },
];