/* Internal helpers. Ownership: a trainer only reads and acts on horses with horse.trainerId === actor.id. */
import { http } from '../http';
import type { Actor } from '../managerApi';
import type { Horse } from './types';
import { trainingBlock } from './labels';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};

/* Ownership: each horse has one HeadTrainer (horse.trainerId). A trainer only reads and acts on those horses. */
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
/** Keep only rows (plans, sessions, proposals…) that belong to the given horses. */
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
