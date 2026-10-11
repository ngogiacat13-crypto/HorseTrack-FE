// ==================== API — HLV TRƯỞNG (HeadTrainer) ====================
// REST calls to json-server (db.json). Business rules enforced here, not only in the UI:
//  - BR_01: a horse under a veterinary training lock cannot get a plan, a session, a "continue" decision or a race proposal.
//  - BR_02: a paused session may only continue after an adjustment AND when the recovery heart rate is back under the threshold.
//  - BR_04: race proposal goes HLV → vet pre-race exam → owner consent; submission to the organizer is a manual step.
import { DEMO_NOW, http } from './http';
import { Actor, addAudit } from './managerApi';

/* ---------------- Types ---------------- */
export type HealthStatus = 'HEALTHY' | 'WATCH' | 'INJURED' | 'QUARANTINE';
export interface Injury { id?: string; part: string; severity: string; date: string; vet: string; note: string; x: number; y: number; caseId?: string }
export interface Horse {
  id: string; name: string; breed: string; sex: '♂' | '♀'; age: number; microchip: string; owner: string; stall: string;
  /** User id of the HeadTrainer in charge — a trainer only sees their own horses. */
  trainerId: string;
  health: HealthStatus; trainingLocked: boolean; form: 'GOOD' | null; pendingCase: string | null;
  lock: { by: string; at: string; reason: string; review: string } | null;
  injuries: Injury[];
  medicalHistory: { date: string; title: string; tone: 'danger' | 'warning' | 'success' }[];
}

export type Intensity = 'Nhẹ' | 'Vừa' | 'Cao';
export interface PlanPhase { no: number; name: string; weeks: number; intensity: Intensity; distanceM: number; sessionsPerWeek: number; hrLimit: number }
export type PlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'REPLACED';
export interface TrainingPlan {
  id: string; horseId: string; horseName: string; type: string; goal: string; phases: PlanPhase[];
  currentPhase: number; week: number; status: PlanStatus; startDate: string; createdBy: string; pausedReason?: string;
}

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED_PENDING_TRAINER' | 'RESUMED' | 'STOPPED' | 'COMPLETED';
export interface Reading { t: string; hr: number; speed: number }
export interface TrainingSession {
  id: string; horseId: string; horseName: string; planId: string; phaseNo: number; label: string;
  date: string; time: string; groom: string; track: string; status: SessionStatus;
  thresholds: { hr: number; speed: number };
  readings: Reading[]; recovery?: Reading[];
  pausedAt?: string; pausedReason?: string;
  metrics?: string[];
  alerts?: { to: string; role: string; channel: string; at: string; seen: boolean }[];
  decision: null | {
    type: 'STOP_VET' | 'ADJUST_CONTINUE'; by: string; at: string; note: string; caseId?: string;
    adjustment?: { intensity: Intensity; distanceM: number; hrLimit: number };
  };
  evaluation: null | { score: number; comment: string; by: string; at: string };
}

export interface Tournament {
  id: string; name: string; organizer: string; date: string; venue: string; distance: string;
  deadline: string; conditions: string; source: string; finished?: boolean;
}
export type ProposalStatus =
  | 'PROPOSED' | 'WAITING_VET_EXAM' | 'VET_FAILED' | 'WAITING_OWNER' | 'OWNER_DECLINED'
  | 'READY_TO_SUBMIT' | 'SUBMITTED' | 'REJECTED_BY_ORGANIZER' | 'RESULT_RECORDED';
export interface RaceProposal {
  id: string; horseId: string; horseName: string; owner: string; tournamentId: string; status: ProposalStatus;
  createdAt: string; createdBy: string; note?: string;
  history: { at: string; who: string; text: string; tone?: 'success' | 'danger' | 'warning' | 'info' }[];
  vetResult: null | { pass: boolean; by: string; at: string; note: string; conditions?: string };
  ownerResponse: null | { agree: boolean; at: string; reason?: string };
  result: null | { rank: number; time: string; note?: string };
  organizerReason?: string;
}
export interface Vaccination {
  id: string; horseId: string; horse: string; type: string; due: string; status: 'DUE_SOON' | 'SCHEDULED' | 'POSTPONED' | 'DONE'; note?: string;
  kind?: 'VACCINE' | 'DEWORM'; cycleMonths?: number; doneAt?: string; lot?: string; by?: string;
}
export interface Stall {
  id: string; zone: string; horseId: string | null; horse: string | null; status: 'CLEAN' | 'NEEDS_CLEANING' | 'MAINTENANCE'; groom: string;
  /** Set for the trainer view when the stall holds a horse of another trainer (name hidden). */
  otherTrainer?: boolean;
}
export interface Groom { id: string; name: string; zones: string[] }

/* ---------------- Labels shared by pages ---------------- */
export const HEALTH_LABEL: Record<HealthStatus, [string, 'success' | 'warning' | 'danger' | 'purple']> = {
  HEALTHY: ['Khỏe mạnh', 'success'], WATCH: ['Theo dõi', 'warning'], INJURED: ['Chấn thương', 'danger'], QUARANTINE: ['Cách ly', 'purple'],
};
export const SESSION_LABEL: Record<SessionStatus, [string, 'success' | 'warning' | 'danger' | 'info' | 'neutral']> = {
  SCHEDULED: ['Chưa bắt đầu', 'neutral'], IN_PROGRESS: ['Đang diễn ra', 'info'], PAUSED_PENDING_TRAINER: ['Tạm dừng — chờ HLV', 'warning'],
  RESUMED: ['Tiếp tục (đã điều chỉnh)', 'info'], STOPPED: ['Đã dừng', 'danger'], COMPLETED: ['Hoàn thành', 'success'],
};
export const PROPOSAL_LABEL: Record<ProposalStatus, [string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand']> = {
  PROPOSED: ['Mới tạo', 'neutral'], WAITING_VET_EXAM: ['Chờ BS khám', 'info'], VET_FAILED: ['Không đạt khám', 'danger'],
  WAITING_OWNER: ['Chờ chủ ngựa', 'warning'], OWNER_DECLINED: ['Chủ ngựa từ chối', 'danger'], READY_TO_SUBMIT: ['Sẵn sàng gửi BTC', 'brand'],
  SUBMITTED: ['Đã gửi BTC', 'info'], REJECTED_BY_ORGANIZER: ['BTC từ chối', 'danger'], RESULT_RECORDED: ['Đã có kết quả', 'success'],
};
export const PLAN_LABEL: Record<PlanStatus, [string, 'success' | 'warning' | 'neutral']> = {
  ACTIVE: ['Đang chạy', 'success'], PAUSED: ['Tạm dừng', 'warning'], COMPLETED: ['Hoàn tất', 'neutral'], REPLACED: ['Đã thay thế', 'neutral'],
};

/** Stable zone of a horse, from its stall (e.g. A-01 → "Khu A"). */
export const horseZone = (h: Horse, stalls: Stall[]) =>
  stalls.find((st) => st.id === h.stall)?.zone ?? `Khu ${h.stall.split('-')[0]}`;

/** Two-letter avatar text, e.g. Galaxy → GA. */
export const horseInitials = (name: string) => name.slice(0, 2).toUpperCase();

/** Why a horse cannot train or race right now (BR_01), or null when it can. */
export const trainingBlock = (h: Pick<Horse, 'trainingLocked' | 'lock' | 'health'>): string | null =>
  h.trainingLocked ? `Đang khóa huấn luyện bởi BS ${h.lock?.by ?? ''} — ${h.lock?.reason ?? 'lý do y tế'} (BR_01).` : null;

export const raceBlock = (h: Horse): string | null =>
  trainingBlock(h) ?? (h.health === 'INJURED' || h.health === 'QUARANTINE' ? `${HEALTH_LABEL[h.health][0]} — không đủ điều kiện thi đấu.` : null);

/* ---------------- Helpers ---------------- */
const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};

/* Ownership: each horse has one HeadTrainer (horse.trainerId). A trainer only reads and acts on those horses. */
const NOT_MINE = 'Bạn không phụ trách ngựa này — HLV trưởng chỉ xem được ngựa mình được giao.';
const trainerIdOf = (actor: Actor) => {
  if (!actor.id) throw new Error('Phiên đăng nhập không có mã người dùng — hãy đăng nhập lại.');
  return actor.id;
};
const myHorses = (actor: Actor) => get<Horse[]>('/horses', { trainerId: trainerIdOf(actor) });
const getMyHorse = async (horseId: string, actor: Actor) => {
  const horse = await get<Horse>(`/horses/${horseId}`);
  if (horse.trainerId !== trainerIdOf(actor)) throw new Error(NOT_MINE);
  return horse;
};
/** Keep only rows (plans, sessions, proposals…) that belong to the given horses. */
const ofHorses = <T extends { horseId: string }>(rows: T[], horses: Horse[]) => {
  const ids = new Set(horses.map((h) => h.id));
  return rows.filter((r) => ids.has(r.horseId));
};
const getHorseChecked = async (horseId: string, actor: Actor) => {
  const horse = await getMyHorse(horseId, actor);
  const block = trainingBlock(horse);
  if (block) throw new Error(`${horse.name}: ${block}`);
  return horse;
};

/* ---------------- API ---------------- */
export const trainerApi = {
  /* ----- Herd overview (1.1, 4.2, 4.3) ----- */
  async getHerd(actor: Actor) {
    const [horses, plans, sessions, vaccinations] = await Promise.all([
      myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<TrainingSession[]>('/trainingSessions'), get<Vaccination[]>('/vaccinations'),
    ]);
    return { horses, plans: ofHorses(plans, horses), sessions: ofHorses(sessions, horses), vaccinations: ofHorses(vaccinations, horses) };
  },

  /* ----- Horse record (1.5, 4.1–4.3; read-only health) ----- */
  async getHorse(id: string, actor: Actor) {
    const [horse, plans, sessions, vaccinations, proposals, tournaments] = await Promise.all([
      getMyHorse(id, actor),
      get<TrainingPlan[]>('/trainingPlans', { horseId: id }),
      get<TrainingSession[]>('/trainingSessions', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }),
      get<RaceProposal[]>('/raceProposals', { horseId: id }),
      get<Tournament[]>('/tournaments'),
    ]);
    return { horse, plans, sessions, vaccinations, proposals, tournaments };
  },

  /* ----- Training plans (1.2) ----- */
  async getPlans(actor: Actor) {
    const [plans, horses] = await Promise.all([get<TrainingPlan[]>('/trainingPlans'), myHorses(actor)]);
    return { plans: ofHorses(plans, horses), horses };
  },

  async createPlan(input: { horseId: string; type: string; goal: string; startDate: string; phases: PlanPhase[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    if (!input.phases.length) throw new Error('Giáo án cần ít nhất 1 giai đoạn.');
    const all = await get<TrainingPlan[]>('/trainingPlans');
    // One running plan per horse: the old ACTIVE/PAUSED one is marked REPLACED.
    const old = all.filter((p) => p.horseId === horse.id && (p.status === 'ACTIVE' || p.status === 'PAUSED'));
    await Promise.all(old.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'REPLACED' })));
    const plan: TrainingPlan = {
      id: nextId(all.map((p) => p.id), 'KH-'), horseId: horse.id, horseName: horse.name, type: input.type, goal: input.goal,
      phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1 })), currentPhase: 1, week: 1, status: 'ACTIVE',
      startDate: input.startDate, createdBy: actor.name,
    };
    const { data } = await http.post<TrainingPlan>('/trainingPlans', plan);
    await addAudit(actor, { action: 'CREATE_TRAINING_PLAN', label: 'Tạo giáo án', object: `${data.id} · ${horse.name}`, area: 'train', to: `${input.type} · ${input.phases.length} giai đoạn`, reason: input.goal });
    return data;
  },

  /* ----- Schedule (1.3, 1.4) ----- */
  async getSchedule(actor: Actor) {
    const [sessions, horses, plans, grooms, vaccinations, stalls] = await Promise.all([
      get<TrainingSession[]>('/trainingSessions'), myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<Groom[]>('/grooms'), get<Vaccination[]>('/vaccinations'), get<Stall[]>('/stalls'),
    ]);
    const zoneOf = (h: Horse) => horseZone(h, stalls);
    return {
      sessions: ofHorses(sessions, horses), horses, plans: ofHorses(plans, horses), grooms, vaccinations: ofHorses(vaccinations, horses),
      zones: [...new Set(horses.map(zoneOf))].sort(), // only zones that hold this trainer's horses
      zoneOf,
    };
  },

  async assignSession(input: { horseId: string; date: string; time: string; groom: string; track: string; metrics: string[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const [plan] = await get<TrainingPlan[]>('/trainingPlans', { horseId: horse.id, status: 'ACTIVE' });
    if (!plan) throw new Error(`${horse.name} chưa có giáo án đang chạy — tạo giáo án trước khi xếp lịch.`);
    // Mã phu must be in charge of the horse's stable zone.
    const [stalls, grooms] = await Promise.all([get<Stall[]>('/stalls'), get<Groom[]>('/grooms')]);
    const zone = horseZone(horse, stalls);
    const groom = grooms.find((g) => g.name === input.groom);
    if (!groom || !groom.zones.includes(zone)) throw new Error(`${input.groom || 'Mã phu này'} không phụ trách ${zone} — chọn Mã phu của ${zone}.`);
    const phase = plan.phases.find((p) => p.no === plan.currentPhase) ?? plan.phases[0];
    const all = await get<TrainingSession[]>('/trainingSessions');
    const clash = all.find((s) => s.horseId === horse.id && s.date === input.date && s.time === input.time);
    if (clash) throw new Error(`${horse.name} đã có phiên ${clash.id} lúc ${input.time} ngày ${input.date}.`);
    const session: TrainingSession = {
      id: nextId(all.map((s) => s.id), 'S-'), horseId: horse.id, horseName: horse.name, planId: plan.id, phaseNo: phase.no,
      label: `${plan.type} · P${phase.no}`, date: input.date, time: input.time, groom: input.groom, track: input.track,
      status: 'SCHEDULED', thresholds: { hr: phase.hrLimit, speed: 60 }, readings: [], metrics: input.metrics, decision: null, evaluation: null,
    };
    const { data } = await http.post<TrainingSession>('/trainingSessions', session);
    await addAudit(actor, { action: 'ASSIGN_SESSION', label: 'Phân công phiên tập', object: `${data.id} · ${horse.name}`, area: 'train', to: `${input.date} ${input.time} · ${input.groom}`, reason: `${data.label} · ${input.track}` });
    return data;
  },

  async evaluateSession(s: TrainingSession, score: number, comment: string, actor: Actor) {
    await getMyHorse(s.horseId, actor);
    if (s.status !== 'COMPLETED') throw new Error('Chỉ đánh giá được phiên đã hoàn thành.');
    if (!Number.isInteger(score) || score < 1 || score > 10) throw new Error('Điểm phong độ phải từ 1 đến 10.');
    const evaluation = { score, comment: comment.trim(), by: actor.name, at: DEMO_NOW.short };
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { evaluation });
    await addAudit(actor, { action: 'EVALUATE_SESSION', label: 'Đánh giá phong độ', object: `${s.id} · ${s.horseName}`, area: 'train', to: `${score}/10`, reason: comment.trim() || undefined });
    return data;
  },

  /* ----- Paused session decisions (2.1–2.4) ----- */
  async getSession(id: string, actor: Actor) {
    const session = await get<TrainingSession>(`/trainingSessions/${id}`);
    const [horse, plan, history] = await Promise.all([
      getMyHorse(session.horseId, actor),
      get<TrainingPlan>(`/trainingPlans/${session.planId}`),
      get<TrainingSession[]>('/trainingSessions', { horseId: session.horseId }),
    ]);
    const previousMax = history
      .filter((h) => h.id !== session.id && h.status === 'COMPLETED' && h.readings.length)
      .map((h) => Math.max(...h.readings.map((r) => r.hr)))[0] ?? null;
    return { session, horse, plan, previousMax };
  },

  async stopAndRequestVet(s: TrainingSession, note: string, actor: Actor) {
    await getMyHorse(s.horseId, actor);
    if (s.status !== 'PAUSED_PENDING_TRAINER') throw new Error('Phiên này không còn chờ quyết định.');
    if (note.trim().length < 10) throw new Error('Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.');
    const cases = await get<{ id: string }[]>('/vetCases');
    const caseId = nextId(cases.map((c) => c.id), 'C-');
    const peak = s.readings[s.readings.length - 1];
    await http.post('/vetCases', {
      id: caseId, horseId: s.horseId, horse: s.horseName, source: 'SESSION_STOP', sessionId: s.id, type: 'Nghi vấn sau phiên tập',
      severity: 'HIGH', status: 'NEW', sender: actor.name, at: DEMO_NOW.short,
      note: `Nhịp tim ${peak?.hr} bpm (ngưỡng ${s.thresholds.hr}). ${note.trim()}`,
    });
    await http.patch(`/horses/${s.horseId}`, { pendingCase: caseId });
    await http.patch(`/trainingPlans/${s.planId}`, { status: 'PAUSED', pausedReason: `Phiên ${s.id} vượt ngưỡng — chờ BS đánh giá ca ${caseId}` });
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, {
      status: 'STOPPED', decision: { type: 'STOP_VET', by: actor.name, at: DEMO_NOW.time, caseId, note: note.trim() },
    });
    await addAudit(actor, { action: 'STOP_SESSION_REQUEST_VET', label: 'Dừng phiên, gửi ca khám', object: `${s.id} · ${s.horseName}`, area: 'train', from: 'PAUSED_PENDING_TRAINER', to: `STOPPED · tạo ${caseId}`, reason: note.trim() });
    return data;
  },

  async adjustAndContinue(s: TrainingSession, adj: { intensity: Intensity; distanceM: number; hrLimit: number; note: string }, actor: Actor) {
    if (s.status !== 'PAUSED_PENDING_TRAINER') throw new Error('Phiên này không còn chờ quyết định.');
    await getHorseChecked(s.horseId, actor); // BR_01: a vet lock overrides any trainer decision
    const last = (s.recovery ?? [])[(s.recovery ?? []).length - 1];
    if (!last || last.hr >= s.thresholds.hr) throw new Error(`Nhịp tim hồi phục chưa về dưới ngưỡng ${s.thresholds.hr} bpm — không thể tiếp tục (BR_02).`);
    if (adj.note.trim().length < 10) throw new Error('Ghi rõ nội dung điều chỉnh ít nhất 10 ký tự.');
    const plan = await get<TrainingPlan>(`/trainingPlans/${s.planId}`);
    const phases = plan.phases.map((p) => (p.no === s.phaseNo ? { ...p, intensity: adj.intensity, distanceM: adj.distanceM, hrLimit: adj.hrLimit } : p));
    await http.patch(`/trainingPlans/${plan.id}`, { phases });
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, {
      status: 'RESUMED',
      thresholds: { ...s.thresholds, hr: adj.hrLimit },
      decision: { type: 'ADJUST_CONTINUE', by: actor.name, at: DEMO_NOW.time, note: adj.note.trim(), adjustment: { intensity: adj.intensity, distanceM: adj.distanceM, hrLimit: adj.hrLimit } },
    });
    await addAudit(actor, { action: 'ADJUST_AND_CONTINUE', label: 'Điều chỉnh & tiếp tục phiên', object: `${s.id} · ${s.horseName}`, area: 'train', from: 'PAUSED_PENDING_TRAINER', to: `RESUMED · ${adj.intensity} · ${adj.distanceM} m`, reason: adj.note.trim() });
    return data;
  },

  /* ----- Races (3.1–3.5) ----- */
  async getRaces(actor: Actor) {
    const [tournaments, proposals, horses] = await Promise.all([get<Tournament[]>('/tournaments'), get<RaceProposal[]>('/raceProposals'), myHorses(actor)]);
    return { tournaments, proposals: ofHorses(proposals, horses), horses };
  },

  async createProposal(input: { horseId: string; tournamentId: string; note: string }, actor: Actor) {
    const [horse, tournament, existing] = await Promise.all([
      getMyHorse(input.horseId, actor), get<Tournament>(`/tournaments/${input.tournamentId}`), get<RaceProposal[]>('/raceProposals', { horseId: input.horseId }),
    ]);
    const block = raceBlock(horse);
    if (block) throw new Error(`${horse.name}: ${block}`);
    if (tournament.finished) throw new Error('Giải đấu đã kết thúc.');
    const dup = existing.find((p) => p.tournamentId === tournament.id && !['VET_FAILED', 'OWNER_DECLINED', 'REJECTED_BY_ORGANIZER'].includes(p.status));
    if (dup) throw new Error(`${horse.name} đã có đề xuất ${dup.id} cho giải này.`);
    const all = await get<RaceProposal[]>('/raceProposals');
    const proposal: RaceProposal = {
      id: nextId(all.map((p) => p.id), 'DX-'), horseId: horse.id, horseName: horse.name, owner: horse.owner, tournamentId: tournament.id,
      status: 'WAITING_VET_EXAM', createdAt: DEMO_NOW.date, createdBy: actor.name, note: input.note.trim() || undefined,
      history: [{ at: DEMO_NOW.short, who: actor.name, text: 'tạo đề xuất · gửi yêu cầu khám trước thi đấu' }],
      vetResult: null, ownerResponse: null, result: null,
    };
    const { data } = await http.post<RaceProposal>('/raceProposals', proposal);
    await addAudit(actor, { action: 'CREATE_RACE_PROPOSAL', label: 'Tạo đề xuất thi đấu', object: `${data.id} · ${horse.name}`, area: 'train', to: 'WAITING_VET_EXAM', reason: `${tournament.name} · ${tournament.date}` });
    return data;
  },

  async markSubmitted(p: RaceProposal, actor: Actor) {
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'READY_TO_SUBMIT') throw new Error('Chỉ gửi hồ sơ khi chủ ngựa đã đồng ý.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: 'đánh dấu đã gửi hồ sơ cho ban tổ chức (ngoài hệ thống)' }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status: 'SUBMITTED', history });
    await addAudit(actor, { action: 'MARK_PROPOSAL_SUBMITTED', label: 'Cập nhật đã gửi BTC', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'READY_TO_SUBMIT', to: 'SUBMITTED' });
    return data;
  },

  async markOrganizerRejected(p: RaceProposal, reason: string, actor: Actor) {
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'SUBMITTED') throw new Error('Chỉ cập nhật khi hồ sơ đã gửi ban tổ chức.');
    if (reason.trim().length < 10) throw new Error('Lý do ít nhất 10 ký tự.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: `ban tổ chức từ chối: ${reason.trim()}`, tone: 'danger' as const }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status: 'REJECTED_BY_ORGANIZER', organizerReason: reason.trim(), history });
    await addAudit(actor, { action: 'MARK_ORGANIZER_REJECTED', label: 'Ban tổ chức từ chối', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'SUBMITTED', to: 'REJECTED_BY_ORGANIZER', reason: reason.trim() });
    return data;
  },

  async recordResult(p: RaceProposal, result: { rank: number; time: string; note: string }, actor: Actor) {
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'SUBMITTED') throw new Error('Chỉ nhập kết quả cho hồ sơ đã gửi ban tổ chức.');
    if (!Number.isInteger(result.rank) || result.rank < 1) throw new Error('Thứ hạng phải là số nguyên ≥ 1.');
    if (!/^\d{1,2}:\d{2}\.\d{2}$/.test(result.time)) throw new Error('Thời gian theo dạng m:ss.cc, ví dụ 1:38.42.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: `nhập kết quả: Hạng ${result.rank} · ${result.time}`, tone: 'success' as const }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, {
      status: 'RESULT_RECORDED', result: { rank: result.rank, time: result.time, note: result.note.trim() || undefined }, history,
    });
    await addAudit(actor, { action: 'RECORD_RACE_RESULT', label: 'Nhập kết quả thi đấu', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'SUBMITTED', to: `Hạng ${result.rank} · ${result.time}` });
    return data;
  },

  /* ----- Stable map (read-only for the trainer) ----- */
  async getStable(actor: Actor) {
    const [stalls, horses] = await Promise.all([get<Stall[]>('/stalls'), myHorses(actor)]);
    const mine = new Set(horses.map((h) => h.id));
    // Stalls of other trainers' horses stay on the map, but the horse is hidden.
    const masked = stalls.map((st) => (st.horseId && !mine.has(st.horseId) ? { ...st, horseId: null, horse: null, otherTrainer: true } : st));
    return { stalls: masked, horses };
  },
};
