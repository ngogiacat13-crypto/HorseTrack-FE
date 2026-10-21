import { DEMO_NOW, http } from '../http';
import type { Actor } from '../managerApi';
import type { Horse, TrainingPlan, TrainingSession } from './types';
import { trainingBlock } from './labels';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};

export const NOT_MINE = 'Bạn không phụ trách ngựa này — HLV trưởng chỉ xem được ngựa mình được giao.';
export const trainerIdOf = (actor: Actor) => {
  if (!actor.id) throw new Error('Phiên đăng nhập không có mã người dùng — hãy đăng nhập lại.');
  return actor.id;
};
export const myHorses = (actor: Actor) => get<Horse[]>('/horses', { trainerId: trainerIdOf(actor) });
export const getMyHorse = async (horseId: string, actor: Actor) => {
  const horse = await get<Horse>(`/horses/${horseId}`);
  if (horse.trainerId !== trainerIdOf(actor)) throw new Error(NOT_MINE);
  return horse;
};
export const ofHorses = <T extends { horseId: string }>(rows: T[], horses: Horse[]) => {
  const ids = new Set(horses.map((h) => h.id));
  return rows.filter((r) => ids.has(r.horseId));
};
export const getHorseChecked = async (horseId: string, actor: Actor) => {
  const horse = await getMyHorse(horseId, actor);
  const block = trainingBlock(horse);
  if (block) throw new Error(`${horse.name}: ${block}`);
  return horse;
};

export const CURRENT_PLAN: TrainingPlan['status'][] = ['PLANNED', 'ACTIVE', 'PAUSED'];
const dayKey = (ddmmyyyy: string) => ddmmyyyy.split('/').reverse().join('');
export const withLiveStatus = async (plans: TrainingPlan[], sessions?: TrainingSession[]) => {
  const due = plans.filter((p) => p.status === 'PLANNED' && dayKey(p.startDate) <= dayKey(DEMO_NOW.date));
  if (!due.length) return plans;
  const all = sessions ?? (await get<TrainingSession[]>('/trainingSessions'));
  const started = new Set(due.filter((p) => all.some((s) => s.planId === p.id)).map((p) => p.id));
  await Promise.all([...started].map((id) => http.patch(`/trainingPlans/${id}`, { status: 'ACTIVE' })));
  return plans.map((p) => (started.has(p.id) ? { ...p, status: 'ACTIVE' as const } : p));
};
