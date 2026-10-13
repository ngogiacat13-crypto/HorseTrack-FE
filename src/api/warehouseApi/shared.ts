/* Internal helpers shared by the warehouse API files. Every stock movement goes through moveStock() so the log (4.4) never misses one. */
import { DEMO_NOW, http } from '../http';
import type { Actor } from '../managerApi';
import { byExpiry } from './labels';
import type { Lot, StockItem, StockTx, TxType } from './types';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
export const now = () => DEMO_NOW.short;
export const min = (v: string, n: number, what: string) => { if (v.trim().length < n) throw new Error(`${what} ít nhất ${n} ký tự.`); return v.trim(); };
export const posInt = (n: number, what: string) => { if (!Number.isInteger(n) || n < 1) throw new Error(`${what} phải là số nguyên ≥ 1.`); return n; };

/** Take qty from the lots, earliest expiry first (or from one chosen lot). Returns the new lots and the lots used. */
export const takeFromLots = (lots: Lot[] | undefined, qty: number, preferLot?: string) => {
  if (!lots) return { lots, used: [] as { lot: string; qty: number }[] };
  const next = lots.map((l) => ({ ...l }));
  const order = byExpiry(next).sort((a, b) => (a.lot === preferLot ? -1 : b.lot === preferLot ? 1 : 0));
  const used: { lot: string; qty: number }[] = [];
  let left = qty;
  for (const l of order) {
    if (left <= 0) break;
    const t = Math.min(l.qty, left);
    if (t > 0) { l.qty -= t; left -= t; used.push({ lot: l.lot, qty: t }); }
  }
  return { lots: next.filter((l) => l.qty > 0), used };
};

/**
 * Change on hand / held of one item and write the warehouse log.
 *  - RECEIVE: +onHand (new lot if given) · ISSUE: −onHand (FEFO) and −held when it was held · ADJUST: ±onHand
 *  - HOLD: +held · RELEASE: −held
 */
export const moveStock = async (item: StockItem, type: TxType, qty: number, info: { ref?: string; note: string; lot?: string; expiry?: string; fromHeld?: number }, actor: Actor) => {
  const patch: Partial<StockItem> = {};
  let lotUsed = info.lot;
  if (type === 'RECEIVE') {
    patch.onHand = item.onHand + qty;
    if (item.lots && info.lot) {
      const same = item.lots.find((l) => l.lot === info.lot);
      patch.lots = same ? item.lots.map((l) => (l.lot === info.lot ? { ...l, qty: l.qty + qty } : l)) : [...item.lots, { lot: info.lot, expiry: info.expiry ?? '—', qty }];
    }
  } else if (type === 'ISSUE' || type === 'ADJUST') {
    const delta = type === 'ISSUE' ? -Math.abs(qty) : qty;
    patch.onHand = item.onHand + delta;
    if (delta < 0) {
      const r = takeFromLots(item.lots, -delta, info.lot);
      if (r.lots) patch.lots = r.lots;
      lotUsed = r.used.map((u) => `${u.lot}×${u.qty}`).join(', ') || undefined;
    } else if (item.lots?.length) {
      const last = byExpiry(item.lots).pop() as Lot;
      patch.lots = item.lots.map((l) => (l.lot === last.lot ? { ...l, qty: l.qty + delta } : l));
    }
    if (type === 'ISSUE' && info.fromHeld) patch.held = Math.max(0, item.held - info.fromHeld);
  } else if (type === 'HOLD') {
    patch.held = item.held + qty;
  } else {
    patch.held = Math.max(0, item.held - qty);
  }
  if ((patch.onHand ?? item.onHand) < (patch.held ?? item.held)) throw new Error(`${item.name}: tồn thực tế không được thấp hơn lượng đang giữ (${patch.held ?? item.held} ${item.unit}).`);

  const { data } = await http.patch<StockItem>(`/inventory/${item.id}`, patch);
  const txs = await get<StockTx[]>('/stockTx');
  const signed = type === 'ISSUE' ? -Math.abs(qty) : qty;
  await http.post('/stockTx', {
    id: nextId(txs.map((t) => t.id), 'TX-'), at: now(), type, itemId: item.id, item: item.name, qty: signed,
    lot: lotUsed, ref: info.ref, by: actor.name, note: info.note, balance: data.onHand,
  } satisfies StockTx);
  return data;
};
