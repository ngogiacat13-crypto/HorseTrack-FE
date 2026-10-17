/* Data shapes of the Groom module (match db.json). */
export type TaskType = 'FEED' | 'CLEAN' | 'GROOM' | 'COOL' | 'OTHER';

/** One daily care task. SLA = start time + 45 minutes (BR_05). */
export interface CareTask {
  id: string; date: string; groom: string; zone: string; type: TaskType; title: string;
  horseId: string | null; horse: string | null; stall: string | null;
  time: string; sla: string; status: 'TODO' | 'DONE'; doneAt: string | null; note: string; photo: string | null;
  instructions: string[]; diet?: string; medicalDiet?: boolean; warning?: string;
}

export interface GroomInfo { id: string; name: string; zones: string[] }
