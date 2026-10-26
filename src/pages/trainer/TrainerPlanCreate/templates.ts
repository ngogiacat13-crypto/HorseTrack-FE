import type { Intensity, PlanPhase } from '../../../api/trainerApi';

export const TYPES = ['Sức bền', 'Tốc độ', 'Phục hồi', 'Kỹ thuật'] as const;
export type PlanType = (typeof TYPES)[number];
export const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];
export type PhaseDraft = Omit<PlanPhase, 'no'>;

export const TEMPLATES: Record<PlanType, PhaseDraft[]> = {
  'Sức bền': [{ name: 'Nền thể lực', weeks: 2, intensity: 'Nhẹ', distanceM: 1200, sessionsPerWeek: 4, hrLimit: 160 }],
  'Tốc độ': [{ name: 'Khởi động tốc độ', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 175 }],
  'Phục hồi': [{ name: 'Hồi phục nhẹ', weeks: 2, intensity: 'Nhẹ', distanceM: 600, sessionsPerWeek: 3, hrLimit: 150 }],
  'Kỹ thuật': [{ name: 'Xuất phát & vào cua', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 170 }],
};

export const validPhase = (p: PhaseDraft) =>
  !!p.name.trim() && p.weeks >= 1 && p.weeks <= 12 && p.distanceM >= 200 && p.distanceM <= 4000 && p.sessionsPerWeek >= 1 && p.sessionsPerWeek <= 7 && p.hrLimit >= 120 && p.hrLimit <= 200;
