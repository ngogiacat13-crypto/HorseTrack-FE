import { DEMO_NOW } from '../../../api/http';
import { isFutureDay, type CareTask } from '../../../api/groomApi';

export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export type TaskState = 'late' | 'soon' | 'todo' | 'done' | 'upcoming';
const dayKey = (ddmmyyyy: string) => ddmmyyyy.split('/').reverse().join('');
export const taskState = (t: CareTask): TaskState => {
  if (t.status === 'DONE') return 'done';
  if (isFutureDay(t.date)) return 'upcoming';
  if (dayKey(t.date) < dayKey(DEMO_NOW.date)) return 'late';
  const left = toMin(t.sla) - toMin(DEMO_NOW.time);
  return left < 0 ? 'late' : left <= 30 ? 'soon' : 'todo';
};
