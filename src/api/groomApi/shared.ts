/* Internal helpers for the Groom API. A Groom only works on the zones assigned to them (grooms[].zones). */
import { DEMO_NOW, http } from '../http';
import type { Actor } from '../managerApi';
import type { GroomInfo } from './types';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
export const now = () => DEMO_NOW.short;
export const min = (v: string, n: number, what: string) => { if (v.trim().length < n) throw new Error(`${what} ít nhất ${n} ký tự.`); return v.trim(); };
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** The signed-in Groom with their zones. */
export const me = async (actor: Actor): Promise<GroomInfo> => {
  const grooms = await get<GroomInfo[]>('/grooms');
  const g = grooms.find((x) => x.id === actor.id) ?? grooms.find((x) => x.name === actor.name);
  if (!g) throw new Error('Tài khoản chưa được phân khu chăm sóc — liên hệ HLV trưởng.');
  return g;
};
