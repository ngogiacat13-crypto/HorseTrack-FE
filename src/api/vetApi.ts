// ==================== API — BÁC SĨ THÚ Y (Veterinarian) ====================
// Business rules enforced here, not only in the UI:
//  - BR_01: only the vet locks / unlocks training; a lock pauses the horse's running training plan.
//  - BR_03: the vet sets the medical diet and approves special feed; it overrides the normal ration.
//  - BR_04: pre-race exam — PASS moves the proposal to the owner, FAIL stops it. A locked/injured horse cannot pass.
//  - BR_07: the vet builds and confirms the protocol after the warehouse stock answer. No Club Manager approval.
//           A protocol replaced by a new version becomes SUPERSEDED and is never dispensed.
import { DEMO_NOW, http } from './http';
import { Actor, addAudit, ProtocolState } from './managerApi';
import type { HealthStatus, Horse, Injury, RaceProposal, Tournament, TrainingPlan, TrainingSession, Vaccination } from './trainerApi';

/* ---------------- Types ---------------- */
export type CaseSource = 'SESSION_STOP' | 'GROOM_REPORT' | 'TRAINER_REQUEST';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus = 'NEW' | 'MONITORING' | 'CLOSED';
export interface CaseExam { symptoms: string; diagnosis: string; severity: Severity; plan: string; health: HealthStatus; by: string; at: string }
export interface VetCase {
  id: string; horseId: string; horse: string; source: CaseSource; sessionId?: string; type: string; severity: Severity;
  status: CaseStatus; sender: string; at: string; note: string;
  exam?: CaseExam | null; protocolId?: string | null; outcome?: string;
}

export interface InventoryItem {
  id: string; name: string; note?: string; category: string; unit: string; unitPrice: number; onHand: number; held: number; safety: number;
  /** Drug group, route, example brands and a textbook reference dose (the vet decides the real dose). */
  group: string; route: string; brand?: string; doseRef?: string;
  /** Reference detection time in competition testing (FEI Detection Times 2022) — only where a published value exists. */
  detectionHours?: number;
  rx?: boolean; controlled?: boolean;
}
export interface ProtoItem { itemId: string; name: string; unit: string; unitPrice: number; qty: number }
export interface ProtoPhase { no: number; name: string; startDate: string; days: number; goal: string; items: ProtoItem[] }
export interface StockLine {
  itemId: string; name: string; unit: string; need: number; available: number; held: number; short: number;
  eta: string | null; lot: string | null; expiry: string | null; shipment?: string;
}
export interface Protocol {
  id: string; version: number; replaces: string | null; supersededBy: string | null;
  horseId: string; horse: string; caseId: string; diagnosis: string; vet: string; createdAt: string; requiredBy: string;
  phases: ProtoPhase[]; state: ProtocolState; path: ProtocolState[];
  stock: null | { at: string; by: string; lines: StockLine[] };
  wait: null | { eta: string; requiredBy: string; at: string; note: string };
  delayed: boolean;
  progress: { at: string; by: string; text: string }[];
  outcome: string | null;
  // Fields read by the Club Manager monitor (kept in sync on every change)
  label: string; tone: 'danger' | 'info' | 'success' | 'neutral'; cost: number; trainingLocked?: boolean; open: boolean;
  alertState?: ProtocolState; materials: { item: string; status: string; tone: 'success' | 'danger' | 'neutral' }[]; note: string;
  log: { tone?: 'danger' | 'warning' | 'success'; who: string; text: string; at: string }[];
}
export interface Shipment { id: string; item: string; status: 'DELAYED' | 'IN_TRANSIT'; etaOld?: string; eta: string; forRef: string }
export interface MedicalDiet { by: string; at: string; morning: string; noon: string; evening: string; special: string; note: string }
export interface FeedRequest {
  id: string; horseId: string; horse: string; item: string; reason: string; by: string; at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; vetNote?: string; decidedBy?: string; decidedAt?: string;
}
export type VetHorse = Horse & { medicalDiet: MedicalDiet | null };

/* ---------------- Labels ---------------- */
type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
export const SOURCE_LABEL: Record<CaseSource, string> = { SESSION_STOP: 'Dừng phiên', GROOM_REPORT: 'Mã phu báo', TRAINER_REQUEST: 'HLV yêu cầu' };
export const SEVERITY_LABEL: Record<Severity, [string, Tone]> = { HIGH: ['Cao', 'danger'], MEDIUM: ['Trung bình', 'warning'], LOW: ['Thấp', 'success'] };
export const CASE_LABEL: Record<CaseStatus, [string, Tone]> = { NEW: ['Chờ xử lý', 'info'], MONITORING: ['Đang theo dõi', 'warning'], CLOSED: ['Đã đóng', 'neutral'] };
export const PROTOCOL_LABEL: Record<ProtocolState, [string, Tone]> = {
  DRAFT: ['Bản nháp', 'neutral'],
  WAITING_STOCK_CHECK: ['Chờ kho kiểm tồn', 'info'],
  STOCK_SHORTAGE: ['Thiếu vật tư — chờ BS quyết định', 'danger'],
  STOCK_AVAILABLE: ['Kho đủ hàng — chờ BS xác nhận', 'info'],
  WAITING_RESTOCK: ['Chờ hàng về', 'warning'],
  REQUIRES_VET_REVIEW: ['Cần BS đánh giá lại', 'danger'],
  VET_CONFIRMED: ['BS đã xác nhận', 'success'],
  READY_FOR_DISPENSING: ['Chờ kho cấp phát', 'success'],
  IN_TREATMENT: ['Đang điều trị', 'success'],
  COMPLETED: ['Hoàn tất', 'neutral'],
  SUPERSEDED: ['Đã bị thay thế', 'neutral'],
  CANCELLED: ['Đã hủy', 'neutral'],
};
/** The main status path from the spec (section 5) — used for the stepper. */
export const PROTOCOL_FLOW: ProtocolState[] = ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_AVAILABLE', 'VET_CONFIRMED', 'READY_FOR_DISPENSING', 'IN_TREATMENT', 'COMPLETED'];
/** States where the vet has to act. */
export const VET_ACTION_STATES: ProtocolState[] = ['DRAFT', 'STOCK_SHORTAGE', 'STOCK_AVAILABLE', 'REQUIRES_VET_REVIEW', 'IN_TREATMENT'];
const CLOSED_STATES: ProtocolState[] = ['COMPLETED', 'SUPERSEDED', 'CANCELLED'];
export const isOpenProtocol = (p: Pick<Protocol, 'state'>) => !CLOSED_STATES.includes(p.state);

export const INJURY_SEVERITIES = ['Nhẹ', 'Trung bình', 'Nặng'] as const;
/** Body parts on the 2D map (public/horse-injury-map.svg, horse seen from its left side). x/y are % of the image. */
export const BODY_PARTS: { part: string; x: number; y: number }[] = [
  { part: 'Đầu', x: 20, y: 17 },
  { part: 'Cổ', x: 33, y: 25 },
  { part: 'Vai', x: 38, y: 40 },
  { part: 'Ngực', x: 35, y: 50 },
  { part: 'Lưng', x: 53, y: 38 },
  { part: 'Bụng', x: 55, y: 52 },
  { part: 'Hông · mông', x: 71, y: 42 },
  { part: 'Đuôi', x: 84, y: 52 },
  { part: 'Chân trước trái', x: 39, y: 66 },
  { part: 'Chân trước phải', x: 44, y: 70 },
  { part: 'Gối trước', x: 39, y: 74 },
  { part: 'Móng trước', x: 38, y: 93 },
  { part: 'Chân sau trái', x: 72, y: 64 },
  { part: 'Chân sau phải', x: 79, y: 67 },
  { part: 'Khuỷu chân sau', x: 80, y: 72 },
  { part: 'Móng sau trái', x: 72, y: 93 },
  { part: 'Móng sau phải', x: 80, y: 93 },
];

/* ---------------- Date helpers (dd/mm/yyyy) ---------------- */
export const dateKey = (d: string) => d.split('/').reverse().join('');
const pad = (n: number) => String(n).padStart(2, '0');
const toDate = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
const fmt = (x: Date) => `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
export const addDays = (d: string, n: number) => { const x = toDate(d); x.setDate(x.getDate() + n); return fmt(x); };
export const addMonths = (d: string, n: number) => { const x = toDate(d); x.setMonth(x.getMonth() + n); return fmt(x); };
export const isDate = (d: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(d) && fmt(toDate(d)) === d;
/** Days from the demo clock to the given date (negative = past). */
export const daysFromToday = (d: string) => Math.round((toDate(d).getTime() - toDate(DEMO_NOW.date).getTime()) / 86400000);
/** Due within the next 7 days (4.3), overdue included. */
export const dueWithin7 = (v: Pick<Vaccination, 'due' | 'status'>) => v.status !== 'DONE' && daysFromToday(v.due) <= 7;

/* ---------------- Drug detection before a race ---------------- */
export interface DrugWindow { protocolId: string; drug: string; lastDose: string; clearFrom: string; hours: number }
/** Drugs with a published detection time that the horse gets (or will get) in a protocol still in force.
    clearFrom = last dose day + detection time; a race on/before that day risks a positive test. */
export const drugWindows = (protocols: Protocol[], inventory: InventoryItem[], horseId: string): DrugWindow[] => {
  const det = new Map(inventory.filter((i) => i.detectionHours).map((i) => [i.id, i.detectionHours as number]));
  return protocols
    .filter((p) => p.horseId === horseId && !['SUPERSEDED', 'CANCELLED', 'DRAFT'].includes(p.state))
    .flatMap((p) => p.phases.flatMap((ph) => ph.items.filter((it) => det.has(it.itemId)).map((it) => {
      const hours = det.get(it.itemId) as number;
      const lastDose = addDays(ph.startDate, Math.max(0, ph.days - 1));
      return { protocolId: p.id, drug: it.name, lastDose, clearFrom: addDays(lastDose, Math.ceil(hours / 24)), hours };
    })));
};
/** Windows that are still open on the race day. */
export const blockingWindows = (windows: DrugWindow[], raceDate: string) => windows.filter((w) => dateKey(w.clearFrom) > dateKey(raceDate));

/* ---------------- Helpers ---------------- */
const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
const now = () => DEMO_NOW.short;
const min = (v: string, n: number, what: string) => { if (v.trim().length < n) throw new Error(`${what} ít nhất ${n} ký tự.`); return v.trim(); };
const addHistory = (h: Horse, title: string, tone: 'danger' | 'warning' | 'success') =>
  http.patch(`/horses/${h.id}`, { medicalHistory: [{ date: DEMO_NOW.date, title, tone }, ...h.medicalHistory] });
export const protoCost = (phases: ProtoPhase[]) => phases.reduce((s, p) => s + p.items.reduce((t, i) => t + i.qty * i.unitPrice, 0), 0);
const lastEta = (lines: StockLine[]) => lines.filter((l) => l.short > 0 && l.eta).map((l) => l.eta as string).sort((a, b) => dateKey(a).localeCompare(dateKey(b))).pop() ?? null;
export const stockShort = (p: Pick<Protocol, 'stock'>) => (p.stock?.lines ?? []).filter((l) => l.short > 0);

/** Recompute the fields the Club Manager monitor shows, after any change. */
const watchFields = (p: Protocol, horseLocked: boolean): Partial<Protocol> => {
  const [label, tone] = PROTOCOL_LABEL[p.state];
  const materials = p.stock
    ? p.stock.lines.map((l) => ({
        item: `${l.name} · ${l.need} ${l.unit}`,
        status: l.short > 0 ? `Thiếu ${l.short}${l.eta ? ` · ETA ${l.eta.slice(0, 5)}` : ''}` : p.state === 'SUPERSEDED' ? 'Không cấp — bản đã bị thay' : `Đủ · đã giữ ${l.held}`,
        tone: (l.short > 0 ? 'danger' : p.state === 'SUPERSEDED' ? 'neutral' : 'success') as 'danger' | 'neutral' | 'success',
      }))
    : p.phases.flatMap((ph) => ph.items.map((i) => ({ item: `${i.name} · ${i.qty} ${i.unit}`, status: p.state === 'DRAFT' ? 'Chưa gửi kho' : 'Đang kiểm', tone: 'neutral' as const })));
  return {
    label, cost: protoCost(p.phases), trainingLocked: horseLocked, open: isOpenProtocol(p), materials,
    tone: (tone === 'warning' || tone === 'purple' ? 'info' : tone) as Protocol['tone'],
    alertState: ['STOCK_SHORTAGE', 'REQUIRES_VET_REVIEW'].includes(p.state) || p.delayed ? p.state : undefined,
  };
};
const saveProtocol = async (p: Protocol, change: Partial<Protocol>, logLine?: Protocol['log'][number]) => {
  const next = { ...p, ...change };
  const horse = await get<Horse>(`/horses/${p.horseId}`);
  const log = logLine ? [logLine, ...p.log] : p.log;
  const { data } = await http.patch<Protocol>(`/protocols/${p.id}`, { ...change, ...watchFields(next, horse.trainingLocked), log });
  return data;
};
const goTo = (p: Protocol, ...states: ProtocolState[]) => ({ state: states[states.length - 1], path: [...p.path, ...states] });

/** Held stock of a protocol that will not be used any more goes back to "available" (BR_08 / §8 note). */
const releaseHeld = async (p: Protocol) => {
  const lines = p.stock?.lines.filter((l) => l.held > 0) ?? [];
  await Promise.all(lines.map(async (l) => {
    const it = await get<InventoryItem>(`/inventory/${l.itemId}`).catch(() => null);
    if (it) await http.patch(`/inventory/${it.id}`, { held: Math.max(0, it.held - l.held) });
  }));
};

/* ---------------- API ---------------- */
export const vetApi = {
  /* ----- Dashboard: herd health ----- */
  async getOverview() {
    const [horses, cases, protocols, vaccinations, proposals, feedRequests] = await Promise.all([
      get<VetHorse[]>('/horses'), get<VetCase[]>('/vetCases'), get<Protocol[]>('/protocols'), get<Vaccination[]>('/vaccinations'),
      get<RaceProposal[]>('/raceProposals'), get<FeedRequest[]>('/feedRequests'),
    ]);
    return { horses, cases, protocols, vaccinations, proposals, feedRequests };
  },

  /* ----- 1.1–1.2 Case inbox ----- */
  async getCases() {
    const [cases, horses, protocols, sessions] = await Promise.all([
      get<VetCase[]>('/vetCases'), get<VetHorse[]>('/horses'), get<Protocol[]>('/protocols'), get<TrainingSession[]>('/trainingSessions'),
    ]);
    // The vet only sees sessions linked to a case ("Xem ca liên quan" in the permission matrix).
    const linked = new Set(cases.map((c) => c.sessionId).filter(Boolean));
    return { cases, horses, protocols, sessions: sessions.filter((s) => linked.has(s.id)) };
  },

  async examineCase(c: VetCase, input: { symptoms: string; diagnosis: string; severity: Severity; plan: string; health: HealthStatus }, actor: Actor) {
    if (c.status === 'CLOSED') throw new Error('Ca đã đóng.');
    const exam: CaseExam = {
      symptoms: min(input.symptoms, 10, 'Triệu chứng'), diagnosis: min(input.diagnosis, 5, 'Chẩn đoán'), plan: min(input.plan, 10, 'Hướng xử lý'),
      severity: input.severity, health: input.health, by: actor.name, at: now(),
    };
    const horse = await get<Horse>(`/horses/${c.horseId}`);
    const { data } = await http.patch<VetCase>(`/vetCases/${c.id}`, { exam, severity: input.severity, status: 'MONITORING' });
    await http.patch(`/horses/${horse.id}`, { health: input.health, pendingCase: horse.pendingCase === c.id ? null : horse.pendingCase });
    await addHistory(horse, `Khám ${c.type.toLowerCase()} · #${c.id} — ${exam.diagnosis}`, input.severity === 'HIGH' ? 'danger' : 'warning');
    await addAudit(actor, { action: 'RECORD_EXAM', label: 'Ghi nhận ca khám', object: `${c.id} · ${c.horse}`, area: 'med', from: c.status, to: 'MONITORING', reason: exam.diagnosis });
    return data;
  },

  async closeCase(c: VetCase, outcome: string, actor: Actor) {
    if (c.status === 'CLOSED') throw new Error('Ca đã đóng.');
    if (!c.exam) throw new Error('Ghi nhận khám trước khi đóng ca.');
    const protocols = await get<Protocol[]>('/protocols', { caseId: c.id });
    const open = protocols.find(isOpenProtocol);
    if (open) throw new Error(`Phác đồ ${open.id} còn đang mở (${PROTOCOL_LABEL[open.state][0]}) — hoàn tất hoặc hủy trước khi đóng ca.`);
    const { data } = await http.patch<VetCase>(`/vetCases/${c.id}`, { status: 'CLOSED', outcome: min(outcome, 10, 'Kết luận') });
    await addAudit(actor, { action: 'CLOSE_CASE', label: 'Đóng ca khám', object: `${c.id} · ${c.horse}`, area: 'med', from: c.status, to: 'CLOSED', reason: outcome.trim() });
    return data;
  },

  /* ----- Horse health record (1.3, 1.4, 3.1–3.4) ----- */
  async getHorseHealth(id: string) {
    const [horse, cases, protocols, vaccinations, proposals, feedRequests] = await Promise.all([
      get<VetHorse>(`/horses/${id}`), get<VetCase[]>('/vetCases', { horseId: id }), get<Protocol[]>('/protocols', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }), get<RaceProposal[]>('/raceProposals', { horseId: id }), get<FeedRequest[]>('/feedRequests', { horseId: id }),
    ]);
    return { horse, cases, protocols, vaccinations, proposals, feedRequests };
  },

  async addInjury(horse: Horse, input: { part: string; severity: string; note: string; x: number; y: number; caseId?: string }, actor: Actor) {
    if (!input.part.trim()) throw new Error('Chọn bộ phận bị ảnh hưởng.');
    if (!(INJURY_SEVERITIES as readonly string[]).includes(input.severity)) throw new Error('Chọn mức độ.');
    const note = min(input.note, 5, 'Mô tả');
    const all = horse.injuries ?? [];
    const injury: Injury & { id: string; caseId?: string } = {
      id: nextId(all.map((i) => (i as { id?: string }).id ?? ''), 'INJ-', 2) + '-' + horse.id.slice(2, 5),
      part: input.part.trim(), severity: input.severity, note, date: DEMO_NOW.date, vet: actor.name,
      x: Math.round(Math.min(98, Math.max(2, input.x))), y: Math.round(Math.min(98, Math.max(2, input.y))), caseId: input.caseId || undefined,
    };
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { injuries: [injury, ...all] });
    await addAudit(actor, { action: 'MARK_INJURY', label: 'Đánh dấu chấn thương 2D', object: `${horse.name} · ${injury.part}`, area: 'med', to: input.severity, reason: note });
    return data;
  },

  async removeInjury(horse: Horse, injuryId: string, actor: Actor) {
    const all = horse.injuries as (Injury & { id?: string })[];
    const target = all.find((i) => i.id === injuryId);
    if (!target) throw new Error('Không tìm thấy vết đánh dấu.');
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { injuries: all.filter((i) => i.id !== injuryId) });
    await addAudit(actor, { action: 'REMOVE_INJURY', label: 'Gỡ đánh dấu chấn thương', object: `${horse.name} · ${target.part}`, area: 'med', from: target.severity, to: 'đã gỡ' });
    return data;
  },

  /** 3.1 — BR_01. Pauses the running training plan; the trainer can no longer schedule or continue sessions. */
  async lockTraining(horse: Horse, input: { reason: string; review: string }, actor: Actor) {
    if (horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện.`);
    const reason = min(input.reason, 10, 'Lý do khóa');
    const review = min(input.review, 10, 'Điều kiện đánh giá lại');
    const lock = { by: actor.name, at: DEMO_NOW.date, reason, review };
    const plans = await get<TrainingPlan[]>('/trainingPlans', { horseId: horse.id, status: 'ACTIVE' });
    await Promise.all(plans.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'PAUSED', pausedReason: `Tạm dừng do BS ${actor.name} khóa huấn luyện — ${reason}` })));
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { trainingLocked: true, lock });
    await addHistory({ ...horse, ...data }, 'Khóa huấn luyện (BR_01)', 'danger');
    await addAudit(actor, { action: 'LOCK_TRAINING', label: 'Khóa huấn luyện', object: horse.name, area: 'med', from: 'Được tập', to: 'Khóa tập', reason });
    return { horse: data, pausedPlans: plans.length };
  },

  /** 3.2 — BR_01. Only the vet unlocks. Paused plans stay paused: the trainer decides when to resume. */
  async unlockTraining(horse: Horse, note: string, actor: Actor) {
    if (!horse.trainingLocked) throw new Error(`${horse.name} không bị khóa huấn luyện.`);
    const why = min(note, 10, 'Đánh giá đủ điều kiện');
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { trainingLocked: false, lock: null });
    await addHistory({ ...horse, ...data }, 'Mở khóa huấn luyện — đủ điều kiện y tế', 'success');
    await addAudit(actor, { action: 'UNLOCK_TRAINING', label: 'Mở khóa huấn luyện', object: horse.name, area: 'med', from: 'Khóa tập', to: 'Được tập', reason: why });
    return data;
  },

  /** 3.3 — BR_03. null removes the medical diet (back to the normal ration). */
  async setDiet(horse: VetHorse, diet: Omit<MedicalDiet, 'by' | 'at'> | null, actor: Actor) {
    if (diet) {
      if (![diet.morning, diet.noon, diet.evening].some((m) => m.trim())) throw new Error('Nhập ít nhất một bữa.');
      min(diet.note, 10, 'Lý do / ghi chú chỉ định');
    }
    const medicalDiet: MedicalDiet | null = diet ? { ...diet, by: actor.name, at: DEMO_NOW.date } : null;
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { medicalDiet });
    await addAudit(actor, {
      action: diet ? 'SET_MEDICAL_DIET' : 'CLEAR_MEDICAL_DIET', label: diet ? 'Chỉ định khẩu phần y tế' : 'Bỏ khẩu phần y tế', object: horse.name, area: 'med',
      from: horse.medicalDiet ? 'Khẩu phần y tế' : 'Khẩu phần thường', to: diet ? 'Khẩu phần y tế' : 'Khẩu phần thường', reason: diet?.note,
    });
    return data;
  },

  /** 3.4 — approve / reject a special feed request. Approved feed is added to the medical diet. */
  async decideFeed(req: FeedRequest, approve: boolean, note: string, actor: Actor) {
    if (req.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý.');
    if (!approve) min(note, 10, 'Lý do từ chối');
    const { data } = await http.patch<FeedRequest>(`/feedRequests/${req.id}`, { status: approve ? 'APPROVED' : 'REJECTED', vetNote: note.trim() || undefined, decidedBy: actor.name, decidedAt: now() });
    if (approve) {
      const horse = await get<VetHorse>(`/horses/${req.horseId}`);
      const base = horse.medicalDiet ?? { by: actor.name, at: DEMO_NOW.date, morning: '', noon: '', evening: '', special: '', note: 'Bổ sung thức ăn đặc biệt.' };
      await http.patch(`/horses/${req.horseId}`, { medicalDiet: { ...base, special: [base.special, req.item].filter(Boolean).join('; '), by: actor.name, at: DEMO_NOW.date } });
    }
    await addAudit(actor, { action: approve ? 'APPROVE_SPECIAL_FEED' : 'REJECT_SPECIAL_FEED', label: approve ? 'Duyệt thức ăn đặc biệt' : 'Từ chối thức ăn đặc biệt', object: `${req.id} · ${req.horse}`, area: 'med', from: 'PENDING', to: approve ? 'APPROVED' : 'REJECTED', reason: note.trim() || req.item });
    return data;
  },

  /* ----- 2.x Protocols ----- */
  async getProtocols() {
    const [protocols, horses, shipments] = await Promise.all([get<Protocol[]>('/protocols'), get<VetHorse[]>('/horses'), get<Shipment[]>('/shipments')]);
    return { protocols, horses, shipments };
  },

  async getProtocol(id: string) {
    const p = await get<Protocol>(`/protocols/${id}`);
    const [horse, vetCase, versions, shipments] = await Promise.all([
      get<VetHorse>(`/horses/${p.horseId}`), get<VetCase>(`/vetCases/${p.caseId}`).catch(() => null),
      get<Protocol[]>('/protocols', { caseId: p.caseId }), get<Shipment[]>('/shipments'),
    ]);
    return { protocol: p, horse, vetCase, versions: versions.sort((a, b) => b.version - a.version), shipments: shipments.filter((s) => s.forRef === p.id) };
  },

  /** Data for the create form: horse + case + the warehouse catalogue, and the version being replaced (2.4). */
  async getProtocolForm(opts: { horseId?: string; caseId?: string; replaceId?: string }) {
    const [horses, cases, inventory] = await Promise.all([get<VetHorse[]>('/horses'), get<VetCase[]>('/vetCases'), get<InventoryItem[]>('/inventory')]);
    const replacing = opts.replaceId ? await get<Protocol>(`/protocols/${opts.replaceId}`) : null;
    return { horses, cases: cases.filter((c) => c.status !== 'CLOSED'), inventory: inventory.filter((i) => i.category !== 'Thức ăn'), replacing };
  },

  /** 2.1 + 2.2 — save a draft, or send it straight to the warehouse stock check (never to the Club Manager). */
  async createProtocol(input: { horseId: string; caseId: string; diagnosis: string; requiredBy: string; phases: ProtoPhase[]; replaces?: string | null }, send: boolean, actor: Actor) {
    const horse = await get<Horse>(`/horses/${input.horseId}`);
    const vetCase = await get<VetCase>(`/vetCases/${input.caseId}`).catch(() => { throw new Error('Chọn ca khám cho phác đồ.'); });
    if (vetCase.horseId !== horse.id) throw new Error('Ca khám không thuộc ngựa này.');
    if (vetCase.status === 'CLOSED') throw new Error('Ca khám đã đóng.');
    const diagnosis = min(input.diagnosis, 5, 'Chẩn đoán');
    if (!input.phases.length) throw new Error('Phác đồ cần ít nhất 1 giai đoạn.');
    input.phases.forEach((ph, i) => {
      if (!ph.name.trim()) throw new Error(`Giai đoạn ${i + 1}: nhập tên giai đoạn.`);
      if (!isDate(ph.startDate)) throw new Error(`Giai đoạn ${i + 1}: ngày bắt đầu theo dạng dd/mm/yyyy.`);
      if (!Number.isInteger(ph.days) || ph.days < 1) throw new Error(`Giai đoạn ${i + 1}: thời lượng ít nhất 1 ngày.`);
      if (ph.items.some((it) => !Number.isInteger(it.qty) || it.qty < 1)) throw new Error(`Giai đoạn ${i + 1}: số lượng thuốc/vật tư phải là số nguyên ≥ 1.`);
    });
    if (!input.phases.some((ph) => ph.items.length)) throw new Error('Thêm ít nhất 1 thuốc/vật tư để gửi kiểm tồn.');
    if (input.requiredBy && !isDate(input.requiredBy)) throw new Error('Ngày cần thuốc theo dạng dd/mm/yyyy.');

    const all = await get<Protocol[]>('/protocols');
    const replaced = input.replaces ? all.find((p) => p.id === input.replaces) : undefined;
    if (input.replaces && (!replaced || !isOpenProtocol(replaced))) throw new Error('Phác đồ cũ không còn hiệu lực để thay thế.');
    const id = nextId(all.map((p) => p.id), 'PD-');
    const states: ProtocolState[] = send ? ['DRAFT', 'WAITING_STOCK_CHECK'] : ['DRAFT'];
    const draft: Protocol = {
      id, version: replaced ? replaced.version + 1 : 1, replaces: replaced?.id ?? null, supersededBy: null,
      horseId: horse.id, horse: horse.name, caseId: vetCase.id, diagnosis, vet: actor.name, createdAt: DEMO_NOW.date,
      requiredBy: input.requiredBy || input.phases[0].startDate,
      phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1, name: ph.name.trim(), goal: ph.goal.trim() })),
      state: states[states.length - 1], path: states, stock: null, wait: null, delayed: false, progress: [], outcome: null,
      label: '', tone: 'neutral', cost: 0, open: true, materials: [], note: send ? 'Đã gửi kho kiểm tra tồn, chờ phản hồi.' : 'Bản nháp chưa gửi kho.',
      log: [{ who: `BS ${actor.name}`, text: send ? `gửi kiểm tồn${replaced ? ` · thay thế ${replaced.id}` : ''}` : 'lưu bản nháp', at: now() }],
    };
    const { data } = await http.post<Protocol>('/protocols', { ...draft, ...watchFields(draft, horse.trainingLocked) });
    await http.patch(`/vetCases/${vetCase.id}`, { protocolId: data.id });
    if (send && replaced) await vetApi.supersede(replaced, data.id, actor);
    await addAudit(actor, { action: send ? 'SEND_STOCK_CHECK' : 'CREATE_PROTOCOL_DRAFT', label: send ? 'Gửi kiểm tra tồn kho' : 'Lưu phác đồ nháp', object: `${data.id} · ${horse.name}`, area: 'med', to: data.state, reason: replaced ? `Phiên bản ${data.version}, thay ${replaced.id}` : diagnosis });
    return data;
  },

  /** 2.2 — a saved draft goes to the warehouse. */
  async sendStockCheck(p: Protocol, actor: Actor) {
    if (p.state !== 'DRAFT') throw new Error('Chỉ gửi kiểm tồn cho bản nháp.');
    const data = await saveProtocol(p, { ...goTo(p, 'WAITING_STOCK_CHECK'), note: 'Đã gửi kho kiểm tra tồn, chờ phản hồi.' }, { who: `BS ${actor.name}`, text: 'gửi kiểm tồn', at: now() });
    if (p.replaces) {
      const old = await get<Protocol>(`/protocols/${p.replaces}`);
      if (isOpenProtocol(old)) await vetApi.supersede(old, p.id, actor);
    }
    await addAudit(actor, { action: 'SEND_STOCK_CHECK', label: 'Gửi kiểm tra tồn kho', object: `${p.id} · ${p.horse}`, area: 'med', from: 'DRAFT', to: 'WAITING_STOCK_CHECK' });
    return data;
  },

  async cancelDraft(p: Protocol, actor: Actor) {
    if (p.state !== 'DRAFT') throw new Error('Chỉ hủy được bản nháp.');
    const data = await saveProtocol(p, { ...goTo(p, 'CANCELLED'), note: 'Bản nháp đã hủy.' }, { who: `BS ${actor.name}`, text: 'hủy bản nháp', at: now() });
    await addAudit(actor, { action: 'CANCEL_PROTOCOL_DRAFT', label: 'Hủy phác đồ nháp', object: `${p.id} · ${p.horse}`, area: 'med', from: 'DRAFT', to: 'CANCELLED' });
    return data;
  },

  /** The old version is replaced: it is never dispensed, and its held stock is released. */
  async supersede(old: Protocol, byId: string, actor: Actor) {
    await releaseHeld(old);
    await saveProtocol(old, { ...goTo(old, 'SUPERSEDED'), supersededBy: byId, note: `Đã bị thay bằng ${byId} — không cấp phát theo bản này.` },
      { who: `BS ${actor.name}`, text: `thay bằng ${byId}`, at: now() });
  },

  /** 2.4 / 2.6 — wait for the shipment. When the ETA is after the date the medicine is needed, the vet must justify it. */
  async waitRestock(p: Protocol, note: string, actor: Actor) {
    if (!['STOCK_SHORTAGE', 'REQUIRES_VET_REVIEW'].includes(p.state)) throw new Error('Chỉ chọn chờ hàng khi kho báo thiếu hoặc khi cần đánh giá lại.');
    const short = stockShort(p);
    if (!short.length) throw new Error('Kho không còn báo thiếu — xác nhận phác đồ thay vì chờ hàng.');
    const eta = lastEta(short);
    if (!eta) throw new Error('Kho chưa có ngày dự kiến hàng về — chưa thể chọn chờ.');
    const late = dateKey(eta) > dateKey(p.requiredBy);
    const why = min(note, late ? 15 : 10, late ? 'Đánh giá an toàn khi chờ quá mốc cần thuốc' : 'Ghi chú');
    const data = await saveProtocol(p,
      { ...goTo(p, 'WAITING_RESTOCK'), wait: { eta, requiredBy: p.requiredBy, at: now(), note: why }, delayed: late,
        note: late ? `Chờ hàng về ${eta.slice(0, 5)} — trễ so với mốc cần thuốc ${p.requiredBy.slice(0, 5)}; BS đã đánh giá chờ vẫn an toàn.` : `Chờ hàng về ${eta.slice(0, 5)}, trước mốc cần thuốc ${p.requiredBy.slice(0, 5)}.` },
      { tone: 'warning', who: `BS ${actor.name}`, text: `chọn chờ hàng (ETA ${eta.slice(0, 5)})`, at: now() });
    await addAudit(actor, { action: 'WAIT_RESTOCK', label: 'Chờ nhập hàng', object: `${p.id} · ${p.horse}`, area: 'med', from: p.state, to: 'WAITING_RESTOCK', reason: why });
    return data;
  },

  /** 2.5 — the vet confirms after the warehouse can supply everything. Stock must be complete. */
  async confirmProtocol(p: Protocol, note: string, actor: Actor) {
    if (!['STOCK_AVAILABLE', 'REQUIRES_VET_REVIEW', 'WAITING_RESTOCK'].includes(p.state)) throw new Error('Phác đồ chưa ở bước xác nhận.');
    if (!p.stock) throw new Error('Kho chưa phản hồi tồn.');
    const short = stockShort(p);
    if (short.length) throw new Error(`Còn thiếu ${short.map((l) => `${l.name} ${l.short} ${l.unit}`).join(', ')} — chỉ xác nhận khi kho đủ khả năng cấp.`);
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    const why = min(note, 10, 'Đánh giá tính phù hợp');
    const data = await saveProtocol(p, { ...goTo(p, 'VET_CONFIRMED', 'READY_FOR_DISPENSING'), delayed: false, note: 'BS đã xác nhận — kho chuẩn bị cấp phát.' },
      { tone: 'success', who: `BS ${actor.name}`, text: 'xác nhận phác đồ, chuyển kho cấp phát', at: now() });
    await addAudit(actor, { action: 'CONFIRM_PROTOCOL', label: 'Xác nhận phác đồ', object: `${p.id} · ${horse.name}`, area: 'med', from: p.state, to: 'READY_FOR_DISPENSING', reason: why });
    return data;
  },

  /** 2.7 — progress notes while in treatment. */
  async addProgress(p: Protocol, text: string, actor: Actor) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ ghi tiến triển khi đang điều trị.');
    const entry = { at: now(), by: actor.name, text: min(text, 10, 'Tiến triển') };
    const data = await saveProtocol(p, { progress: [entry, ...p.progress] });
    await addAudit(actor, { action: 'TREATMENT_PROGRESS', label: 'Ghi tiến triển điều trị', object: `${p.id} · ${p.horse}`, area: 'med', reason: entry.text });
    return data;
  },

  async completeProtocol(p: Protocol, outcome: string, actor: Actor) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ kết thúc khi phác đồ đang điều trị.');
    const why = min(outcome, 10, 'Kết quả điều trị');
    const data = await saveProtocol(p, { ...goTo(p, 'COMPLETED'), outcome: why, note: `Hoàn tất: ${why}` }, { tone: 'success', who: `BS ${actor.name}`, text: 'kết thúc điều trị', at: now() });
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    await addHistory(horse, `Hoàn tất phác đồ ${p.id} — ${why}`, 'success');
    await addAudit(actor, { action: 'COMPLETE_PROTOCOL', label: 'Kết thúc điều trị', object: `${p.id} · ${p.horse}`, area: 'med', from: 'IN_TREATMENT', to: 'COMPLETED', reason: why });
    return data;
  },

  /* ----- 4.x Vaccination & deworming ----- */
  async getVaccinations() {
    const [vaccinations, horses] = await Promise.all([get<Vaccination[]>('/vaccinations'), get<VetHorse[]>('/horses')]);
    return { vaccinations, horses };
  },

  /** 4.1 / 4.2 — one schedule line per selected horse. */
  async scheduleVaccination(input: { horseIds: string[]; kind: 'VACCINE' | 'DEWORM'; type: string; due: string; cycleMonths: number; note: string }, actor: Actor) {
    if (!input.horseIds.length) throw new Error('Chọn ít nhất 1 ngựa.');
    const type = min(input.type, 3, input.kind === 'DEWORM' ? 'Loại thuốc tẩy giun' : 'Loại vaccine');
    if (!isDate(input.due)) throw new Error('Ngày dự kiến theo dạng dd/mm/yyyy.');
    if (daysFromToday(input.due) < 0) throw new Error('Ngày dự kiến không được ở quá khứ.');
    if (input.kind === 'DEWORM' && (input.cycleMonths < 3 || input.cycleMonths > 6)) throw new Error('Chu kỳ tẩy giun từ 3 đến 6 tháng.');
    if (input.kind === 'VACCINE' && (input.cycleMonths < 1 || input.cycleMonths > 24)) throw new Error('Chu kỳ tiêm nhắc từ 1 đến 24 tháng.');
    const [all, horses] = await Promise.all([get<Vaccination[]>('/vaccinations'), get<Horse[]>('/horses')]);
    const dup = all.find((v) => input.horseIds.includes(v.horseId) && v.type.toLowerCase() === type.toLowerCase() && v.status !== 'DONE');
    if (dup) throw new Error(`${dup.horse} đã có lịch “${dup.type}” ngày ${dup.due}.`);
    const ids = all.map((v) => v.id);
    const created: Vaccination[] = [];
    for (const hid of input.horseIds) {
      const h = horses.find((x) => x.id === hid);
      if (!h) continue;
      const id = nextId(ids, 'VC-', 3);
      ids.push(id);
      const row = { id, horseId: h.id, horse: h.name, type, kind: input.kind, cycleMonths: input.cycleMonths, due: input.due, status: daysFromToday(input.due) <= 7 ? 'DUE_SOON' : 'SCHEDULED', note: input.note.trim() || undefined } as Vaccination;
      created.push((await http.post<Vaccination>('/vaccinations', row)).data);
    }
    await addAudit(actor, { action: input.kind === 'DEWORM' ? 'SCHEDULE_DEWORM' : 'SCHEDULE_VACCINE', label: input.kind === 'DEWORM' ? 'Tạo lịch tẩy giun' : 'Tạo lịch tiêm phòng', object: `${type} · ${created.map((c) => c.horse).join(', ')}`, area: 'med', to: `${input.due} · chu kỳ ${input.cycleMonths} tháng` });
    return created;
  },

  /** 4.4 — record it as done and plan the next one from the cycle. */
  async recordVaccination(v: Vaccination, input: { doneAt: string; lot: string; by: string }, actor: Actor) {
    if (v.status === 'DONE') throw new Error('Mũi này đã được ghi nhận.');
    if (!isDate(input.doneAt)) throw new Error('Ngày thực hiện theo dạng dd/mm/yyyy.');
    if (daysFromToday(input.doneAt) > 0) throw new Error('Ngày thực hiện không được sau hôm nay.');
    const lot = min(input.lot, 3, 'Số lô');
    const by = min(input.by, 3, 'Người thực hiện');
    const ext = v as Vaccination & { cycleMonths?: number; kind?: string };
    const { data } = await http.patch<Vaccination>(`/vaccinations/${v.id}`, { status: 'DONE', doneAt: input.doneAt, lot, by });
    let next: Vaccination | null = null;
    if (ext.cycleMonths) {
      const all = await get<Vaccination[]>('/vaccinations');
      const due = addMonths(input.doneAt, ext.cycleMonths);
      next = (await http.post<Vaccination>('/vaccinations', { ...ext, id: nextId(all.map((x) => x.id), 'VC-', 3), due, status: 'SCHEDULED', note: `Nhắc lại sau ${ext.cycleMonths} tháng`, doneAt: undefined, lot: undefined, by: undefined })).data;
    }
    const horse = await get<Horse>(`/horses/${v.horseId}`);
    await addHistory(horse, `${v.type} · lô ${lot}`, 'success');
    await addAudit(actor, { action: 'RECORD_VACCINATION', label: ext.kind === 'DEWORM' ? 'Ghi nhận tẩy giun' : 'Ghi nhận đã tiêm', object: `${v.id} · ${v.horse}`, area: 'med', from: v.status, to: 'DONE', reason: `${v.type} · lô ${lot} · ${by}${next ? ` · nhắc lại ${next.due}` : ''}` });
    return { done: data, next };
  },

  /* ----- 5.x Pre-race exam (BR_04) ----- */
  async getRaceExams() {
    const [proposals, tournaments, horses, protocols, inventory] = await Promise.all([
      get<RaceProposal[]>('/raceProposals'), get<Tournament[]>('/tournaments'), get<VetHorse[]>('/horses'), get<Protocol[]>('/protocols'), get<InventoryItem[]>('/inventory'),
    ]);
    return { proposals, tournaments, horses, protocols, inventory };
  },

  /* ----- Medicine catalogue (read-only for the vet; stock is owned by the warehouse) ----- */
  async getMedicines() {
    const inventory = await get<InventoryItem[]>('/inventory');
    return inventory.filter((i) => i.category !== 'Thức ăn');
  },

  async recordRaceExam(p: RaceProposal, input: { pass: boolean; note: string; conditions: string }, actor: Actor) {
    if (p.status !== 'WAITING_VET_EXAM') throw new Error('Đề xuất này không chờ khám trước thi đấu.');
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    if (input.pass && horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện — không thể kết luận ĐẠT (BR_01).`);
    if (input.pass && (horse.health === 'INJURED' || horse.health === 'QUARANTINE')) throw new Error(`${horse.name} đang ${horse.health === 'INJURED' ? 'chấn thương' : 'cách ly'} — không thể kết luận ĐẠT.`);
    const note = min(input.note, 10, input.pass ? 'Nhận xét khám' : 'Lý do không đạt');
    const vetResult = { pass: input.pass, by: actor.name, at: now(), note, conditions: input.conditions.trim() || undefined };
    const status = input.pass ? 'WAITING_OWNER' : 'VET_FAILED';
    const history = [
      { at: now(), who: `BS ${actor.name}`, text: input.pass ? 'kết luận ĐẠT · gửi kết quả cho chủ ngựa và HLV' : `kết luận KHÔNG ĐẠT: ${note}`, tone: input.pass ? 'success' as const : 'danger' as const },
      ...p.history,
    ];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status, vetResult, history });
    await addAudit(actor, { action: input.pass ? 'RACE_EXAM_PASS' : 'RACE_EXAM_FAIL', label: 'Khám trước thi đấu', object: `${p.id} · ${p.horseName}`, area: 'med', from: 'WAITING_VET_EXAM', to: input.pass ? 'VET_PASSED → WAITING_OWNER' : 'VET_FAILED', reason: note });
    return data;
  },
};
