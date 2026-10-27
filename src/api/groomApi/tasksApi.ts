import { DEMO_NOW, http } from '../http';
import { USE_BACKEND } from '../beClient';
import { addAudit, type Actor } from '../managerApi';
import type { Stall, TrainingSession } from '../trainerApi';
import type { FeedRequest, VetHorse } from '../vetApi';
import { get, me, min, nextId, now, toMin } from './shared';
import type { CareTask } from './types';

const SLA_MINUTES = 45;

export const lateBy = (t: CareTask) => Math.max(0, toMin(t.doneAt ?? DEMO_NOW.time) - toMin(t.sla));
const lateText = (m: number) => (m >= 60 ? `+${Math.floor(m / 60)} giờ ${m % 60 ? `${m % 60} phút` : ''}`.trim() : `+${m} phút`);

export const tasksApi = {
  async getToday(actor: Actor) {
    const g = await me(actor);
    const [tasks, horses, sessions] = await Promise.all([get<CareTask[]>('/tasks', { date: DEMO_NOW.date }), get<VetHorse[]>('/horses'), get<TrainingSession[]>('/trainingSessions')]);
    const mine = tasks.filter((t) => t.groom === g.name).sort((a, b) => a.time.localeCompare(b.time));
    const alerts = sessions.filter((s) => s.groom === g.name && s.date === DEMO_NOW.date && (s.status === 'PAUSED_PENDING_TRAINER' || s.status === 'STOPPED'));
    return { groom: g, tasks: mine, horses: horses.filter((h) => mine.some((t) => t.horseId === h.id)), alerts, slaMinutes: SLA_MINUTES };
  },

  async completeTask(t: CareTask, input: { note: string; photo: string | null }, actor: Actor) {
    if (t.status === 'DONE') throw new Error('Công việc đã hoàn thành.');
    const doneAt = DEMO_NOW.time;
    const late = Math.max(0, toMin(doneAt) - toMin(t.sla));
    const { data } = await http.patch<CareTask>(`/tasks/${t.id}`, { status: 'DONE', doneAt, note: input.note.trim(), photo: input.photo });
    if (t.type === 'CLEAN' && t.stall) {
      const stall = await get<Stall>(`/stalls/${t.stall}`);
      if (stall.groom === actor.name && stall.status !== 'MAINTENANCE') {
        await http.patch<Stall>(`/stalls/${t.stall}`, { status: 'CLEAN' });
        await addAudit(actor, {
          action: 'MARK_STALL_CLEAN',
          label: 'Cập nhật trạng thái chuồng',
          object: t.stall,
          area: 'train',
          from: stall.status,
          to: 'CLEAN',
          reason: `Hoàn thành công việc ${t.id}`,
        });
      }
    }
    if (late > 0 && !USE_BACKEND) {
      const dash = await get<{ lateTasks: { title: string; groom: string; due: string; late: string; doneAt?: string }[] }>('/dashboard');
      await http.patch('/dashboard', { lateTasks: [{ title: `${t.title} — ${t.horse ?? t.stall}`, groom: t.groom, due: t.time, late: lateText(late), doneAt }, ...dash.lateTasks] });
    }
    await addAudit(actor, { action: late ? 'TASK_DONE_LATE' : 'TASK_DONE', label: late ? 'Hoàn thành việc trễ SLA' : 'Hoàn thành công việc', object: `${t.id} · ${t.title} ${t.horse ?? ''}`, area: 'train', to: `xong ${doneAt}${late ? ` · trễ ${late} phút (BR_05)` : ''}`, reason: input.note.trim() || undefined });
    return { task: data, late };
  },

  async getStable(actor: Actor) {
    const g = await me(actor);
    const [stalls, horses, tasks, feeds] = await Promise.all([get<Stall[]>('/stalls'), get<VetHorse[]>('/horses'), get<CareTask[]>('/tasks', { date: DEMO_NOW.date }), get<FeedRequest[]>('/feedRequests')]);
    const assignedStalls = stalls.filter((s) => g.zones.includes(s.zone) && s.groom === g.name);
    const latestCleanByStall = new Map<string, CareTask>();
    tasks
      .filter((t) => t.groom === g.name && t.type === 'CLEAN' && t.stall)
      .forEach((t) => {
        const stallId = t.stall as string;
        const previous = latestCleanByStall.get(stallId);
        if (!previous || t.time.localeCompare(previous.time) > 0) latestCleanByStall.set(stallId, t);
      });
    const cleanedStalls = new Set(
      [...latestCleanByStall.entries()]
        .filter(([, t]) => t.status === 'DONE')
        .map(([stallId]) => stallId),
    );
    await Promise.all(
      assignedStalls
        .filter((s) => cleanedStalls.has(s.id) && s.status !== 'CLEAN' && s.status !== 'MAINTENANCE')
        .map((s) => http.patch<Stall>(`/stalls/${s.id}`, { status: 'CLEAN' })),
    );
    const syncedStalls = assignedStalls.map((s) => cleanedStalls.has(s.id) && s.status !== 'MAINTENANCE' ? { ...s, status: 'CLEAN' as const } : s);
    const assignedHorseIds = new Set(assignedStalls.map((s) => s.horseId).filter(Boolean));
    return { groom: g, stalls: syncedStalls, horses: horses.filter((h) => assignedHorseIds.has(h.id)), tasks: tasks.filter((t) => t.groom === g.name), feeds };
  },

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
