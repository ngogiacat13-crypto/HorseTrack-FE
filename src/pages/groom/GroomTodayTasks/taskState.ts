import { DEMO_NOW } from '../../../api/http';
import type { CareTask } from '../../../api/groomApi';

export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export type TaskState = 'late' | 'soon' | 'todo' | 'done';
/** late = past SLA and not done · soon = SLA within 30 min · done (late or on time). */
export const taskState = (t: CareTask): TaskState => {
  if (t.status === 'DONE') return 'done';
  const left = toMin(t.sla) - toMin(DEMO_NOW.time);
  return left < 0 ? 'late' : left <= 30 ? 'soon' : 'todo';
};
