import { DEMO_NOW, http } from '../../api/http';
import { USE_BACKEND, be, beData } from '../../api/beClient';
import { addAudit, type Actor } from '../../api/managerApi';
import {
  ACTIVE, CANCELLABLE, HOLDING, eligibilityReasons, endOfDay, fmtDate, formScore, holdingCount, prizeFor, registrationOpen,
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

const T = '/raceTournaments';
const E = '/raceEntries';
const get = async <R,>(url: string, params?: Record<string, unknown>) => (await http.get<R>(url, { params })).data;

export const RACE_FLOW_V2 = !USE_BACKEND || import.meta.env.VITE_RACE_FLOW === 'v2';

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
  allowedBreeds: (t.allowedBreeds as string[] | null) ?? [], prizes: (t.prizes as RaceTournament['prizes'] | null) ?? [],
  status: (t.status as RaceTournament['status']) ?? 'DRAFT', note: (t.note as string | undefined) ?? undefined,
});
const mapBeEntry = (p: Record<string, unknown>): RaceEntry => ({
  id: String(p.proposalCode ?? p.proposalId), beId: Number(p.proposalId), tournamentId: String(p.tournamentId ?? (p.tournament as { tournamentId?: number } | null)?.tournamentId ?? ''),
  horseId: String(p.horseId), horseName: String(p.horseName ?? ''), owner: String(p.ownerName ?? ''), status: p.status as EntryStatus,
  createdAt: String(p.createdAt ?? p.proposedAt ?? '').slice(0, 16), stageDeadline: p.stageDeadline ? String(p.stageDeadline).slice(0, 16) : null,
  queuePosition: (p.queuePosition as number | null) ?? null, trainerDecision: (p.trainerDecision as RaceEntry['trainerDecision']) ?? null,
  vetResult: p.vetPassed == null ? null : { pass: !!p.vetPassed, note: String(p.vetNote ?? ''), by: String(p.vetName ?? ''), at: String(p.vetCheckedAt ?? '').slice(0, 16) },
  invoiceId: p.invoiceId == null ? null : String(p.invoiceId), complaint: (p.complaint as RaceEntry['complaint']) ?? null,
  result: p.rank == null ? null : { rank: Number(p.rank), finishTime: String(p.finishTime ?? ''), prize: Number(p.prizeAmount ?? 0) },
  history: (p.history as EntryHistory[] | null) ?? [],
});
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
  return { tournaments, entries: rows };
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
      const [tournaments, entries] = await Promise.all([beList('/tournaments', mapBeTournament), beList('/race-proposals', mapBeEntry)]);
      return { tournaments, entries };
    }
    return syncMock();
  },

  async managerTournament(id: string) {
    if (USE_BACKEND) {
      const [t, entries] = await Promise.all([beData<Record<string, unknown>>(be.get(`/tournaments/${id}`)).then(mapBeTournament), beList('/race-proposals', mapBeEntry, { tournamentId: id })]);
      return { tournament: t, entries };
    }
    const { tournaments, entries } = await syncMock();
    const tournament = tournaments.find((t) => t.id === id);
    if (!tournament) throw new Error('Không tìm thấy giải đấu.');
    return { tournament, entries: entries.filter((e) => e.tournamentId === id) };
  },

  async saveTournament(draft: TournamentDraft, actor: Actor, existing?: RaceTournament) {
    const errors = validateTournament(draft, todayIso());
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);
    const body = { ...draft, name: draft.name.trim(), organizer: draft.organizer.trim(), location: draft.location.trim(), note: draft.note?.trim() || undefined };
    if (USE_BACKEND) {
      if (existing) await be.put(`/tournaments/${ref(existing)}`, body);
      else await be.post('/tournaments', body);
      return;
    }
    if (existing) {
      if (existing.status === 'FINISHED') throw new Error('Giải đã kết thúc, không sửa được.');
      const held = holdingCount(await get<RaceEntry[]>(E, { tournamentId: existing.id }));
      if (existing.status === 'PUBLISHED' && draft.slots < held) throw new Error(`Đã có ${held} suất đang giữ, không giảm số suất dưới mức này.`);
      await http.patch(`${T}/${existing.id}`, body);
      await addAudit(actor, { action: 'UPDATE_TOURNAMENT', label: 'Sửa giải đấu', object: `${existing.id} · ${body.name}`, area: 'train' });
      if (existing.status === 'PUBLISHED') await resweep(existing.id);
      return;
    }
    const all = await get<RaceTournament[]>(T);
    const id = nextId(all.map((t) => t.id), 'GD-');
    await http.post(T, { ...body, id, status: 'DRAFT' });
    await addAudit(actor, { action: 'CREATE_TOURNAMENT', label: 'Tạo giải đấu', object: `${id} · ${body.name}`, area: 'train', to: 'DRAFT' });
  },

  async publish(t: RaceTournament, actor: Actor) {
    if (t.status !== 'DRAFT') throw new Error('Chỉ công bố giải đang ở bản nháp.');
    if (t.registrationDeadline < todayIso()) throw new Error('Hạn đăng ký đã qua, sửa lại trước khi công bố.');
    if (USE_BACKEND) { await be.put(`/tournaments/${ref(t)}/publish`); return; }
    await http.patch(`${T}/${t.id}`, { status: 'PUBLISHED' });
    await addAudit(actor, { action: 'PUBLISH_TOURNAMENT', label: 'Công bố giải đấu', object: `${t.id} · ${t.name}`, area: 'train', from: 'DRAFT', to: 'PUBLISHED' });
  },

  async recordResults(t: RaceTournament, rows: { entryId: string; rank: number; finishTime: string }[], actor: Actor) {
    if (todayIso() < t.raceDate) throw new Error('Chỉ nhập kết quả sau ngày thi đấu.');
    const ranks = rows.map((r) => r.rank);
    if (rows.some((r) => !Number.isInteger(r.rank) || r.rank < 1)) throw new Error('Thứ hạng là số nguyên ≥ 1.');
    if (new Set(ranks).size !== ranks.length) throw new Error('Hai ngựa không cùng thứ hạng.');
    if (rows.some((r) => !/^\d{1,2}:\d{2}\.\d{2}$/.test(r.finishTime))) throw new Error('Thời gian theo dạng m:ss.cc, ví dụ 1:12.55.');
    if (USE_BACKEND) {
      const entries = await beList('/race-proposals', mapBeEntry, { tournamentId: ref(t) });
      await be.put(`/tournaments/${ref(t)}/results`, rows.map((r) => ({ proposalId: entries.find((e) => e.id === r.entryId)?.beId ?? r.entryId, rank: r.rank, finishTime: r.finishTime })));
      return;
    }
    const entries = await get<RaceEntry[]>(E, { tournamentId: t.id });
    for (const r of rows) {
      const e = entries.find((x) => x.id === r.entryId);
      if (!e || e.status !== 'REGISTERED') throw new Error(`${r.entryId} không ở trạng thái đã đăng ký.`);
      const prize = prizeFor(r.rank, t.prizes);
      await save(e, { status: 'RESULTED', result: { rank: r.rank, finishTime: r.finishTime, prize }, history: entry(e, actor.name, `nhập kết quả: hạng ${r.rank} · ${r.finishTime}${prize ? ` · thưởng ${prize.toLocaleString('vi-VN')} ₫` : ''}`, 'success') });
    }
    await http.patch(`${T}/${t.id}`, { status: 'FINISHED' });
    await addAudit(actor, { action: 'RECORD_TOURNAMENT_RESULTS', label: 'Nhập kết quả giải', object: `${t.id} · ${t.name}`, area: 'train', to: 'FINISHED' });
  },

  async complaints() {
    if (USE_BACKEND) {
      const [tournaments, entries] = await Promise.all([beList('/tournaments', mapBeTournament), beList('/race-proposals', mapBeEntry, { hasComplaint: true })]);
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
      return rows.map((r) => ({
        tournament: mapBeTournament((r.tournament as Record<string, unknown>) ?? r), eligible: !!r.eligible,
        horses: ((r.horses as Record<string, unknown>[]) ?? []).map((h) => ({ horseId: String(h.horseId), horseName: String(h.horseName ?? ''), eligible: !!h.eligible, reasons: (h.reasons as string[]) ?? [], formScore: Number(h.formScore ?? 0) })),
        myProposal: r.myProposal ? mapBeEntry(r.myProposal as Record<string, unknown>) : null, slotsLeft: Number(r.slotsLeft ?? 0), queueLength: Number(r.queueLength ?? 0),
      }));
    }
    const [{ tournaments, entries }, horses] = await Promise.all([syncMock(), facts()]);
    const mine = horses.filter((h) => h.row.owner === actor.name);
    return tournaments.filter((t) => t.status !== 'DRAFT').sort((a, b) => Number(registrationOpen(b, clockNow())) - Number(registrationOpen(a, clockNow())) || a.raceDate.localeCompare(b.raceDate)).map((t) => {
      const own = entries.filter((e) => e.tournamentId === t.id);
      const list = mine.map((h) => {
        const reasons = eligibilityReasons(h.facts, t, busyDatesFor(h.row.id, entries, tournaments, t.id));
        return { horseId: h.row.id, horseName: h.row.name, eligible: reasons.length === 0, reasons, formScore: h.form };
      }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.formScore - a.formScore);
      return {
        tournament: t, eligible: list.some((h) => h.eligible), horses: list,
        myProposal: own.filter((e) => e.owner === actor.name).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find((e) => ACTIVE.includes(e.status)) ?? null,
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
      const [tournaments, entries] = await Promise.all([beList('/tournaments', mapBeTournament), beList('/race-proposals', mapBeEntry)]);
      return { tournaments, entries };
    }
    const { tournaments, entries } = await syncMock();
    return { tournaments, entries: entries.filter((e) => e.owner === actor.name).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  },

  async cancel(e: RaceEntry, actor: Actor) {
    if (!CANCELLABLE.includes(e.status)) throw new Error('Đề xuất này không hủy được nữa.');
    if (USE_BACKEND) { await be.put(`/race-proposals/${ref(e)}/cancel`); return; }
    if (e.owner !== actor.name) throw new Error('Chỉ hủy đề xuất của bạn.');
    await save(e, { status: 'OWNER_CANCELLED', stageDeadline: null, queuePosition: null, history: entry(e, actor.name, 'chủ ngựa hủy đề xuất · trả suất', 'warning') });
    await resweep(e.tournamentId);
  },

  async complain(e: RaceEntry, reason: string, actor: Actor) {
    if (e.status !== 'TRAINER_REJECTED') throw new Error('Chỉ khiếu nại khi HLV từ chối.');
    if (e.complaint) throw new Error('Đề xuất này đã có khiếu nại.');
    if (reason.trim().length < 10) throw new Error('Nội dung khiếu nại ít nhất 10 ký tự.');
    if (USE_BACKEND) { await be.post(`/race-proposals/${ref(e)}/complaint`, { reason: reason.trim() }); return; }
    await save(e, { complaint: { reason: reason.trim(), at: toIsoMinute(clockNow()), status: 'OPEN' }, history: entry(e, actor.name, `gửi khiếu nại tới Quản lý CLB: ${reason.trim()}`, 'warning') });
  },

  async dossier(e: RaceEntry): Promise<Dossier> {
    if (USE_BACKEND) return beData<Dossier>(be.get(`/race-proposals/${ref(e)}/dossier`));
    if (!['REGISTERED', 'RESULTED'].includes(e.status)) throw new Error('Hồ sơ chỉ có khi đã đăng ký thành công.');
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
      const [tournaments, entries] = await Promise.all([beList('/tournaments', mapBeTournament), beList('/race-proposals', mapBeEntry)]);
      return { tournaments, entries };
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
      const rows = await beList('/race-proposals', mapBeEntry, { horseId }).catch(() => [] as RaceEntry[]);
      const tournaments = await beList('/tournaments', mapBeTournament).catch(() => [] as RaceTournament[]);
      return rows.filter((e) => HOLDING.includes(e.status) && e.status !== 'RESULTED').map((e) => tournaments.find((t) => t.id === e.tournamentId)).filter((t): t is RaceTournament => !!t);
    }
    const [entries, tournaments] = await Promise.all([get<RaceEntry[]>(E, { horseId }), get<RaceTournament[]>(T)]);
    return entries.filter((e) => HOLDING.includes(e.status) && e.status !== 'RESULTED').map((e) => tournaments.find((t) => t.id === e.tournamentId)).filter((t): t is RaceTournament => !!t);
  },

  async vetQueue() {
    if (USE_BACKEND) {
      const [tournaments, entries] = await Promise.all([beList('/tournaments', mapBeTournament), beList('/race-proposals', mapBeEntry)]);
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
