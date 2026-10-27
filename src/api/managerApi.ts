import { DEMO_NOW, http } from './http';
import { EMAIL_TIMEOUT, USE_BACKEND, be, beData, type ApiResponse } from './beClient';
import { invalidate } from './hybridAdapter';
import { assignmentApi, assignmentText } from './assignmentApi';
import { financeBe } from './beFinance';

export type RegStatus = 'Pending' | 'Approved' | 'Rejected';
export interface ChecklistItem { key: string; label: string; detail: string; passed: boolean }
export interface HistoryItem { tone?: 'danger' | 'warning' | 'success' | 'info'; who: string; text: string; at: string }
export interface Registration {
  id: string;
  beId?: number;
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
  attachments: { name: string; meta: string; problem?: boolean; beId?: number; mime?: string; file?: string; docType?: string }[];
  history: HistoryItem[];
}

export type ProtocolState =
  | 'DRAFT' | 'WAITING_STOCK_CHECK' | 'STOCK_SHORTAGE' | 'STOCK_AVAILABLE' | 'WAITING_RESTOCK' | 'REQUIRES_VET_REVIEW'
  | 'VET_CONFIRMED' | 'READY_FOR_DISPENSING' | 'IN_TREATMENT' | 'ON_HOLD_PAYMENT' | 'COMPLETED' | 'SUPERSEDED' | 'CANCELLED';
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
  zones?: string[];
  beId?: number;
  emailConfirmed?: boolean;
}
export interface GroomAssignment { id: string; name: string; zones: string[]; role?: UserRole; pendingNote?: string }
export type StaffRole = 'HeadTrainer' | 'Veterinarian' | 'Groom' | 'WarehouseManager';
export interface StaffInput {
  fullName: string; username: string; email: string; phone: string; password: string; role: StaffRole;
  licenseNumber?: string;
  specialization?: string;
}
export const BE_STAFF_ROLE: Partial<Record<StaffRole, string>> = { HeadTrainer: 'Trainer', Veterinarian: 'Veterinarian', Groom: 'Groom', WarehouseManager: 'Warehouse Manager' };
export interface AssignedStall { id: string; zone: string; horseId: string | null; horse: string | null; status: string; groom: string }
export interface AssignedHorse { id: string; name: string; owner: string; stall: string; health: string; trainerId?: string; trainerName?: string | null; pendingNote?: string }
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

interface BeOverdueTask { taskCode?: string | null; title?: string | null; taskType: string; horseName?: string | null; groomName?: string | null; taskDate?: string | null; scheduledTime?: string | null }
const lateBy = (task: BeOverdueTask) => {
  if (!task.taskDate || !task.scheduledTime) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(`${task.taskDate}T${task.scheduledTime}`).getTime()) / 60000));
  return minutes >= 60 ? `+${Math.floor(minutes / 60)} giờ ${String(minutes % 60).padStart(2, '0')}` : `+${minutes} phút`;
};
const loadOverdueTasks = async () => {
  if (!USE_BACKEND) return null;
  const rows = await beData<BeOverdueTask[]>(be.get('/care-tasks/overdue')).catch(() => null);
  return rows?.map((task) => ({
    title: `${task.title || task.taskType}${task.horseName ? ` — ${task.horseName}` : ''}`,
    groom: task.groomName ?? '—', due: task.scheduledTime?.slice(0, 5) ?? '—', late: lateBy(task),
  })) ?? null;
};

interface BeHorseLite { horseId: number; horseName: string; approvalStatus?: string | null; stallId?: number | null; createdAt?: string | null; assignedTrainerName?: string | null }
interface BePlanLite { planId: number; planName: string; horseName: string; startDate: string; endDate: string; status: string }
interface BePlanSessions { planId: number; planName: string; horseName: string; sessions?: { sessionId: number; sessionDate: string; activityType: string; status: string; notes?: string | null; assignedToName?: string | null }[] }
type SessionTone = 'success' | 'danger' | 'info' | 'neutral' | 'warning';
const SESSION_LABEL: Record<string, [string, SessionTone]> = {
  PENDING: ['Chờ Mã phu xác nhận', 'neutral'], CONFIRMED: ['Sắp diễn ra', 'info'], IN_PROGRESS: ['Đang tập', 'info'],
  PAUSED: ['Tạm dừng — chờ HLV', 'warning'], PAUSED_PENDING_TRAINER: ['Tạm dừng — chờ HLV', 'warning'],
  WAITING_VET: ['Đã dừng — chờ Bác sĩ', 'danger'], STOPPED: ['Đã dừng', 'danger'], COMPLETED: ['Hoàn thành', 'success'], CANCELLED: ['Đã hủy', 'neutral'],
};
const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const vetCostByMonth = (protocols: ProtocolWatch[], months = 6) => {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const total = protocols
      .filter((p) => !['CANCELLED', 'SUPERSEDED', 'DRAFT'].includes(p.state) && String((p as ProtocolWatch & { createdAt?: string }).createdAt ?? '').slice(3, 10) === key)
      .reduce((s, p) => s + (Number(p.cost) || 0), 0);
    return { month: `T${d.getMonth() + 1}`, value: Math.round(total / 100000) / 10 };
  });
};

const loadDashboardBe = async () => {
  const now = new Date();
  const today = localIso(now);
  const [horsesPage, plansPage] = await Promise.all([
    beData<{ horses: BeHorseLite[] }>(be.get('/horses', { params: { page: 0, size: 500 } })).catch(() => ({ horses: [] as BeHorseLite[] })),
    beData<{ content: BePlanLite[] }>(be.get('/training-plans', { params: { page: 0, size: 500 } })).catch(() => ({ content: [] as BePlanLite[] })),
  ]);
  const managed = horsesPage.horses.filter((h) => (h.approvalStatus ? h.approvalStatus === 'APPROVED' : h.stallId != null));
  const newThisMonth = managed.filter((h) => h.createdAt?.startsWith(today.slice(0, 7))).length;
  const running = plansPage.content.filter((p) => p.startDate.slice(0, 10) <= today && p.endDate.slice(0, 10) >= today);
  const details = await Promise.all(running.map((p) => beData<BePlanSessions>(be.get(`/training-plans/${p.planId}`)).catch(() => null)));
  const trainerOf = (horse: string) => managed.find((h) => h.horseName === horse)?.assignedTrainerName ?? '—';
  const todaySessions = details.flatMap((d) => (d?.sessions ?? [])
    .filter((x) => x.sessionDate.startsWith(today))
    .map((x) => {
      const [status, tone] = SESSION_LABEL[x.status?.toUpperCase()] ?? [x.status, 'neutral' as SessionTone];
      return { id: x.sessionId, time: x.sessionDate.slice(11, 16), horse: d!.horseName, plan: `${d!.planName} · ${x.activityType}`, trainer: trainerOf(d!.horseName), status, tone, raw: x.status?.toUpperCase(), note: x.notes ?? '' };
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
  return {
    greeting: { weekday: WEEKDAY[now.getDay()], date: `${today.slice(8, 10)}/${today.slice(5, 7)}/${today.slice(0, 4)}` },
    autoStop: null,
    stoppedToday: todaySessions.filter((x) => x.raw === 'WAITING_VET' || x.raw === 'STOPPED').map((x) => ({ session: `#${x.id}`, horse: x.horse, at: x.time, note: x.note.split(' | ').pop() ?? '' })),
    kpi: { horses: managed.length, horsesTrend: newThisMonth ? `+${newThisMonth} tháng này` : '', lateTasks: 0, lateTasksToday: 0 },
    sessions: todaySessions.map(({ time, horse, plan, trainer, status, tone, id }) => ({ id, time, horse, plan, trainer, status, tone })),
    lateTasks: [], moreLateTasks: 0, vetCost: [],
  };
};

export const managerApi = {
  async resendConfirmation(user: ManagedUser, actor: Actor) {
    if (!USE_BACKEND) throw new Error('Chỉ gửi lại mail xác nhận khi chạy với server.');
    if (user.emailConfirmed !== false) throw new Error(`${user.fullName} đã xác nhận tài khoản.`);
    const res = await be.post<ApiResponse<null>>(`/users/${user.beId ?? user.id}/resend-confirmation`, undefined, { timeout: EMAIL_TIMEOUT });
    invalidate('users');
    await addAudit(actor, { action: 'RESEND_STAFF_CONFIRMATION', label: 'Gửi lại mail xác nhận tài khoản', object: `${user.username} · ${user.email}`, area: 'acct' });
    return res.data.message;
  },
  async openAttachment(attachmentId: number) {
    if (!USE_BACKEND) throw new Error('Tệp chỉ xem được khi chạy với server.');
    const tab = window.open('', '_blank');
    try {
      const res = await be.get<Blob>(`/horses/registration-attachments/${attachmentId}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      tab?.close();
      throw e;
    }
  },

  async getDashboard() {
    const [dash, regs, protocols, invoices, shipments, logs, overdueTasks] = await Promise.all([
      USE_BACKEND ? loadDashboardBe() : get<any>('/dashboard'),
      get<Registration[]>('/registrations'),
      get<ProtocolWatch[]>('/protocols'),
      get<Invoice[]>('/invoices'),
      get<Shipment[]>('/shipments'),
      get<AuditLog[]>('/auditLogs', { _sort: 'id', _order: 'desc', _limit: 10 }),
      loadOverdueTasks(),
    ]);
    const pending = regs.filter((r) => r.status === 'Pending');
    const delayed = shipments.filter((s) => s.status === 'DELAYED');
    const AREA_TONE: Record<AuditArea, 'danger' | 'warning' | 'success' | 'info'> = { train: 'danger', med: 'warning', reg: 'success', fin: 'info', acct: 'info' };
    return {
      ...dash,
      ...(USE_BACKEND ? { vetCost: vetCostByMonth(protocols) } : {}),
      ...(overdueTasks ? { lateTasks: overdueTasks.slice(0, 4), moreLateTasks: Math.max(0, overdueTasks.length - 4) } : {}),
      kpi: {
        ...dash.kpi,
        ...(overdueTasks ? { lateTasks: overdueTasks.length, lateTasksToday: overdueTasks.length } : {}),
        pendingRegs: pending.length,
        oldestPendingDays: Math.max(0, ...pending.map((r) => r.waitingDays)),
        medicalWatch: protocols.filter((p) => p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_STOCK_CHECK').length,
        shortage: protocols.filter((p) => p.open !== false && (p.state === 'STOCK_SHORTAGE' || p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_RESTOCK')).length,
        delayedShipments: delayed.length,
        delayedEta: delayed[0]?.eta.slice(0, 5) ?? '—',
      },
      recentRegistrations: USE_BACKEND
        ? [...regs].sort((a, b) => Number((b as Registration & { beId?: number }).beId ?? 0) - Number((a as Registration & { beId?: number }).beId ?? 0)).slice(0, 4)
        : regs.filter((r) => r.id >= 'REG-0016').sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4),
      medicalWatch: protocols.filter((p) => p.state === 'REQUIRES_VET_REVIEW' || p.state === 'WAITING_STOCK_CHECK'),
      overdueInvoices: invoices.filter((i) => i.status === 'SUSPENDED' || i.status === 'OVERDUE'),
      log: logs.filter((l) => !l.isLogin).slice(0, 3).map((l) => ({ tone: AREA_TONE[l.area], who: l.who, text: l.label.charAt(0).toLowerCase() + l.label.slice(1) + ' · ' + l.object, at: l.at.slice(0, 5) + ' ' + l.at.slice(11, 16) })),
    } as {
      greeting: { weekday: string; date: string };
      autoStop: { session: string; horse: string; at: string; hr: number; limit: number; decidedBy: string; caseId: string; decidedAt: string } | null;
      stoppedToday?: { session: string; horse: string; at: string; note: string }[];
      kpi: { horses: number; horsesTrend: string; lateTasks: number; lateTasksToday: number; pendingRegs: number; oldestPendingDays: number; medicalWatch: number; shortage: number; delayedShipments: number; delayedEta: string };
      sessions: { id?: number; time: string; horse: string; plan: string; trainer: string; status: string; tone: SessionTone }[];
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
      stallId: stall?.id, decisionNote: note.trim() || undefined,
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
      status: 'Rejected', decidedNote: allowResubmit ? 'Cho phép nộp lại' : 'Không cho nộp lại', checklist, history, reason: reason.trim(), allowResubmit,
    });
    await addAudit(actor, { action: 'REJECT_REGISTRATION', label: 'Từ chối hồ sơ ngựa', object: `${reg.id} · ${reg.horse.name}`, area: 'reg', from: 'PENDING_REVIEW', to: allowResubmit ? 'REJECTED · cho phép nộp lại' : 'REJECTED', reason: reason.trim() });
    return data;
  },

  async getMedicalMonitoring() {
    const [protocols, shipments, dash] = await Promise.all([get<ProtocolWatch[]>('/protocols'), get<Shipment[]>('/shipments'), USE_BACKEND ? Promise.resolve({ vetCost: [] }) : get<any>('/dashboard')]);
    const costs = USE_BACKEND ? vetCostByMonth(protocols, 1) : dash.vetCost;
    return { protocols, shipments, monthCost: costs[costs.length - 1].value as number, costMonth: costs[costs.length - 1].month as string };
  },

  getInvoices: () => get<Invoice[]>('/invoices'),

  async suspendService(inv: Invoice, reason: string, actor: Actor) {
    if (USE_BACKEND) {
      await financeBe.suspendOwner(Number((inv as Invoice & { beOwnerId?: number }).beOwnerId), reason.trim());
      invalidate('invoices', 'auditLogs');
      return { ...inv, status: 'SUSPENDED' as const };
    }
    const { data } = await http.patch<Invoice>(`/invoices/${inv.id}`, { status: 'SUSPENDED', suspendedSince: DEMO_NOW.date.slice(0, 5) });
    const [owner] = await get<UserRecord[]>('/users', { fullname: inv.owner });
    if (owner) await http.patch(`/users/${owner.id}`, { serviceSuspended: true });
    await addAudit(actor, { action: 'SUSPEND_SERVICE', label: 'Đình chỉ dịch vụ', object: `${inv.id} · ${inv.owner}`, area: 'fin', from: 'OVERDUE', to: 'SUSPENDED', reason });
    return data;
  },

  async reactivateService(inv: Invoice, actor: Actor) {
    if (USE_BACKEND) {
      await financeBe.reactivateOwner(Number((inv as Invoice & { beOwnerId?: number }).beOwnerId));
      invalidate('invoices', 'auditLogs');
      return { ...inv, status: 'ACTIVE' as const };
    }
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
    if (USE_BACKEND) return financeBe.report();
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
    const v = { ...input, fullName: input.fullName.trim(), username: input.username.trim(), email: input.email.trim(), phone: input.phone.replace(/[\s.-]/g, '') };
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
      invalidate('users', 'auditLogs');
    } else {
      const users = await get<UserRecord[]>('/users');
      if (users.some((u) => u.username.toLowerCase() === v.username.toLowerCase())) throw new Error('Tên đăng nhập đã tồn tại.');
      if (users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) throw new Error('Email đã được sử dụng.');
      id = String(Math.max(0, ...users.map((u) => Number(u.id) || 0)) + 1);
      await http.post('/users', { id, username: v.username, password: v.password, fullname: v.fullName, email: v.email, phone: v.phone, role: v.role, status: 'ACTIVE', lastLogin: '—', openTasks: 0, zones: v.specialization && (v.role === 'HeadTrainer' || v.role === 'Groom') ? [v.specialization] : [] });
      if (v.role === 'Groom') await http.post('/grooms', { id, name: v.fullName, zones: v.specialization ? [v.specialization] : [] });
    }
    await addAudit(actor, { action: 'CREATE_ACCOUNT', label: 'Tạo tài khoản nhân viên', object: `${v.username} · ${v.fullName}`, area: 'acct', from: '—', to: v.role, reason: 'Quản lý CLB cấp tài khoản cho nhân viên' });
    return {
      id, fullName: v.fullName, username: v.username, email: v.email, role: v.role, lastLogin: '—', status: 'ACTIVE', openTasks: 0,
      emailNote, emailFailed: !!emailNote && /KHÔNG gửi được email/i.test(emailNote),
    };
  },

  async getGroomAssignments() {
    const [grooms, users, stalls, allHorses] = await Promise.all([
      get<GroomAssignment[]>('/grooms'), get<UserRecord[]>('/users'), get<AssignedStall[]>('/stalls'), get<AssignedHorse[]>('/horses'),
    ]);
    const horses = allHorses.filter((h) => h.stall && h.stall !== '—' && h.stall !== 'Chưa cấp chuồng')
      .map((h) => ({ ...h, trainerName: h.trainerName ?? users.find((u) => u.id === h.trainerId)?.fullname ?? null }));
    const zonesOfTrainer = (id: string) => [...new Set(horses.filter((h) => h.trainerId === id).map((h) => stalls.find((s) => s.horseId === h.id)?.zone).filter((z): z is string => !!z))];
    const staffZones = users
      .filter((u) => u.role === 'HeadTrainer' || u.role === 'Groom')
      .map((u) => ({ id: u.id, name: u.fullname, role: u.role, zones: u.role === 'HeadTrainer' ? zonesOfTrainer(u.id) : u.zones ?? [] }));
    if (USE_BACKEND) {
      const pending = await assignmentApi.pending();
      const horsesPending = horses.map((h) => {
        const req = pending.find((r) => r.horseId === Number(h.id) && (r.requestType === 'TRAINER_HORSE' || r.requestType === 'TRAINER_RELEASE'));
        return req ? { ...h, pendingNote: `Chờ xác nhận: ${assignmentText(req)}` } : h;
      });
      const groomsPending = staffZones.map((s) => {
        const req = pending.find((r) => r.requestType === 'GROOM_ZONE' && String(r.targetUserId) === s.id);
        return req ? { ...s, pendingNote: `Chờ xác nhận: ${assignmentText(req)}` } : s;
      });
      return { grooms: groomsPending, stalls, horses: horsesPending };
    }
    const allAssignments = [
      ...grooms.map((g) => ({ ...g, role: g.role ?? 'Groom' as const })),
      ...staffZones.filter((s) => !grooms.some((g) => g.id === s.id)),
    ];
    return { grooms: allAssignments, stalls, horses };
  },

  async assignGroom(user: ManagedUser, zones: string[], actor: Actor) {
    if (user.role !== 'Groom') throw new Error('Chỉ có thể phân công cho Người chăm ngựa.');
    if (zones.length > 1) throw new Error('Chỉ chọn một khu chăm sóc.');
    const assignments = await managerApi.getGroomAssignments();
    const target = assignments.grooms.find((g) => g.id === user.id || g.name === user.fullName);
    if (!target) throw new Error('Không tìm thấy hồ sơ phân công của người chăm ngựa.');
    if (USE_BACKEND) {
      const same = target.zones.length === zones.length && zones.every((z) => target.zones.includes(z));
      if (same) return { zones };
      await be.put(`/users/${target.id}/barn-zone`, { barnZone: zones[0] ?? null });
      invalidate('users', 'auditLogs');
      return { zones };
    }
    await http.patch(`/grooms/${target.id}`, { zones });
    await Promise.all(assignments.stalls.map((s) => {
      if (zones.includes(s.zone)) return http.patch(`/stalls/${s.id}`, { groom: user.fullName });
      if (s.groom === user.fullName) return http.patch(`/stalls/${s.id}`, { groom: 'Chưa phân công' });
      return Promise.resolve();
    }));
    await http.patch(`/users/${user.id}`, { zones });
    await addAudit(actor, { action: 'ASSIGN_GROOM_SCOPE', label: 'Phân công khu cho mã phu', object: user.fullName, area: 'acct', from: target.zones.join(', '), to: zones.join(', '), reason: 'Cập nhật khu chăm sóc' });
    return { zones };
  },

  async assignTrainer(user: ManagedUser, horseIds: string[], actor: Actor) {
    if (user.role !== 'HeadTrainer') throw new Error('Chỉ có thể phân công cho HLV trưởng.');
    const assignments = await managerApi.getGroomAssignments();
    const selected = new Set(horseIds);
    const dropped = assignments.horses.filter((h) => h.trainerId === user.id && !selected.has(h.id));
    const added = assignments.horses.filter((h) => selected.has(h.id) && h.trainerId !== user.id);
    if (USE_BACKEND) {
      if (!added.length && !dropped.length) throw new Error('Không có thay đổi phân công.');
      for (const h of added) await be.put(`/horses/${h.id}/assign-trainer`, { trainerId: Number(user.id) });
      for (const h of dropped) await be.delete(`/horses/${h.id}/assign-trainer`);
      invalidate('horses', 'auditLogs');
      return { horseIds };
    }
    await Promise.all([
      ...added.map((h) => http.patch(`/horses/${h.id}`, { trainerId: user.id })),
      ...dropped.map((h) => http.patch(`/horses/${h.id}`, { trainerId: '' })),
    ]);
    await addAudit(actor, { action: 'ASSIGN_TRAINER_HORSES', label: 'Phân công ngựa cho HLV trưởng', object: user.fullName, area: 'acct', from: `${assignments.horses.filter((h) => h.trainerId === user.id).length} ngựa`, to: `${horseIds.length} ngựa`, reason: 'Cập nhật ngựa phụ trách huấn luyện' });
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
