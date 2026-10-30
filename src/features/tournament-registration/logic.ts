import type { EntryHistory, EntryStatus, Prize, RaceEntry, RaceTournament, TournamentDraft } from './types';

export const HOLD_DAYS: Partial<Record<EntryStatus, number>> = { WAITING_TRAINER: 2, WAITING_VET_EXAM: 3, WAITING_PAYMENT: 2 };
export const EXPIRED_STATUS: Partial<Record<EntryStatus, EntryStatus>> = { WAITING_TRAINER: 'TRAINER_EXPIRED', WAITING_VET_EXAM: 'VET_EXPIRED', WAITING_PAYMENT: 'PAYMENT_EXPIRED' };
export const HOLDING: EntryStatus[] = ['WAITING_TRAINER', 'WAITING_VET_EXAM', 'WAITING_PAYMENT', 'REGISTERED', 'RESULT_RECORDED'];
export const ACTIVE: EntryStatus[] = ['WAITLISTED', ...HOLDING];
export const TRAINER_CONFIRMED: EntryStatus[] = ['WAITING_VET_EXAM', 'WAITING_PAYMENT', 'REGISTERED'];
export const CANCELLABLE: EntryStatus[] = ['WAITLISTED', 'WAITING_TRAINER', 'WAITING_VET_EXAM', 'WAITING_PAYMENT'];
export const PRE_RACE_REST_DAYS = 7;

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoMinute = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const toIsoDay = (d: Date) => toIsoMinute(d).slice(0, 10);
export const parseIso = (iso: string) => {
  const [day, time = '00:00'] = iso.split('T');
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};
export const fmtDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
export const fmtDateTime = (iso: string | null | undefined) => (iso ? `${fmtDate(iso)}${iso.length > 10 ? ` ${iso.slice(11, 16)}` : ''}` : '—');
export const endOfDay = (isoDay: string) => `${isoDay.slice(0, 10)}T23:59`;
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export const stageDeadline = (status: EntryStatus, now: Date, registrationDeadline: string) => {
  const days = HOLD_DAYS[status];
  if (!days) return null;
  const byRule = toIsoMinute(addDays(now, days));
  const cap = endOfDay(registrationDeadline);
  return byRule < cap ? byRule : cap;
};

export const countdown = (deadline: string | null, now: Date) => {
  if (!deadline) return '';
  const ms = parseIso(deadline).getTime() - now.getTime();
  if (ms <= 0) return 'đã quá hạn';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  return d > 0 ? `còn ${d} ngày ${h % 24} giờ` : h > 0 ? `còn ${h} giờ` : `còn ${Math.max(1, Math.floor(ms / 60000))} phút`;
};

export const registrationOpen = (t: RaceTournament, now: Date) => t.status === 'PUBLISHED' && toIsoMinute(now) <= endOfDay(t.registrationDeadline);

export interface HorseFacts {
  id: string; name: string; breed: string; age: number; weightKg: number | null; owner: string;
  trainingLocked?: boolean; health?: string; inTreatment?: boolean; approved?: boolean;
}

export const eligibilityReasons = (h: HorseFacts, t: RaceTournament, busyDates: string[]) => {
  const reasons: string[] = [];
  if (t.minAgeYears != null && h.age < t.minAgeYears) reasons.push(`Tuổi ${h.age} nhỏ hơn tối thiểu ${t.minAgeYears}`);
  if (t.maxAgeYears != null && h.age > t.maxAgeYears) reasons.push(`Tuổi ${h.age} lớn hơn tối đa ${t.maxAgeYears}`);
  if (h.weightKg == null && (t.minWeightKg != null || t.maxWeightKg != null)) reasons.push('Chưa có cân nặng trong hồ sơ');
  if (h.weightKg != null && t.minWeightKg != null && h.weightKg < t.minWeightKg) reasons.push(`Cân nặng ${h.weightKg} kg dưới mức ${t.minWeightKg} kg`);
  if (h.weightKg != null && t.maxWeightKg != null && h.weightKg > t.maxWeightKg) reasons.push(`Cân nặng ${h.weightKg} kg vượt mức ${t.maxWeightKg} kg`);
  if (t.allowedBreeds.length > 0 && !t.allowedBreeds.includes(h.breed)) reasons.push(`Giống ${h.breed} không thuộc danh sách giải nhận`);
  if (h.trainingLocked) reasons.push('Đang bị bác sĩ khóa y tế');
  if (h.health === 'INJURED' || h.health === 'QUARANTINE') reasons.push(h.health === 'INJURED' ? 'Đang chấn thương' : 'Đang cách ly');
  if (h.inTreatment) reasons.push('Đang trong phác đồ điều trị');
  if (h.approved === false) reasons.push('Hồ sơ ngựa chưa được duyệt');
  if (busyDates.includes(t.raceDate)) reasons.push('Đã đăng ký giải khác cùng ngày thi đấu');
  return reasons;
};

export const formScore = (results: { rank: number; field: number }[], evaluations: number[]) => {
  const recent = results.slice(0, 3).filter((r) => r.field > 1);
  const race = recent.length ? recent.reduce((s, r) => s + (1 - (r.rank - 1) / (r.field - 1)), 0) / recent.length : null;
  const evals = evaluations.slice(0, 5);
  const train = evals.length ? evals.reduce((s, x) => s + x, 0) / evals.length / 10 : null;
  const parts = [race, train].filter((x): x is number => x != null);
  return parts.length ? Math.round((parts.reduce((s, x) => s + x, 0) / parts.length) * 100) : 50;
};

export const holdingCount = (entries: RaceEntry[]) => entries.filter((e) => HOLDING.includes(e.status)).length;
export const waitlist = (entries: RaceEntry[]) => entries.filter((e) => e.status === 'WAITLISTED').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
export const withQueuePositions = (entries: RaceEntry[]) => {
  const order = new Map(waitlist(entries).map((e, i) => [e.id, i + 1]));
  return entries.map((e) => ({ ...e, queuePosition: order.get(e.id) ?? null }));
};

const log = (e: RaceEntry, at: Date, text: string, tone?: EntryHistory['tone']): EntryHistory[] => [{ at: toIsoMinute(at), who: 'Hệ thống', text, tone }, ...e.history];

export const sweepTournament = (t: RaceTournament, entries: RaceEntry[], now: Date) => {
  const nowIso = toIsoMinute(now);
  const changed = new Set<string>();
  let rows = entries.map((e) => {
    const expiredTo = EXPIRED_STATUS[e.status];
    if (expiredTo && e.stageDeadline && e.stageDeadline < nowIso) {
      changed.add(e.id);
      return { ...e, status: expiredTo, stageDeadline: null, history: log(e, now, 'quá hạn giữ chỗ · mất suất', 'danger') };
    }
    return e;
  });
  const open = nowIso <= endOfDay(t.registrationDeadline);
  if (open) {
    let free = t.slots - holdingCount(rows);
    for (const head of waitlist(rows)) {
      if (free <= 0) break;
      free -= 1;
      changed.add(head.id);
      rows = rows.map((e) => (e.id === head.id ? { ...e, status: 'WAITING_TRAINER' as EntryStatus, stageDeadline: stageDeadline('WAITING_TRAINER', now, t.registrationDeadline), history: log(e, now, 'có suất trống · chuyển sang chờ HLV xác nhận', 'success') } : e));
    }
  } else {
    rows = rows.map((e) => {
      if (e.status !== 'WAITLISTED') return e;
      changed.add(e.id);
      return { ...e, status: 'NO_SLOT' as EntryStatus, history: log(e, now, 'hết hạn đăng ký · không còn suất', 'danger') };
    });
  }
  return { rows: withQueuePositions(rows), changed };
};

export const criteriaText = (t: RaceTournament) => {
  const parts: string[] = [];
  if (t.minAgeYears != null || t.maxAgeYears != null) parts.push(`Tuổi ${t.minAgeYears ?? '…'}–${t.maxAgeYears ?? '…'}`);
  if (t.minWeightKg != null || t.maxWeightKg != null) parts.push(`Cân nặng ${t.minWeightKg ?? '…'}–${t.maxWeightKg ?? '…'} kg`);
  parts.push(t.allowedBreeds.length ? `Giống: ${t.allowedBreeds.join(', ')}` : 'Mọi giống');
  return parts.join(' · ');
};

export const prizeFor = (rank: number, prizes: Prize[]) => prizes.find((p) => p.rank === rank)?.amount ?? 0;

export const validateTournament = (d: TournamentDraft, todayIso: string) => {
  const errors: Partial<Record<keyof TournamentDraft, string>> = {};
  if (d.name.trim().length < 5) errors.name = 'Tên giải ít nhất 5 ký tự';
  if (d.organizer.trim().length < 2) errors.organizer = 'Nhập ban tổ chức';
  if (d.location.trim().length < 2) errors.location = 'Nhập địa điểm';
  if (!d.raceDate) errors.raceDate = 'Chọn ngày thi đấu';
  else if (d.raceDate <= todayIso) errors.raceDate = 'Ngày thi đấu phải sau hôm nay';
  if (!d.registrationDeadline) errors.registrationDeadline = 'Chọn hạn đăng ký';
  else if (d.registrationDeadline < todayIso) errors.registrationDeadline = 'Hạn đăng ký không ở quá khứ';
  else if (d.raceDate && d.registrationDeadline >= d.raceDate) errors.registrationDeadline = 'Hạn đăng ký phải trước ngày thi đấu';
  if (!(d.distanceM >= 200 && d.distanceM <= 5000)) errors.distanceM = 'Cự ly 200–5000 m';
  if (!(d.entryFee >= 0)) errors.entryFee = 'Lệ phí không âm';
  if (!(Number.isInteger(d.slots) && d.slots >= 1 && d.slots <= 50)) errors.slots = 'Số suất 1–50';
  if (d.minAgeYears != null && d.maxAgeYears != null && d.minAgeYears > d.maxAgeYears) errors.maxAgeYears = 'Tuổi tối đa phải ≥ tối thiểu';
  if (d.minWeightKg != null && d.maxWeightKg != null && d.minWeightKg > d.maxWeightKg) errors.maxWeightKg = 'Cân nặng tối đa phải ≥ tối thiểu';
  const ranks = d.prizes.map((p) => p.rank);
  if (d.prizes.some((p) => !(p.rank >= 1) || !(p.amount >= 0)) || new Set(ranks).size !== ranks.length) errors.prizes = 'Hạng giải thưởng không trùng, tiền thưởng không âm';
  return errors;
};

export const restWindowConflict = (startIso: string, endIso: string, raceDates: string[]) =>
  raceDates.find((race) => {
    const from = toIsoDay(addDays(parseIso(race), -PRE_RACE_REST_DAYS));
    return startIso <= race && endIso >= from;
  }) ?? null;

export const isHighIntensity = (intensity: string) => ['Cao', 'HIGH'].includes(intensity);
