import { DEMO_NOW, http } from './http';
import { EMAIL_TIMEOUT, USE_BACKEND, be, beData, type ApiResponse } from './beClient';
import { invalidate } from './hybridAdapter';

export type RegStatus = 'Pending' | 'Approved' | 'Rejected';
export interface ChecklistItem { key: string; label: string; detail: string; passed: boolean }
export interface HistoryItem { tone?: 'danger' | 'warning' | 'success' | 'info'; who: string; text: string; at: string }
export interface Registration {
  id: string;
  horse: { name: string; breed: string; sex: string; age: number; code: string };
  owner: { fullName: string; email: string; phone: string };
  submittedAt: string;
  waitingDays: number;
  passed: number;
  firstIssue?: string;
  status: RegStatus;
  decidedNote?: string;
  ownerExtra: { otherHorses: string };
  horseExtra: { color: string; height: string; weight: number; passport: string; healthCert: string };
  checklist: ChecklistItem[];
  attachments: { name: string; meta: string; problem?: boolean }[];
  history: HistoryItem[];
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
export interface Shipment { id: string; item: string; status: 'ORDERED' | 'IN_TRANSIT' | 'DELAYED' | 'RECEIVED' | 'CANCELLED'; etaOld?: string; eta: string; forRef: string }

export type InvoiceStatus = 'UNPAID' | 'OVERDUE' | 'SUSPENDED' | 'REACTIVATION_PENDING' | 'PAID' | 'ACTIVE';
export interface Invoice {
  id: string; horse: string; owner: string; period: string; dueDate: string; amount: number;
  overdueDays: number; status: InvoiceStatus; suspendedSince?: string; paidRef?: string; dueInDays?: number;
}

export type UserRole = 'ClubManager' | 'HeadTrainer' | 'Veterinarian' | 'WarehouseManager' | 'Groom' | 'HorseOwner';
export interface ManagedUser {
  id: string; fullName: string; username: string; email: string; role: UserRole;
  lastLogin: string; status: 'ACTIVE' | 'LOCKED'; lockReason?: string;
  openTasks?: number; horsesOwned?: number; serviceSuspended?: boolean; avatarUrl?: string | null;
  beId?: number;
}
export interface GroomAssignment { id: string; name: string; zones: string[] }
export type StaffRole = 'HeadTrainer' | 'Veterinarian' | 'Groom' | 'WarehouseManager';
export interface StaffInput {
  fullName: string; username: string; email: string; phone: string; password: string; role: StaffRole;
  licenseNumber?: string;
  specialization?: string;
}
export const BE_STAFF_ROLE: Partial<Record<StaffRole, string>> = { HeadTrainer: 'Trainer', Veterinarian: 'Veterinarian', Groom: 'Groom', WarehouseManager: 'Warehouse Manager' };
export interface AssignedStall { id: string; zone: string; horseId: string | null; horse: string | null; status: string; groom: string }
export interface AssignedHorse { id: string; name: string; owner: string; stall: string; health: string; trainerId?: string }
export interface RoleCheck { level: 'pass' | 'warn' | 'fail'; text: string }

export type AuditArea = 'reg' | 'med' | 'train' | 'fin' | 'acct';
export interface AuditLog {
  id: number; at: string; who: string; role: string; action: string; label: string;
  object: string; area: AuditArea; ip: string; from?: string; to?: string; reason?: string; isLogin?: boolean;
}

export interface Actor { id?: string; name: string; role: string }

export const GRACE_DAYS = 10;
export const SUSPEND_AT = 25;

const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;

export const addAudit = (actor: Actor, e: Omit<AuditLog, 'id' | 'at' | 'who' | 'role' | 'ip'>) =>
  http.post<AuditLog>('/auditLogs', {
    id: Date.now(),
    at: `${DEMO_NOW.date} ${DEMO_NOW.time}:00`,
    who: actor.name,
    role: actor.role,
    ip: '127.0.0.1',
    ...e,
  }).then((r) => r.data);

interface UserRecord extends Omit<ManagedUser, 'fullName'> { fullname: string; password?: string }
const beUserAction = async (url: string, body: Record<string, string>): Promise<ManagedUser> => {
  const u = await beData<{ userId: number; username: string; fullName: string; email: string; role?: string; roleName: string; status?: string; lockReason?: string | null; openTasks?: number; horsesOwned?: number; lastLogin?: string | null }>(be.put(url, body));
  invalidate('users', 'auditLogs');
  return {
    id: String(u.userId), username: u.username, fullName: u.fullName, email: u.email, role: (u.role ?? u.roleName) as UserRole,
    status: u.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE', lockReason: u.lockReason ?? undefined, openTasks: u.openTasks ?? 0, horsesOwned: u.horsesOwned ?? 0, lastLogin: u.lastLogin && /^\d{4}-\d{2}-\d{2}/.test(u.lastLogin) ? `${u.lastLogin.slice(8, 10)}/${u.lastLogin.slice(5, 7)} ${u.lastLogin.slice(11, 16)}` : u.lastLogin || '—',
  };
};
const toManaged = ({ password: _pw, fullname, ...u }: UserRecord): ManagedUser => ({ ...u, fullName: fullname });

export const managerApi = {
  async getDashboard() {
    const [dash, regs, protocols, invoices, shipments, logs] = await Promise.all([
      get<any>('/dashboard'),
      get<Registration[]>('/registrations'),
      get<ProtocolWatch[]>('/protocols'),
      get<Invoice[]>('/invoices'),
      get<Shipment[]>('/shipments'),
      get<AuditLog[]>('/auditLogs', { _sort: 'id', _order: 'desc', _limit: 10 }),
    ]);
    const pending = regs.filter((r) => r.status === 'Pending');
    const delayed = shipments.filter((s) => s.status === 'DELAYED');
    const AREA_TONE: Record<AuditArea, 'danger' | 'warning' | 'success' | 'info'> = { train: 'danger', med: 'warning', reg: 'success', fin: 'info', acct: 'info' };
    return {
      ...dash,
      kpi: {
        ...dash.kpi,
        pendingRegs: pending.length,
        oldestPendingDays: Math.max(0, ...pending.map((r) => r.waitingDays)),
        medicalWatch: protocols.filter((p) => p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_STOCK_CHECK').length,
        delayedShipments: delayed.length,
        delayedEta: delayed[0]?.eta.slice(0, 5) ?? '—',
      },
      recentRegistrations: regs.filter((r) => r.id >= 'REG-0016').sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4),
      medicalWatch: protocols.filter((p) => p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_STOCK_CHECK'),
      overdueInvoices: invoices.filter((i) => i.status === 'SUSPENDED' || i.status === 'OVERDUE'),
      log: logs.filter((l) => !l.isLogin).slice(0, 3).map((l) => ({ tone: AREA_TONE[l.area], who: l.who, text: l.label.charAt(0).toLowerCase() + l.label.slice(1) + ' · ' + l.object, at: l.at.slice(0, 5) + ' ' + l.at.slice(11, 16) })),
    } as {
      greeting: { weekday: string; date: string };
      autoStop: { session: string; horse: string; at: string; hr: number; limit: number; decidedBy: string; caseId: string; decidedAt: string };
      kpi: { horses: number; horsesTrend: string; lateTasks: number; lateTasksToday: number; pendingRegs: number; oldestPendingDays: number; medicalWatch: number; delayedShipments: number; delayedEta: string };
      sessions: { time: string; horse: string; plan: string; trainer: string; status: string; tone: 'success' | 'danger' | 'info' | 'neutral' }[];
      lateTasks: { title: string; groom: string; due: string; doneAt?: string; late: string }[];
      moreLateTasks: number;
      vetCost: { month: string; value: number }[];
      recentRegistrations: Registration[];
      medicalWatch: ProtocolWatch[];
      overdueInvoices: Invoice[];
      log: { tone: 'danger' | 'warning' | 'success' | 'info'; who: string; text: string; at: string }[];
    };
  },

  getRegistrations: () => get<Registration[]>('/registrations'),
  getRegistration: (id: string) => get<Registration>(`/registrations/${id}`),

  async approveRegistration(reg: Registration, checklist: ChecklistItem[], note: string, actor: Actor, stall?: { id: number; code: string }) {
    const history: HistoryItem[] = [
      { tone: 'success', who: actor.name, text: `phê duyệt${stall ? ` · cấp chuồng ${stall.code}` : ''} · chuyển APPROVED${note ? `: “${note}”` : ''}`, at: DEMO_NOW.short },
      ...reg.history,
    ];
    const { data } = await http.patch<Registration>(`/registrations/${reg.id}`, {
      status: 'Approved', decidedNote: stall ? `Cấp chuồng ${stall.code}` : `Duyệt ${DEMO_NOW.date.slice(0, 5)}`, checklist, passed: checklist.length, firstIssue: null, history,
      stallId: stall?.id,
    });
    await addAudit(actor, { action: 'APPROVE_REGISTRATION', label: 'Phê duyệt hồ sơ ngựa', object: `${reg.id} · ${reg.horse.name}`, area: 'reg', from: 'PENDING_REVIEW', to: 'APPROVED', reason: note || `Checklist ${checklist.length}/${checklist.length} đạt.` });
    return data;
  },

  async rejectRegistration(reg: Registration, checklist: ChecklistItem[], reason: string, allowResubmit: boolean, actor: Actor) {
    if (reason.trim().length < 10) throw new Error('Lý do từ chối phải có ít nhất 10 ký tự.');
    const history: HistoryItem[] = [
      { tone: 'danger', who: actor.name, text: `từ chối${allowResubmit ? ' · cho phép nộp lại' : ''}: “${reason.trim()}”`, at: DEMO_NOW.short },
      ...reg.history,
    ];
    const { data } = await http.patch<Registration>(`/registrations/${reg.id}`, {
      status: 'Rejected', decidedNote: allowResubmit ? 'Cho phép nộp lại' : 'Không cho nộp lại', checklist, history,
    });
    await addAudit(actor, { action: 'REJECT_REGISTRATION', label: 'Từ chối hồ sơ ngựa', object: `${reg.id} · ${reg.horse.name}`, area: 'reg', from: 'PENDING_REVIEW', to: allowResubmit ? 'REJECTED · cho phép nộp lại' : 'REJECTED', reason: reason.trim() });
    return data;
  },

  async getMedicalMonitoring() {
    const [protocols, shipments, dash] = await Promise.all([get<ProtocolWatch[]>('/protocols'), get<Shipment[]>('/shipments'), get<any>('/dashboard')]);
    return { protocols, shipments, monthCost: dash.vetCost[dash.vetCost.length - 1].value as number };
  },

  getInvoices: () => get<Invoice[]>('/invoices'),

  async suspendService(inv: Invoice, reason: string, actor: Actor) {
    const { data } = await http.patch<Invoice>(`/invoices/${inv.id}`, { status: 'SUSPENDED', suspendedSince: DEMO_NOW.date.slice(0, 5) });
    const [owner] = await get<UserRecord[]>('/users', { fullname: inv.owner });
    if (owner) await http.patch(`/users/${owner.id}`, { serviceSuspended: true });
    await addAudit(actor, { action: 'SUSPEND_SERVICE', label: 'Đình chỉ dịch vụ', object: `${inv.id} · ${inv.owner}`, area: 'fin', from: 'OVERDUE', to: 'SUSPENDED', reason });
    return data;
  },

  async reactivateService(inv: Invoice, actor: Actor) {
    const { data } = await http.patch<Invoice>(`/invoices/${inv.id}`, { status: 'ACTIVE' });
    const [owner] = await get<UserRecord[]>('/users', { fullname: inv.owner });
    if (owner) await http.patch(`/users/${owner.id}`, { serviceSuspended: false });
    await addAudit(actor, { action: 'REACTIVATE_SERVICE', label: 'Kích hoạt lại dịch vụ', object: `${inv.id} · ${inv.owner}`, area: 'fin', from: 'REACTIVATION_PENDING', to: 'ACTIVE', reason: `Đã tất toán ${inv.paidRef} (BR_14).` });
    return data;
  },

  async sendReminder(inv: Invoice, actor: Actor) {
    await addAudit(actor, { action: 'SEND_PAYMENT_REMINDER', label: 'Gửi nhắc thanh toán', object: `${inv.id} · ${inv.owner}`, area: 'fin', reason: `Quá hạn ${inv.overdueDays} ngày.` });
  },

  async getFinanceReport() {
    const [base, invoices] = await Promise.all([get<any>('/financeReport'), get<Invoice[]>('/invoices')]);
    const unpaid = invoices.filter((i) => i.status === 'OVERDUE' || i.status === 'SUSPENDED');
    const bucket = (pred: (i: Invoice) => boolean) => { const xs = unpaid.filter(pred); return { ids: xs.map((x) => x.id).join(' · ') || '—', count: xs.length, amount: xs.reduce((s, x) => s + x.amount, 0) }; };
    const aging = [
      { bucket: 'Ân hạn · 1–10 ngày', tone: 'warning' as const, suspended: false, ...bucket((i) => i.status === 'OVERDUE' && i.overdueDays <= GRACE_DAYS) },
      { bucket: 'Tính phạt · 11–24 ngày', tone: 'danger' as const, suspended: false, ...bucket((i) => i.status === 'OVERDUE' && i.overdueDays > GRACE_DAYS && i.overdueDays < SUSPEND_AT) },
      { bucket: 'Đủ mốc đình chỉ · ≥ 25 ngày', tone: 'danger' as const, suspended: false, ...bucket((i) => i.status === 'OVERDUE' && i.overdueDays >= SUSPEND_AT) },
      { bucket: 'Đang đình chỉ', tone: 'danger' as const, suspended: true, ...bucket((i) => i.status === 'SUSPENDED') },
    ];
    const owners = new Map<string, { owner: string; ids: string[]; amount: number; suspended: boolean }>();
    unpaid.forEach((i) => {
      const o = owners.get(i.owner) ?? { owner: i.owner, ids: [], amount: 0, suspended: false };
      o.ids.push(i.id); o.amount += i.amount; o.suspended = o.suspended || i.status === 'SUSPENDED';
      owners.set(i.owner, o);
    });
    const overdueTotal = unpaid.reduce((s, i) => s + i.amount, 0);
    return {
      ...base,
      overdue: Math.round(overdueTotal / 100000) / 10,
      overdueCount: unpaid.length,
      aging,
      byOwner: [...owners.values()].sort((a, b) => b.amount - a.amount).map((o) => ({ ...o, ids: o.ids.join(' · ') })),
    } as {
      period: string; collected: number; billed: number; billedCount: number; rate: number; rateDelta: number; overdue: number; overdueCount: number;
      months: { m: string; billed: number; collected: number; q: boolean }[];
      byService: { name: string; amount: number }[];
      aging: { bucket: string; tone: 'warning' | 'danger'; suspended: boolean; ids: string; count: number; amount: number }[];
      byOwner: { owner: string; ids: string; amount: number; suspended: boolean }[];
    };
  },

  getUsers: async () => (await get<UserRecord[]>('/users')).map(toManaged),

  async createStaff(input: StaffInput, actor: Actor): Promise<ManagedUser & { emailNote?: string; emailFailed?: boolean }> {
    const v = { ...input, fullName: input.fullName.trim(), username: input.username.trim(), email: input.email.trim(), phone: input.phone.replace(/\s/g, '') };
    let id: string;
    let emailNote: string | undefined;
    if (USE_BACKEND) {
      const roleName = BE_STAFF_ROLE[v.role];
      if (!roleName) throw new Error('Backend chưa hỗ trợ tạo tài khoản Quản lý kho.');
      const { data } = await be.post<ApiResponse<null>>('/auth/staff/create', {
        username: v.username, password: v.password, fullName: v.fullName, email: v.email, phone: v.phone || undefined,
        roleName, licenseNumber: v.licenseNumber?.trim() || undefined, specialization: v.specialization?.trim() || undefined,
      }, { timeout: EMAIL_TIMEOUT });
      emailNote = data.message;
      id = `be-${v.username}`;
    } else {
      const users = await get<UserRecord[]>('/users');
      if (users.some((u) => u.username.toLowerCase() === v.username.toLowerCase())) throw new Error('Tên đăng nhập đã tồn tại.');
      if (users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) throw new Error('Email đã được sử dụng.');
      id = String(Math.max(0, ...users.map((u) => Number(u.id) || 0)) + 1);
      await http.post('/users', { id, username: v.username, password: v.password, fullname: v.fullName, email: v.email, phone: v.phone, role: v.role, status: 'ACTIVE', lastLogin: '—', openTasks: 0 });
      if (v.role === 'Groom') await http.post('/grooms', { id, name: v.fullName, zones: v.specialization ? [v.specialization] : [] });
    }
    await addAudit(actor, { action: 'CREATE_ACCOUNT', label: 'Tạo tài khoản nhân viên', object: `${v.username} · ${v.fullName}`, area: 'acct', from: '—', to: v.role, reason: 'Quản lý CLB cấp tài khoản cho nhân viên' });
    return {
      id, fullName: v.fullName, username: v.username, email: v.email, role: v.role, lastLogin: '—', status: 'ACTIVE', openTasks: 0,
      emailNote, emailFailed: !!emailNote && /KHÔNG gửi được email/i.test(emailNote),
    };
  },

  async getGroomAssignments() {
    const [grooms, stalls, horses] = await Promise.all([
      get<GroomAssignment[]>('/grooms'), get<AssignedStall[]>('/stalls'), get<AssignedHorse[]>('/horses'),
    ]);
    return { grooms, stalls, horses };
  },

  async assignGroom(user: ManagedUser, zones: string[], horseIds: string[], actor: Actor) {
    if (user.role !== 'Groom') throw new Error('Chỉ có thể phân công cho Người chăm ngựa.');
    if (!zones.length) throw new Error('Chọn ít nhất một khu chăm sóc.');
    const assignments = await managerApi.getGroomAssignments();
    const target = assignments.grooms.find((g) => g.id === user.id || g.name === user.fullName);
    if (!target) throw new Error('Không tìm thấy hồ sơ phân công của người chăm ngựa.');
    const selected = new Set(horseIds);
    const invalid = assignments.horses.find((h) => selected.has(h.id) && !zones.includes(assignments.stalls.find((s) => s.horseId === h.id)?.zone ?? ''));
    if (invalid) throw new Error(`${invalid.name} không thuộc khu đã chọn.`);
    await http.patch(`/grooms/${target.id}`, { zones });
    await Promise.all(assignments.stalls.map((s) => {
      if (selected.has(s.horseId ?? '')) return http.patch(`/stalls/${s.id}`, { groom: user.fullName });
      if (s.groom === user.fullName) return http.patch(`/stalls/${s.id}`, { groom: 'Chưa phân công' });
      return Promise.resolve();
    }));
    await addAudit(actor, { action: 'ASSIGN_GROOM_SCOPE', label: 'Phân công khu và ngựa cho mã phu', object: user.fullName, area: 'acct', from: target.zones.join(', '), to: `${zones.join(', ')} · ${horseIds.length} ngựa`, reason: 'Cập nhật phạm vi chăm sóc' });
    return { zones, horseIds };
  },

  async assignTrainer(user: ManagedUser, horseIds: string[], actor: Actor) {
    if (user.role !== 'HeadTrainer') throw new Error('Chỉ có thể phân công cho HLV trưởng.');
    const assignments = await managerApi.getGroomAssignments();
    const selected = new Set(horseIds);
    await Promise.all(assignments.horses.map((h) => {
      if (selected.has(h.id)) return http.patch(`/horses/${h.id}`, { trainerId: user.id });
      if (h.trainerId === user.id) return http.patch(`/horses/${h.id}`, { trainerId: '' });
      return Promise.resolve();
    }));
    await addAudit(actor, { action: 'ASSIGN_TRAINER_SCOPE', label: 'Phân công ngựa cho HLV trưởng', object: user.fullName, area: 'acct', from: '—', to: `${horseIds.length} ngựa`, reason: 'Cập nhật phạm vi phụ trách huấn luyện' });
    return { horseIds };
  },

  checkRoleChange(user: ManagedUser, to: UserRole): RoleCheck[] {
    const out: RoleCheck[] = [];
    if (to === 'HorseOwner' && user.role !== 'HorseOwner') out.push({ level: 'fail', text: 'Nhân sự đang chăm sóc / điều trị ngựa của CLB không thể đồng thời là chủ ngựa (xung đột lợi ích).' });
    if (user.role === 'HorseOwner' && to !== 'HorseOwner' && (user.horsesOwned ?? 0) > 0) out.push({ level: 'fail', text: `${user.fullName} đang sở hữu ${user.horsesOwned} ngựa trong CLB — không thể nhận vai trò nhân sự.` });
    if (user.openTasks) out.push({ level: 'warn', text: `${user.openTasks} công việc chăm sóc đang mở sẽ phải giao lại cho mã phu khác.` });
    if (to === 'ClubManager') out.push({ level: 'warn', text: 'Vai trò có quyền quản trị người dùng, tài chính và nhật ký — kiểm tra kỹ trước khi cấp.' });
    out.push({ level: 'pass', text: 'Không có phiên tập hoặc ca khám đang diễn ra do người này phụ trách.' });
    return out;
  },

  async changeRole(user: ManagedUser, role: UserRole, reason: string, actor: Actor) {
    if (USE_BACKEND) return beUserAction(`/users/${user.id}/role`, { roleName: role, reason: reason.trim() });
    const { data } = await http.patch<UserRecord>(`/users/${user.id}`, { role, openTasks: 0 });
    await addAudit(actor, { action: 'CHANGE_ROLE', label: 'Đổi vai trò', object: `${user.username} · ${user.fullName}`, area: 'acct', from: user.role, to: role, reason });
    return toManaged(data);
  },

  async lockUser(user: ManagedUser, reason: string, actor: Actor) {
    if (USE_BACKEND) return beUserAction(`/users/${user.id}/lock`, { reason: reason.trim() });
    const { data } = await http.patch<UserRecord>(`/users/${user.id}`, { status: 'LOCKED', lockReason: reason });
    await addAudit(actor, { action: 'LOCK_ACCOUNT', label: 'Khóa tài khoản', object: `${user.username} · ${user.fullName}`, area: 'acct', from: 'ACTIVE', to: 'LOCKED', reason });
    return toManaged(data);
  },

  async unlockUser(user: ManagedUser, reason: string, actor: Actor) {
    if (USE_BACKEND) return beUserAction(`/users/${user.id}/unlock`, { reason: reason.trim() });
    const { data } = await http.patch<UserRecord>(`/users/${user.id}`, { status: 'ACTIVE', lockReason: null });
    await addAudit(actor, { action: 'UNLOCK_ACCOUNT', label: 'Mở khóa tài khoản', object: `${user.username} · ${user.fullName}`, area: 'acct', from: 'LOCKED', to: 'ACTIVE', reason });
    return toManaged(data);
  },

  getAuditLogs: () => get<AuditLog[]>('/auditLogs', { _sort: 'id', _order: 'desc' }),
};
