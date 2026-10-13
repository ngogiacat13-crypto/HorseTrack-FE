import { addAudit, type Actor } from '../managerApi';
import type { Horse } from '../trainerApi';
import { isOpenProtocol, type Protocol, type StockLine } from '../vetApi';
import { goTo, saveProtocol } from '../vetApi/shared';
import { available, nearestLot, OPEN_SHIPMENT } from './labels';
import { get, moveStock, now, posInt } from './shared';
import type { ShipmentOrder, StockItem } from './types';

/** States in which a protocol concerns the warehouse. */
export const WAREHOUSE_STATES: Protocol['state'][] = ['WAITING_STOCK_CHECK', 'STOCK_SHORTAGE', 'STOCK_AVAILABLE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW', 'READY_FOR_DISPENSING', 'IN_TREATMENT'];

/** Total need per item over all phases of a protocol. */
export const needs = (p: Protocol) => {
  const m = new Map<string, { itemId: string; name: string; unit: string; need: number }>();
  p.phases.forEach((ph) => ph.items.forEach((it) => {
    const cur = m.get(it.itemId) ?? { itemId: it.itemId, name: it.name, unit: it.unit, need: 0 };
    cur.need += it.qty;
    m.set(it.itemId, cur);
  }));
  return [...m.values()];
};

/** What the warehouse would answer right now: hold what is available (earliest lot), report the rest as short. */
export const previewStock = (p: Protocol, items: StockItem[]) => needs(p).map((n) => {
  const it = items.find((i) => i.id === n.itemId);
  const avail = it ? available(it) : 0;
  const held = Math.min(n.need, avail);
  const lot = it ? nearestLot(it) : undefined;
  return { ...n, available: avail, held, short: n.need - held, lot: lot?.lot ?? null, expiry: lot?.expiry ?? null };
});

/* 2.1–2.5 — protocol requests from the vet. The warehouse checks, holds and dispenses; it never changes the protocol (BR_07). */
export const medicalApi = {
  async getRequests() {
    const [protocols, items, shipments] = await Promise.all([get<Protocol[]>('/protocols'), get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    return { protocols: protocols.filter((p) => WAREHOUSE_STATES.includes(p.state)), items, shipments };
  },

  async getRequest(id: string) {
    const p = await get<Protocol>(`/protocols/${id}`);
    const [horse, items, shipments] = await Promise.all([get<Horse>(`/horses/${p.horseId}`), get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    return { protocol: p, horse, items, shipments, openShipments: shipments.filter((s) => OPEN_SHIPMENT.includes(s.status)) };
  },

  /** 2.2 / 2.3 — answer the stock check. Short lines carry the ETA of a linked shipment, or "chưa xác định" (null) — never a guess. */
  async respondStock(p: Protocol, etaFor: Record<string, string | null>, actor: Actor) {
    if (p.state !== 'WAITING_STOCK_CHECK') throw new Error('Phác đồ này không còn chờ kho kiểm tồn.');
    const [items, shipments] = await Promise.all([get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    const preview = previewStock(p, items);
    const lines: StockLine[] = preview.map((l) => {
      const ship = l.short > 0 && etaFor[l.itemId] ? shipments.find((s) => s.id === etaFor[l.itemId]) : undefined;
      return { itemId: l.itemId, name: l.name, unit: l.unit, need: l.need, available: l.available, held: l.held, short: l.short,
        eta: ship?.eta ?? null, lot: l.held > 0 ? l.lot : null, expiry: l.held > 0 ? l.expiry : null, ...(ship ? { shipment: ship.id } : {}) };
    });
    for (const l of lines.filter((x) => x.held > 0)) {
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      await moveStock(it, 'HOLD', l.held, { ref: p.id, note: l.short ? `Giữ phần có sẵn, thiếu ${l.short} ${l.unit}` : `Giữ cho phác đồ ${p.id}` }, actor);
    }
    const short = lines.filter((l) => l.short > 0);
    const state = short.length ? 'STOCK_SHORTAGE' : 'STOCK_AVAILABLE';
    const text = short.length
      ? `báo thiếu ${short.map((l) => `${l.name} ${l.short} ${l.unit}${l.eta ? ` · ETA ${l.eta.slice(0, 5)}` : ' · ETA chưa xác định'}`).join('; ')}`
      : 'xác nhận đủ hàng, đã giữ số lượng cần thiết';
    const data = await saveProtocol(p, { ...goTo(p, state), stock: { at: now(), by: actor.name, lines },
      note: short.length ? 'Kho báo thiếu vật tư — chờ bác sĩ quyết định đổi thuốc hoặc chờ hàng.' : 'Kho đủ hàng và đã giữ — chờ bác sĩ xác nhận.' },
    { tone: short.length ? 'warning' : 'success', who: actor.name, text, at: now() });
    await addAudit(actor, { action: 'STOCK_CHECK_RESPONSE', label: 'Phản hồi kiểm tồn', object: `${p.id} · ${p.horse}`, area: 'med', from: 'WAITING_STOCK_CHECK', to: state, reason: text });
    return data;
  },

  /** 2.4 — dispense only a protocol the vet has confirmed. Actual quantity, lot and receiver are recorded; on hand goes down now. */
  async dispense(p: Protocol, input: { lines: { itemId: string; qty: number; lot: string }[]; receiver: string }, actor: Actor) {
    if (p.state !== 'READY_FOR_DISPENSING') throw new Error('Chỉ cấp phát phác đồ đã được bác sĩ xác nhận (READY_FOR_DISPENSING).');
    if (!isOpenProtocol(p)) throw new Error('Phác đồ đã đóng hoặc bị thay thế — không cấp phát.');
    const receiver = input.receiver.trim();
    if (receiver.length < 3) throw new Error('Nhập người nhận.');
    const items = await get<StockItem[]>('/inventory');
    const out: string[] = [];
    for (const l of input.lines) {
      const it = items.find((i) => i.id === l.itemId);
      if (!it) continue;
      const qty = posInt(l.qty, `Số lượng ${it.name}`);
      const heldLine = p.stock?.lines.find((s) => s.itemId === l.itemId)?.held ?? 0;
      if (qty > heldLine + available(it)) throw new Error(`${it.name}: chỉ còn ${heldLine + available(it)} ${it.unit} để cấp.`);
      await moveStock(it, 'ISSUE', qty, { ref: p.id, lot: l.lot || undefined, fromHeld: Math.min(heldLine, qty), note: `Cấp cho ${receiver} theo phác đồ ${p.horse}` }, actor);
      out.push(`${it.name} ${qty} ${it.unit}`);
    }
    const data = await saveProtocol(p, { ...goTo(p, 'IN_TREATMENT'), note: `Đã cấp phát cho ${receiver} — đang điều trị.` },
      { tone: 'success', who: actor.name, text: `cấp phát ${out.join(', ')} cho ${receiver}`, at: now() });
    await addAudit(actor, { action: 'DISPENSE_PROTOCOL', label: 'Cấp phát theo phác đồ', object: `${p.id} · ${p.horse}`, area: 'med', from: 'READY_FOR_DISPENSING', to: 'IN_TREATMENT', reason: `${out.join(', ')} · người nhận ${receiver}` });
    return data;
  },
};
