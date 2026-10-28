export type TaskType = 'FEED' | 'CLEAN' | 'GROOM' | 'COOL' | 'OTHER';

export interface CareTask {
  id: string; date: string; groom: string; zone: string; type: TaskType; title: string;
  horseId: string | null; horse: string | null; stall: string | null;
  time: string; sla: string; status: 'TODO' | 'DONE'; doneAt: string | null; note: string; photo: string | null;
  instructions: string[]; diet?: string; medicalDiet?: boolean; warning?: string; lateMinutes?: number;
}

export interface GroomInfo { id: string; name: string; zones: string[] }
