import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { be, type ApiResponse } from './beClient';
import { fail, mockAdapter, queryRows, respond } from './mockServer';
import { loadAuditLogs, loadInventory, loadProtocols, loadRequisitions, loadShipments, loadStockChecks, loadStockTx, loadUsers } from './beDomain';

/* Backend bridge (`npm run dev:be`).
   The screens keep calling the same REST paths as with db.json ('/horses', '/stalls', '/trainingPlans'…).
   For every collection the Spring Boot backend already serves, this adapter reads the real API and turns each
   record into the shape the screens expect; writes the backend supports are sent to it.
   Everything else (invoices, audit log, requisitions…) still comes from db.json in the browser.
   Changes the backend cannot store yet (e.g. a horse's medical history) are kept in this tab only (`overlay`). */

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
/** A read the signed-in role is not allowed to make (403) simply gives an empty list. */
const orEmpty = async <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);

/* ---------- value mapping ---------- */
const ddmmyyyy = (iso?: string | null) => {
  if (!iso) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(iso)) return iso.slice(0, 10);
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
const hhmm = (iso?: string | null) => (iso && iso.length > 15 ? iso.slice(11, 16) : '—');
const zone = (z?: string | null) => (z ? z.replace(/^Zone\s+/i, 'Khu ') : '—');
const age = (dob?: string | null) => (dob ? Math.max(0, new Date().getFullYear() - Number(dob.slice(0, 4))) : 0);
const HEALTH: Record<string, string> = { healthy: 'HEALTHY', injured: 'INJURED', watch: 'WATCH', monitoring: 'WATCH', 'theo dõi': 'WATCH', quarantine: 'QUARANTINE', sick: 'WATCH', 'khỏe mạnh': 'HEALTHY' };
const health = (h?: string | null) => HEALTH[(h ?? '').toLowerCase()] ?? 'HEALTHY';
const sex = (g?: string | null) => (['mare', 'filly'].includes((g ?? '').toLowerCase()) ? '♀' : '♂');
const CLEAN: Record<string, string> = { clean: 'CLEAN', 'needs cleaning': 'NEEDS_CLEANING', needs_cleaning: 'NEEDS_CLEANING', 'under maintenance': 'MAINTENANCE', maintenance: 'MAINTENANCE' };
const SESSION: Record<string, string> = { PENDING: 'SCHEDULED', COMPLETED: 'COMPLETED', CANCELLED: 'STOPPED', IN_PROGRESS: 'IN_PROGRESS' };
const TASK_TYPE: Record<string, [string, string]> = {
  feeding: ['FEED', 'Cho ăn'], 'stall cleaning': ['CLEAN', 'Dọn chuồng'], 'grooming & bath': ['GROOM', 'Chải lông & tắm'],
  'ice bath therapy': ['COOL', 'Ngâm lạnh'], 'exercise walk': ['GROOM', 'Dắt đi bộ'], 'hoof care': ['GROOM', 'Chăm sóc móng'],
};

/* ---------- backend DTOs (Swagger) ---------- */
interface BeHorse { horseId: number; horseName: string; dob: string; gender: string; breed: string; pedigree?: string | null; weightKg: number; healthStatus: string; isLocked: boolean; ownerId: number; stallId: number | null; stallCode?: string | null; approvalStatus?: string | null; createdAt?: string | null }
interface BeStall { stallId: number; stallCode: string; barnZone: string; cleanStatus: string; currentHorseId: number | null; horseName: string | null }
interface BePlan { planId: number; planName: string; horseName: string; startDate: string; endDate: string; status: string; progress: number }
interface BeSchedule { sessionId: number; sessionDate: string; activityType: string; status: string; planName: string; horseName: string; stallZone: string }
interface BeTask { taskId: number; taskType: string; status: string; dueDate: string; horseName: string; stallZone: string }
interface BeCase { caseId: string; horseId: number; horseName: string; source: string; issueType: string; severity: string; status: string; description: string; maxHeartRate: number; vetResult: string; createdAt: string }
interface BeVacc { recordCode: string; horseName: string; typeName: string; category: string; expectedDate: string; cycleMonths: number; status: string }
interface BeExam { proposalCode: string; proposalDate: string; horseName: string; ownerName: string; tournamentName: string; raceDate: string; distance: string; location: string; trainerName: string; tabStatus: string; resultStatus: string | null; vetNotes: string | null }
interface BeProtocol { protocolCode: string; horseName: string; diagnosis: string; caseCode: string; requiredDate: string; estimatedCost: string; status: string; nextStep: string }
interface BeShipment { lotCode: string; itemName: string; quantity: number; unit: string; eta: string; targetProtocol: string; status: string }

/* ---------- collections served by the backend ---------- */
const stallsRaw = () => orEmpty(data<BeStall[]>('/stalls'));
const horsesRaw = async () => {
  const u = me();
  if (u?.role === 'WarehouseManager') return []; // the warehouse cannot read /horses (403)
  if (u?.role === 'HorseOwner') return orEmpty(data<BeHorse[]>(`/horses/my-horses/${u.id}`)); // an owner may only read their own horses
  return (await data<{ horses: BeHorse[] }>('/horses', { page: 0, size: 500 }).catch(() => ({ horses: [] }))).horses;
};
const byName = (rows: Row[], name?: string | null) => rows.find((r) => r.name === name);

const LOADERS: Record<string, () => Promise<Row[]>> = {
  async horses() {
    const u = me();
    const [hs, stalls] = await Promise.all([horsesRaw(), stallsRaw()]);
    // "Ngựa của tôi" only lists horses the Club Manager approved (a stall assigned); pending ones show under "Đăng ký ngựa mới"
    return hs.filter((h) => u?.role !== 'HorseOwner' || isApproved(h)).map((h) => ({
      id: String(h.horseId), name: h.horseName, breed: h.breed, sex: sex(h.gender), age: age(h.dob), weightKg: h.weightKg,
      owner: u?.role === 'HorseOwner' && String(h.ownerId) === u.id ? u.name : `Chủ ngựa #${h.ownerId}`,
      stall: stalls.find((s) => s.stallId === h.stallId)?.stallCode ?? h.stallCode ?? '—',
      // The backend has no "trainer in charge" yet: a trainer sees every horse.
      trainerId: u?.role === 'HeadTrainer' ? u.id : '',
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

  /* Grooms and their zones: the signed-in groom from the backend profile + the demo grooms. */
  async grooms() {
    const u = me();
    const demo = ((await mockGet('/grooms')) as Row[]) ?? [];
    if (u?.role !== 'Groom') return demo;
    const p = await data<{ specialization?: string | null }>('/account/my-profile').catch(() => ({ specialization: null }));
    return [{ id: u.id, name: u.name, zones: p.specialization ? [zone(p.specialization)] : ['Khu A'] }, ...demo.filter((g) => g.id !== u.id)];
  },

  async trainingPlans() {
    const [page, horses] = await Promise.all([data<{ content: BePlan[] }>('/training-plans', { page: 0, size: 500 }).catch(() => ({ content: [] })), LOADERS.horses()]);
    return page.content.map((p) => {
      const weeks = Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (7 * 864e5)));
      return {
        id: String(p.planId), horseId: (byName(horses, p.horseName)?.id as string) ?? '', horseName: p.horseName, name: p.planName,
        type: 'Thể lực', goal: '', startDate: ddmmyyyy(p.startDate), createdBy: '—',
        phases: [{ no: 1, name: 'Toàn giáo án', weeks, intensity: 'Vừa', distanceM: 1200, sessionsPerWeek: 3, hrLimit: 180 }],
        currentPhase: 1, week: Math.max(1, Math.round((p.progress ?? 0) * weeks / 100)), status: p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      };
    });
  },

  /* Sessions: the backend gives each Trainer / Groom their own schedule. */
  async trainingSessions() {
    const u = me();
    if (!u || !['HeadTrainer', 'Groom'].includes(u.role)) return [];
    const [rows, horses, plans] = await Promise.all([
      orEmpty(data<BeSchedule[]>('/training-sessions/my-schedule', { startDate: '2020-01-01', endDate: '2030-12-31' })), LOADERS.horses(), LOADERS.trainingPlans(),
    ]);
    return rows.map((s) => ({
      id: String(s.sessionId), horseId: (byName(horses, s.horseName)?.id as string) ?? '', horseName: s.horseName,
      planId: (plans.find((p) => p.name === s.planName)?.id as string) ?? '', phaseNo: 1, label: s.activityType,
      date: ddmmyyyy(s.sessionDate), time: hhmm(s.sessionDate), groom: u.role === 'Groom' ? u.name : '—', track: zone(s.stallZone),
      status: SESSION[s.status?.toUpperCase()] ?? 'SCHEDULED', thresholds: { hr: 180, speed: 60 }, readings: [], decision: null, evaluation: null,
    }));
  },

  async tasks() {
    const u = me();
    if (u?.role !== 'Groom') return [];
    const [rows, horses] = await Promise.all([orEmpty(data<BeTask[]>('/care-tasks/my-tasks')), LOADERS.horses()]);
    return rows.map((t) => {
      const [type, title] = TASK_TYPE[(t.taskType ?? '').toLowerCase()] ?? ['GROOM', t.taskType];
      const h = byName(horses, t.horseName);
      return {
        id: String(t.taskId), date: ddmmyyyy(t.dueDate), groom: u.name, zone: zone(t.stallZone), type, title,
        horseId: (h?.id as string) ?? null, horse: t.horseName, stall: (h?.stall as string) ?? '—', time: hhmm(t.dueDate), sla: '—',
        status: (t.status ?? '').toUpperCase() === 'COMPLETED' || (t.status ?? '').toUpperCase() === 'DONE' ? 'DONE' : 'TODO',
        doneAt: null, note: '', photo: null, instructions: [],
      };
    });
  },

  async vetCases() {
    const rows = await orEmpty(data<BeCase[]>('/medical/cases'));
    const SRC: Record<string, string> = { GROOM: 'GROOM_REPORT', GROOM_REPORT: 'GROOM_REPORT', TRAINER: 'TRAINER_REQUEST', TRAINER_REQUEST: 'TRAINER_REQUEST' };
    const ST: Record<string, string> = { NEW: 'NEW', PENDING: 'NEW', MONITORING: 'MONITORING', CLOSED: 'CLOSED', RESOLVED: 'CLOSED' };
    return rows.map((c) => ({
      id: c.caseId, horseId: String(c.horseId), horse: c.horseName, source: SRC[(c.source ?? '').toUpperCase()] ?? 'SESSION_STOP',
      type: c.issueType ?? 'Khám', severity: ['HIGH', 'MEDIUM', 'LOW'].includes((c.severity ?? '').toUpperCase()) ? c.severity.toUpperCase() : 'MEDIUM',
      status: ST[(c.status ?? '').toUpperCase()] ?? 'NEW', sender: '—', at: ddmmyyyy(c.createdAt), note: c.description ?? '',
      exam: null, protocolId: null, outcome: c.vetResult ?? undefined,
    }));
  },

  async vaccinations() {
    const [rows, horses] = await Promise.all([orEmpty(data<BeVacc[]>('/vaccinations')), LOADERS.horses()]);
    const ST: Record<string, string> = { 'sắp đến hạn': 'DUE_SOON', 'đã tiêm': 'DONE', 'hoàn thành': 'DONE', 'đã hoãn': 'POSTPONED' };
    return rows.map((v) => ({
      id: v.recordCode, horseId: (byName(horses, v.horseName)?.id as string) ?? `ten:${v.horseName}`, horse: v.horseName, type: v.typeName,
      due: v.expectedDate, status: ST[(v.status ?? '').toLowerCase()] ?? 'SCHEDULED', kind: /giun/i.test(v.category) ? 'DEWORM' : 'VACCINE', cycleMonths: v.cycleMonths,
    }));
  },

  /* Race proposals the vet must examine (the backend has no proposal API for trainer/owner yet). */
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
    const real = await loadProtocols().catch(() => null); // backend Test API 3: real protocols with phases + stock answer
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
    const real = await loadShipments().catch(() => null); // warehouse: real purchase orders
    if (real) return real;
    const rows = await orEmpty(data<BeShipment[]>('/protocols/shipments'));
    const ST: Record<string, string> = { 'trễ': 'DELAYED', 'đang giao': 'IN_TRANSIT', 'đã nhận': 'RECEIVED', 'đã đặt': 'ORDERED', 'đã hủy': 'CANCELLED' };
    return rows.map((s) => ({
      id: s.lotCode, supplier: '—', orderedAt: '—', status: ST[(s.status ?? '').toLowerCase()] ?? 'ORDERED', eta: s.eta, forRef: s.targetProtocol,
      item: `${s.itemName} · ${s.quantity} ${s.unit}`, lines: [{ itemId: '', name: s.itemName, unit: s.unit, qty: s.quantity, received: null, lot: null, expiry: null }], history: [],
    }));
  },

  /* Warehouse module (backend Test API 3) — other roles fall back to db.json for these collections. */
  async inventory() {
    return (await loadInventory()) ?? ((await mockGet('/inventory')) as Row[]);
  },
  async requisitions() {
    return (await loadRequisitions()) ?? ((await mockGet('/requisitions')) as Row[]);
  },
  async stockChecks() {
    return (await loadStockChecks()) ?? ((await mockGet('/stockChecks')) as Row[]);
  },
  /* Horse registrations = rows of the Horses table: no stall yet → waiting for the Club Manager, stall assigned → approved.
     The backend keeps no checklist, documents or rejection, so those stay in this tab only. */
  async registrations() {
    const u = me();
    if (u?.role !== 'ClubManager' && u?.role !== 'HorseOwner') return (await mockGet('/registrations')) as Row[];
    const [hs, users] = await Promise.all([horsesRaw(), u.role === 'ClubManager' ? LOADERS.users() : Promise.resolve([] as Row[])]);
    const ownerOf = (h: BeHorse) => (u.role === 'HorseOwner' ? { fullName: u.name, email: '', phone: '—' } : (() => {
      const o = users.find((x) => x.beId === h.ownerId);
      return { fullName: (o?.fullname as string) ?? `Chủ ngựa #${h.ownerId}`, email: (o?.email as string) ?? '', phone: (o?.phone as string) || '—' };
    })());
    return hs.map((h) => {
      const ok = isApproved(h);
      const code = String(h.horseId).padStart(4, '0');
      const sent = h.createdAt ? `${ddmmyyyy(h.createdAt)} ${hhmm(h.createdAt)}` : '—';
      const stall = h.stallCode ?? `#${h.stallId}`;
      return {
        id: `REG-${code}`, beId: h.horseId,
        horse: { name: h.horseName, breed: h.breed, sex: sex(h.gender), age: age(h.dob), code: `HT-${code}` },
        owner: ownerOf(h), submittedAt: sent,
        waitingDays: !ok && h.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(h.createdAt).getTime()) / 86400000)) : 0,
        passed: ok ? REG_CHECKS.length : 0, status: ok ? 'Approved' : 'Pending', decidedNote: ok ? `Cấp chuồng ${stall}` : undefined,
        ownerExtra: { otherHorses: hs.filter((x) => x.ownerId === h.ownerId && x.horseId !== h.horseId).map((x) => x.horseName).join(', ') || '—' },
        horseExtra: { color: '—', height: '—', weight: h.weightKg, passport: h.pedigree || '—', healthCert: '—' },
        checklist: REG_CHECKS.map(([key, label]) => ({ key, label, detail: ok ? 'Đã kiểm tra thủ công.' : 'Chờ Quản lý CLB kiểm tra.', passed: ok })),
        attachments: [],
        history: [
          ...(ok ? [{ tone: 'success', who: 'Quản lý CLB', text: `phê duyệt · cấp chuồng ${stall} · chuyển APPROVED`, at: '—' }] : []),
          { who: 'Hệ thống', text: 'kiểm tra trường bắt buộc: đủ · chuyển PENDING_REVIEW', at: sent },
          { who: ownerOf(h).fullName, text: 'gửi hồ sơ', at: sent },
        ],
      };
    });
  },
  /* Club Manager: users + audit log (backend branch `test`); an older backend without these APIs → db.json */
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
const isApproved = (h: BeHorse) => (h.approvalStatus ? h.approvalStatus === 'APPROVED' : h.stallId != null);
const REG_CHECKS: [string, string][] = [['identity', 'Danh tính chủ ngựa'], ['health', 'Giấy chứng nhận sức khỏe còn hiệu lực'], ['ownership', 'Giấy tờ sở hữu hợp lệ']];
const unknownHorse = (id: string): Row => ({
  id, name: id.slice(4), breed: '—', sex: '♂', age: 0, owner: '—', stall: '—', trainerId: '', health: 'HEALTHY', trainingLocked: false,
  form: null, pendingCase: null, lock: null, injuries: [], medicalHistory: [], raceResults: [], medicalDiet: null,
});
const tourId = (e: BeExam) => `T-${e.tournamentName}-${e.raceDate}`.replace(/\s+/g, '-');

/* ---------- writes the backend supports ---------- */
/** Returns true when the backend stored the whole change: the rows are then read again instead of kept in this tab. */
type Write = (id: string | undefined, body: Row, current: Row | undefined) => Promise<boolean | void> | boolean | void;
const WRITES: Record<string, Partial<Record<'post' | 'patch', Write>>> = {
  registrations: {
    // owner sends the file → a new horse without a stall (waiting for approval)
    async post(_id, body) {
      const h = body.horse as { name: string; breed: string; sex: string; age: number };
      const x = body.horseExtra as { color: string; weight: number; passport: string };
      if (!(Number(x.weight) >= 0.1)) throw new Error('Nhập cân nặng của ngựa (kg).');
      await be.post('/horses/register', {
        horseName: h.name, dob: `${new Date().getFullYear() - h.age}-01-01`, gender: h.sex === '♀' ? 'Mare' : 'Stallion', breed: h.breed,
        pedigree: [x.passport && `Hộ chiếu ${x.passport}`, x.color && `màu ${x.color}`].filter(Boolean).join(' · ') || null,
        weightKg: Number(x.weight), ownerId: Number(me()?.id),
      });
      return true;
    },
    // approve = assign a stall; the backend has no rejection yet (kept in this tab)
    async patch(_id, body, current) {
      if (body.status !== 'Approved') return false;
      if (!body.stallId) throw new Error('Chọn chuồng để cấp cho ngựa.');
      await be.put(`/horses/${current?.beId}/approve`, { stallId: Number(body.stallId) });
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
    async patch(id, body) {
      const exam = body.exam as { diagnosis: string; plan: string } | undefined;
      if (exam) await be.post('/medical/cases/action', { caseId: id, vetNotes: exam.diagnosis, treatmentDirection: exam.plan }, { params: { vetId: me()?.id } });
    },
  },
  trainingSessions: {
    async patch(id, body) {
      if (body.status === 'COMPLETED') await be.put(`/training-sessions/${id}/execute`, { status: 'COMPLETED', notes: 'Hoàn thành phiên' });
      if (body.status === 'STOPPED') await be.put(`/training-sessions/${id}/execute`, { status: 'CANCELLED', notes: (body.decision as Row | undefined)?.note ?? 'Dừng phiên' });
    },
    async post(_id, body) {
      if (!body.planId) throw new Error('Ngựa này chưa có giáo án trên hệ thống — tạo giáo án trước khi phân công.');
      const [d, m, y] = String(body.date).split('/');
      await be.post(`/training-plans/${body.planId}/sessions`, {
        sessionDate: `${y}-${m}-${d}T${body.time ?? '08:00'}:00`, activityType: body.label ?? 'Phiên tập', notes: body.track ?? '', assignedToId: Number(body.groomId) || undefined,
      });
    },
  },
};

/* ---------- cache + per-tab overlay ---------- */
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
/** Forget cached rows (and local-only changes) after a write the backend made itself. */
export const invalidate = (...names: string[]) => names.forEach((n) => { cache.delete(n); overlay.delete(n); });
const mockGet = async (url: string) => (await mockAdapter({ url, method: 'get', headers: {} } as InternalAxiosRequestConfig)).data;

export const hybridAdapter: AxiosAdapter = async (config) => {
  const url = new URL(config.url ?? '/', 'http://mock.local');
  const [name, id] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!name || !(name in LOADERS)) return mockAdapter(config);

  const method = (config.method ?? 'get').toLowerCase();
  const params: Record<string, unknown> = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  if (name === 'tasks') delete params.date; // the backend already returns this groom's current tasks
  const body = typeof config.data === 'string' && config.data ? (JSON.parse(config.data) as Row) : ((config.data as Row) ?? {});
  const rows = await rowsOf(name);

  if (method === 'get') {
    if (id === undefined) return respond(config, 200, queryRows(rows, params));
    const row = rows.find((r) => String(r.id) === id);
    if (row) return respond(config, 200, row);
    // Sample records of the backend (pre-race exams, vaccinations, protocols) name horses that are not in the Horses table yet
    if (name === 'horses' && id.startsWith('ten:')) return respond(config, 200, unknownHorse(id));
    // roles that may not read /horses (warehouse) still open a protocol: build the horse from the protocol row
    if (name === 'horses') {
      const p = (await rowsOf('protocols')).find((r) => String(r.horseId) === id);
      if (p) return respond(config, 200, { ...unknownHorse(`ten:${p.horse}`), id, trainingLocked: !!p.trainingLocked });
    }
    return fail(config, 404);
  }

  const current = id === undefined ? undefined : rows.find((r) => String(r.id) === id);
  const write = WRITES[name]?.[method as 'post' | 'patch'];
  const stored = write ? await write(id, body, current) : false; // backend errors reach the screen as normal errors
  cache.delete(name);
  if (stored === true) {
    invalidate(name, 'horses', 'stalls');
    return respond(config, method === 'post' ? 201 : 200, { ...(current ?? {}), ...body });
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
