import { addAudit, type Actor } from '../managerApi';
import type { Horse } from '../trainerApi';
import { isOpenProtocol, type Protocol, type StockLine } from '../vetApi';
import { goTo, saveProtocol } from '../vetApi/shared';
import { available, nearestLot, OPEN_SHIPMENT } from './labels';
import { get, moveStock, now, posInt } from './shared';
import type { ShipmentOrder, StockItem } from './types';

const CHANGED_STATES: Protocol['state'][] = ['SUPERSEDED', 'CANCELLED'];
const sentToWarehouse = (p: Protocol) => p.path.length <= 1 || p.path.includes('WAITING_STOCK_CHECK');
export const WAREHOUSE_STATES: Protocol['state'][] = ['WAITING_STOCK_CHECK', 'STOCK_SHORTAGE', 'STOCK_AVAILABLE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW', 'READY_FOR_DISPENSING', 'IN_TREATMENT', 'ON_HOLD_PAYMENT', 'COMPLETED'];

export const needs = (p: Protocol, phaseNos?: number[]) => {
  const selected = phaseNos ? new Set(phaseNos) : null;
  const m = new Map<string, { itemId: string; phaseNo: number; name: string; unit: string; need: number }>();
  p.phases.filter((ph) => !selected || selected.has(ph.no)).forEach((ph) => ph.items.forEach((it) => {
    const key = `${ph.no}:${it.itemId}`;
    const cur = m.get(key) ?? { itemId: it.itemId, phaseNo: ph.no, name: it.name, unit: it.unit, need: 0 };
    cur.need += it.qty;
    m.set(key, cur);
  }));
  return [...m.values()];
};

export const previewStock = (p: Protocol, items: StockItem[], phaseNos?: number[]) => needs(p, phaseNos).map((n) => {
  const it = items.find((i) => i.id === n.itemId);
  const avail = it ? available(it) : 0;
  const held = Math.min(n.need, avail);
  const lot = it ? nearestLot(it) : undefined;
  return { ...n, available: avail, held, short: n.need - held, lot: lot?.lot ?? null, expiry: lot?.expiry ?? null };
});

export const medicalApi = {
  async getRequests() {
    const [protocols, items, shipments] = await Promise.all([get<Protocol[]>('/protocols'), get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    return { protocols: protocols.filter((p) => WAREHOUSE_STATES.includes(p.state) || (CHANGED_STATES.includes(p.state) && sentToWarehouse(p))), items, shipments };
  },

  async getRequest(id: string) {
    const p = await get<Protocol>(`/protocols/${id}`);
    const [horse, items, shipments, previous] = await Promise.all([
      get<Horse>(`/horses/${p.horseId}`), get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments'),
      p.replaces ? get<Protocol>(`/protocols/${p.replaces}`).catch(() => null) : Promise.resolve(null),
    ]);
    return { protocol: p, horse, items, shipments, previous, openShipments: shipments.filter((s) => OPEN_SHIPMENT.includes(s.status)) };
  },

  async respondStock(p: Protocol, etaFor: Record<string, string | null>, actor: Actor, phaseNos?: number[]) {
    if (p.state !== 'WAITING_STOCK_CHECK') throw new Error('Phác đồ này không còn chờ kho kiểm tồn.');
    const [items, shipments] = await Promise.all([get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    const selectedPhases = phaseNos?.length ? phaseNos : p.phases.map((ph) => ph.no);
    const preview = previewStock(p, items, selectedPhases);
    const lines: StockLine[] = preview.map((l) => {
      const etaId = etaFor[`${l.phaseNo}:${l.itemId}`] ?? etaFor[l.itemId];
      const ship = l.short > 0 && etaId ? shipments.find((s) => s.id === etaId) : undefined;
      return { itemId: l.itemId, phaseNo: l.phaseNo, name: l.name, unit: l.unit, need: l.need, available: l.available, held: l.held, short: l.short,
        eta: ship?.eta ?? null, lot: l.held > 0 ? l.lot : null, expiry: l.held > 0 ? l.expiry : null, ...(ship ? { shipment: ship.id } : {}) };
    });
    for (const l of lines.filter((x) => x.held > 0)) {
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      await moveStock(it, 'HOLD', l.held, { ref: p.id, note: l.short ? `Giữ phần có sẵn, thiếu ${l.short} ${l.unit}` : `Giữ cho phác đồ ${p.id}` }, actor);
    }
    const short = lines.filter((l) => l.short > 0);
    const approvedPhases = [...new Set([...(p.approvedPhases ?? []), ...selectedPhases.filter((no) => lines.filter((l) => l.phaseNo === no).every((l) => l.short === 0))])];
    const state = short.length ? 'STOCK_SHORTAGE' : 'STOCK_AVAILABLE';
    const text = short.length
      ? `báo thiếu ${short.map((l) => `${l.name} ${l.short} ${l.unit}${l.eta ? ` · ETA ${l.eta.slice(0, 5)}` : ' · ETA chưa xác định'}`).join('; ')}`
      : 'xác nhận đủ hàng, đã giữ số lượng cần thiết';
    const merged = [...(p.stock?.lines ?? []).filter((old) => !selectedPhases.includes(old.phaseNo ?? 0)), ...lines];
    const data = await saveProtocol(p, { ...goTo(p, state), stock: { at: now(), by: actor.name, lines: merged }, approvedPhases,
      note: short.length ? `Kho báo thiếu thuốc cho giai đoạn ${selectedPhases.join(', ')}.` : `Đã duyệt ${approvedPhases.length}/${p.phases.length} giai đoạn.` },
    { tone: short.length ? 'warning' : 'success', who: actor.name, text, at: now() });
    await addAudit(actor, { action: 'STOCK_CHECK_RESPONSE', label: 'Phản hồi kiểm tồn', object: `${p.id} · ${p.horse}`, area: 'med', from: 'WAITING_STOCK_CHECK', to: state, reason: text });
    return data;
  },

  async dispense(p: Protocol, input: { phaseNos?: number[]; lines: { itemId: string; phaseNo?: number; qty: number; lot: string }[]; receiver: string }, actor: Actor) {
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
      const heldLine = p.stock?.lines.find((s) => s.itemId === l.itemId && s.phaseNo === l.phaseNo)?.held ?? p.stock?.lines.find((s) => s.itemId === l.itemId)?.held ?? 0;
      if (qty > heldLine + available(it)) throw new Error(`${it.name}: chỉ còn ${heldLine + available(it)} ${it.unit} để cấp.`);
      await moveStock(it, 'ISSUE', qty, { ref: p.id, lot: l.lot || undefined, fromHeld: Math.min(heldLine, qty), note: `Cấp cho ${receiver} theo phác đồ ${p.horse}` }, actor);
      out.push(`${it.name} ${qty} ${it.unit}`);
    }
    const dispensedPhases = [...new Set([...(p.dispensedPhases ?? []), ...(input.phaseNos ?? [])])];
    const allDone = p.phases.every((ph) => dispensedPhases.includes(ph.no));
    const hasPending = p.phases.some((ph) => !dispensedPhases.includes(ph.no) && !(p.approvedPhases ?? []).includes(ph.no));
    const nextState = allDone ? 'IN_TREATMENT' : hasPending ? 'WAITING_STOCK_CHECK' : 'READY_FOR_DISPENSING';
    const data = await saveProtocol(p, { ...goTo(p, nextState), dispensedPhases, note: allDone ? `Đã cấp phát cho ${receiver} — đang điều trị.` : `Đã cấp phát ${input.phaseNos?.length ?? 0} giai đoạn.` },
      { tone: 'success', who: actor.name, text: `cấp phát ${out.join(', ')} cho ${receiver}`, at: now() });
    await addAudit(actor, { action: 'DISPENSE_PROTOCOL', label: 'Cấp phát theo phác đồ', object: `${p.id} · ${p.horse}`, area: 'med', from: 'READY_FOR_DISPENSING', to: 'IN_TREATMENT', reason: `${out.join(', ')} · người nhận ${receiver}` });
    return data;
  },
};
