import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { be, type ApiResponse } from './beClient';
import { loadInvoices, loadPayments } from './beFinance';
import { fail, mockAdapter, queryRows, respond } from './mockServer';
import { loadAuditLogs, loadInventory, loadProtocols, loadRequisitions, loadShipments, loadStockChecks, loadStockTx, loadUsers } from './beDomain';


type Row = Record<string, unknown>;
interface Me { id: string; name: string; role: string }

const me = (): Me | null => {
  try {
    const u = JSON.parse(localStorage.getItem('horsetrack_user') ?? 'null') as { userId: string; fullname: string; role: string } | null;
    return u ? { id: u.userId, name: u.fullname, role: u.role } : null;
  } catch {
    return null;
  }
};

const data = async <T,>(url: string, params?: Record<string, unknown>) => (await be.get<ApiResponse<T>>(url, { params })).data.data;
const orEmpty = async <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);

const ddmmyyyy = (iso?: string | null) => {
  if (!iso) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(iso)) return iso.slice(0, 10);
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
const hhmm = (iso?: string | null) => (iso && iso.length > 15 ? iso.slice(11, 16) : '—');
const stamp = (iso?: string | null) => (iso ? `${ddmmyyyy(iso)} ${hhmm(iso)}` : '—');
const CARE_SLA_MINUTES = 45;
const plusMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '—';
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const zone = (z?: string | null) => (z ? z.replace(/^Zone\s+/i, 'Khu ') : '—');
const age = (dob?: string | null) => (dob ? Math.max(0, new Date().getFullYear() - Number(dob.slice(0, 4))) : 0);
const HEALTH: Record<string, string> = { healthy: 'HEALTHY', injured: 'INJURED', watch: 'WATCH', monitoring: 'WATCH', 'theo dõi': 'WATCH', quarantine: 'QUARANTINE', sick: 'WATCH', 'khỏe mạnh': 'HEALTHY' };
const health = (h?: string | null) => HEALTH[(h ?? '').toLowerCase()] ?? 'HEALTHY';
const sex = (g?: string | null) => (['mare', 'filly'].includes((g ?? '').toLowerCase()) ? '♀' : '♂');
const CLEAN: Record<string, string> = { clean: 'CLEAN', 'needs cleaning': 'NEEDS_CLEANING', needs_cleaning: 'NEEDS_CLEANING', 'under maintenance': 'MAINTENANCE', maintenance: 'MAINTENANCE' };
const SESSION: Record<string, string> = { PENDING: 'SCHEDULED', CONFIRMED: 'SCHEDULED', COMPLETED: 'COMPLETED', CANCELLED: 'STOPPED', IN_PROGRESS: 'IN_PROGRESS' };
const PLAN_STATUS: Record<string, string> = { PENDING: 'PLANNED', ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' };
const TASK_TYPE: Record<string, [string, string]> = {
  feeding: ['FEED', 'Cho ăn'], 'stall cleaning': ['CLEAN', 'Dọn chuồng'], 'grooming & bath': ['GROOM', 'Chải lông & tắm'],
  'ice bath therapy': ['COOL', 'Ngâm lạnh'], 'exercise walk': ['GROOM', 'Dắt đi bộ'], 'hoof care': ['GROOM', 'Chăm sóc móng'],
};

interface BeHorse { horseId: number; horseName: string; dob: string; gender: string; breed: string; pedigree?: string | null; weightKg: number; healthStatus: string; isLocked: boolean; ownerId: number; stallId: number | null; stallCode?: string | null; approvalStatus?: string | null; createdAt?: string | null;
  horseCode?: string | null; color?: string | null; heightHands?: number | null; passportNo?: string | null; healthCertIssuer?: string | null; healthCertExpiry?: string | null;
  registrationCode?: string | null; rejectReason?: string | null; allowResubmit?: boolean | null; assignedTrainerId?: number | null; assignedTrainerName?: string | null }
interface BeRegCheck { checkKey: string; passed: boolean; detail?: string | null; checkedByName?: string | null; checkedAt?: string | null }
interface BeRegistration { registrationCode?: string | null; ownerName?: string | null; submittedAt?: string | null; status: string; ownerNote?: string | null; decisionNote?: string | null; allowResubmit?: boolean | null; decidedByName?: string | null; decidedAt?: string | null; checks?: BeRegCheck[] | null }
interface BeStall { stallId: number; stallCode: string; barnZone: string; cleanStatus: string; currentHorseId: number | null; horseName: string | null }
interface BePlan { planId: number; planName: string; horseName: string; startDate: string; endDate: string; status: string; progress: number }
interface BePlanDetail { planId: number; planName: string; horseId: number | null; horseName: string; startDate: string; endDate: string; status: string; sessions: { sessionId: number; sessionDate: string; activityType: string; status: string; notes: string | null; assignedToId: number | null; assignedToName: string | null }[] }
interface BeSchedule { sessionId: number; sessionDate: string; activityType: string; status: string; planName: string; horseName: string; stallZone: string }
interface BeTask { taskId: number; taskCode?: string | null; taskType: string; title?: string | null; status: string; taskDate?: string | null; scheduledTime?: string | null; dueDate?: string | null; instructions?: string | null; completedAt?: string | null; horseName: string; stallCode?: string | null; stallZone: string; groomName?: string | null; warningNote?: string | null; overdue?: boolean | null }
interface BeCase { caseId: string; id?: number; horseId: number; horseName: string; source: string; issueType: string; severity: string; status: string; description: string; imageUrl?: string | null; reportedByName?: string | null; assignedVetName?: string | null; maxHeartRate: number; vetResult: string | null; createdAt: string; closedAt?: string | null }
interface BeVacc { recordCode: string; horseName: string; typeName: string; category: string; expectedDate: string; cycleMonths: number; status: string }
interface BeExam { proposalCode: string; proposalDate: string; horseName: string; ownerName: string; tournamentName: string; raceDate: string; distance: string; location: string; trainerName: string; tabStatus: string; resultStatus: string | null; vetNotes: string | null }
interface BeProtocol { protocolCode: string; horseName: string; diagnosis: string; caseCode: string; requiredDate: string; estimatedCost: string; status: string; nextStep: string }
interface BeShipment { lotCode: string; itemName: string; quantity: number; unit: string; eta: string; targetProtocol: string; status: string }

const stallsRaw = () => orEmpty(data<BeStall[]>('/stalls'));
const horsesRaw = async () => {
  const u = me();
  if (u?.role === 'WarehouseManager') return [];
  if (u?.role === 'HorseOwner') return orEmpty(data<BeHorse[]>(`/horses/my-horses/${u.id}`));
  return (await data<{ horses: BeHorse[] }>('/horses', { page: 0, size: 500 }).catch(() => ({ horses: [] }))).horses;
};
const byName = (rows: Row[], name?: string | null) => rows.find((r) => r.name === name);

const LOADERS: Record<string, () => Promise<Row[]>> = {
  async horses() {
    const u = me();
    const [hs, stalls] = await Promise.all([horsesRaw(), stallsRaw()]);
    return hs.filter((h) => u?.role !== 'HorseOwner' || isApproved(h)).map((h) => ({
      id: String(h.horseId), name: h.horseName, breed: h.breed, sex: sex(h.gender), age: age(h.dob), weightKg: h.weightKg,
      owner: u?.role === 'HorseOwner' && String(h.ownerId) === u.id ? u.name : `Chủ ngựa #${h.ownerId}`,
      stall: stalls.find((s) => s.stallId === h.stallId)?.stallCode ?? h.stallCode ?? '—',
      trainerId: h.assignedTrainerId ? String(h.assignedTrainerId) : u?.role === 'HeadTrainer' ? u.id : '', trainerName: h.assignedTrainerName ?? null,
      health: health(h.healthStatus), trainingLocked: !!h.isLocked, form: null, pendingCase: null,
      lock: h.isLocked ? { by: 'Bác sĩ thú y', at: '—', reason: 'Khóa từ hệ thống', review: '—' } : null,
      injuries: [], medicalHistory: [], raceResults: [], medicalDiet: null,
    }));
  },

  async stalls() {
    const [stalls, grooms] = await Promise.all([stallsRaw(), LOADERS.grooms()]);
    return stalls.map((s) => ({
      id: s.stallCode, beId: s.stallId, zone: zone(s.barnZone), horseId: s.currentHorseId ? String(s.currentHorseId) : null, horse: s.horseName,
      status: CLEAN[(s.cleanStatus ?? '').toLowerCase()] ?? 'CLEAN',
      groom: (grooms.find((g) => (g.zones as string[]).includes(zone(s.barnZone)))?.name as string) ?? 'Chưa phân công',
    }));
  },

  async grooms() {
    const u = me();
    const demo = ((await mockGet('/grooms')) as Row[]) ?? [];
    if (u?.role !== 'Groom') return demo;
    const p = await data<{ specialization?: string | null }>('/account/my-profile').catch(() => ({ specialization: null }));
    return [{ id: u.id, name: u.name, zones: p.specialization ? [zone(p.specialization)] : ['Khu A'] }, ...demo.filter((g) => g.id !== u.id)];
  },

  async trainingPlans() {
    if (me()?.role === 'HorseOwner') return (await ownerProgress()).map(({ plan }) => plan);
    const [page, horses] = await Promise.all([data<{ content: BePlan[] }>('/training-plans', { page: 0, size: 500 }).catch(() => ({ content: [] })), LOADERS.horses()]);
    return page.content.map((p) => {
      const weeks = Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (7 * 864e5)));
      return {
        id: String(p.planId), horseId: (byName(horses, p.horseName)?.id as string) ?? '', horseName: p.horseName, name: p.planName,
        type: 'Thể lực', goal: '', startDate: ddmmyyyy(p.startDate), createdBy: '—',
        phases: [{ no: 1, name: 'Toàn giáo án', weeks, intensity: 'Vừa', distanceM: 1200, sessionsPerWeek: 3, hrLimit: 180 }],
        currentPhase: 1, week: Math.max(1, Math.round((p.progress ?? 0) * weeks / 100)), status: PLAN_STATUS[(p.status ?? '').toUpperCase()] ?? 'PAUSED',
      };
    });
  },

  async trainingSessions() {
    const u = me();
    if (u?.role === 'HorseOwner') return (await ownerProgress()).flatMap(({ sessions }) => sessions);
    if (!u || !['HeadTrainer', 'Groom'].includes(u.role)) return [];
    if (u.role === 'HeadTrainer') {
      const plans = await LOADERS.trainingPlans();
      const details = await Promise.all(plans.map((p) => data<BePlanDetail>(`/training-plans/${p.id}`).catch(() => null)));
      return details.flatMap((d, i) => (d?.sessions ?? []).map((s) => ({
        id: String(s.sessionId), horseId: plans[i].horseId, horseName: d!.horseName, planId: String(d!.planId), phaseNo: 1, label: s.activityType,
        date: ddmmyyyy(s.sessionDate), time: hhmm(s.sessionDate), groom: s.assignedToName ?? '—', groomId: s.assignedToId ? String(s.assignedToId) : null,
        track: (s.notes ?? '').split(' · Ghi nhận:')[0] || '—', metrics: (s.notes ?? '').split(' · Ghi nhận:')[1]?.split(',').map((m) => m.trim()).filter(Boolean),
        status: SESSION[s.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: s.status?.toUpperCase() === 'CONFIRMED', thresholds: { hr: 180, speed: 60 }, readings: [], decision: null, evaluation: null,
      })));
    }
    const [rows, horses, plans] = await Promise.all([
      orEmpty(data<BeSchedule[]>('/training-sessions/my-schedule', { startDate: '2020-01-01', endDate: '2030-12-31' })), LOADERS.horses(), LOADERS.trainingPlans(),
    ]);
    return rows.map((s) => ({
      id: String(s.sessionId), horseId: (byName(horses, s.horseName)?.id as string) ?? '', horseName: s.horseName,
      planId: (plans.find((p) => p.name === s.planName)?.id as string) ?? '', phaseNo: 1, label: s.activityType,
      date: ddmmyyyy(s.sessionDate), time: hhmm(s.sessionDate), groom: u.role === 'Groom' ? u.name : '—', track: zone(s.stallZone),
      status: SESSION[s.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: s.status?.toUpperCase() === 'CONFIRMED', thresholds: { hr: 180, speed: 60 }, readings: [], decision: null, evaluation: null,
    }));
  },

  async tasks() {
    const u = me();
    if (u?.role !== 'Groom') return [];
    const [rows, horses] = await Promise.all([orEmpty(data<BeTask[]>('/care-tasks/my-tasks')), LOADERS.horses()]);
    return rows.map((t) => {
      const [type, typeTitle] = TASK_TYPE[(t.taskType ?? '').toLowerCase()] ?? ['GROOM', t.taskType];
      const h = byName(horses, t.horseName);
      const time = t.scheduledTime ? t.scheduledTime.slice(0, 5) : hhmm(t.dueDate);
      return {
        id: String(t.taskId), code: t.taskCode ?? null, date: ddmmyyyy(t.taskDate ?? t.dueDate), groom: u.name, zone: zone(t.stallZone), type, title: t.title || typeTitle,
        horseId: (h?.id as string) ?? null, horse: t.horseName, stall: t.stallCode ?? (h?.stall as string) ?? '—', time, sla: plusMinutes(time, CARE_SLA_MINUTES),
        status: (t.status ?? '').toUpperCase() === 'COMPLETED' || (t.status ?? '').toUpperCase() === 'DONE' ? 'DONE' : 'TODO',
        doneAt: t.completedAt ? hhmm(t.completedAt) : null, note: t.warningNote ?? '', photo: null,
        instructions: t.instructions ? t.instructions.split(/\r?\n|;\s*/).map((line) => line.trim()).filter(Boolean) : [],
        overdue: !!t.overdue,
      };
    });
  },

  async vetCases() {
    const rows = await orEmpty(data<BeCase[]>('/medical/cases'));
    const SRC: Record<string, string> = { GROOM: 'GROOM_REPORT', GROOM_REPORT: 'GROOM_REPORT', TRAINER: 'TRAINER_REQUEST', TRAINER_REQUEST: 'TRAINER_REQUEST' };
    const ST: Record<string, string> = { NEW: 'NEW', PENDING: 'NEW', IN_EXAM: 'NEW', MONITORING: 'MONITORING', CLOSED: 'CLOSED', RESOLVED: 'CLOSED', CANCELLED: 'CLOSED' };
    const SEVERITY: Record<string, string> = { CRITICAL: 'HIGH', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
    return rows.map((c) => {
      const status = ST[(c.status ?? '').toUpperCase()] ?? 'NEW';
      const severity = SEVERITY[(c.severity ?? '').toUpperCase()] ?? 'MEDIUM';
      const examined = status !== 'NEW' && !!c.vetResult;
      return {
        id: c.caseId, beId: c.id, horseId: String(c.horseId), horse: c.horseName, source: SRC[(c.source ?? '').toUpperCase()] ?? 'SESSION_STOP',
        type: c.issueType ?? 'Khám', severity, status, sender: c.reportedByName ?? '—', at: stamp(c.createdAt), note: c.description ?? '',
        photo: c.imageUrl ?? null, protocolId: null, outcome: status === 'CLOSED' ? c.vetResult ?? undefined : undefined,
        exam: examined ? { symptoms: c.description ?? '', diagnosis: c.vetResult ?? '', plan: '', severity, health: 'WATCH', by: c.assignedVetName ?? 'Bác sĩ thú y', at: '—' } : null,
      };
    });
  },

  async feedRequests() {
    return [];
  },

  async vaccinations() {
    const [rows, horses] = await Promise.all([orEmpty(data<BeVacc[]>('/vaccinations')), LOADERS.horses()]);
    const ST: Record<string, string> = { 'sắp đến hạn': 'DUE_SOON', 'đã tiêm': 'DONE', 'hoàn thành': 'DONE', 'đã hoãn': 'POSTPONED' };
    return rows.map((v) => ({
      id: v.recordCode, horseId: (byName(horses, v.horseName)?.id as string) ?? `ten:${v.horseName}`, horse: v.horseName, type: v.typeName,
      due: v.expectedDate, status: ST[(v.status ?? '').toLowerCase()] ?? 'SCHEDULED', kind: /giun/i.test(v.category) ? 'DEWORM' : 'VACCINE', cycleMonths: v.cycleMonths,
    }));
  },

  async raceProposals() {
    const [waiting, done, horses] = await Promise.all([
      orEmpty(data<BeExam[]>('/prerace-exams', { tab: 'CHO_KHAM' })), orEmpty(data<BeExam[]>('/prerace-exams', { tab: 'DA_CO_KET_QUA' })), LOADERS.horses(),
    ]);
    return [...waiting, ...done].map((e) => {
      const passed = e.resultStatus === 'ĐẠT';
      const status = !e.resultStatus ? 'WAITING_VET_EXAM' : passed ? 'READY_TO_SUBMIT' : 'VET_FAILED';
      return {
        id: e.proposalCode, horseId: (byName(horses, e.horseName)?.id as string) ?? `ten:${e.horseName}`, horseName: e.horseName, owner: e.ownerName,
        tournamentId: tourId(e), status, createdAt: e.proposalDate, createdBy: e.trainerName,
        history: [{ at: e.proposalDate, who: e.trainerName, text: 'tạo đề xuất · chủ ngựa đã đồng ý' }],
        vetResult: e.resultStatus ? { pass: passed, by: 'Bác sĩ thú y', at: '—', note: e.vetNotes ?? '' } : null,
        ownerResponse: { agree: true, at: e.proposalDate }, result: null,
      };
    });
  },

  async tournaments() {
    const rows = [...(await orEmpty(data<BeExam[]>('/prerace-exams', { tab: 'CHO_KHAM' }))), ...(await orEmpty(data<BeExam[]>('/prerace-exams', { tab: 'DA_CO_KET_QUA' })))];
    const seen = new Map<string, Row>();
    rows.forEach((e) => seen.set(tourId(e), { id: tourId(e), name: e.tournamentName, organizer: '—', date: e.raceDate, venue: e.location, distance: e.distance, deadline: '—', conditions: '—', source: 'Backend' }));
    return [...seen.values()];
  },

  async protocols() {
    const real = await loadProtocols().catch(() => null);
    if (real) return real;
    const [rows, horses] = await Promise.all([orEmpty(data<BeProtocol[]>('/protocols')), LOADERS.horses()]);
    return rows.map((p) => {
      const short = /thiếu/i.test(p.status);
      const state = short ? 'STOCK_SHORTAGE' : /đủ/i.test(p.status) ? 'STOCK_AVAILABLE' : 'WAITING_STOCK_CHECK';
      const id = p.protocolCode.split(' ')[0];
      return {
        id, version: Number(p.protocolCode.match(/v(\d+)/)?.[1] ?? 1), replaces: null, supersededBy: null,
        horseId: (byName(horses, p.horseName)?.id as string) ?? `ten:${p.horseName}`, horse: p.horseName, caseId: p.caseCode.replace('#', ''), diagnosis: p.diagnosis,
        vet: 'Bác sĩ thú y', createdAt: '—', requiredBy: p.requiredDate, phases: [], state, path: ['WAITING_STOCK_CHECK', state],
        stock: null, wait: null, delayed: false, progress: [], outcome: null,
        label: p.status, tone: short ? 'danger' : 'info', cost: Number(p.estimatedCost.replace(/\D/g, '')) || 0, open: true,
        materials: [{ item: p.nextStep, status: short ? 'Thiếu' : 'Đủ', tone: short ? 'danger' : 'success' }], note: p.nextStep, log: [],
      };
    });
  },

  async shipments() {
    const real = await loadShipments().catch(() => null);
    if (real) return real;
    const rows = await orEmpty(data<BeShipment[]>('/protocols/shipments'));
    const ST: Record<string, string> = { 'trễ': 'DELAYED', 'đang giao': 'IN_TRANSIT', 'đã nhận': 'RECEIVED', 'đã đặt': 'ORDERED', 'đã hủy': 'CANCELLED' };
    return rows.map((s) => ({
      id: s.lotCode, supplier: '—', orderedAt: '—', status: ST[(s.status ?? '').toLowerCase()] ?? 'ORDERED', eta: s.eta, forRef: s.targetProtocol,
      item: `${s.itemName} · ${s.quantity} ${s.unit}`, lines: [{ itemId: '', name: s.itemName, unit: s.unit, qty: s.quantity, received: null, lot: null, expiry: null }], history: [],
    }));
  },

  async inventory() {
    return (await loadInventory()) ?? ((await mockGet('/inventory')) as Row[]);
  },
  async requisitions() {
    return (await loadRequisitions()) ?? ((await mockGet('/requisitions')) as Row[]);
  },
  async stockChecks() {
    return (await loadStockChecks()) ?? ((await mockGet('/stockChecks')) as Row[]);
  },
  async registrations() {
    const u = me();
    if (u?.role !== 'ClubManager' && u?.role !== 'HorseOwner') return (await mockGet('/registrations')) as Row[];
    const [hs, users] = await Promise.all([horsesRaw(), u.role === 'ClubManager' ? LOADERS.users() : Promise.resolve([] as Row[])]);
    const histories = await Promise.all(hs.map((h) => orEmpty(data<BeRegistration[]>(`/horses/${h.horseId}/registrations`))));
    const ownerOf = (h: BeHorse) => (u.role === 'HorseOwner' ? { fullName: u.name, email: '', phone: '—' } : (() => {
      const o = users.find((x) => x.beId === h.ownerId);
      return { fullName: (o?.fullname as string) ?? `Chủ ngựa #${h.ownerId}`, email: (o?.email as string) ?? '', phone: (o?.phone as string) || '—' };
    })());
    return hs.map((h, index) => toRegistration(h, histories[index], ownerOf(h), hs));
  },
  async invoices() {
    return ((await loadInvoices(me()?.role)) as Row[] | null) ?? ((await mockGet('/invoices')) as Row[]);
  },
  async payments() {
    return ((await loadPayments(me()?.role)) as Row[] | null) ?? ((await mockGet('/payments')) as Row[]);
  },
  async users() {
    return (await loadUsers()) ?? ((await mockGet('/users')) as Row[]);
  },
  async auditLogs() {
    return (await loadAuditLogs()) ?? ((await mockGet('/auditLogs')) as Row[]);
  },
  async stockTx() {
    return (await loadStockTx()) ?? ((await mockGet('/stockTx')) as Row[]);
  },
};
interface BeOwnerProgress { planId: number; planName: string; startDate: string; endDate: string; status: string; progress?: number | null; sessions?: { sessionId: number; sessionDate: string; activityType: string; status: string; notes?: string | null; assignedToName?: string | null }[] | null }
const ownerProgress = async () => {
  const horses = await LOADERS.horses();
  const rows = await Promise.all(horses.map(async (h) => ({ h, p: await data<BeOwnerProgress | null>(`/owner/training/horses/${h.id}/progress`).catch(() => null) })));
  return rows.filter((r): r is { h: Row; p: BeOwnerProgress } => !!r.p?.planId).map(({ h, p }) => {
    const weeks = Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (7 * 864e5)));
    const plan: Row = {
      id: String(p.planId), horseId: h.id, horseName: h.name, name: p.planName, type: 'Thể lực', goal: '', startDate: ddmmyyyy(p.startDate), createdBy: '—',
      phases: [{ no: 1, name: 'Toàn giáo án', weeks, intensity: 'Vừa', distanceM: 1200, sessionsPerWeek: 3, hrLimit: 180 }],
      currentPhase: 1, week: Math.max(1, Math.round(((p.progress ?? 0) * weeks) / 100)), status: PLAN_STATUS[(p.status ?? '').toUpperCase()] ?? 'PAUSED',
    };
    const sessions: Row[] = (p.sessions ?? []).map((x) => ({
      id: String(x.sessionId), horseId: h.id, horseName: h.name, planId: String(p.planId), phaseNo: 1, label: x.activityType,
      date: ddmmyyyy(x.sessionDate), time: hhmm(x.sessionDate), groom: x.assignedToName ?? '—', track: (x.notes ?? '').split(' · Ghi nhận:')[0] || '—',
      status: SESSION[x.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: x.status?.toUpperCase() === 'CONFIRMED', thresholds: { hr: 180, speed: 60 }, readings: [], decision: null, evaluation: null,
    }));
    return { plan, sessions };
  });
};
const isApproved = (h: BeHorse) => (h.approvalStatus ? h.approvalStatus === 'APPROVED' : h.stallId != null);
const REG_CHECKS: [string, string][] = [['identity', 'Danh tính chủ ngựa'], ['health', 'Giấy chứng nhận sức khỏe còn hiệu lực'], ['ownership', 'Giấy tờ sở hữu hợp lệ']];
const REG_STATUS: Record<string, string> = { APPROVED: 'Approved', REJECTED: 'Rejected', PENDING: 'Pending' };
const RESUBMIT_ALLOWED = 'Cho phép nộp lại';
const regHistory = (r: BeRegistration, owner: string, first: boolean) => {
  const items: Row[] = [];
  if (r.status === 'APPROVED') items.push({ tone: 'success', who: r.decidedByName ?? 'Quản lý CLB', text: `phê duyệt · chuyển APPROVED${r.decisionNote ? `: “${r.decisionNote}”` : ''}`, at: stamp(r.decidedAt) });
  if (r.status === 'REJECTED') items.push({ tone: 'danger', who: r.decidedByName ?? 'Quản lý CLB', text: `từ chối${r.allowResubmit ? ' · cho phép nộp lại' : ''}: “${r.decisionNote ?? ''}”`, at: stamp(r.decidedAt) });
  items.push({ who: 'Hệ thống', text: `${r.registrationCode ?? ''} kiểm tra trường bắt buộc: đủ · chuyển PENDING_REVIEW`.trim(), at: stamp(r.submittedAt) });
  items.push({ who: r.ownerName ?? owner, text: `${first ? 'gửi hồ sơ' : 'nộp lại hồ sơ (RESUBMITTED)'}${r.ownerNote ? `: “${r.ownerNote}”` : ''}`, at: stamp(r.submittedAt) });
  return items;
};
const toRegistration = (h: BeHorse, history: BeRegistration[], owner: { fullName: string; email: string; phone: string }, all: BeHorse[]): Row => {
  const status = REG_STATUS[(h.approvalStatus ?? '').toUpperCase()] ?? (isApproved(h) ? 'Approved' : 'Pending');
  const latest = history[0];
  const checks = latest?.checks ?? [];
  const checklist = REG_CHECKS.map(([key, label]) => {
    const found = checks.find((c) => c.checkKey.toLowerCase() === key);
    const detail = found?.detail || (found ? `Kiểm tra bởi ${found.checkedByName ?? 'Quản lý CLB'}` : status === 'Approved' ? 'Đã kiểm tra thủ công.' : 'Chờ Quản lý CLB kiểm tra.');
    return { key, label, detail, passed: found ? found.passed : status === 'Approved' };
  });
  const firstFailed = checklist.find((c) => !c.passed && checks.length > 0);
  const code = String(h.horseId).padStart(4, '0');
  const stall = h.stallCode ?? `#${h.stallId}`;
  const submitted = latest?.submittedAt ?? h.createdAt;
  const heldSince = submitted ? new Date(submitted).getTime() : Date.now();
  const decidedNote = status === 'Approved' ? `Cấp chuồng ${stall}` : status === 'Rejected' ? ((h.allowResubmit ?? latest?.allowResubmit) ? RESUBMIT_ALLOWED : 'Không cho nộp lại') : undefined;
  const healthCert = [h.healthCertIssuer, h.healthCertExpiry && `hết hạn ${ddmmyyyy(h.healthCertExpiry)}`].filter(Boolean).join(' · ');
  return {
    id: `REG-${code}`, beId: h.horseId, registrationCode: latest?.registrationCode ?? h.registrationCode ?? null,
    horse: { name: h.horseName, breed: h.breed, sex: sex(h.gender), age: age(h.dob), code: h.horseCode ?? `HT-${code}` },
    owner, submittedAt: stamp(submitted),
    waitingDays: status === 'Pending' ? Math.max(0, Math.floor((Date.now() - heldSince) / 86400000)) : 0,
    passed: checklist.filter((c) => c.passed).length, status, decidedNote,
    firstIssue: status === 'Rejected' ? h.rejectReason ?? latest?.decisionNote ?? undefined : firstFailed?.label,
    ownerExtra: { otherHorses: all.filter((x) => x.ownerId === h.ownerId && x.horseId !== h.horseId).map((x) => x.horseName).join(', ') || '—' },
    horseExtra: { color: h.color || '—', height: h.heightHands ? `${h.heightHands} hands` : '—', weight: h.weightKg, passport: h.passportNo || h.pedigree || '—', healthCert: healthCert || '—' },
    checklist, attachments: [],
    history: history.length
      ? history.flatMap((r, index) => regHistory(r, owner.fullName, index === history.length - 1))
      : [{ who: owner.fullName, text: 'gửi hồ sơ', at: stamp(h.createdAt) }],
  };
};
const regChecks = (checklist: unknown) => ((checklist as { key: string; passed: boolean; detail?: string }[] | undefined) ?? [])
  .map((c) => ({ checkKey: c.key.toUpperCase(), passed: !!c.passed, detail: c.detail?.slice(0, 500) }));
const regExtra = (x: { color?: string; height?: string; passport?: string; healthCert?: string }) => {
  const heightHands = Number.parseFloat(String(x.height ?? '').replace(',', '.'));
  const expiry = String(x.healthCert ?? '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})\/(\d{4})/);
  const healthCertExpiry = expiry
    ? expiry[3] ? `${expiry[3]}-${expiry[2].padStart(2, '0')}-${expiry[1].padStart(2, '0')}` : new Date(Date.UTC(Number(expiry[5]), Number(expiry[4]), 0)).toISOString().slice(0, 10)
    : undefined;
  const clean = (v?: string) => (v && v.trim() && v.trim() !== '—' ? v.trim() : undefined);
  return {
    color: clean(x.color)?.slice(0, 50),
    heightHands: Number.isFinite(heightHands) && heightHands >= 1 && heightHands <= 25 ? Math.round(heightHands * 10) / 10 : undefined,
    passportNo: clean(x.passport)?.slice(0, 50),
    healthCertIssuer: clean(x.healthCert)?.slice(0, 150),
    healthCertExpiry,
  };
};
const unknownHorse = (id: string): Row => ({
  id, name: id.slice(4), breed: '—', sex: '♂', age: 0, owner: '—', stall: '—', trainerId: '', health: 'HEALTHY', trainingLocked: false,
  form: null, pendingCase: null, lock: null, injuries: [], medicalHistory: [], raceResults: [], medicalDiet: null,
});
const tourId = (e: BeExam) => `T-${e.tournamentName}-${e.raceDate}`.replace(/\s+/g, '-');

type Write = (id: string | undefined, body: Row, current: Row | undefined) => Promise<boolean | Row | void> | boolean | Row | void;
const WRITES: Record<string, Partial<Record<'post' | 'patch' | 'put', Write>>> = {
  registrations: {
    async post(_id, body) {
      const h = body.horse as { name: string; breed: string; sex: string; age: number };
      const x = body.horseExtra as { color: string; height: string; weight: number; passport: string; healthCert: string };
      if (!(Number(x.weight) >= 0.1)) throw new Error('Nhập cân nặng của ngựa (kg).');
      await be.post('/horses/register', {
        horseName: h.name, dob: `${new Date().getFullYear() - h.age}-01-01`, gender: h.sex === '♀' ? 'Mare' : 'Stallion', breed: h.breed,
        weightKg: Number(x.weight), ownerId: Number(me()?.id), ...regExtra(x),
      });
      return true;
    },
    async patch(_id, body, current) {
      if (body.status === 'Approved') {
        if (!body.stallId) throw new Error('Chọn chuồng để cấp cho ngựa.');
        await be.put(`/horses/${current?.beId}/approve`, { stallId: Number(body.stallId), checks: regChecks(body.checklist), note: (body.decisionNote as string | undefined)?.slice(0, 500) || undefined });
        return true;
      }
      if (body.status === 'Rejected') {
        await be.put(`/horses/${current?.beId}/reject`, { reason: body.reason, allowResubmit: !!body.allowResubmit, checks: regChecks(body.checklist) });
        return true;
      }
      return false;
    },
    async put(_id, body, current) {
      const x = body.horseExtra as { color: string; height: string; weight: number; passport: string; healthCert: string };
      await be.put(`/horses/${current?.beId}/resubmit`, { weightKg: Number(x.weight) >= 0.1 ? Number(x.weight) : undefined, ...regExtra(x), note: 'Đã sửa thông tin theo yêu cầu của Quản lý CLB' });
      return true;
    },
  },
  horses: {
    async patch(id, body) {
      if (!('trainingLocked' in body)) return;
      if (id?.startsWith('ten:')) throw new Error('Ngựa này chưa có trong danh sách ngựa của backend.');
      if (body.trainingLocked) await be.post('/medical/vet-lock', { horseId: Number(id), reason: (body.lock as Row | undefined)?.reason ?? 'Khóa huấn luyện' });
      else await be.post(`/medical/release-lock/${id}`);
    },
  },
  raceProposals: {
    async patch(id, body) {
      const r = body.vetResult as { pass: boolean; note: string } | undefined;
      if (r) await be.post(`/prerace-exams/${encodeURIComponent(id ?? '')}/examine`, { isPassed: r.pass, vetNotes: r.note });
    },
  },
  vaccinations: {
    async patch(id, body) {
      if (body.status === 'DONE') await be.post(`/vaccinations/${encodeURIComponent(id ?? '')}/execute`);
    },
    async post(_id, body) {
      await be.post('/vaccinations/schedule', { horseIds: [Number(body.horseId) || 0], medicineName: body.type, scheduledDate: body.due, notes: body.note ?? '' });
    },
  },
  tasks: {
    async patch(id, body) {
      if (body.status === 'DONE') await be.put(`/care-tasks/${id}/complete`);
    },
  },
  vetCases: {
    async post(_id, body) {
      const created = (await be.post<ApiResponse<BeCase>>('/medical/cases', {
        horseId: Number(body.horseId), caseType: body.type, severity: body.severity, description: body.note,
        imageUrl: typeof body.photo === 'string' && /^https?:\/\//.test(body.photo) ? body.photo : undefined,
      })).data.data;
      return { id: created.caseId, beId: created.id, status: 'NEW' };
    },
    async patch(id, body) {
      const exam = body.exam as { diagnosis: string; plan: string } | undefined;
      if (exam) {
        await be.post('/medical/cases/action', { caseId: id, vetNotes: exam.diagnosis, treatmentDirection: exam.plan });
        return true;
      }
      if (body.status === 'CLOSED') {
        await be.put(`/medical/cases/${encodeURIComponent(id ?? '')}/close`, { outcome: body.outcome });
        return true;
      }
      return false;
    },
  },
  trainingSessions: {
    async patch(id, body) {
      if (body.confirmed === true) {
        await be.put(`/training-sessions/${id}/confirm`);
        invalidate('trainingPlans');
        return true;
      }
      if (body.status === 'COMPLETED') await be.put(`/training-sessions/${id}/execute`, { status: 'COMPLETED', notes: 'Hoàn thành phiên' });
      if (body.status === 'STOPPED') await be.put(`/training-sessions/${id}/execute`, { status: 'CANCELLED', notes: (body.decision as Row | undefined)?.note ?? 'Dừng phiên' });
    },
  },
};

const cache = new Map<string, { at: number; rows: Promise<Row[]> }>();
const overlay = new Map<string, { patches: Map<string, Row>; added: Row[] }>();
const ov = (name: string) => {
  if (!overlay.has(name)) overlay.set(name, { patches: new Map(), added: [] });
  return overlay.get(name)!;
};
const load = (name: string) => {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < 4000) return hit.rows;
  const rows = LOADERS[name]().catch((): Row[] => []);
  cache.set(name, { at: Date.now(), rows });
  return rows;
};
const rowsOf = async (name: string) => {
  const o = ov(name);
  return [...(await load(name)).map((r) => ({ ...r, ...(o.patches.get(String(r.id)) ?? {}) })), ...o.added];
};
export const invalidate = (...names: string[]) => names.forEach((n) => { cache.delete(n); overlay.delete(n); });
const mockGet = async (url: string) => (await mockAdapter({ url, method: 'get', headers: {} } as InternalAxiosRequestConfig)).data;

export const hybridAdapter: AxiosAdapter = async (config) => {
  const url = new URL(config.url ?? '/', 'http://mock.local');
  const [name, id] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!name || !(name in LOADERS)) return mockAdapter(config);

  const method = (config.method ?? 'get').toLowerCase();
  const params: Record<string, unknown> = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  if (name === 'tasks') delete params.date;
  const body = typeof config.data === 'string' && config.data ? (JSON.parse(config.data) as Row) : ((config.data as Row) ?? {});
  const rows = await rowsOf(name);

  if (method === 'get') {
    if (id === undefined) return respond(config, 200, queryRows(rows, params));
    const row = rows.find((r) => String(r.id) === id);
    if (row) return respond(config, 200, row);
    if (name === 'horses' && id.startsWith('ten:')) return respond(config, 200, unknownHorse(id));
    if (name === 'horses') {
      const p = (await rowsOf('protocols')).find((r) => String(r.horseId) === id);
      if (p) return respond(config, 200, { ...unknownHorse(`ten:${p.horse}`), id, trainingLocked: !!p.trainingLocked });
    }
    return fail(config, 404);
  }

  const current = id === undefined ? undefined : rows.find((r) => String(r.id) === id);
  const write = WRITES[name]?.[method as 'post' | 'patch' | 'put'];
  const stored = write ? await write(id, body, current) : false;
  cache.delete(name);
  if (stored) {
    invalidate(name, 'horses', 'stalls');
    return respond(config, method === 'post' ? 201 : 200, { ...(current ?? {}), ...body, ...(stored === true ? {} : stored) });
  }

  if (method === 'post') {
    const row = { ...body, id: body.id ?? `${Date.now()}` };
    ov(name).added.push(row);
    return respond(config, 201, row);
  }
  if (method === 'patch' || method === 'put') {
    const o = ov(name);
    o.patches.set(String(id), { ...(o.patches.get(String(id)) ?? {}), ...body });
    return respond(config, 200, { ...(current ?? { id }), ...body });
  }
  if (method === 'delete' && current) return respond(config, 200, {});
  return fail(config, 404);
};
