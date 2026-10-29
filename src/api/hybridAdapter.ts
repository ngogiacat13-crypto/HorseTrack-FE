import type { AxiosAdapter } from 'axios';
import { be, type ApiResponse } from './beClient';
import { loadInvoices, loadPayments, mapInvoice, type BeInvoice } from './beFinance';
import { fail, queryRows, respond } from './mockServer';
import { loadAuditLogs, loadInventory, loadProtocols, loadRequisitions, loadShipments, loadStockChecks, loadStockTx, loadUsers, mapPo, mapUser, type BeUser } from './beDomain';


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
interface SessionReading { t: string; hr: number; speed: number }
const sessionNotes = (row: Row | undefined) => {
  const readings = (row?.readings as SessionReading[] | undefined) ?? [];
  if (!readings.length) return 'Hoàn thành phiên';
  const recovery = (row?.recovery as SessionReading[] | undefined) ?? [];
  const place = typeof row?.track === 'string' && row.track !== '—' ? row.track : 'Hoàn thành';
  const hr = Math.max(...readings.map((r) => r.hr));
  const speed = Math.max(...readings.map((r) => r.speed));
  const span = readings.length > 1 ? ` ${readings[0].t}–${readings[readings.length - 1].t}` : ` lúc ${readings[0].t}`;
  const rec = recovery.length ? `, Hồi phục ${recovery[recovery.length - 1].hr} bpm` : '';
  return `${place} · Ghi nhận: Nhịp tim max ${hr} bpm, Tốc độ max ${speed} km/h, ${readings.length} lần đo${span}${rec}`;
};
const readingsFromNotes = (notes: string | null | undefined, time: string): SessionReading[] => {
  const hr = notes?.match(/Nhịp tim max (\d+) bpm/);
  if (!hr) return [];
  const speed = notes?.match(/Tốc độ max ([\d.]+) km\/h/);
  return [{ t: time, hr: Number(hr[1]), speed: speed ? Number(speed[1]) : 0 }];
};
interface BeReading { time?: string | null; recordedAt?: string | null; heartRate: number; speedKmh?: number | string | null }
interface BeMonitor { notes?: string | null; sessionDate: string; maxHeartRate?: number | null; maxSpeedKmh?: number | string | null; startedAt?: string | null; pausedAt?: string | null; pausedReason?: string | null; readings?: BeReading[] | null; recovery?: BeReading[] | null; vetCaseCode?: string | null; status?: string }
const toReadings = (rows?: BeReading[] | null): SessionReading[] => (rows ?? []).map((r) => ({ t: r.time || hhmm(r.recordedAt), hr: r.heartRate, speed: Number(r.speedKmh ?? 0) }));
const INTENSITY_VI: Record<string, string> = { LOW: 'Nhẹ', MEDIUM: 'Vừa', HIGH: 'Cao', 'Nhẹ': 'Nhẹ', 'Vừa': 'Vừa', 'Cao': 'Cao' };
const decisionFrom = (s: BeMonitor) => {
  const status = (s.status ?? '').toUpperCase();
  const caseId = s.vetCaseCode || s.notes?.match(/Ca khám\s+(C-\d+|#\d+)/)?.[1];
  if (caseId && (status === 'WAITING_VET' || status === 'STOPPED' || status === 'CANCELLED')) {
    return { type: 'STOP_VET', by: 'HLV', at: s.pausedAt ? hhmm(s.pausedAt) : '', note: s.pausedReason || '', caseId };
  }
  const part = (s.notes ?? '').split(' | ').reverse().find((p) => p.includes('cho tập tiếp'));
  if (part) {
    const intensity = part.match(/cường độ ([^,)]+)/)?.[1]?.trim();
    const distanceM = Number(part.match(/cự ly (\d+) m/)?.[1] ?? 0);
    const hrLimit = Number(part.match(/-> (\d+) bpm/)?.[1] ?? s.maxHeartRate ?? 0);
    const by = part.match(/^HLV (.+?) cho tập tiếp/)?.[1] ?? 'HLV';
    const note = part.includes(': ') ? part.slice(part.indexOf(': ') + 2) : '';
    return { type: 'ADJUST_CONTINUE', by, at: '', note, adjustment: { intensity: INTENSITY_VI[intensity ?? ''] ?? 'Vừa', distanceM, hrLimit } };
  }
  return null;
};
const monitor = (s: BeMonitor) => ({
  thresholds: { hr: s.maxHeartRate ?? 180, speed: Number(s.maxSpeedKmh ?? 60) },
  readings: s.readings?.length ? toReadings(s.readings) : readingsFromNotes(s.notes, hhmm(s.sessionDate)),
  recovery: toReadings(s.recovery),
  ...(s.startedAt ? { startedAt: hhmm(s.startedAt) } : {}),
  ...(s.pausedAt ? { pausedAt: hhmm(s.pausedAt), pausedReason: s.pausedReason ?? '' } : {}),
});
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
const SESSION: Record<string, string> = { PENDING: 'SCHEDULED', CONFIRMED: 'SCHEDULED', COMPLETED: 'COMPLETED', CANCELLED: 'STOPPED', STOPPED: 'STOPPED', WAITING_VET: 'STOPPED', IN_PROGRESS: 'IN_PROGRESS', PAUSED: 'PAUSED_PENDING_TRAINER', PAUSED_PENDING_TRAINER: 'PAUSED_PENDING_TRAINER' };
const SERVER_DEFAULT_MAX_HR = 180;
const unknownPhase = (weeks: number) => ({ no: 1, name: 'Toàn giáo án', weeks, intensity: 'Vừa', distanceM: 0, sessionsPerWeek: 0, hrLimit: SERVER_DEFAULT_MAX_HR, estimated: true });
const planMeta = (goal: string) => {
  const tag = goal.match(/^\[([^·\]]+)·[^\]]*\]\s*/);
  return { type: tag ? tag[1].trim() : '—', goal: tag ? goal.slice(tag[0].length) : goal };
};
const PLAN_STATUS: Record<string, string> ={ PENDING: 'PLANNED', ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' };
const TASK_TYPE: Record<string, [string, string]> = {
  feeding: ['FEED', 'Cho ăn'], 'stall cleaning': ['CLEAN', 'Dọn chuồng'], 'grooming & bath': ['GROOM', 'Chải lông & tắm'],
  'ice bath therapy': ['COOL', 'Ngâm lạnh'], 'exercise walk': ['GROOM', 'Dắt đi bộ'], 'hoof care': ['GROOM', 'Chăm sóc móng'],
  feed: ['FEED', 'Cho ăn'], clean: ['CLEAN', 'Dọn chuồng'], groom: ['GROOM', 'Chải lông'], walk: ['GROOM', 'Dắt đi bộ'],
  cool: ['COOL', 'Chườm lạnh'], hoof: ['GROOM', 'Chăm sóc móng'], medication: ['OTHER', 'Cho thuốc'], other: ['OTHER', 'Khác'],
};

interface BeHorse { horseId: number; horseName: string; dob: string; gender: string; breed: string; pedigree?: string | null; weightKg: number; healthStatus: string; isLocked: boolean; ownerId: number; stallId: number | null; stallCode?: string | null; approvalStatus?: string | null; createdAt?: string | null;
  horseCode?: string | null; color?: string | null; heightCm?: number | null; ownerPhone?: string | null; heightHands?: number | null; passportNo?: string | null; healthCertIssuer?: string | null; healthCertExpiry?: string | null;
  registrationCode?: string | null; rejectReason?: string | null; allowResubmit?: boolean | null; assignedTrainerId?: number | null; assignedTrainerName?: string | null; ownerName?: string | null }
interface BeRegCheck { checkKey: string; passed: boolean; detail?: string | null; checkedByName?: string | null; checkedAt?: string | null }
interface BeAttachment { attachmentId: number; docType?: string | null; fileName: string; mimeType?: string | null; fileSizeKb?: number | null; uploadedAt?: string | null }
const DOC_LABEL: Record<string, string> = { OWNERSHIP: 'Giấy tờ sở hữu', OTHER: 'Giấy chứng nhận sức khỏe / khác' };
interface BeRegistration { attachments?: BeAttachment[] | null; registrationCode?: string | null; ownerName?: string | null; submittedAt?: string | null; status: string; ownerNote?: string | null; decisionNote?: string | null; allowResubmit?: boolean | null; decidedByName?: string | null; decidedAt?: string | null; checks?: BeRegCheck[] | null }
interface BeInjury { injuryId: number; part: string; severity: string; severityLabel?: string | null; note?: string | null; x?: number | null; y?: number | null; caseCode?: string | null; createdByName?: string | null; createdAt?: string | null }
const INJURY_VIEWERS = ['ClubManager', 'HeadTrainer', 'Veterinarian', 'Groom', 'HorseOwner'];
const injuriesOf = async (horseId: string) => {
  if (!INJURY_VIEWERS.includes(me()?.role ?? '') || !/^\d+$/.test(horseId)) return [];
  return (await orEmpty(data<BeInjury[]>(`/horses/${horseId}/injuries`))).map((i) => ({
    id: String(i.injuryId), part: i.part, severity: i.severityLabel ?? i.severity, note: i.note ?? '', date: ddmmyyyy(i.createdAt),
    vet: i.createdByName ?? 'Bác sĩ thú y', x: i.x ?? 50, y: i.y ?? 50, caseId: i.caseCode ?? undefined,
  }));
};
interface BeStall { stallId: number; stallCode: string; barnZone: string; cleanStatus: string; currentHorseId: number | null; horseName: string | null }
interface BePhase { phaseNo: number; name: string; weeks: number; intensity: string; distanceM?: number | null; sessionsPerWeek?: number | null; maxHeartRate?: number | null; current?: boolean | null }
interface BePlan { planId: number; planName: string; horseName: string; startDate: string; endDate: string; status: string; progress: number; type?: string | null; goal?: string | null; phases?: BePhase[] | null }
const INTENSITY: Record<string, string> = { LOW: 'Nhẹ', LIGHT: 'Nhẹ', MEDIUM: 'Vừa', MODERATE: 'Vừa', HIGH: 'Cao', 'NHẸ': 'Nhẹ', 'VỪA': 'Vừa', CAO: 'Cao' };
const toPhases = (phases: BePhase[] | null | undefined, weeks: number) => phases?.length
  ? phases.map((ph) => ({ no: ph.phaseNo, name: ph.name, weeks: ph.weeks, intensity: INTENSITY[(ph.intensity ?? '').toUpperCase()] ?? ph.intensity, distanceM: Number(ph.distanceM) || 0, sessionsPerWeek: ph.sessionsPerWeek ?? 0, hrLimit: ph.maxHeartRate ?? SERVER_DEFAULT_MAX_HR }))
  : [unknownPhase(weeks)];
const currentPhaseOf = (phases: BePhase[] | null | undefined) => phases?.find((ph) => ph.current)?.phaseNo ?? 1;
interface BePlanDetail { planId: number; planName: string; horseId: number | null; horseName: string; startDate: string; endDate: string; status: string; sessions: (BeMonitor & { sessionId: number; phaseNo?: number | null; sessionDate: string; activityType: string; status: string; notes: string | null; assignedToId: number | null; assignedToName: string | null; evaluationScore?: number | null; evaluationComment?: string | null; evaluatedBy?: string | null; evaluatedAt?: string | null })[] }
interface BeSchedule extends BeMonitor { sessionId: number; sessionDate: string; activityType: string; status: string; planName: string; horseName: string; stallZone: string; evaluationScore?: number | null; evaluationComment?: string | null; evaluatedBy?: string | null; evaluatedAt?: string | null }
interface BeTask { taskId: number; taskCode?: string | null; taskType: string; title?: string | null; status: string; taskDate?: string | null; scheduledTime?: string | null; dueDate?: string | null; instructions?: string | null; completedAt?: string | null; horseName: string; stallCode?: string | null; stallZone: string; groomName?: string | null; warningNote?: string | null; dietNote?: string | null; overdue?: boolean | null; lateMinutes?: number | null; canComplete?: boolean | null; completableFrom?: string | null }
interface BeCase { caseId: string; id?: number; horseId: number; horseName: string; source: string; issueType: string; severity: string; status: string; description: string; imageUrl?: string | null; reportedByName?: string | null; assignedVetName?: string | null; maxHeartRate: number; vetResult: string | null; createdAt: string; closedAt?: string | null }
interface BeVacc { id: number; recordCode: string; horseId: number; horseName: string; kind?: string | null; typeName: string; category?: string | null; expectedDate: string; countdown?: string | null; cycleMonths?: number | null; statusCode?: string | null; status: string; doneAt?: string | null; doneByName?: string | null; lotNo?: string | null; itemName?: string | null; note?: string | null }
const VACC_STATUS: Record<string, string> = { OVERDUE: 'DUE_SOON', DUE_SOON: 'DUE_SOON', SCHEDULED: 'SCHEDULED', POSTPONED: 'POSTPONED', SKIPPED: 'POSTPONED', DONE: 'DONE' };
interface BeTournament { tournamentId: number; code: string; name: string; organizer?: string | null; location?: string | null; raceDate?: string | null; registrationDeadline?: string | null; distanceM?: number | null; entryFee?: number | null; entryConditions?: string | null; finished?: boolean | null; openForProposal?: boolean | null }
interface BeProposal { proposalId: number; proposalCode?: string | null; status: string; horseId: number; horseName: string; ownerName?: string | null; tournament?: BeTournament | null; proposedByName?: string | null; proposedAt?: string | null; note?: string | null;
  ownerAgreed?: boolean | null; ownerRespondedAt?: string | null; ownerNote?: string | null; vetName?: string | null; vetPassed?: boolean | null; vetCheckedAt?: string | null; vetNote?: string | null;
  rank?: number | null; finishTimeSeconds?: number | null; resultNote?: string | null }
const PROPOSAL_STATUS: Record<string, string> = { WAITING_VET: 'WAITING_VET_EXAM', ACCEPTED: 'SUBMITTED', REJECTED: 'REJECTED_BY_ORGANIZER', WITHDRAWN: 'OWNER_DECLINED' };
const raceTime = (seconds?: number | null) => {
  if (seconds == null) return '—';
  const total = Number(seconds);
  const m = Math.floor(total / 60);
  return `${m}:${(total - m * 60).toFixed(2).padStart(5, '0')}`;
};
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

const PROTOCOL_STATE_OF: Record<string, string> = {
  'Bản nháp': 'DRAFT', 'Chờ kho kiểm tồn': 'WAITING_STOCK_CHECK', 'Thiếu vật tư — chờ BS quyết định': 'STOCK_SHORTAGE', 'Kho đủ hàng — chờ BS xác nhận': 'STOCK_AVAILABLE',
  'Chờ hàng về': 'WAITING_RESTOCK', 'Cần BS đánh giá lại': 'REQUIRES_VET_REVIEW', 'BS đã xác nhận': 'VET_CONFIRMED', 'Chờ kho cấp phát': 'READY_FOR_DISPENSING',
  'Đang điều trị': 'IN_TREATMENT', 'Tạm dừng · chờ chủ ngựa thanh toán': 'ON_HOLD_PAYMENT', 'Hoàn tất': 'COMPLETED', 'Đã bị thay thế': 'SUPERSEDED', 'Đã hủy': 'CANCELLED',
};

const toProposal = (p: BeProposal): Row => {
  const history: Row[] = [];
  if (p.resultNote && p.status === 'REJECTED') history.push({ at: '—', who: p.proposedByName ?? 'HLV', text: `ban tổ chức từ chối: ${p.resultNote}`, tone: 'danger' });
  if (p.rank) history.push({ at: '—', who: p.proposedByName ?? 'HLV', text: `nhập kết quả: Hạng ${p.rank} · ${raceTime(p.finishTimeSeconds)}`, tone: 'success' });
  if (p.vetCheckedAt) history.push({ at: stamp(p.vetCheckedAt), who: `BS ${p.vetName ?? ''}`.trim(), text: p.vetPassed ? 'kết luận ĐẠT' : `kết luận KHÔNG ĐẠT: ${p.vetNote ?? ''}`, tone: p.vetPassed ? 'success' : 'danger' });
  if (p.ownerRespondedAt) history.push({ at: stamp(p.ownerRespondedAt), who: p.ownerName ?? 'Chủ ngựa', text: p.ownerAgreed ? `chủ ngựa đồng ý tham gia${p.ownerNote ? `: “${p.ownerNote}”` : ''}` : `chủ ngựa từ chối: “${p.ownerNote ?? ''}”`, tone: p.ownerAgreed ? 'success' : 'danger' });
  history.push({ at: stamp(p.proposedAt), who: p.proposedByName ?? 'HLV', text: 'tạo đề xuất · chờ chủ ngựa đồng ý' });
  return {
    id: p.proposalCode || `DX-${p.proposalId}`, beId: p.proposalId, horseId: String(p.horseId), horseName: p.horseName, owner: p.ownerName ?? '—',
    tournamentId: p.tournament ? String(p.tournament.tournamentId) : '', status: PROPOSAL_STATUS[p.status] ?? p.status, createdAt: ddmmyyyy(p.proposedAt),
    createdBy: p.proposedByName ?? '—', note: p.note ?? undefined, history,
    vetResult: p.vetPassed == null ? null : { pass: p.vetPassed, by: p.vetName ?? 'Bác sĩ thú y', at: stamp(p.vetCheckedAt), note: p.vetNote ?? '' },
    ownerResponse: p.ownerAgreed == null ? null : { agree: p.ownerAgreed, at: stamp(p.ownerRespondedAt), reason: p.ownerNote ?? undefined },
    result: p.rank ? { rank: p.rank, time: raceTime(p.finishTimeSeconds), note: p.resultNote ?? undefined } : null,
    organizerReason: p.status === 'REJECTED' ? p.resultNote ?? undefined : undefined,
  };
};

const toHorse = (h: BeHorse, stalls: BeStall[], u: Me | null): Row => ({
  id: String(h.horseId), name: h.horseName, breed: h.breed, sex: sex(h.gender), age: age(h.dob), weightKg: h.weightKg,
  owner: u?.role === 'HorseOwner' && String(h.ownerId) === u.id ? u.name : h.ownerName ?? `Chủ ngựa #${h.ownerId}`,
  stall: stalls.find((s) => s.stallId === h.stallId)?.stallCode ?? h.stallCode ?? '—',
  trainerId: h.assignedTrainerId ? String(h.assignedTrainerId) : u?.role === 'HeadTrainer' ? u.id : '', trainerName: h.assignedTrainerName ?? null,
  health: health(h.healthStatus), trainingLocked: !!h.isLocked, form: null, pendingCase: null,
  lock: h.isLocked ? { by: 'Bác sĩ thú y', at: '—', reason: 'Khóa từ hệ thống', review: '—' } : null,
  injuries: [], medicalHistory: [], raceResults: [], medicalDiet: null,
});

const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const loadTasks = async (dateIso?: string): Promise<Row[]> => {
  const u = me();
  if (u?.role !== 'Groom') return [];
  const [rows, horses] = await Promise.all([orEmpty(data<BeTask[]>('/care-tasks/my-tasks', dateIso ? { date: dateIso } : undefined)), LOADERS.horses()]);
  return rows.filter((t) => (t.status ?? '').toUpperCase() !== 'SKIPPED').map((t) => {
    const [type, typeTitle] = TASK_TYPE[(t.taskType ?? '').toLowerCase()] ?? ['GROOM', t.taskType];
    const h = byName(horses, t.horseName);
    const time = t.scheduledTime ? t.scheduledTime.slice(0, 5) : hhmm(t.dueDate);
    return {
      id: String(t.taskId), code: t.taskCode ?? null, date: ddmmyyyy(t.taskDate ?? t.dueDate), groom: u.name, zone: zone(t.stallZone), type, title: t.title || typeTitle,
      horseId: (h?.id as string) ?? null, horse: t.horseName, stall: t.stallCode ?? (h?.stall as string) ?? '—', time, sla: plusMinutes(time, CARE_SLA_MINUTES),
      status: (t.status ?? '').toUpperCase() === 'COMPLETED' || (t.status ?? '').toUpperCase() === 'DONE' ? 'DONE' : 'TODO',
      doneAt: t.completedAt ? hhmm(t.completedAt) : null, note: t.warningNote ?? '', photo: null,
      instructions: t.instructions ? t.instructions.split(/\r?\n|;\s*/).map((line) => line.trim()).filter(Boolean) : [],
      diet: t.dietNote ?? undefined, medicalDiet: /khẩu phần y tế/i.test(t.title ?? ''),
      overdue: !!t.overdue, lateMinutes: t.lateMinutes ?? undefined,
      canComplete: t.canComplete ?? undefined, completableFrom: t.completableFrom ? `${hhmm(t.completableFrom)} ${ddmmyyyy(t.completableFrom).slice(0, 5)}` : undefined,
    };
  });
};

const LOADERS: Record<string, () => Promise<Row[]>> = {
  async horses() {
    const u = me();
    const [hs, stalls] = await Promise.all([horsesRaw(), stallsRaw()]);
    return hs.filter((h) => u?.role !== 'HorseOwner' || isApproved(h)).map((h) => toHorse(h, stalls, u));
  },

  async stalls() {
    const [stalls, grooms] = await Promise.all([stallsRaw(), LOADERS.grooms()]);
    return stalls.map((s) => ({
      id: s.stallCode, beId: s.stallId, zone: zone(s.barnZone), horseId: s.currentHorseId ? String(s.currentHorseId) : null, horse: s.horseName,
      status: CLEAN[(s.cleanStatus ?? '').toLowerCase()] ?? 'CLEAN',
      groom: (grooms.find((g) => (g.zones as string[]).includes(zone(s.barnZone)))?.name as string) ?? (grooms.length ? 'Chưa phân công' : '—'),
    }));
  },

  async grooms() {
    const u = me();
    if (u?.role === 'ClubManager') {
      return (await LOADERS.users()).filter((x) => x.role === 'Groom' && x.status !== 'LOCKED')
        .map((x) => ({ id: x.id, name: x.fullname, zones: ((x.zones as string[] | undefined) ?? []).map((z) => zone(z)) }));
    }
    if (u?.role !== 'Groom') return [];
    const p = await data<{ specialization?: string | null }>('/account/my-profile').catch(() => ({ specialization: null }));
    return [{ id: u.id, name: u.name, zones: p.specialization ? [zone(p.specialization)] : [] }];
  },

  async trainingPlans() {
    if (me()?.role === 'HorseOwner') return (await ownerProgress()).map(({ plan }) => plan);
    const [page, horses] = await Promise.all([data<{ content: BePlan[] }>('/training-plans', { page: 0, size: 500 }).catch(() => ({ content: [] })), LOADERS.horses()]);
    return page.content.map((p) => {
      const weeks = Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (7 * 864e5)));
      return {
        id: String(p.planId), horseId: (byName(horses, p.horseName)?.id as string) ?? '', horseName: p.horseName, name: p.planName,
        ...planMeta(p.goal ?? ''), ...(p.type ? { type: p.type } : {}), startDate: ddmmyyyy(p.startDate), createdBy: '—',
        phases: toPhases(p.phases, weeks),
        currentPhase: currentPhaseOf(p.phases), week: Math.max(1, Math.round((p.progress ?? 0) * weeks / 100)), status: PLAN_STATUS[(p.status ?? '').toUpperCase()] ?? 'PAUSED',
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
        id: String(s.sessionId), horseId: plans[i].horseId, horseName: d!.horseName, planId: String(d!.planId), phaseNo: s.phaseNo ?? 1, label: s.activityType,
        date: ddmmyyyy(s.sessionDate), time: hhmm(s.sessionDate), groom: s.assignedToName ?? '—', groomId: s.assignedToId ? String(s.assignedToId) : null,
        track: (s.notes ?? '').split(' · Ghi nhận:')[0] || '—', metrics: (s.notes ?? '').split(' · Ghi nhận:')[1]?.split(',').map((m) => m.trim()).filter(Boolean),
        status: SESSION[s.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: s.status?.toUpperCase() === 'CONFIRMED', cancelled: s.status?.toUpperCase() === 'CANCELLED', ...monitor(s), decision: decisionFrom(s),
        evaluation: s.evaluationScore ? { score: s.evaluationScore, comment: s.evaluationComment ?? '', by: s.evaluatedBy ?? 'HLV', at: s.evaluatedAt ?? '' } : null,
      })));
    }
    const [rows, horses, plans] = await Promise.all([
      orEmpty(data<BeSchedule[]>('/training-sessions/my-schedule', { startDate: '2020-01-01', endDate: '2030-12-31' })), LOADERS.horses(), LOADERS.trainingPlans(),
    ]);
    return rows.map((s) => ({
      id: String(s.sessionId), horseId: (byName(horses, s.horseName)?.id as string) ?? '', horseName: s.horseName,
      planId: (plans.find((p) => p.name === s.planName)?.id as string) ?? '', phaseNo: 1, label: s.activityType,
      date: ddmmyyyy(s.sessionDate), time: hhmm(s.sessionDate), groom: u.role === 'Groom' ? u.name : '—', track: zone(s.stallZone),
      status: SESSION[s.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: s.status?.toUpperCase() === 'CONFIRMED', cancelled: s.status?.toUpperCase() === 'CANCELLED', ...monitor(s), decision: decisionFrom(s),
      evaluation: s.evaluationScore ? { score: s.evaluationScore, comment: s.evaluationComment ?? '', by: s.evaluatedBy ?? 'HLV', at: s.evaluatedAt ?? '' } : null,
    }));
  },

  tasks: () => loadTasks(),

  async vetCases() {
    if (me()?.role === 'HorseOwner') return [];
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
    const rows = await orEmpty(data<Row[]>('/diet-requests'));
    return rows.map((r) => ({
      id: String(r.requestCode || 'FR-' + r.requestId),
      beId: r.requestId,
      horseId: String(r.horseId),
      horse: r.horseName,
      item: r.item ?? r.requestDetail,
      reason: r.reason,
      by: r.requestedByName,
      at: r.requestedAt ? ddmmyyyy(r.requestedAt as string) : '—',
      status: r.status,
      vetNote: r.vetNote ?? undefined,
      decidedBy: r.decidedByName ?? undefined,
      decidedAt: r.decidedAt ? ddmmyyyy(r.decidedAt as string) : undefined,
      approverRole: r.approverRole ?? null,
      approverName: r.approverName ?? null,
      canDecide: r.canDecide ?? null,
    }));
  },

  async vaccinations() {
    const rows = await orEmpty(data<BeVacc[]>('/vaccinations'));
    return rows.map((v) => ({
      id: v.recordCode, beId: v.id, horseId: String(v.horseId), horse: v.horseName, type: v.typeName, due: v.expectedDate,
      status: VACC_STATUS[(v.statusCode ?? '').toUpperCase()] ?? 'SCHEDULED', overdue: (v.statusCode ?? '').toUpperCase() === 'OVERDUE', countdown: v.countdown ?? undefined,
      kind: (v.kind ?? '').toUpperCase() === 'DEWORM' || /giun/i.test(v.category ?? '') ? 'DEWORM' : 'VACCINE', cycleMonths: v.cycleMonths ?? undefined,
      doneAt: v.doneAt ? ddmmyyyy(v.doneAt) : undefined, by: v.doneByName ?? undefined, lot: v.lotNo ?? undefined, note: v.note ?? undefined,
    }));
  },

  async raceProposals() {
    const role = me()?.role;
    if (role === 'Groom' || role === 'WarehouseManager') return [];
    const rows = await orEmpty(data<BeProposal[]>('/race-proposals'));
    return rows.map(toProposal);
  },

  async tournaments() {
    const rows = await orEmpty(data<BeTournament[]>('/tournaments'));
    return rows.map((t) => ({
      id: String(t.tournamentId), code: t.code, name: t.name, organizer: t.organizer ?? '—', date: ddmmyyyy(t.raceDate), venue: t.location ?? '—',
      distance: t.distanceM ? `${Number(t.distanceM)} m` : '—', deadline: ddmmyyyy(t.registrationDeadline), conditions: t.entryConditions || '—',
      source: 'Backend', finished: !!t.finished || t.openForProposal === false, entryFee: t.entryFee ?? null,
    }));
  },

  async protocols() {
    const real = await loadProtocols().catch(() => null);
    if (real) return real;
    const [rows, horses] = await Promise.all([orEmpty(data<BeProtocol[]>('/protocols')), LOADERS.horses()]);
    return rows.map((p) => {
      const state = PROTOCOL_STATE_OF[p.status] ?? 'WAITING_STOCK_CHECK';
      const short = state === 'STOCK_SHORTAGE' || state === 'REQUIRES_VET_REVIEW';
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
    return (await loadInventory()) ?? ([] as Row[]);
  },
  async requisitions() {
    return (await loadRequisitions()) ?? ([] as Row[]);
  },
  async stockChecks() {
    return (await loadStockChecks()) ?? ([] as Row[]);
  },
  async registrations() {
    const u = me();
    if (u?.role !== 'ClubManager' && u?.role !== 'HorseOwner') return [];
    const [hs, users] = await Promise.all([horsesRaw(), u.role === 'ClubManager' ? LOADERS.users() : Promise.resolve([] as Row[])]);
    const histories = await Promise.all(hs.map((h) => orEmpty(data<BeRegistration[]>(`/horses/${h.horseId}/registrations`))));
    const ownerOf = (h: BeHorse) => (u.role === 'HorseOwner' ? { fullName: u.name, email: '', phone: '—' } : (() => {
      const o = users.find((x) => x.beId === h.ownerId);
      return { fullName: (o?.fullname as string) ?? `Chủ ngựa #${h.ownerId}`, email: (o?.email as string) ?? '', phone: (o?.phone as string) || '—' };
    })());
    return hs.map((h, index) => toRegistration(h, histories[index], ownerOf(h), hs));
  },
  async invoices() {
    return ((await loadInvoices(me()?.role)) as Row[] | null) ?? ([] as Row[]);
  },
  async payments() {
    return ((await loadPayments(me()?.role)) as Row[] | null) ?? ([] as Row[]);
  },
  async users() {
    return (await loadUsers()) ?? ([] as Row[]);
  },
  async auditLogs() {
    return (await loadAuditLogs()) ?? ([] as Row[]);
  },
  async stockTx() {
    return (await loadStockTx()) ?? ([] as Row[]);
  },
};
interface BeOwnerProgress {
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  progress?: number | null;
  delayNote?: string | null;
  phases?: BePhase[] | null;
  sessions?: (BeMonitor & {
    sessionId: number;
    sessionDate: string;
    activityType: string;
    status: string;
    notes?: string | null;
    assignedToName?: string | null;
    planName?: string | null;
    late?: boolean | null;
    evaluationScore?: number | null;
    evaluationComment?: string | null;
    evaluatedBy?: string | null;
    evaluatedAt?: string | null;
  })[] | null;
}
const ownerProgress = async () => {
  const horses = await LOADERS.horses();
  const rows = await Promise.all(horses.map(async (h) => ({ h, p: await data<BeOwnerProgress | null>(`/owner/training/horses/${h.id}/progress`).catch(() => null) })));
  return rows.filter((r): r is { h: Row; p: BeOwnerProgress } => !!r.p?.planId).map(({ h, p }) => {
    const weeks = Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (7 * 864e5)));
    const plan: Row = {
      id: String(p.planId), horseId: h.id, horseName: h.name, name: p.planName, type: '—', goal: '', startDate: ddmmyyyy(p.startDate), createdBy: '—',
      phases: toPhases(p.phases, weeks),
      currentPhase: currentPhaseOf(p.phases), week: Math.max(1, Math.round(((p.progress ?? 0) * weeks) / 100)), status: PLAN_STATUS[(p.status ?? '').toUpperCase()] ?? 'PAUSED',
      ...(p.delayNote ? { pausedReason: p.delayNote } : {}),
    };
    const sessions: Row[] = (p.sessions ?? []).map((x) => ({
      id: String(x.sessionId), horseId: h.id, horseName: h.name, planId: String(p.planId), phaseNo: 1, label: x.planName ? `${x.activityType} · ${x.planName}` : x.activityType,
      date: ddmmyyyy(x.sessionDate), time: hhmm(x.sessionDate), groom: x.assignedToName ?? '—', track: (x.notes ?? '').split(' · Ghi nhận:')[0] || '—',
      status: SESSION[x.status?.toUpperCase()] ?? 'SCHEDULED', confirmed: x.status?.toUpperCase() === 'CONFIRMED', cancelled: x.status?.toUpperCase() === 'CANCELLED', ...monitor(x), decision: decisionFrom(x),
      ...(x.late ? { pausedReason: 'Nhân viên chưa xác nhận, buổi tập đã quá giờ' } : {}),
      evaluation: x.evaluationScore ? { score: x.evaluationScore, comment: x.evaluationComment ?? '', by: x.evaluatedBy ?? 'HLV', at: x.evaluatedAt ?? '' } : null,
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
const toAttachment = (a: BeAttachment): Row => ({
  name: DOC_LABEL[(a.docType ?? '').toUpperCase()] ?? 'Giấy tờ', file: a.fileName, beId: a.attachmentId, mime: a.mimeType ?? undefined,
  docType: (a.docType ?? '').toUpperCase() || undefined,
  meta: `${(a.fileName.split('.').pop() ?? '').toUpperCase()} · ${a.fileSizeKb ?? 0} KB · ${stamp(a.uploadedAt)}`,
});
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
    owner: { ...owner, phone: h.ownerPhone || owner.phone }, submittedAt: stamp(submitted),
    waitingDays: status === 'Pending' ? Math.max(0, Math.floor((Date.now() - heldSince) / 86400000)) : 0,
    passed: checklist.filter((c) => c.passed).length, status, decidedNote,
    firstIssue: status === 'Rejected' ? h.rejectReason ?? latest?.decisionNote ?? undefined : firstFailed?.label,
    ownerExtra: { otherHorses: all.filter((x) => x.ownerId === h.ownerId && x.horseId !== h.horseId).map((x) => x.horseName).join(', ') || '—' },
    horseExtra: { color: h.color || '—', height: h.heightCm ? `${Number(h.heightCm)} cm` : h.heightHands ? `${Math.round(h.heightHands * 10.16)} cm` : '—', weight: h.weightKg, passport: h.passportNo || '—', healthCert: healthCert || '—' },
    checklist,
    attachments: (latest?.attachments ?? []).map(toAttachment),
    history: history.length
      ? history.flatMap((r, index) => regHistory(r, owner.fullName, index === history.length - 1))
      : [{ who: owner.fullName, text: 'gửi hồ sơ', at: stamp(h.createdAt) }],
  };
};
const regChecks = (checklist: unknown) => ((checklist as { key: string; passed: boolean; detail?: string }[] | undefined) ?? [])
  .map((c) => ({ checkKey: c.key.toUpperCase(), passed: !!c.passed, detail: c.detail?.slice(0, 500) }));
const regExtra = (x: { color?: string; height?: string; passport?: string; healthCert?: string }) => {
  const heightText = String(x.height ?? '').replace(',', '.');
  const heightCm = /cm/i.test(heightText) ? Number.parseFloat(heightText) : NaN;
  const heightHands = /cm/i.test(heightText) ? NaN : Number.parseFloat(heightText);
  const expiry = String(x.healthCert ?? '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})\/(\d{4})/);
  const healthCertExpiry = expiry
    ? expiry[3] ? `${expiry[3]}-${expiry[2].padStart(2, '0')}-${expiry[1].padStart(2, '0')}` : new Date(Date.UTC(Number(expiry[5]), Number(expiry[4]), 0)).toISOString().slice(0, 10)
    : undefined;
  const clean = (v?: string) => (v && v.trim() && v.trim() !== '—' ? v.trim() : undefined);
  return {
    color: clean(x.color)?.slice(0, 50),
    heightCm: Number.isFinite(heightCm) && heightCm >= 50 && heightCm <= 250 ? Math.round(heightCm) : undefined,
    heightHands: Number.isFinite(heightHands) && heightHands >= 1 && heightHands <= 25 ? Math.round(heightHands * 10) / 10 : undefined,
    ...(healthCertExpiry ? { healthCertExpiry } : {}),
  };
};
const unknownHorse = (id: string): Row => ({
  id, name: id.slice(4), breed: '—', sex: '♂', age: 0, owner: '—', stall: '—', trainerId: '', health: 'HEALTHY', trainingLocked: false,
  form: null, pendingCase: null, lock: null, injuries: [], medicalHistory: [], raceResults: [], medicalDiet: null,
});

type Write = (id: string | undefined, body: Row, current: Row | undefined) => Promise<boolean | Row | void> | boolean | Row | void;
const WRITES: Record<string, Partial<Record<'post' | 'patch' | 'put', Write>>> = {
  registrations: {
    async post(_id, body) {
      const h = body.horse as { name: string; breed: string; sex: string; age: number };
      const x = body.horseExtra as { color: string; height: string; weight: number; passport: string; healthCert: string };
      if (!(Number(x.weight) >= 0.1)) throw new Error('Nhập cân nặng của ngựa (kg).');
      const created = (await be.post<ApiResponse<{ horseId: number }>>('/horses/register', {
        horseName: h.name, dob: `${new Date().getFullYear() - h.age}-01-01`, gender: h.sex === '♀' ? 'Mare' : 'Stallion', breed: h.breed,
        weightKg: Number(x.weight), ownerId: Number(me()?.id), ...regExtra(x),
      })).data.data;
      return { beId: created.horseId };
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
  stalls: {
    async patch(_id, body, current) {
      if (typeof body.status !== 'string' || !current?.beId) return;
      await be.put(`/stalls/${current.beId}/clean-status`, { status: body.status });
      return true;
    },
  },
  horses: {
    async patch(id, body) {
      if (!('trainingLocked' in body)) return;
      if (id?.startsWith('ten:')) throw new Error('Ngựa này chưa có trong danh sách ngựa của backend.');
      if (body.trainingLocked) await be.post('/medical/vet-lock', { horseId: Number(id), reason: (body.lock as Row | undefined)?.reason ?? 'Khóa huấn luyện' });
      else await be.post(`/medical/release-lock/${id}`);
      invalidate('trainingPlans', 'trainingSessions');
      return true;
    },
  },
  raceProposals: {
    async patch(id, body) {
      const r = body.vetResult as { pass: boolean; note: string } | undefined;
      if (r) await be.post(`/prerace-exams/${encodeURIComponent(id ?? '')}/examine`, { isPassed: r.pass, vetNotes: r.note });
      return !!r;
    },
  },
  tasks: {
    async patch(id, body) {
      if (body.status !== 'DONE') return false;
      await be.put(`/care-tasks/${id}/complete`);
      return true;
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
  feedRequests: {
    async post(_id, body) {
      const horses = await LOADERS.horses();
      const h = horses.find((x) => x.id === body.horseId || x.name === body.horse);
      const res = await be.post<ApiResponse<Row>>('/diet-requests', {
        horseId: Number(h?.id ?? body.horseId),
        item: body.item,
        reason: body.reason,
      });
      invalidate('feedRequests');
      const d = res.data.data;
      return {
        id: String(d.requestCode || 'FR-' + d.requestId),
        beId: d.requestId,
        horseId: String(d.horseId),
        horse: d.horseName,
        item: d.item ?? d.requestDetail,
        reason: d.reason,
        by: d.requestedByName,
        at: d.requestedAt ? ddmmyyyy(d.requestedAt as string) : '—',
        status: d.status,
      };
    },
    async patch(id, body, current) {
      const beId = current?.beId ?? id;
      const latest = await data<Row>(`/diet-requests/${beId}`);
      if (String(latest.status).toUpperCase() !== 'PENDING') throw new Error('Đề xuất thức ăn này đã được xử lý, tải lại trang để xem kết quả.');
      const isApproved = body.status === 'APPROVED';
      await be.put(`/diet-requests/${beId}/decide`, {
        approve: isApproved,
        note: body.vetNote ?? (isApproved ? 'Duyệt thức ăn đặc biệt' : 'Từ chối thức ăn đặc biệt'),
      });
      invalidate('feedRequests', 'horses');
      return true;
    },
  },
  requisitions: {
    async post(_id, body) {
      const items = await LOADERS.inventory();
      const found = items.find((i) => i.id === body.itemId);
      let neededByIso: string | undefined = undefined;
      if (body.neededBy && typeof body.neededBy === 'string' && body.neededBy.includes('/')) {
        const [d, m, y] = body.neededBy.split('/');
        neededByIso = `${y}-${m}-${d}`;
      }
      const res = await be.post<ApiResponse<Row>>('/supply-requests', {
        itemId: Number(found?.beId ?? body.itemId),
        quantity: Number(body.qty),
        reason: body.reason,
        neededBy: neededByIso,
      });
      invalidate('requisitions');
      return res.data.data;
    },
    async patch(id, body, current) {
      if (body.status !== 'CLOSED' || current?.status !== 'ISSUED') return false;
      await be.put(`/supply-requests/${current?.beId ?? id}/confirm-received`);
      invalidate('requisitions');
      return true;
    },
  },
  trainingSessions: {
    async patch(id, body, current) {
      if (body.confirmed === true) {
        await be.put(`/training-sessions/${id}/confirm`);
        invalidate('trainingPlans');
        return true;
      }
      if (body.status === 'COMPLETED') {
        await be.put(`/training-sessions/${id}/execute`, { status: 'COMPLETED', notes: sessionNotes(current) });
        invalidate('trainingPlans', 'trainingSessions');
        return true;
      }
      if (body.evaluation) {
        const ev = body.evaluation as { score: number; comment?: string };
        await be.put(`/training-sessions/${id}/evaluate`, { score: Number(ev.score), comment: ev.comment ?? '' });
        invalidate('trainingPlans', 'trainingSessions');
        return true;
      }
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
  const rows = LOADERS[name]().catch((err: unknown) => {
    cache.delete(name);
    if (name === 'stockTx') throw err;
    return [] as Row[];
  });
  cache.set(name, { at: Date.now(), rows });
  return rows;
};
const rowsOf = async (name: string) => {
  const o = ov(name);
  return [...(await load(name)).map((r) => ({ ...r, ...(o.patches.get(String(r.id)) ?? {}) })), ...o.added];
};
const DETAILS: Record<string, (row: Row) => Promise<Row> | null> = {
  horses: (row) => (me()?.role === 'WarehouseManager' || !/^\d+$/.test(String(row.id)) ? null
    : Promise.all([data<BeHorse>(`/horses/${row.id}`), stallsRaw()]).then(([h, stalls]) => {
      const { injuries: _injuries, medicalHistory: _history, raceResults: _results, ...fresh } = toHorse(h, stalls, me());
      return { ...fresh, trainerId: fresh.trainerId || row.trainerId };
    })),
  raceProposals: (row) => (row.beId ? data<BeProposal>(`/race-proposals/${row.beId}`).then(toProposal) : null),
  registrations: (row) => (row.beId ? data<(BeAttachment & { registrationCode?: string | null })[]>(`/horses/${row.beId}/registration-attachments`)
    .then((list) => ({ attachments: list.filter((a) => !row.registrationCode || !a.registrationCode || a.registrationCode === row.registrationCode).map(toAttachment) })) : null),
  shipments: (row) => (me()?.role === 'WarehouseManager' && row.beId ? data<Parameters<typeof mapPo>[0]>(`/inventory/purchase-orders/${row.beId}`).then(mapPo) : null),
  invoices: (row) => (me()?.role === 'ClubManager' && row.beId ? data<BeInvoice>(`/billing/invoices/${row.beId}`).then((i) => mapInvoice(i) as unknown as Row) : null),
  users: (row) => (me()?.role === 'ClubManager' && row.beId ? data<BeUser>(`/users/${row.beId}`).then(mapUser) : null),
};
const freshRow = async (name: string, id: string, row: Row) => {
  const fresh = await (DETAILS[name]?.(row) ?? null)?.catch(() => null);
  return fresh ? { ...row, ...fresh, ...(ov(name).patches.get(id) ?? {}) } : row;
};
export const invalidate = (...names: string[]) => names.forEach((n) => { cache.delete(n); overlay.delete(n); });
export const resetBackendData = () => { cache.clear(); overlay.clear(); };

export const hybridAdapter: AxiosAdapter = async (config) => {
  const url = new URL(config.url ?? '/', 'http://mock.local');
  const [name, id] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!name || !(name in LOADERS)) {
    if ((config.method ?? 'get').toLowerCase() === 'get') return fail(config, 404);
    if (name !== 'auditLogs') console.warn(`[backend] Không lưu: ${(config.method ?? '').toUpperCase()} /${name ?? ''} chưa có API trên server`);
    return respond(config, 200, {});
  }

  const method = (config.method ?? 'get').toLowerCase();
  const params: Record<string, unknown> = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  const taskDay = name === 'tasks' && typeof params.date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(params.date) ? params.date.split('/').reverse().join('-') : null;
  if (name === 'tasks') delete params.date;
  const body = typeof config.data === 'string' && config.data ? (JSON.parse(config.data) as Row) : ((config.data as Row) ?? {});
  const rows = taskDay && taskDay !== isoToday() ? await loadTasks(taskDay) : await rowsOf(name);

  if (method === 'get') {
    if (id === undefined) return respond(config, 200, queryRows(rows, params));
    const found = rows.find((r) => String(r.id) === id);
    const row = found && await freshRow(name, id, found);
    if (row && name === 'horses') return respond(config, 200, { ...row, injuries: await injuriesOf(id) });
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

  if (method === 'post' && name === 'auditLogs') return respond(config, 201, body);
  console.warn(`[backend] Không lưu: ${method.toUpperCase()} /${name}${id ? `/${id}` : ''} chưa có API trên server — giữ nguyên dữ liệu thật`, Object.keys(body));
  if (method === 'post') return respond(config, 201, { ...body, id: body.id ?? '' });
  if (method === 'delete') return respond(config, 200, {});
  return respond(config, 200, current ?? { id });
};
