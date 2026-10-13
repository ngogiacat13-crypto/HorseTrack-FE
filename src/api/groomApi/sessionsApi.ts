import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import type { Horse, TrainingPlan, TrainingSession } from '../trainerApi';
import { get, me, toMin } from './shared';

const isTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

/* 3.1–3.4 — the Groom runs the session the trainer assigned: start, enter readings, auto-pause over the threshold (BR_02). */
export const sessionsApi = {
  async getMySessions(actor: Actor) {
    const g = await me(actor);
    const sessions = await get<TrainingSession[]>('/trainingSessions');
    const key = (s: TrainingSession) => s.date.split('/').reverse().join('') + s.time;
    return { groom: g, sessions: sessions.filter((s) => s.groom === g.name).sort((a, b) => key(b).localeCompare(key(a))) };
  },

  async getSession(id: string, actor: Actor) {
    const g = await me(actor);
    const s = await get<TrainingSession>(`/trainingSessions/${id}`);
    if (s.groom !== g.name) throw new Error('Phiên tập này không được giao cho bạn.');
    const [horse, plan] = await Promise.all([get<Horse>(`/horses/${s.horseId}`), get<TrainingPlan>(`/trainingPlans/${s.planId}`)]);
    return { session: s, horse, plan };
  },

  /** 3.1 — only a scheduled session of today, and only when the horse is not under a vet lock (BR_01). */
  async start(s: TrainingSession, actor: Actor) {
    if (s.status !== 'SCHEDULED') throw new Error('Phiên không ở trạng thái chờ bắt đầu.');
    if (s.date !== DEMO_NOW.date) throw new Error(`Phiên được lịch ngày ${s.date} — chỉ bắt đầu đúng ngày.`);
    const horse = await get<Horse>(`/horses/${s.horseId}`);
    if (horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện bởi BS ${horse.lock?.by} — không được bắt đầu (BR_01).`);
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { status: 'IN_PROGRESS', startedAt: DEMO_NOW.time });
    await addAudit(actor, { action: 'START_SESSION', label: 'Bắt đầu phiên tập', object: `${s.id} · ${s.horseName}`, area: 'train', from: 'SCHEDULED', to: 'IN_PROGRESS' });
    return data;
  },

  /** 3.2 / 3.3 — a reading over the threshold pauses the session and alerts the trainer; the Groom cannot skip it. */
  async addReading(s: TrainingSession, input: { t: string; hr: number; speed: number }, actor: Actor) {
    if (s.status !== 'IN_PROGRESS' && s.status !== 'RESUMED') throw new Error('Chỉ nhập chỉ số khi phiên đang diễn ra.');
    if (!isTime(input.t)) throw new Error('Thời điểm đo theo dạng HH:mm.');
    if (!Number.isInteger(input.hr) || input.hr < 20 || input.hr > 260) throw new Error('Nhịp tim phải là số nguyên 20–260 bpm.');
    if (!(input.speed >= 0 && input.speed <= 80)) throw new Error('Tốc độ phải trong khoảng 0–80 km/h.');
    const last = s.readings[s.readings.length - 1];
    if (last && toMin(input.t) < toMin(last.t)) throw new Error(`Thời điểm đo phải sau lần đo trước (${last.t}).`);
    const readings = [...s.readings, { t: input.t, hr: input.hr, speed: input.speed }];
    const overHr = input.hr > s.thresholds.hr;
    const overSpeed = input.speed > s.thresholds.speed;
    if (!overHr && !overSpeed) {
      const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { readings });
      return { session: data, paused: false };
    }
    const reason = [overHr && `Nhịp tim ${input.hr} bpm vượt ngưỡng ${s.thresholds.hr}`, overSpeed && `tốc độ ${input.speed} km/h vượt ngưỡng ${s.thresholds.speed}`].filter(Boolean).join('; ') + ' (BR_02).';
    const plan = await get<TrainingPlan>(`/trainingPlans/${s.planId}`);
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, {
      readings, status: 'PAUSED_PENDING_TRAINER', pausedAt: input.t, pausedReason: reason.charAt(0).toUpperCase() + reason.slice(1), recovery: [],
      alerts: [{ to: plan.createdBy, role: 'HLV trưởng', channel: 'alert chặn', at: input.t, seen: false }, { to: s.groom, role: 'Mã phu', channel: 'banner', at: input.t, seen: true }],
    });
    await addAudit(actor, { action: 'SESSION_AUTO_PAUSED', label: 'Phiên tự tạm dừng (vượt ngưỡng)', object: `${s.id} · ${s.horseName}`, area: 'train', from: s.status, to: 'PAUSED_PENDING_TRAINER', reason });
    return { session: data, paused: true };
  },

  /** While paused: recovery heart rate, which the trainer needs before allowing to continue (BR_02). */
  async addRecovery(s: TrainingSession, input: { t: string; hr: number }, actor: Actor) {
    if (s.status !== 'PAUSED_PENDING_TRAINER') throw new Error('Chỉ đo hồi phục khi phiên đang tạm dừng.');
    if (!isTime(input.t)) throw new Error('Thời điểm đo theo dạng HH:mm.');
    if (!Number.isInteger(input.hr) || input.hr < 20 || input.hr > 260) throw new Error('Nhịp tim phải là số nguyên 20–260 bpm.');
    const recovery = [...(s.recovery ?? []), { t: input.t, hr: input.hr, speed: 0 }];
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { recovery });
    await addAudit(actor, { action: 'RECOVERY_READING', label: 'Đo nhịp tim hồi phục', object: `${s.id} · ${s.horseName}`, area: 'train', to: `${input.hr} bpm lúc ${input.t}` });
    return data;
  },

  async complete(s: TrainingSession, actor: Actor) {
    if (s.status !== 'IN_PROGRESS' && s.status !== 'RESUMED') throw new Error('Phiên không ở trạng thái đang diễn ra.');
    if (!s.readings.length) throw new Error('Nhập ít nhất 1 lần đo trước khi kết thúc phiên.');
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { status: 'COMPLETED', completedAt: DEMO_NOW.time });
    await addAudit(actor, { action: 'COMPLETE_SESSION', label: 'Hoàn thành phiên tập', object: `${s.id} · ${s.horseName}`, area: 'train', from: s.status, to: 'COMPLETED', reason: `${s.readings.length} lần đo` });
    return data;
  },
};
