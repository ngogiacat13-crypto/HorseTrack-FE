import { DEMO_NOW, http } from '../../api/http';
import { USE_BACKEND, be, beData } from '../../api/beClient';
import { addAudit, type Actor } from '../../api/managerApi';
import {
  ACTIVE, CANCELLABLE, HOLDING, TRAINER_CONFIRMED, eligibilityReasons, endOfDay, fmtDate, formScore, holdingCount, prizeFor, registrationOpen,
  stageDeadline, sweepTournament, toIsoDay, toIsoMinute, validateTournament, waitlist, type HorseFacts,
} from './logic';
import type { Dossier, EntryHistory, EntryStatus, OwnerTournament, RaceEntry, RaceTournament, RejectCode, TournamentDraft } from './types';

interface HorseRow {
  id: string; name: string; breed: string; sex?: string; age: number; owner: string; trainerId?: string; weightKg?: number | null;
  health?: string; trainingLocked?: boolean; raceResults?: { rank: number; field: number }[];
}
interface ProtocolRow { horseId: string; state: string }
interface SessionRow { horseId: string; evaluation?: { score: number } | null }
interface InvoiceRow { id: string; status: string; paidAt?: string }
interface UserRow { id: string; fullname?: string; role: string }
interface BeDossier {
  proposal: Record<string, unknown> & { proposalCode?: string; tournament?: Record<string, unknown> | null };
  horse: { horseId: number; horseName: string; breed?: string | null; gender?: string | null; ageYears?: number | null; weightKg?: number | string | null };
  owner?: { fullName?: string | null } | null; trainer?: { fullName?: string | null } | null;
  vetExam?: { vetName?: string | null; passed?: boolean | null; checkedAt?: string | null; note?: string | null } | null;
  payment?: { paidAt?: string | null } | null; generatedAt?: string | null;
}

const T = '/raceTournaments';
const E = '/raceEntries';
const get = async <R,>(url: string, params?: Record<string, unknown>) => (await http.get<R>(url, { params })).data;

export const RACE_FLOW_V2 = import.meta.env.VITE_RACE_FLOW !== 'v1';

export const clockNow = () => {
  if (USE_BACKEND) return new Date();
  const [d, m, y] = DEMO_NOW.date.split('/').map(Number);
  const [hh, mm] = DEMO_NOW.time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};
export const todayIso = () => toIsoDay(clockNow());

const nextId = (ids: string[], prefix: string) => `${prefix}${String(ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0) + 1).padStart(4, '0')}`;
const entry = (e: RaceEntry, who: string, text: string, tone?: EntryHistory['tone']): EntryHistory[] => [{ at: toIsoMinute(clockNow()), who, text, tone }, ...e.history];
const ref = (x: { id: string; beId?: number }) => x.beId ?? x.id;

const mapBeTournament = (t: Record<string, unknown>): RaceTournament => ({
  id: String(t.tournamentId ?? t.id), beId: Number(t.tournamentId ?? t.id), name: String(t.name ?? ''), organizer: String(t.organizer ?? '—'),
  location: String(t.location ?? '—'), raceDate: String(t.raceDate ?? '').slice(0, 10), registrationDeadline: String(t.registrationDeadline ?? '').slice(0, 10),
  distanceM: Number(t.distanceM ?? 0), entryFee: Number(t.entryFee ?? 0), slots: Number(t.slots ?? 0),
  minAgeYears: (t.minAgeYears as number | null) ?? null, maxAgeYears: (t.maxAgeYears as number | null) ?? null,
  minWeightKg: (t.minWeightKg as number | null) ?? null, maxWeightKg: (t.maxWeightKg as number | null) ?? null,
  allowedBreeds: (t.allowedBreeds as string[] | null) ?? [],
  prizes: ((t.prizes as { rank: number; amount: number | string }[] | null) ?? []).map((p) => ({ rank: Number(p.rank), amount: Number(p.amount) })),
  status: (t.status as RaceTournament['status']) ?? 'DRAFT', note: (t.entryConditions as string | null) ?? undefined,
  canFinish: t.canFinish === true, canRecordResults: t.canRecordResults === true, raceEnded: t.raceEnded === true,
});

const minute = (v: unknown) => (v ? String(v).slice(0, 16) : '');
const raceTime = (seconds: unknown) => {
  if (seconds == null) return '—';
  const total = Number(seconds);
  const m = Math.floor(total / 60);
  return `${m}:${(total - m * 60).toFixed(2).padStart(5, '0')}`;
};
const COMPLAINT_STATUS: Record<string, 'OPEN' | 'ACCEPTED' | 'REJECTED'> = { PENDING: 'OPEN', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED' };

const beHistory = (p: Record<string, unknown>): EntryHistory[] => {
  const rows: EntryHistory[] = [{ at: minute(p.proposedAt), who: String(p.ownerName ?? 'Chủ ngựa'), text: 'đề xuất tham gia' }];
  if (p.slotHeldAt && p.slotHeldAt !== p.proposedAt) rows.push({ at: minute(p.slotHeldAt), who: 'Hệ thống', text: 'giữ suất · chờ HLV xác nhận', tone: 'info' });
  if (p.trainerDecidedAt) rows.push({ at: minute(p.trainerDecidedAt), who: `HLV ${p.trainerName ?? ''}`.trim(), text: p.trainerApproved ? 'xác nhận ngựa sẵn sàng · chuyển bác sĩ khám' : `từ chối: ${p.trainerReasonLabel ?? ''}${p.trainerNote ? ` — ${p.trainerNote}` : ''}`, tone: p.trainerApproved ? 'success' : 'danger' });
  if (p.complaintAt) rows.push({ at: minute(p.complaintAt), who: String(p.ownerName ?? 'Chủ ngựa'), text: `gửi khiếu nại: ${p.complaintNote ?? ''}`, tone: 'warning' });
  if (p.complaintDecidedAt) rows.push({ at: minute(p.complaintDecidedAt), who: 'Quản lý CLB', text: `${p.complaintStatus === 'ACCEPTED' ? 'chấp nhận' : 'bác'} khiếu nại${p.complaintDecisionNote ? `: ${p.complaintDecisionNote}` : ''}`, tone: p.complaintStatus === 'ACCEPTED' ? 'success' : 'danger' });
  if (p.vetCheckedAt) rows.push({ at: minute(p.vetCheckedAt), who: `BS ${p.vetName ?? ''}`.trim(), text: p.vetPassed ? `kết luận ĐẠT${p.invoiceCode ? ` · hóa đơn lệ phí ${p.invoiceCode}` : ''}` : `kết luận KHÔNG ĐẠT: ${p.vetNote ?? ''}`, tone: p.vetPassed ? 'success' : 'danger' });
  if (p.paidAt) rows.push({ at: minute(p.paidAt), who: 'Hệ thống · VNPay', text: 'đã nộp lệ phí · đăng ký thành công', tone: 'success' });
  if (p.rank != null) rows.push({ at: minute(p.closedAt), who: 'Quản lý CLB', text: `nhập kết quả: hạng ${p.rank} · ${raceTime(p.finishTimeSeconds)}`, tone: 'success' });
  if (p.closedReason && p.rank == null) rows.push({ at: minute(p.closedAt), who: 'Hệ thống', text: String(p.closedReason), tone: 'danger' });
  return rows.filter((r) => r.at).sort((a, b) => b.at.localeCompare(a.at));
};

const mapBeEntry = (p: Record<string, unknown>): RaceEntry => ({
  id: String(p.proposalCode ?? p.proposalId), beId: Number(p.proposalId), tournamentId: String(p.tournamentId ?? (p.tournament as { tournamentId?: number } | null)?.tournamentId ?? ''),
  horseId: String(p.horseId), horseName: String(p.horseName ?? ''), owner: String(p.ownerName ?? ''), trainerId: p.trainerId == null ? undefined : String(p.trainerId),
  status: p.status as EntryStatus, statusLabel: p.statusLabel == null ? undefined : String(p.statusLabel), createdAt: minute(p.proposedAt), stageDeadline: p.stageDeadline ? minute(p.stageDeadline) : null,
  queuePosition: (p.queuePosition as number | null) ?? null,
  closedReason: p.closedReason == null ? undefined : String(p.closedReason), closedAt: p.closedAt ? minute(p.closedAt) : undefined,
  trainerDecision: p.trainerDecidedAt ? { approve: !!p.trainerApproved, reasonCode: (p.trainerReasonCode as RejectCode | null) ?? undefined, note: (p.trainerNote as string | null) ?? undefined, by: String(p.trainerName ?? ''), at: minute(p.trainerDecidedAt) } : null,
  vetResult: p.vetPassed == null ? null : { pass: !!p.vetPassed, note: String(p.vetNote ?? ''), by: String(p.vetName ?? ''), at: minute(p.vetCheckedAt) },
  invoiceId: p.invoiceId == null ? null : String(p.invoiceCode ?? `INV-${p.invoiceId}`),
  complaint: p.complaintStatus ? { reason: String(p.complaintNote ?? ''), at: minute(p.complaintAt), status: COMPLAINT_STATUS[String(p.complaintStatus)] ?? 'OPEN', decidedAt: minute(p.complaintDecidedAt) || undefined, decisionNote: (p.complaintDecisionNote as string | null) ?? undefined } : null,
  canComplain: (p.canComplain as boolean | null) ?? undefined,
  result: p.rank == null ? null : { rank: Number(p.rank), finishTime: raceTime(p.finishTimeSeconds), prize: Number(p.prizeAmount ?? 0) },
  history: beHistory(p),
});
const tournamentsOf = (entries: RaceEntry[], raw: Record<string, unknown>[]) => {
  const byId = new Map<string, RaceTournament>();
  raw.forEach((p) => { const t = p.tournament as Record<string, unknown> | null; if (t) byId.set(String(t.tournamentId), mapBeTournament(t)); });
  return entries.map((e) => byId.get(e.tournamentId)).filter((t): t is RaceTournament => !!t).filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i);
};
const beProposals = async (params?: Record<string, unknown>) => {
  const raw = await beData<Record<string, unknown>[]>(be.get('/race-proposals', { params }));
  const entries = (raw ?? []).map(mapBeEntry);
  return { entries, tournaments: tournamentsOf(entries, raw ?? []) };
};
const CHECK_LABEL: Record<string, string> = { NOT_LOCKED: 'Trạng thái' };
const reasonsOf = (h: Record<string, unknown>) => {
  const checks = (h.checks as { code?: string; label?: string; passed?: boolean; detail?: string }[] | null) ?? [];
  if (!checks.length) return (h.reasons as string[] | null) ?? [];
  return checks.filter((c) => c.passed === false).map((c) => `${CHECK_LABEL[c.code ?? ''] ?? c.label ?? ''}: ${c.detail ?? ''}`);
};

const isApprovedHorse = (h: Record<string, unknown>) =>
  !((h.checks as { code?: string; passed?: boolean }[] | null) ?? []).some((c) => c.code === 'APPROVED' && c.passed === false);

const beList = async <R,>(url: string, map: (x: Record<string, unknown>) => R, params?: Record<string, unknown>) =>
  (await beData<Record<string, unknown>[] | { content: Record<string, unknown>[] }>(be.get(url, { params })).then((d) => (Array.isArray(d) ? d : d?.content ?? []))).map(map);

const syncMock = async () => {
  const [tournaments, entries, invoices] = await Promise.all([get<RaceTournament[]>(T), get<RaceEntry[]>(E), get<InvoiceRow[]>('/invoices')]);
  const now = clockNow();
  const paid = new Map(invoices.filter((i) => i.status === 'PAID').map((i) => [i.id, i]));
  let rows = entries.map((e) => (e.status === 'WAITING_PAYMENT' && e.invoiceId && paid.has(e.invoiceId)
    ? { ...e, status: 'REGISTERED' as EntryStatus, stageDeadline: null, history: entry(e, 'Hệ thống · VNPay', 'đã nộp lệ phí · đăng ký thành công', 'success'), queuePosition: null }
    : e));
  const changed = new Set(rows.filter((e, i) => e !== entries[i]).map((e) => e.id));
  for (const t of tournaments) {
    const own = rows.filter((e) => e.tournamentId === t.id);
    const swept = sweepTournament(t, own, now);
    swept.changed.forEach((id) => changed.add(id));
    const byId = new Map(swept.rows.map((e) => [e.id, e]));
    rows = rows.map((e) => byId.get(e.id) ?? e);
  }
  await Promise.all(rows.filter((e, i) => changed.has(e.id) || e.queuePosition !== entries[i]?.queuePosition).map((e) => http.put(`${E}/${e.id}`, e)));
  return { tournaments: tournaments.map(withMockFlags), entries: rows };
};

const withMockFlags = (t: RaceTournament): RaceTournament => {
  const published = t.status === 'PUBLISHED';
  const finished = t.isFinished === true || t.raceEnded === true;
  return {
    ...t,
    raceEnded: published && finished,
    canFinish: published && !finished,
    canRecordResults: published,
  };
};

const FINISH_OPEN: EntryStatus[] = ['WAITLISTED', 'WAITING_TRAINER', 'WAITING_VET_EXAM', 'WAITING_PAYMENT'];
const FINISH_REASON = 'Quản lý CLB đã kết thúc giải khi đề xuất chưa hoàn tất đăng ký';
const RESULTS_REASON = 'Quản lý CLB đã nhập kết quả giải khi đề xuất chưa hoàn tất đăng ký';

const closeOpenEntries = async (entries: RaceEntry[], reason: string, actor: Actor) => {
  const open = entries.filter((e) => FINISH_OPEN.includes(e.status));
  const at = toIsoMinute(clockNow());
  await Promise.all(open.map((e) => http.patch(`${E}/${e.id}`, {
    status: 'NO_SLOT', stageDeadline: null, queuePosition: null, closedReason: reason, closedAt: at,
    history: entry(e, actor.name, `kết thúc giải · ${reason.toLowerCase()}`, 'warning'),
  })));
  return open;
};

const facts = async () => {
  const [horses, protocols, sessions] = await Promise.all([get<HorseRow[]>('/horses'), get<ProtocolRow[]>('/protocols'), get<SessionRow[]>('/trainingSessions')]);
  const treating = new Set(protocols.filter((p) => p.state === 'IN_TREATMENT').map((p) => p.horseId));
  return horses.map((h) => ({
    row: h,
    facts: { id: h.id, name: h.name, breed: h.breed, age: h.age, weightKg: h.weightKg ?? null, owner: h.owner, trainingLocked: h.trainingLocked, health: h.health, inTreatment: treating.has(h.id), approved: true } as HorseFacts,
    form: formScore(h.raceResults ?? [], sessions.filter((s) => s.horseId === h.id && s.evaluation).map((s) => s.evaluation?.score ?? 0)),
  }));
};

const busyDatesFor = (horseId: string, entries: RaceEntry[], tournaments: RaceTournament[], exceptTournament: string) =>
  entries.filter((e) => e.horseId === horseId && e.tournamentId !== exceptTournament && HOLDING.includes(e.status))
    .map((e) => tournaments.find((t) => t.id === e.tournamentId)?.raceDate ?? '');

const save = async (e: RaceEntry, patch: Partial<RaceEntry>) => (await http.patch<RaceEntry>(`${E}/${e.id}`, patch)).data;

const resweep = async (tournamentId: string) => {
  const [t, entries] = await Promise.all([get<RaceTournament>(`${T}/${tournamentId}`), get<RaceEntry[]>(E, { tournamentId })]);
  const swept = sweepTournament(t, entries, clockNow());
  await Promise.all(swept.rows.filter((e, i) => swept.changed.has(e.id) || e.queuePosition !== entries[i].queuePosition).map((e) => http.put(`${E}/${e.id}`, e)));
};

export const tournamentApi = {
  async managerTournaments() {
    if (USE_BACKEND) {
      const [tournaments, { entries }] = await Promise.all([beList('/tournaments', mapBeTournament), beProposals()]);
      return { tournaments, entries };
    }
    return syncMock();
  },

  async managerTournament(id: string) {
    if (USE_BACKEND) {
      const [t, entries] = await Promise.all([beData<Record<string, unknown>>(be.get(`/tournaments/${id}`)).then(mapBeTournament), beProposals({ tournamentId: id })]);
      return { tournament: t, entries: entries.entries };
    }
    const { tournaments, entries } = await syncMock();
    const tournament = tournaments.find((t) => t.id === id);
    if (!tournament) throw new Error('Không tìm thấy giải đấu.');
    return { tournament, entries: entries.filter((e) => e.tournamentId === id) };
  },

  async saveTournament(draft: TournamentDraft, actor: Actor, existing?: RaceTournament) {
    if (existing && existing.status !== 'DRAFT') throw new Error('Giải đã công bố, không sửa được nữa.');
    const errors = validateTournament(draft, todayIso(), existing);
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);
    const body = { ...draft, name: draft.name.trim(), organizer: draft.organizer.trim(), location: draft.location.trim(), note: draft.note?.trim() || undefined };
    if (USE_BACKEND) {
      const { note, ...rest } = body;
      const payload = { ...rest, entryConditions: note };
      if (existing) await be.put(`/tournaments/${ref(existing)}`, payload);
      else await be.post('/tournaments', payload);
      return;
    }
    if (existing) {
      await http.patch(`${T}/${existing.id}`, body);
      await addAudit(actor, { action: 'UPDATE_TOURNAMENT', label: 'Sửa giải đấu', object: `${existing.id} · ${body.name}`, area: 'train' });
      return;
    }
    const all = await get<RaceTournament[]>(T);
    const id = nextId(all.map((t) => t.id), 'GD-');
    await http.post(T, { ...body, id, status: 'DRAFT' });
    await addAudit(actor, { action: 'IMPORT_TOURNAMENT', label: 'Nhập giải đấu', object: `${id} · ${body.name}`, area: 'train', to: 'DRAFT' });
  },

  async publish(t: RaceTournament, actor: Actor) {
    if (t.status !== 'DRAFT') throw new Error('Chỉ công bố giải đang ở bản nháp.');
    if (t.registrationDeadline < todayIso()) throw new Error('Hạn đăng ký đã qua, sửa lại trước khi công bố.');
    if (USE_BACKEND) { await be.put(`/tournaments/${ref(t)}/publish`); return; }
    await http.patch(`${T}/${t.id}`, { status: 'PUBLISHED' });
    await addAudit(actor, { action: 'PUBLISH_TOURNAMENT', label: 'Công bố giải đấu', object: `${t.id} · ${t.name}`, area: 'train', from: 'DRAFT', to: 'PUBLISHED' });
  },

  async finish(t: RaceTournament, actor: Actor) {
    if (t.status !== 'PUBLISHED') throw new Error('Chỉ kết thúc được giải đang công bố.');
    if (t.raceEnded) throw new Error('Giải đã kết thúc, đang chờ nhập kết quả.');
    if (USE_BACKEND) { await be.put(`/tournaments/${ref(t)}/finish`); return; }
    const entries = await get<RaceEntry[]>(E, { tournamentId: t.id });
    const open = await closeOpenEntries(entries, FINISH_REASON, actor);
    const registered = entries.filter((e) => e.status === 'REGISTERED').length;
    await http.patch(`${T}/${t.id}`, { isFinished: true, ...(registered === 0 ? { status: 'FINISHED' } : {}) });
    await addAudit(actor, { action: 'FINISH_TOURNAMENT', label: 'Kết thúc giải đấu', object: `${t.id} · ${t.name}`, area: 'train', from: 'PUBLISHED', to: registered ? 'Chờ nhập kết quả' : 'FINISHED', reason: `Đóng ${open.length} đề xuất chưa hoàn tất · ${registered} ngựa chờ nhập kết quả` });
  },

  async recordResults(t: RaceTournament, rows: { entryId: string; rank: number; finishTime: string }[], actor: Actor) {
    if (t.status !== 'PUBLISHED' || t.canRecordResults === false) throw new Error('Giải này không còn nhập kết quả được.');
    const ranks = rows.map((r) => r.rank);
    if (rows.some((r) => !Number.isInteger(r.rank) || r.rank < 1)) throw new Error('Thứ hạng là số nguyên ≥ 1.');
    if (new Set(ranks).size !== ranks.length) throw new Error('Hai ngựa không cùng thứ hạng.');
    if (rows.some((r) => !/^\d{1,2}:\d{2}\.\d{2}$/.test(r.finishTime))) throw new Error('Thời gian theo dạng m:ss.cc, ví dụ 1:12.55.');
    if (USE_BACKEND) {
      const { entries } = await beProposals({ tournamentId: ref(t) });
      await be.put(`/tournaments/${ref(t)}/results`, rows.map((r) => ({ proposalId: entries.find((e) => e.id === r.entryId)?.beId ?? r.entryId, rank: r.rank, finishTime: r.finishTime })));
      return;
    }
    const entries = await get<RaceEntry[]>(E, { tournamentId: t.id });
    if (!t.raceEnded) {
      await closeOpenEntries(entries, RESULTS_REASON, actor);
      await http.patch(`${T}/${t.id}`, { isFinished: true });
    }
    for (const r of rows) {
      const e = entries.find((x) => x.id === r.entryId);
      if (!e || e.status !== 'REGISTERED') throw new Error(`${r.entryId} không ở trạng thái đã đăng ký.`);
      const prize = prizeFor(r.rank, t.prizes);
      await save(e, { status: 'RESULT_RECORDED', result: { rank: r.rank, finishTime: r.finishTime, prize }, history: entry(e, actor.name, `nhập kết quả: hạng ${r.rank} · ${r.finishTime}${prize ? ` · thưởng ${prize.toLocaleString('vi-VN')} ₫` : ''}`, 'success') });
    }
    await http.patch(`${T}/${t.id}`, { status: 'FINISHED', canRecordResults: false });
    await addAudit(actor, { action: 'RECORD_TOURNAMENT_RESULTS', label: 'Nhập kết quả giải', object: `${t.id} · ${t.name}`, area: 'train', to: 'FINISHED' });
  },

  async complaints() {
    if (USE_BACKEND) {
      const { tournaments, entries } = await beProposals();
      return { tournaments, entries: entries.filter((e) => e.complaint) };
    }
    const { tournaments, entries } = await syncMock();
    return { tournaments, entries: entries.filter((e) => e.complaint) };
  },

  async decideComplaint(e: RaceEntry, accept: boolean, note: string, actor: Actor) {
    if (e.complaint?.status !== 'OPEN') throw new Error('Khiếu nại đã được xử lý.');
    if (note.trim().length < 10) throw new Error('Ghi chú quyết định ít nhất 10 ký tự.');
    if (USE_BACKEND) { await be.put(`/race-proposals/${ref(e)}/complaint-decision`, { accept, note: note.trim() }); return; }
    const t = await get<RaceTournament>(`${T}/${e.tournamentId}`);
    const complaint = { ...e.complaint, status: accept ? 'ACCEPTED' as const : 'REJECTED' as const, decidedBy: actor.name, decidedAt: toIsoMinute(clockNow()), decisionNote: note.trim() };
    if (!accept) {
      await save(e, { complaint, history: entry(e, actor.name, `bác khiếu nại: ${note.trim()}`, 'danger') });
    } else {
      const entries = await get<RaceEntry[]>(E, { tournamentId: e.tournamentId });
      const otherActive = entries.find((x) => x.id !== e.id && x.owner === e.owner && ACTIVE.includes(x.status));
      if (otherActive) throw new Error(`Chủ ngựa đã có đề xuất ${otherActive.id} khác cho giải này.`);
      const hasSlot = registrationOpen(t, clockNow()) && holdingCount(entries) < t.slots;
      const status: EntryStatus = !registrationOpen(t, clockNow()) ? 'NO_SLOT' : hasSlot ? 'WAITING_VET_EXAM' : 'WAITLISTED';
      await save(e, { complaint, status, stageDeadline: stageDeadline(status, clockNow(), t.registrationDeadline), history: entry(e, actor.name, `chấp nhận khiếu nại, bỏ quyết định từ chối của HLV · ${status === 'WAITING_VET_EXAM' ? 'chuyển sang chờ bác sĩ khám' : status === 'WAITLISTED' ? 'xếp lại hàng chờ theo thời điểm đề xuất ban đầu' : 'đã hết hạn đăng ký'}`, 'success') });
      await resweep(e.tournamentId);
    }
    await addAudit(actor, { action: accept ? 'ACCEPT_RACE_COMPLAINT' : 'REJECT_RACE_COMPLAINT', label: 'Xử lý khiếu nại đề xuất thi đấu', object: `${e.id} · ${e.horseName}`, area: 'train', reason: note.trim() });
  },

  async ownerTournaments(actor: Actor): Promise<OwnerTournament[]> {
    if (USE_BACKEND) {
      const rows = await beData<Record<string, unknown>[]>(be.get('/owner/tournaments'));
      return rows.map((r) => {
        const all = (r.horses as Record<string, unknown>[]) ?? [];
        const approved = all.filter(isApprovedHorse);
        const horses = approved.map((h) => ({
          horseId: String(h.horseId), horseName: String(h.horseName ?? ''), eligible: !!h.eligible, reasons: reasonsOf(h),
          formScore: h.formScore == null ? null : Number(h.formScore), formNote: (h.formNote as string | null) ?? undefined, recommended: !!h.recommended,
        }));
        return {
          tournament: mapBeTournament((r.tournament as Record<string, unknown>) ?? r), eligible: horses.some((h) => h.eligible), horses,
          hiddenUnapproved: all.length - approved.length,
          myProposal: r.myProposal ? mapBeEntry(r.myProposal as Record<string, unknown>) : null, lastProposal: r.lastProposal ? mapBeEntry(r.lastProposal as Record<string, unknown>) : null, slotsLeft: Number(r.slotsLeft ?? 0), queueLength: Number(r.queueLength ?? 0),
          canPropose: (r.canPropose as boolean | null) ?? undefined, cannotProposeReason: (r.cannotProposeReason as string | null) ?? undefined,
        };
      });
    }
    const [{ tournaments, entries }, horses] = await Promise.all([syncMock(), facts()]);
    const mine = horses.filter((h) => h.row.owner === actor.name);
    return tournaments.filter((t) => t.status !== 'DRAFT').sort((a, b) => Number(registrationOpen(b, clockNow())) - Number(registrationOpen(a, clockNow())) || a.raceDate.localeCompare(b.raceDate)).map((t) => {
      const own = entries.filter((e) => e.tournamentId === t.id);
      const mineHere = own.filter((e) => e.owner === actor.name).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const list = mine.map((h) => {
        const reasons = eligibilityReasons(h.facts, t, busyDatesFor(h.row.id, entries, tournaments, t.id));
        return { horseId: h.row.id, horseName: h.row.name, eligible: reasons.length === 0, reasons, formScore: h.form };
      }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.formScore ?? 0) - (a.formScore ?? 0));
      return {
        tournament: t, eligible: list.some((h) => h.eligible), horses: list,
        myProposal: mineHere.find((e) => ACTIVE.includes(e.status)) ?? null,
        lastProposal: mineHere.some((e) => ACTIVE.includes(e.status)) ? null : mineHere[0] ?? null,
        slotsLeft: Math.max(0, t.slots - holdingCount(own)), queueLength: waitlist(own).length,
      };
    });
  },

  async propose(t: RaceTournament, horseId: string, actor: Actor) {
    if (USE_BACKEND) { await be.post('/race-proposals', { tournamentId: ref(t), horseId: Number(horseId) || horseId }); return; }
    const now = clockNow();
    if (!registrationOpen(t, now)) throw new Error('Giải đã hết hạn đăng ký.');
    const [{ tournaments, entries }, horses] = await Promise.all([syncMock(), facts()]);
    const h = horses.find((x) => x.row.id === horseId);
    if (!h || h.row.owner !== actor.name) throw new Error('Chỉ đề xuất ngựa của bạn.');
    const own = entries.filter((e) => e.tournamentId === t.id);
    const dup = own.find((e) => e.owner === actor.name && ACTIVE.includes(e.status));
    if (dup) throw new Error(`Bạn đã có đề xuất ${dup.id} (${dup.horseName}) cho giải này — mỗi chủ ngựa chỉ một suất.`);
    const reasons = eligibilityReasons(h.facts, t, busyDatesFor(horseId, entries, tournaments, t.id));
    if (reasons.length) throw new Error(`${h.row.name} không đủ điều kiện: ${reasons.join('; ')}.`);
    const hasSlot = holdingCount(own) < t.slots;
    const status: EntryStatus = hasSlot ? 'WAITING_TRAINER' : 'WAITLISTED';
    const id = nextId(entries.map((e) => e.id), 'DK-');
    const row: RaceEntry = {
      id, tournamentId: t.id, horseId, horseName: h.row.name, owner: actor.name, trainerId: h.row.trainerId, status, createdAt: toIsoMinute(now),
      stageDeadline: stageDeadline(status, now, t.registrationDeadline), queuePosition: hasSlot ? null : waitlist(own).length + 1,
      trainerDecision: null, vetResult: null, invoiceId: null, complaint: null, result: null,
      history: [{ at: toIsoMinute(now), who: actor.name, text: hasSlot ? 'đề xuất tham gia · giữ suất, chờ HLV xác nhận' : 'đề xuất tham gia · hết suất, vào hàng chờ' }],
    };
    await http.post(E, row);
    await addAudit(actor, { action: 'OWNER_PROPOSE_RACE', label: 'Chủ ngựa đề xuất thi đấu', object: `${id} · ${h.row.name}`, area: 'train', to: status, reason: t.name });
  },

  async myEntries(actor: Actor) {
    if (USE_BACKEND) {
      const { tournaments, entries } = await beProposals();
      return { tournaments, entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    }
    const { tournaments, entries } = await syncMock();
    return { tournaments, entries: entries.filter((e) => e.owner === actor.name).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  },

  async cancel(e: RaceEntry, actor: Actor) {
    if (!CANCELLABLE.includes(e.status)) throw new Error('Đề xuất này không hủy được nữa.');
    if (USE_BACKEND) { await be.put(`/race-proposals/${ref(e)}/cancel`); return; }
    if (e.owner !== actor.name) throw new Error('Chỉ hủy đề xuất của bạn.');
    await save(e, { status: 'CANCELLED', stageDeadline: null, queuePosition: null, history: entry(e, actor.name, 'chủ ngựa hủy đề xuất · trả suất', 'warning') });
    await resweep(e.tournamentId);
  },

  async complain(e: RaceEntry, reason: string, actor: Actor) {
    if (e.status !== 'TRAINER_REJECTED') throw new Error('Chỉ khiếu nại khi HLV từ chối.');
    if (e.complaint) throw new Error('Đề xuất này đã có khiếu nại.');
    if (reason.trim().length < 10) throw new Error('Nội dung khiếu nại ít nhất 10 ký tự.');
    if (USE_BACKEND) { await be.post(`/race-proposals/${ref(e)}/complaint`, { note: reason.trim() }); return; }
    await save(e, { complaint: { reason: reason.trim(), at: toIsoMinute(clockNow()), status: 'OPEN' }, history: entry(e, actor.name, `gửi khiếu nại tới Quản lý CLB: ${reason.trim()}`, 'warning') });
  },

  async dossier(e: RaceEntry): Promise<Dossier> {
    if (USE_BACKEND) {
      const d = await beData<BeDossier>(be.get(`/race-proposals/${ref(e)}/dossier`));
      const t = d.proposal.tournament;
      return {
        entryId: String(d.proposal.proposalCode ?? e.id), tournament: t ? mapBeTournament(t) : (await tournamentApi.managerTournament(e.tournamentId)).tournament,
        horse: { id: String(d.horse.horseId), name: d.horse.horseName, breed: d.horse.breed ?? '—', sex: d.horse.gender ?? undefined, age: d.horse.ageYears ?? 0, weightKg: d.horse.weightKg == null ? null : Number(d.horse.weightKg) },
        owner: d.owner?.fullName ?? e.owner, trainer: d.trainer?.fullName ?? '—',
        vetResult: d.vetExam?.passed == null ? e.vetResult : { pass: !!d.vetExam.passed, note: d.vetExam.note ?? '', by: d.vetExam.vetName ?? '', at: minute(d.vetExam.checkedAt) },
        paidAt: d.payment?.paidAt ? fmtDate(minute(d.payment.paidAt)) : null, generatedAt: minute(d.generatedAt),
      };
    }
    if (!['REGISTERED', 'RESULT_RECORDED'].includes(e.status)) throw new Error('Hồ sơ chỉ có khi đã đăng ký thành công.');
    const [t, h, users, invoice] = await Promise.all([
      get<RaceTournament>(`${T}/${e.tournamentId}`), get<HorseRow>(`/horses/${e.horseId}`), get<UserRow[]>('/users'),
      e.invoiceId ? get<InvoiceRow>(`/invoices/${e.invoiceId}`).catch(() => null) : Promise.resolve(null),
    ]);
    return {
      entryId: e.id, tournament: t, horse: { id: h.id, name: h.name, breed: h.breed, sex: h.sex, age: h.age, weightKg: h.weightKg ?? null }, owner: e.owner,
      trainer: users.find((u) => u.id === h.trainerId)?.fullname ?? e.trainerDecision?.by ?? '—', vetResult: e.vetResult,
      paidAt: invoice?.paidAt ?? (invoice?.status === 'PAID' ? fmtDate(toIsoDay(clockNow())) : null), generatedAt: toIsoMinute(clockNow()),
    };
  },

  async trainerQueue(actor: Actor) {
    if (USE_BACKEND) {
      return beProposals();
    }
    const { tournaments, entries } = await syncMock();
    const horses = await get<HorseRow[]>('/horses', { trainerId: actor.id });
    const ids = new Set(horses.map((h) => h.id));
    return { tournaments, entries: entries.filter((e) => ids.has(e.horseId)) };
  },

  async trainerDecide(e: RaceEntry, approve: boolean, reasonCode: RejectCode | '', note: string, actor: Actor) {
    if (e.status !== 'WAITING_TRAINER') throw new Error('Đề xuất không chờ HLV xác nhận.');
    if (!approve && !reasonCode) throw new Error('Chọn lý do từ chối.');
    if (!approve && note.trim().length < 10) throw new Error('Giải thích lý do ít nhất 10 ký tự.');
    if (USE_BACKEND) { await be.put(`/race-proposals/${ref(e)}/trainer-decision`, { approve, reasonCode: reasonCode || undefined, note: note.trim() || undefined }); return; }
    const t = await get<RaceTournament>(`${T}/${e.tournamentId}`);
    const now = clockNow();
    const trainerDecision = { approve, reasonCode: reasonCode || undefined, note: note.trim() || undefined, by: actor.name, at: toIsoMinute(now) };
    if (approve) {
      await save(e, { status: 'WAITING_VET_EXAM', trainerDecision, stageDeadline: stageDeadline('WAITING_VET_EXAM', now, t.registrationDeadline), history: entry(e, `HLV ${actor.name}`, 'xác nhận ngựa sẵn sàng · chuyển bác sĩ khám', 'success') });
    } else {
      await save(e, { status: 'TRAINER_REJECTED', trainerDecision, stageDeadline: null, history: entry(e, `HLV ${actor.name}`, `từ chối: ${note.trim()}`, 'danger') });
      await resweep(e.tournamentId);
    }
    await addAudit(actor, { action: approve ? 'TRAINER_APPROVE_RACE' : 'TRAINER_REJECT_RACE', label: 'HLV xác nhận đề xuất thi đấu', object: `${e.id} · ${e.horseName}`, area: 'train', from: 'WAITING_TRAINER', to: approve ? 'WAITING_VET_EXAM' : 'TRAINER_REJECTED', reason: note.trim() || undefined });
  },

  async raceDatesOf(horseId: string) {
    if (USE_BACKEND) {
      const { entries: rows, tournaments } = await beProposals().catch(() => ({ entries: [] as RaceEntry[], tournaments: [] as RaceTournament[] }));
      return rows.filter((e) => e.horseId === horseId && TRAINER_CONFIRMED.includes(e.status)).map((e) => tournaments.find((t) => t.id === e.tournamentId)).filter((t): t is RaceTournament => !!t);
    }
    const [entries, tournaments] = await Promise.all([get<RaceEntry[]>(E, { horseId }), get<RaceTournament[]>(T)]);
    return entries.filter((e) => TRAINER_CONFIRMED.includes(e.status)).map((e) => tournaments.find((t) => t.id === e.tournamentId)).filter((t): t is RaceTournament => !!t);
  },

  async vetQueue() {
    if (USE_BACKEND) {
      const { tournaments, entries } = await beProposals();
      return { tournaments, entries: entries.filter((e) => e.status === 'WAITING_VET_EXAM' || e.vetResult) };
    }
    const { tournaments, entries } = await syncMock();
    return { tournaments, entries: entries.filter((e) => e.status === 'WAITING_VET_EXAM' || e.vetResult) };
  },

  async vetExam(e: RaceEntry, pass: boolean, note: string, actor: Actor) {
    if (e.status !== 'WAITING_VET_EXAM') throw new Error('Đề xuất không chờ khám.');
    if (note.trim().length < 10) throw new Error(pass ? 'Nhận xét khám ít nhất 10 ký tự.' : 'Lý do không đạt ít nhất 10 ký tự.');
    if (USE_BACKEND) { await be.post(`/prerace-exams/${encodeURIComponent(e.id)}/examine`, { isPassed: pass, vetNotes: note.trim() }); return; }
    const now = clockNow();
    const horse = await get<HorseRow>(`/horses/${e.horseId}`);
    if (pass && (horse.trainingLocked || horse.health === 'INJURED' || horse.health === 'QUARANTINE')) throw new Error(`${horse.name} đang bị khóa y tế / chấn thương / cách ly — chỉ kết luận KHÔNG ĐẠT.`);
    const vetResult = { pass, note: note.trim(), by: actor.name, at: toIsoMinute(now) };
    if (!pass) {
      await save(e, { status: 'VET_FAILED', vetResult, stageDeadline: null, history: entry(e, `BS ${actor.name}`, `kết luận KHÔNG ĐẠT: ${note.trim()}`, 'danger') });
      await resweep(e.tournamentId);
    } else {
      const t = await get<RaceTournament>(`${T}/${e.tournamentId}`);
      if (t.entryFee <= 0) {
        await save(e, { status: 'REGISTERED', vetResult, stageDeadline: null, history: entry(e, `BS ${actor.name}`, 'kết luận ĐẠT · giải miễn lệ phí, đăng ký thành công', 'success') });
      } else {
        const deadline = stageDeadline('WAITING_PAYMENT', now, t.registrationDeadline) ?? endOfDay(t.registrationDeadline);
        const invoices = await get<{ id: string }[]>('/invoices');
        const invoiceId = nextId(invoices.map((i) => i.id), 'INV-');
        const period = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        await http.post('/invoices', {
          id: invoiceId, horse: e.horseName, owner: e.owner, period, dueDate: fmtDate(deadline), amount: t.entryFee, overdueDays: 0, status: 'UNPAID',
          horseId: e.horseId, issuedAt: fmtDate(toIsoDay(now)), service: 'Lệ phí giải đấu', lines: [{ label: `Lệ phí ${t.name} — ${e.horseName}`, kind: 'RACE', period, amount: t.entryFee }],
        });
        await save(e, { status: 'WAITING_PAYMENT', vetResult, invoiceId, stageDeadline: deadline, history: entry(e, `BS ${actor.name}`, `kết luận ĐẠT · phát hành hóa đơn lệ phí ${invoiceId}`, 'success') });
      }
    }
    await addAudit(actor, { action: pass ? 'RACE_EXAM_PASS' : 'RACE_EXAM_FAIL', label: 'Khám trước thi đấu', object: `${e.id} · ${e.horseName}`, area: 'med', from: 'WAITING_VET_EXAM', reason: note.trim() });
  },
};
