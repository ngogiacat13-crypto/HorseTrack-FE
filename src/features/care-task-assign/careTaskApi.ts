import { be, beData } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';

export interface ZoneGroom { id: number; name: string; zone: string | null }
export interface CareTaskDraft { groomId: string; taskType: string; title: string; date: string; time: string; instructions: string }
export type AssignedStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
export interface AssignedTask {
  taskId: number; taskCode?: string | null; taskType: string; title?: string | null; status: AssignedStatus; taskDate: string; scheduledTime?: string | null;
  instructions?: string | null; completedAt?: string | null; horseId?: number | null; horseName?: string | null; stallCode?: string | null; groomName?: string | null; overdue?: boolean | null;
}

export const TASK_TYPES: [string, string][] = [
  ['CLEAN', 'Dọn chuồng'], ['GROOM', 'Chải lông / tắm'], ['WALK', 'Dắt đi bộ'],
  ['COOL', 'Chườm / ngâm lạnh'], ['HOOF', 'Chăm sóc móng'], ['OTHER', 'Khác'],
];
export const TASK_LABEL: Record<string, string> = { ...Object.fromEntries(TASK_TYPES), FEED: 'Cho ăn', MEDICATION: 'Cho thuốc' };

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const emptyDraft = (): CareTaskDraft => ({ groomId: '', taskType: 'CLEAN', title: '', date: todayIso(), time: '', instructions: '' });

export const validateDraft = (d: CareTaskDraft) => {
  if (!d.groomId) return 'Chọn Mã phu thực hiện.';
  if (!TASK_TYPES.some(([k]) => k === d.taskType)) return 'Chọn loại công việc.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Chọn ngày thực hiện.';
  if (d.date < todayIso()) return 'Ngày thực hiện không được ở quá khứ.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return 'Chọn giờ thực hiện (HH:mm).';
  if (d.title.trim().length > 150) return 'Tiêu đề tối đa 150 ký tự.';
  return '';
};

export const careTaskApi = {
  async zoneGrooms(horseId: string): Promise<ZoneGroom[]> {
    const rows = await beData<{ userId: number; fullName: string; barnZone?: string | null }[]>(be.get(`/horses/${horseId}/grooms`));
    return rows.map((g) => ({ id: g.userId, name: g.fullName, zone: g.barnZone ?? null }));
  },

  assigned: (date: string, status?: string) =>
    beData<AssignedTask[]>(be.get('/care-tasks/assigned', { params: { date, status: status || undefined } })),

  async create(horseId: string, d: CareTaskDraft) {
    const problem = validateDraft(d);
    if (problem) throw new Error(problem);
    const typeLabel = TASK_TYPES.find(([k]) => k === d.taskType)?.[1] ?? d.taskType;
    await be.post('/care-tasks', {
      horseId: Number(horseId), groomId: Number(d.groomId), taskType: d.taskType, title: d.title.trim() || typeLabel,
      taskDate: d.date, scheduledTime: `${d.time}:00`, instructions: d.instructions.trim() || undefined,
    });
    invalidate('tasks');
  },
};
