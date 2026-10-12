import type { Intensity, PlanPhase } from '../../../api/trainerApi';

export const TYPES = ['Sức bền', 'Tốc độ', 'Phục hồi', 'Kỹ thuật'] as const;
export type PlanType = (typeof TYPES)[number];
export const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];
export type PhaseDraft = Omit<PlanPhase, 'no'>;

/* Phase templates the trainer can start from and then edit. */
export const TEMPLATES: Record<PlanType, PhaseDraft[]> = {
  'Sức bền': [
    { name: 'Nền thể lực', weeks: 2, intensity: 'Nhẹ', distanceM: 1200, sessionsPerWeek: 4, hrLimit: 160 },
    { name: 'Tăng sức bền', weeks: 3, intensity: 'Vừa', distanceM: 1600, sessionsPerWeek: 4, hrLimit: 180 },
    { name: 'Duy trì trước giải', weeks: 2, intensity: 'Cao', distanceM: 2000, sessionsPerWeek: 3, hrLimit: 185 },
  ],
  'Tốc độ': [
    { name: 'Khởi động tốc độ', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 175 },
    { name: 'Bứt tốc ngắn', weeks: 2, intensity: 'Cao', distanceM: 1000, sessionsPerWeek: 3, hrLimit: 185 },
  ],
  'Phục hồi': [
    { name: 'Hồi phục nhẹ', weeks: 2, intensity: 'Nhẹ', distanceM: 600, sessionsPerWeek: 3, hrLimit: 150 },
    { name: 'Trở lại nhịp', weeks: 2, intensity: 'Vừa', distanceM: 1000, sessionsPerWeek: 3, hrLimit: 165 },
  ],
  'Kỹ thuật': [{ name: 'Xuất phát & vào cua', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 170 }],
};

export const NEW_PHASE: PhaseDraft = { name: '', weeks: 2, intensity: 'Vừa', distanceM: 1200, sessionsPerWeek: 3, hrLimit: 175 };

/** Phase limits: 1–12 weeks, 200–4000 m, 1–7 sessions/week, 120–200 bpm. */
export const validPhase = (p: PhaseDraft) =>
  !!p.name.trim() && p.weeks >= 1 && p.weeks <= 12 && p.distanceM >= 200 && p.distanceM <= 4000 && p.sessionsPerWeek >= 1 && p.sessionsPerWeek <= 7 && p.hrLimit >= 120 && p.hrLimit <= 200;
