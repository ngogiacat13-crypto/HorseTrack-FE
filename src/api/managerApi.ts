// ==================== MOCK API — QUẢN LÝ CLB (ClubManager) ====================
// Demo clock: 03/10/2026 10:30 (Asia/Ho_Chi_Minh). All days are counted against it.
// The manager monitors medical work but never approves protocols (BR_07).

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/* ---------------- Types ---------------- */
export type RegStatus = 'Pending' | 'Approved' | 'Rejected';
export interface Registration {
  id: string;
  horse: { name: string; breed: string; sex: string; age: number; code: string };
  owner: { fullName: string; email: string; phone: string };
  submittedAt: string; // dd/MM/yyyy HH:mm
  waitingDays: number;
  passed: number; // checklist items passed out of 4
  firstIssue?: string;
  status: RegStatus;
  decidedNote?: string;
}
export interface ChecklistItem { key: string; label: string; detail: string; passed: boolean }
export interface RegistrationDetail extends Registration {
  owner: Registration['owner'] & { taxCode: string; billingAddress: string; otherHorses: string };
  horseExtra: { color: string; height: string; weight: number; microchip: string; passport: string; healthCert: string };
  checklist: ChecklistItem[];
  attachments: { name: string; meta: string; problem?: boolean }[];
  history: { tone?: 'danger' | 'warning' | 'success' | 'info'; who: string; text: string; at: string }[];
}

export type ProtocolState =
  | 'DRAFT' | 'WAITING_STOCK_CHECK' | 'STOCK_SHORTAGE' | 'STOCK_AVAILABLE' | 'WAITING_RESTOCK' | 'REQUIRES_VET_REVIEW'
  | 'VET_CONFIRMED' | 'READY_FOR_DISPENSING' | 'IN_TREATMENT' | 'COMPLETED' | 'SUPERSEDED' | 'CANCELLED';
export interface ProtocolWatch {
  id: string; horse: string; diagnosis: string; vet: string;
  state: ProtocolState; label: string; tone: 'danger' | 'info' | 'success' | 'neutral';
  cost: number; trainingLocked?: boolean; open: boolean;
  path: ProtocolState[]; alertState?: ProtocolState;
  materials: { item: string; status: string; tone: 'success' | 'danger' | 'neutral' }[];
  note: string;
  log: { tone?: 'danger' | 'warning' | 'success'; who: string; text: string; at: string }[];
}
export interface Shipment { id: string; item: string; status: 'DELAYED' | 'IN_TRANSIT'; etaOld?: string; eta: string; forRef: string }

export type InvoiceStatus = 'UNPAID' | 'OVERDUE' | 'SUSPENDED' | 'REACTIVATION_PENDING' | 'PAID' | 'ACTIVE';
export interface Invoice {
  id: string; horse: string; owner: string; period: string; dueDate: string; amount: number;
  overdueDays: number; status: InvoiceStatus; suspendedSince?: string; paidRef?: string; dueInDays?: number;
}

export interface ManagedUser {
  id: number; fullName: string; username: string; email: string;
  role: 'ClubManager' | 'HeadTrainer' | 'Veterinarian' | 'WarehouseManager' | 'Groom' | 'HorseOwner';
  lastLogin: string; status: 'ACTIVE' | 'LOCKED'; lockReason?: string;
  openTasks?: number; horsesOwned?: number; serviceSuspended?: boolean; isSelf?: boolean;
}
export interface RoleCheck { level: 'pass' | 'warn' | 'fail'; text: string }

export type AuditArea = 'reg' | 'med' | 'train' | 'fin' | 'acct';
export interface AuditLog {
  id: number; at: string; who: string; role: string; action: string; label: string;
  object: string; area: AuditArea; ip: string; from?: string; to?: string; reason?: string; isLogin?: boolean;
}

/* ---------------- Data ---------------- */
const REGISTRATIONS: Registration[] = [
  { id: 'REG-0017', horse: { name: 'Red Comet', breed: 'Thoroughbred', sex: '♂', age: 5, code: 'VN-MC-9017' }, owner: { fullName: 'Vũ Thị Mai', email: 'mai@example.com', phone: '0923456789' }, submittedAt: '29/09/2026 10:00', waitingDays: 4, passed: 2, firstIssue: 'Thiếu giấy sức khỏe', status: 'Pending' },
  { id: 'REG-0018', horse: { name: 'Silver Wind', breed: 'Arabian', sex: '♀', age: 4, code: 'VN-MC-9018' }, owner: { fullName: 'Đỗ Minh Quân', email: 'quan@example.com', phone: '0912345678' }, submittedAt: '30/09/2026 14:30', waitingDays: 3, passed: 4, status: 'Pending' },
  { id: 'REG-0019', horse: { name: 'Thunder Bay', breed: 'Thoroughbred', sex: '♂', age: 3, code: 'VN-MC-9019' }, owner: { fullName: 'Hoàng Thị Lan', email: 'lan@example.com', phone: '0901234567' }, submittedAt: '01/10/2026 09:15', waitingDays: 2, passed: 3, firstIssue: 'Giấy sở hữu bị mờ', status: 'Pending' },
  { id: 'REG-0016', horse: { name: 'Lightning', breed: 'Quarter Horse', sex: '♂', age: 4, code: 'VN-MC-9016' }, owner: { fullName: 'Vũ Thị Mai', email: 'mai@example.com', phone: '0923456789' }, submittedAt: '28/09/2026 08:40', waitingDays: 0, passed: 4, status: 'Approved', decidedNote: 'Duyệt 28/09' },
  { id: 'REG-0015', horse: { name: 'Night Owl', breed: 'Akhal-Teke', sex: '♀', age: 6, code: 'VN-MC-9015' }, owner: { fullName: 'Đỗ Minh Quân', email: 'quan@example.com', phone: '0912345678' }, submittedAt: '25/09/2026 11:20', waitingDays: 0, passed: 3, status: 'Rejected', decidedNote: 'Cho phép nộp lại' },
  { id: 'REG-0014', horse: { name: 'Spirit', breed: 'Quarter Horse', sex: '♀', age: 5, code: 'VN-MC-0024' }, owner: { fullName: 'Hoàng Thị Lan', email: 'lan@example.com', phone: '0901234567' }, submittedAt: '15/09/2026 09:00', waitingDays: 0, passed: 4, status: 'Approved', decidedNote: 'Duyệt 16/09' },
];

const PROTOCOLS: ProtocolWatch[] = [
  { id: 'PD-0011', horse: 'Storm', diagnosis: 'Sưng gân gấp chân trước trái', vet: 'Lê Thị Hương', state: 'REQUIRES_VET_REVIEW', label: 'Cần BS đánh giá lại', tone: 'danger', cost: 8400000, trainingLocked: true, open: true,
    path: ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_SHORTAGE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW'], alertState: 'REQUIRES_VET_REVIEW',
    materials: [{ item: 'Thuốc ABC · 10 lọ', status: 'Đủ · đã giữ 10', tone: 'success' }, { item: 'Bông gạc · 20 cuộn', status: 'Thiếu 12 · ETA 10/10', tone: 'danger' }, { item: 'Thuốc XYZ · 30 viên (GĐ 2)', status: 'Đủ', tone: 'success' }],
    note: 'Cần thuốc 08/10 — lô SHIP-0024 về 10/10, trễ 2 ngày so với mốc. Hệ thống đã cảnh báo BS Lê Thị Hương.',
    log: [{ tone: 'danger', who: 'Hệ thống', text: 'gắn DELAYED_MEDICINE, báo bác sĩ', at: '03/10 08:00' }, { tone: 'warning', who: 'BS Lê Thị Hương', text: 'chọn chờ hàng (ETA 07/10)', at: '02/10 17:40' }, { tone: 'warning', who: 'Trần Văn Kho', text: 'báo thiếu Bông gạc 12 cuộn', at: '02/10 17:05' }, { who: 'BS Lê Thị Hương', text: 'gửi kiểm tồn · thay thế PD-0010', at: '02/10 16:48' }] },
  { id: 'PD-0012', horse: 'Bolt', diagnosis: 'Viêm khớp nhẹ', vet: 'Lê Thị Hương', state: 'WAITING_STOCK_CHECK', label: 'Chờ kho kiểm tồn', tone: 'info', cost: 2400000, open: true,
    path: ['DRAFT', 'WAITING_STOCK_CHECK'], materials: [{ item: 'Thuốc XYZ · 20 viên', status: 'Đang kiểm', tone: 'neutral' }], note: 'Gửi kho lúc 02/10 10:00.',
    log: [{ who: 'BS Lê Thị Hương', text: 'gửi kiểm tồn', at: '02/10 10:00' }] },
  { id: 'PD-0009', horse: 'Wind', diagnosis: 'Theo dõi hô hấp · cách ly', vet: 'Lê Thị Hương', state: 'IN_TREATMENT', label: 'Đang điều trị · GĐ 1/2', tone: 'success', cost: 3100000, trainingLocked: true, open: true,
    path: ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_AVAILABLE', 'VET_CONFIRMED', 'READY_FOR_DISPENSING', 'IN_TREATMENT'], materials: [{ item: 'Kháng sinh K2 · 14 liều', status: 'Đã cấp phát', tone: 'success' }], note: 'Đánh giá lại 06/10.',
    log: [{ tone: 'success', who: 'Trần Văn Kho', text: 'cấp phát lô L-0912', at: '27/09 08:10' }, { tone: 'success', who: 'BS Lê Thị Hương', text: 'xác nhận phác đồ', at: '26/09 15:00' }] },
  { id: 'PD-0008', horse: 'Star', diagnosis: 'Phục hồi sau mỏi cơ', vet: 'Lê Thị Hương', state: 'READY_FOR_DISPENSING', label: 'Chờ cấp phát', tone: 'info', cost: 1250000, open: true,
    path: ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_AVAILABLE', 'VET_CONFIRMED', 'READY_FOR_DISPENSING'], materials: [{ item: 'Gel giảm đau · 2 tuýp', status: 'Đã giữ', tone: 'success' }], note: 'Kho chuẩn bị cấp trong ngày.',
    log: [{ tone: 'success', who: 'BS Lê Thị Hương', text: 'xác nhận phác đồ', at: '03/10 09:05' }] },
  { id: 'PD-0010', horse: 'Storm', diagnosis: 'Sưng gân gấp (bản cũ)', vet: 'Lê Thị Hương', state: 'SUPERSEDED', label: 'Đã thay thế', tone: 'neutral', cost: 7900000, open: false,
    path: ['DRAFT', 'WAITING_STOCK_CHECK', 'SUPERSEDED'], materials: [{ item: 'Bông gạc · 25 cuộn', status: 'Không cấp — bản đã bị thay', tone: 'neutral' }], note: 'Được thay bằng PD-0011; kho không cấp theo bản này.',
    log: [{ who: 'BS Lê Thị Hương', text: 'tạo bản mới PD-0011', at: '02/10 16:48' }] },
  { id: 'PD-0007', horse: 'Flash', diagnosis: 'Trầy xước nhẹ chân sau', vet: 'Lê Thị Hương', state: 'COMPLETED', label: 'Hoàn tất', tone: 'success', cost: 650000, open: false,
    path: ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_AVAILABLE', 'VET_CONFIRMED', 'READY_FOR_DISPENSING', 'IN_TREATMENT', 'COMPLETED'], materials: [{ item: 'Dung dịch sát khuẩn · 1 chai', status: 'Đã cấp', tone: 'success' }], note: 'Kết thúc 28/09.',
    log: [{ tone: 'success', who: 'BS Lê Thị Hương', text: 'đóng ca', at: '28/09 16:00' }] },
];

const SHIPMENTS: Shipment[] = [
  { id: 'SHIP-0024', item: 'Bông gạc · 50 cuộn', status: 'DELAYED', etaOld: '07/10', eta: '10/10', forRef: 'PD-0011' },
  { id: 'SHIP-0023', item: 'Thuốc ABC · 30 lọ', status: 'IN_TRANSIT', eta: '07/10', forRef: 'bổ sung tồn' },
];

const INVOICES: Invoice[] = [
  { id: 'INV-0042', horse: 'Galaxy', owner: 'Hoàng Thị Lan', period: '08/2026', dueDate: '05/09/2026', amount: 15000000, overdueDays: 28, status: 'SUSPENDED', suspendedSince: '30/09' },
  { id: 'INV-0038', horse: 'Bolt', owner: 'Vũ Thị Mai', period: '08/2026', dueDate: '07/09/2026', amount: 9000000, overdueDays: 26, status: 'OVERDUE' },
  { id: 'INV-0047', horse: 'Storm', owner: 'Đỗ Minh Quân', period: '09/2026', dueDate: '10/09/2026', amount: 6000000, overdueDays: 23, status: 'OVERDUE' },
  { id: 'INV-0049', horse: 'Star', owner: 'Vũ Thị Mai', period: '09/2026', dueDate: '01/10/2026', amount: 12500000, overdueDays: 2, status: 'OVERDUE' },
  { id: 'INV-0035', horse: 'Comet', owner: 'Lý Gia Hân', period: '07/2026', dueDate: '05/08/2026', amount: 11000000, overdueDays: 0, status: 'REACTIVATION_PENDING', paidRef: 'TXN-00061 · 02/10' },
  { id: 'INV-0051', horse: 'Arrow', owner: 'Đỗ Minh Quân', period: '09/2026', dueDate: '10/10/2026', amount: 8000000, overdueDays: 0, status: 'UNPAID', dueInDays: 7 },
  { id: 'INV-0050', horse: 'Flash', owner: 'Đỗ Minh Quân', period: '09/2026', dueDate: '10/09/2026', amount: 7500000, overdueDays: 0, status: 'PAID', paidRef: 'TXN-00052 · 08/09' },
];

const USERS: ManagedUser[] = [
  { id: 2, fullName: 'Nguyễn Văn Minh', username: 'admin', email: 'minh@horsetrack.vn', role: 'ClubManager', lastLogin: '03/10 08:02', status: 'ACTIVE', isSelf: true },
  { id: 3, fullName: 'Trần Đức Hùng', username: 'duchung', email: 'hung@horsetrack.vn', role: 'HeadTrainer', lastLogin: '03/10 07:45', status: 'ACTIVE' },
  { id: 4, fullName: 'Lê Thị Hương', username: 'thihuong', email: 'huong@horsetrack.vn', role: 'Veterinarian', lastLogin: '03/10 09:58', status: 'ACTIVE' },
  { id: 5, fullName: 'Trần Văn Kho', username: 'vankho', email: 'kho@horsetrack.vn', role: 'WarehouseManager', lastLogin: '02/10 17:05', status: 'ACTIVE' },
  { id: 6, fullName: 'Bùi Văn Đạt', username: 'vandat', email: 'dat@horsetrack.vn', role: 'WarehouseManager', lastLogin: '12/09 16:30', status: 'LOCKED', lockReason: 'Nghỉ việc từ 15/09' },
  { id: 7, fullName: 'Phạm Văn Toàn', username: 'vantoan', email: 'toan@horsetrack.vn', role: 'Groom', lastLogin: '03/10 05:40', status: 'ACTIVE', openTasks: 4 },
  { id: 8, fullName: 'Ngô Văn Sơn', username: 'vanson', email: 'son@horsetrack.vn', role: 'Groom', lastLogin: '03/10 06:10', status: 'ACTIVE', openTasks: 3 },
  { id: 9, fullName: 'Hoàng Thị Lan', username: 'hoanglan', email: 'lan@horsetrack.vn', role: 'HorseOwner', lastLogin: '01/10 09:15', status: 'ACTIVE', serviceSuspended: true, horsesOwned: 3 },
  { id: 10, fullName: 'Đỗ Minh Quân', username: 'minhquan', email: 'quan@example.com', role: 'HorseOwner', lastLogin: '30/09 14:30', status: 'ACTIVE', horsesOwned: 3 },
  { id: 11, fullName: 'Vũ Thị Mai', username: 'thimai', email: 'mai@example.com', role: 'HorseOwner', lastLogin: '29/09 10:00', status: 'ACTIVE', horsesOwned: 3 },
];

const AUDIT: AuditLog[] = [
  { id: 10250, at: '03/10/2026 10:26:12', who: 'Trần Đức Hùng', role: 'HeadTrainer', action: 'STOP_SESSION_REQUEST_VET', label: 'Dừng phiên, gửi ca khám', object: 'S-0023 · Galaxy', area: 'train', ip: '192.168.1.18', from: 'PAUSED_PENDING_TRAINER', to: 'STOPPED · tạo C-0015', reason: 'Ngựa thở gấp sau vòng 3, bước chân trước phải hơi ngắn — nghi chấn thương chân.' },
  { id: 10249, at: '03/10/2026 10:23:04', who: 'Hệ thống', role: 'System', action: 'SESSION_AUTO_PAUSE', label: 'Tự dừng phiên tập', object: 'S-0023 · Galaxy', area: 'train', ip: '—', from: 'IN_PROGRESS', to: 'PAUSED_PENDING_TRAINER', reason: 'Nhịp tim 195 bpm vượt ngưỡng 180 (BR_02). Đã báo HLV trưởng.' },
  { id: 10248, at: '03/10/2026 08:02:11', who: 'Nguyễn Văn Minh', role: 'ClubManager', action: 'LOGIN', label: 'Đăng nhập', object: 'admin', area: 'acct', ip: '192.168.1.15', isLogin: true },
  { id: 10247, at: '03/10/2026 08:00:00', who: 'Hệ thống', role: 'System', action: 'FLAG_DELAYED_MEDICINE', label: 'Gắn cảnh báo thuốc về trễ', object: 'PD-0011 · Storm', area: 'med', ip: '—', from: 'WAITING_RESTOCK', to: 'REQUIRES_VET_REVIEW', reason: 'ETA SHIP-0024 (10/10) vượt ngày cần thuốc 08/10. Đã báo BS Lê Thị Hương và Quản lý kho.' },
  { id: 10246, at: '02/10/2026 17:40:27', who: 'Lê Thị Hương', role: 'Veterinarian', action: 'DECIDE_WAIT_RESTOCK', label: 'Chọn chờ nhập hàng', object: 'PD-0011 · Storm', area: 'med', ip: '192.168.1.22', from: 'STOCK_SHORTAGE', to: 'WAITING_RESTOCK', reason: 'Chờ Bông gạc, ETA 07/10, cần dùng 08/10.' },
  { id: 10245, at: '02/10/2026 17:05:42', who: 'Trần Văn Kho', role: 'WarehouseManager', action: 'REPORT_STOCK_SHORTAGE', label: 'Báo thiếu vật tư', object: 'PD-0011 · Storm', area: 'med', ip: '192.168.1.30', from: 'WAITING_STOCK_CHECK', to: 'STOCK_SHORTAGE', reason: 'Bông gạc: tồn 8/20 cuộn, thiếu 12. Liên kết SHIP-0024.' },
  { id: 10244, at: '02/10/2026 16:48:03', who: 'Lê Thị Hương', role: 'Veterinarian', action: 'CREATE_PROTOCOL_VERSION', label: 'Tạo phiên bản phác đồ', object: 'PD-0011 · Storm', area: 'med', ip: '192.168.1.22', from: 'PD-0010 (bản cũ)', to: 'SUPERSEDED → PD-0011 DRAFT', reason: 'Giảm Bông gạc từ 25 xuống 20 cuộn, thêm GĐ 2 phục hồi gân.' },
  { id: 10243, at: '30/09/2026 08:15:30', who: 'Nguyễn Văn Minh', role: 'ClubManager', action: 'SUSPEND_SERVICE', label: 'Đình chỉ dịch vụ', object: 'INV-0042 · Hoàng Thị Lan', area: 'fin', ip: '192.168.1.15', from: 'OVERDUE', to: 'SUSPENDED', reason: 'Hóa đơn INV-0042 quá hạn 25 ngày, chưa có thanh toán được xác minh (BR_13).' },
  { id: 10242, at: '29/09/2026 00:00:00', who: 'Hệ thống', role: 'System', action: 'SEND_SUSPENSION_WARNING', label: 'Gửi cảnh báo trước đình chỉ', object: 'INV-0038 · Vũ Thị Mai', area: 'fin', ip: '—', reason: 'Còn 3 ngày đến mốc đình chỉ (BR_13).' },
  { id: 10241, at: '28/09/2026 09:12:08', who: 'Nguyễn Văn Minh', role: 'ClubManager', action: 'APPROVE_REGISTRATION', label: 'Phê duyệt hồ sơ ngựa', object: 'REG-0016 · Lightning', area: 'reg', ip: '192.168.1.15', from: 'PENDING_REVIEW', to: 'APPROVED', reason: 'Checklist 4/4 đạt.' },
  { id: 10240, at: '28/09/2026 08:03:55', who: 'Lê Thị Hương', role: 'Veterinarian', action: 'LOCK_TRAINING', label: 'Khóa huấn luyện', object: 'Storm · VN-MC-0042', area: 'train', ip: '192.168.1.22', from: 'Được tập', to: 'KHÓA TẬP', reason: 'Chấn thương chân trước trái (BR_01).' },
  { id: 10239, at: '25/09/2026 15:20:16', who: 'Nguyễn Văn Minh', role: 'ClubManager', action: 'REJECT_REGISTRATION', label: 'Từ chối hồ sơ ngựa', object: 'REG-0015 · Night Owl', area: 'reg', ip: '192.168.1.15', from: 'PENDING_REVIEW', to: 'REJECTED · cho phép nộp lại', reason: 'Giấy chứng nhận sức khỏe hết hạn từ 08/2026.' },
  { id: 10238, at: '15/09/2026 16:32:47', who: 'Nguyễn Văn Minh', role: 'ClubManager', action: 'LOCK_ACCOUNT', label: 'Khóa tài khoản', object: 'vandat · Bùi Văn Đạt', area: 'acct', ip: '192.168.1.15', from: 'ACTIVE', to: 'LOCKED', reason: 'Nghỉ việc từ 15/09.' },
];

/* ---------------- API ---------------- */
export const managerApi = {
  async getDashboard() {
    await wait(300);
    return {
      greeting: { name: 'Minh', weekday: 'Thứ Bảy', date: '03/10/2026' },
      autoStop: { session: 'S-0023', horse: 'Galaxy', at: '10:23', hr: 195, limit: 180, decidedBy: 'Trần Đức Hùng', caseId: 'C-0015', decidedAt: '10:26' },
      kpi: { horses: 12, horsesTrend: '+2 tháng này', pendingRegs: 3, oldestPendingDays: 4, medicalWatch: 2, lateTasks: 5, lateTasksToday: 3, delayedShipments: 1, delayedEta: '10/10' },
      recentRegistrations: clone(REGISTRATIONS.filter((r) => r.id !== 'REG-0015' && r.id !== 'REG-0014').sort((a, b) => b.id.localeCompare(a.id))),
      sessions: [
        { time: '08:00', horse: 'Bolt', plan: 'Tốc độ · P1', trainer: 'Trần Đức Hùng', status: 'Hoàn thành', tone: 'success' as const },
        { time: '10:00', horse: 'Galaxy', plan: 'Sức bền · P2', trainer: 'Trần Đức Hùng', status: 'Đã dừng — vượt ngưỡng', tone: 'danger' as const },
        { time: '11:00', horse: 'Thunder', plan: 'Sức bền · P1', trainer: 'Trần Đức Hùng', status: 'Sắp diễn ra', tone: 'info' as const },
        { time: '14:00', horse: 'Star', plan: 'Phục hồi · P1', trainer: 'Trần Đức Hùng', status: 'Chưa bắt đầu', tone: 'neutral' as const },
      ],
      medicalWatch: clone(PROTOCOLS.filter((p) => p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_STOCK_CHECK')),
      overdueInvoices: clone(INVOICES.filter((i) => i.status === 'SUSPENDED' || i.status === 'OVERDUE')),
      lateTasks: [
        { title: 'Cho ăn sáng — Galaxy', groom: 'Phạm Văn Toàn', due: '06:45', doneAt: '07:37', late: '+52 phút' },
        { title: 'Dọn chuồng — Thunder', groom: 'Phạm Văn Toàn', due: '08:15', late: '+2 giờ 15' },
        { title: 'Chải lông — Flash', groom: 'Ngô Văn Sơn', due: '08:45', late: '+1 giờ 45' },
      ],
      moreLateTasks: 2,
      vetCost: [{ month: 'T5', value: 5.2 }, { month: 'T6', value: 6.8 }, { month: 'T7', value: 5.9 }, { month: 'T8', value: 7.4 }, { month: 'T9', value: 7.6 }, { month: 'T10', value: 9.8 }],
      log: [
        { tone: 'danger' as const, who: 'Hệ thống', text: 'dừng phiên S-0023 (Galaxy)', at: '03/10 10:23' },
        { tone: 'warning' as const, who: 'Trần Văn Kho', text: 'báo thiếu Bông gạc cho PD-0011', at: '02/10 17:05' },
        { tone: 'success' as const, who: 'Nguyễn Văn Minh', text: 'duyệt hồ sơ REG-0016', at: '28/09 09:12' },
      ],
    };
  },

  async getRegistrations(): Promise<Registration[]> { await wait(250); return clone(REGISTRATIONS); },

  async getRegistrationDetail(id: string): Promise<RegistrationDetail> {
    await wait(250);
    const base = REGISTRATIONS.find((r) => r.id === id) ?? REGISTRATIONS[2];
    return {
      ...clone(base),
      owner: { ...base.owner, taxCode: '0123456789', billingAddress: '123 Lê Lợi, Q.1, TP.HCM', otherHorses: 'Galaxy, Thunder, Spirit' },
      horseExtra: { color: 'Bay (nâu đỏ)', height: '16.2 hands', weight: 480, microchip: '985141000012345', passport: 'VN-PP-2024-9019', healthCert: 'Chi cục Thú y TP.HCM · hết hạn 15/08/2027' },
      checklist: (() => {
        const fails: Record<string, Record<string, string>> = {
          'REG-0019': { ownership: 'File PDF bị mờ, không đọc được số đăng ký.' },
          'REG-0017': { health: 'Chưa tải giấy chứng nhận sức khỏe.', microchip: 'Số microchip chưa có trong cơ sở dữ liệu cơ quan.' },
          'REG-0015': { health: 'Giấy chứng nhận sức khỏe hết hạn từ 08/2026.' },
        };
        const f = fails[base.id] ?? {};
        return [
          { key: 'identity', label: 'Danh tính chủ ngựa', ok: 'Họ tên, CCCD và email khớp tài khoản.' },
          { key: 'health', label: 'Giấy chứng nhận sức khỏe còn hiệu lực', ok: 'Chi cục Thú y TP.HCM · hết hạn 15/08/2027.' },
          { key: 'microchip', label: 'Microchip đã đăng ký', ok: '985141000012345 khớp ảnh quét.' },
          { key: 'ownership', label: 'Giấy tờ sở hữu hợp lệ', ok: 'Bản gốc rõ, khớp tên chủ ngựa.' },
        ].map((c) => ({ key: c.key, label: c.label, detail: f[c.key] ?? c.ok, passed: !f[c.key] }));
      })(),
      attachments: [
        { name: 'Giấy chứng nhận sức khỏe', meta: 'PDF · 1,2 MB · 01/10' },
        { name: 'Giấy tờ sở hữu', meta: 'PDF · 0,4 MB · 01/10', problem: base.id === 'REG-0019' },
        { name: 'Ảnh quét microchip', meta: 'JPG · 2,8 MB · 01/10' },
      ],
      history: [
        { tone: 'info', who: 'Nguyễn Văn Minh', text: 'mở checklist', at: '03/10 10:28' },
        { who: 'Hệ thống', text: 'kiểm tra trường bắt buộc: đủ · chuyển PENDING_REVIEW', at: base.submittedAt.slice(0, 5) + ' ' + base.submittedAt.slice(11) },
        { who: base.owner.fullName, text: 'gửi hồ sơ', at: base.submittedAt.slice(0, 5) + ' ' + base.submittedAt.slice(11) },
      ],
    };
  },

  async approveRegistration(id: string, payload: { note?: string }) { await wait(700); return { success: true, message: `Hồ sơ ${id} đã được phê duyệt.` }; },
  async rejectRegistration(id: string, payload: { reason: string; allowResubmit: boolean }) {
    await wait(700);
    if (payload.reason.trim().length < 10) throw new Error('Lý do từ chối phải có ít nhất 10 ký tự.');
    return { success: true, message: `Đã từ chối hồ sơ ${id}.` };
  },

  async getMedicalMonitoring() { await wait(250); return { protocols: clone(PROTOCOLS), shipments: clone(SHIPMENTS), monthCost: 9.8 }; },

  async getInvoices() {
    await wait(250);
    return { items: clone(INVOICES), summary: { collectedSept: 7500000, overdue: 42500000, overdueCount: 4, pending: 8000000 } };
  },
  async suspendService(invoiceId: string, reason: string) { await wait(700); return { success: true }; },
  async reactivateService(invoiceId: string) { await wait(700); return { success: true }; },
  async sendReminder(invoiceId: string) { await wait(300); return { success: true }; },

  async getFinanceReport() {
    await wait(250);
    return {
      period: 'Q3/2026',
      collected: 128.4, billed: 171.9, billedCount: 21, overdue: 42.5, overdueCount: 4, rate: 74.7, rateDelta: -20,
      months: [
        { m: 'T4', billed: 52, collected: 50.1, q: false }, { m: 'T5', billed: 55, collected: 52.3, q: false }, { m: 'T6', billed: 54.5, collected: 51, q: false },
        { m: 'T7', billed: 56, collected: 46, q: true }, { m: 'T8', billed: 57, collected: 41, q: true }, { m: 'T9', billed: 58.9, collected: 41.4, q: true },
      ],
      aging: [
        { bucket: 'Ân hạn · 1–10 ngày', tone: 'warning' as const, ids: 'INV-0049', count: 1, amount: 12500000, suspended: false },
        { bucket: 'Tính phạt · 11–24 ngày', tone: 'danger' as const, ids: 'INV-0047', count: 1, amount: 6000000, suspended: false },
        { bucket: 'Đủ mốc đình chỉ · ≥ 25 ngày', tone: 'danger' as const, ids: 'INV-0038', count: 1, amount: 9000000, suspended: false },
        { bucket: 'Đang đình chỉ', tone: 'danger' as const, ids: 'INV-0042', count: 1, amount: 15000000, suspended: true },
      ],
      byService: [{ name: 'Huấn luyện', amount: 108000000 }, { name: 'Lưu chuồng · chăm sóc', amount: 45000000 }, { name: 'Y tế · thuốc', amount: 18900000 }],
      byOwner: [
        { owner: 'Vũ Thị Mai', ids: 'INV-0038 · INV-0049', amount: 21500000, suspended: false },
        { owner: 'Hoàng Thị Lan', ids: 'INV-0042', amount: 15000000, suspended: true },
        { owner: 'Đỗ Minh Quân', ids: 'INV-0047', amount: 6000000, suspended: false },
      ],
    };
  },

  async getUsers(): Promise<ManagedUser[]> { await wait(250); return clone(USERS); },
  checkRoleChange(user: ManagedUser, to: ManagedUser['role']): RoleCheck[] {
    const out: RoleCheck[] = [];
    if (to === 'HorseOwner' && user.role !== 'HorseOwner') out.push({ level: 'fail', text: 'Nhân sự đang chăm sóc / điều trị ngựa của CLB không thể đồng thời là chủ ngựa (xung đột lợi ích).' });
    if (user.role === 'HorseOwner' && to !== 'HorseOwner') out.push({ level: 'fail', text: `${user.fullName} đang sở hữu ${user.horsesOwned ?? 0} ngựa trong CLB — không thể nhận vai trò nhân sự.` });
    if (user.openTasks) out.push({ level: 'warn', text: `${user.openTasks} công việc chăm sóc đang mở sẽ phải giao lại cho mã phu khác.` });
    if (to === 'ClubManager') out.push({ level: 'warn', text: 'Vai trò có quyền quản trị người dùng, tài chính và nhật ký — kiểm tra kỹ trước khi cấp.' });
    out.push({ level: 'pass', text: 'Không có phiên tập hoặc ca khám đang diễn ra do người này phụ trách.' });
    return out;
  },
  async changeRole(userId: number, role: ManagedUser['role'], reason: string) { await wait(600); return { success: true }; },
  async lockUser(userId: number, reason: string) { await wait(600); return { success: true }; },
  async unlockUser(userId: number, reason: string) { await wait(600); return { success: true }; },

  async getAuditLogs() { await wait(250); return { total: 342, items: clone(AUDIT) }; },
};
