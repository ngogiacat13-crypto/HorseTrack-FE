import { TRACK_TYPES, type Intensity, type PlanPhase, type TrackType, type TrainingPlan } from '../../../api/trainerApi';

export const TYPES = ['Sức bền', 'Tốc độ', 'Phục hồi', 'Kỹ thuật'] as const;
export type PlanType = (typeof TYPES)[number];
export const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];
export type PhaseDraft = Omit<PlanPhase, 'no' | 'trackType' | 'distanceM' | 'estimated'> & { trackType: TrackType | '' };

export const TEMPLATES: Record<PlanType, PhaseDraft[]> = {
  'Sức bền': [{ name: 'Nền thể lực', weeks: 2, intensity: 'Nhẹ', trackType: '', sessionsPerWeek: 4, hrLimit: 160 }],
  'Tốc độ': [{ name: 'Khởi động tốc độ', weeks: 2, intensity: 'Vừa', trackType: '', sessionsPerWeek: 3, hrLimit: 175 }],
  'Phục hồi': [{ name: 'Hồi phục nhẹ', weeks: 2, intensity: 'Nhẹ', trackType: '', sessionsPerWeek: 3, hrLimit: 150 }],
  'Kỹ thuật': [{ name: 'Xuất phát & vào cua', weeks: 2, intensity: 'Vừa', trackType: '', sessionsPerWeek: 3, hrLimit: 170 }],
};

export const validPhase = (p: PhaseDraft) =>
  !!p.name.trim() && p.weeks >= 1 && p.weeks <= 12 && TRACK_TYPES.includes(p.trackType as TrackType) && p.sessionsPerWeek >= 1 && p.sessionsPerWeek <= 7 && p.hrLimit >= 120 && p.hrLimit <= 200;

export const draftOf = (plan: TrainingPlan): PhaseDraft => {
  const ph = plan.phases[0];
  const known = ph && !ph.estimated;
  return {
    name: known ? ph.name : '', weeks: ph?.weeks || 1, intensity: known ? ph.intensity : 'Vừa', trackType: ph?.trackType ?? '',
    sessionsPerWeek: known ? ph.sessionsPerWeek : 3, hrLimit: ph?.hrLimit ?? 160,
  };
};
