import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import type { Stall, TrainingSession } from '../trainerApi';
import type { FeedRequest, VetHorse } from '../vetApi';
import { get, me, min, nextId, now, toMin } from './shared';
import type { CareTask } from './types';

const SLA_MINUTES = 45; // BR_05

/** Minutes past the SLA (done late, or still open after the SLA); 0 when on time. */
export const lateBy = (t: CareTask) => Math.max(0, toMin(t.doneAt ?? DEMO_NOW.time) - toMin(t.sla));
const lateText = (m: number) => (m >= 60 ? `+${Math.floor(m / 60)} giờ ${m % 60 ? `${m % 60} phút` : ''}`.trim() : `+${m} phút`);

/* 1.1–1.4 daily tasks · 2.1–2.3 stable map, horse diet (read-only, BR_03) */
export const tasksApi = {
  async getToday(actor: Actor) {
    const g = await me(actor);
    const [tasks, horses, sessions] = await Promise.all([get<CareTask[]>('/tasks', { date: DEMO_NOW.date }), get<VetHorse[]>('/horses'), get<TrainingSession[]>('/trainingSessions')]);
    const mine = tasks.filter((t) => t.groom === g.name).sort((a, b) => a.time.localeCompare(b.time));
    // Sessions of this Groom that stopped or paused today — shown as a banner (2.4 / 3.3).
    const alerts = sessions.filter((s) => s.groom === g.name && s.date === DEMO_NOW.date && (s.status === 'PAUSED_PENDING_TRAINER' || s.status === 'STOPPED'));
    return { groom: g, tasks: mine, horses: horses.filter((h) => mine.some((t) => t.horseId === h.id)), alerts, slaMinutes: SLA_MINUTES };
  },

  /** 1.3 — done, with note and optional photo. A late task is reported to the Club Manager (BR_05). */
  async completeTask(t: CareTask, input: { note: string; photo: string | null }, actor: Actor) {
    if (t.status === 'DONE') throw new Error('Công việc đã hoàn thành.');
    const doneAt = DEMO_NOW.time;
    const late = Math.max(0, toMin(doneAt) - toMin(t.sla));
    if (late > 0) min(input.note, 5, 'Việc trễ SLA — ghi chú lý do');
    const { data } = await http.patch<CareTask>(`/tasks/${t.id}`, { status: 'DONE', doneAt, note: input.note.trim(), photo: input.photo });
    if (late > 0) {
      const dash = await get<{ lateTasks: { title: string; groom: string; due: string; late: string; doneAt?: string }[] }>('/dashboard');
      await http.patch('/dashboard', { lateTasks: [{ title: `${t.title} — ${t.horse ?? t.stall}`, groom: t.groom, due: t.time, late: lateText(late), doneAt }, ...dash.lateTasks] });
    }
    await addAudit(actor, { action: late ? 'TASK_DONE_LATE' : 'TASK_DONE', label: late ? 'Hoàn thành việc trễ SLA' : 'Hoàn thành công việc', object: `${t.id} · ${t.title} ${t.horse ?? ''}`, area: 'train', to: `xong ${doneAt}${late ? ` · trễ ${late} phút (BR_05)` : ''}`, reason: input.note.trim() || undefined });
    return { task: data, late };
  },

  /** 2.1–2.2 — stalls of the Groom's zones with the horse, today's tasks and the diet. */
  async getStable(actor: Actor) {
    const g = await me(actor);
    const [stalls, horses, tasks, feeds] = await Promise.all([get<Stall[]>('/stalls'), get<VetHorse[]>('/horses'), get<CareTask[]>('/tasks', { date: DEMO_NOW.date }), get<FeedRequest[]>('/feedRequests')]);
    return { groom: g, stalls: stalls.filter((s) => g.zones.includes(s.zone)), horses, tasks: tasks.filter((t) => t.groom === g.name), feeds };
  },

  /** 2.3 — the Groom never edits a vet diet (BR_03); they send a request to the vet instead. */
  async requestFeed(horse: VetHorse, input: { item: string; reason: string }, actor: Actor) {
    const item = min(input.item, 3, 'Thức ăn / phụ gia');
    const reason = min(input.reason, 10, 'Lý do');
    const all = await get<FeedRequest[]>('/feedRequests');
    const req: FeedRequest = { id: nextId(all.map((f) => f.id), 'FR-'), horseId: horse.id, horse: horse.name, item, reason, by: actor.name, at: now(), status: 'PENDING' };
    const { data } = await http.post<FeedRequest>('/feedRequests', req);
    await addAudit(actor, { action: 'REQUEST_SPECIAL_FEED', label: 'Đề nghị thức ăn đặc biệt', object: `${data.id} · ${horse.name}`, area: 'med', to: 'PENDING', reason: `${item} — ${reason}` });
    return data;
  },
};
