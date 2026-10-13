import { http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import { dateKey, isDate, type Protocol } from '../vetApi';
import { goTo, saveProtocol } from '../vetApi/shared';
import { available, OPEN_SHIPMENT, tracksLots } from './labels';
import { get, min, moveStock, nextId, now, posInt } from './shared';
import type { HistoryLine, Requisition, ShipmentOrder, StockItem } from './types';

const summary = (lines: ShipmentOrder['lines']) => lines.map((l) => `${l.name} · ${l.qty} ${l.unit}`).join(', ');
const push = (s: ShipmentOrder, line: HistoryLine) => [line, ...s.history];
const late = (eta: string, requiredBy?: string) => !!requiredBy && dateKey(eta) > dateKey(requiredBy);

/** Protocols whose short lines wait for this shipment (or for these items with no ETA yet). */
const linkedProtocols = async (s: ShipmentOrder) => {
  const ps = await get<Protocol[]>('/protocols');
  const ids = new Set(s.lines.map((l) => l.itemId));
  return ps.filter((p) => ['STOCK_SHORTAGE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW'].includes(p.state) &&
    (p.id === s.forRef || (p.stock?.lines ?? []).some((l) => l.short > 0 && (l.shipment === s.id || (!l.shipment && ids.has(l.itemId))))));
};

/* 3.1–3.4 incoming shipments. Stock only goes up when goods are actually received. */
export const shipmentsApi = {
  async getShipments() {
    const [shipments, items, protocols, requisitions] = await Promise.all([
      get<ShipmentOrder[]>('/shipments'), get<StockItem[]>('/inventory'), get<Protocol[]>('/protocols'), get<Requisition[]>('/requisitions'),
    ]);
    // Open needs that a new order can be linked to (3.1).
    const needs = [
      ...protocols.filter((p) => ['STOCK_SHORTAGE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW'].includes(p.state))
        .flatMap((p) => (p.stock?.lines ?? []).filter((l) => l.short > 0 && !l.shipment).map((l) => ({ ref: p.id, label: `${p.id} · ${p.horse} · ${l.name} thiếu ${l.short} ${l.unit}`, itemId: l.itemId, qty: l.short, requiredBy: p.requiredBy }))),
      ...requisitions.filter((r) => (r.status === 'CHECKING_STOCK' || r.status === 'SUBMITTED') && !r.shipmentId)
        .map((r) => ({ ref: r.id, label: `${r.id} · ${r.by} · ${r.item} ${r.qty} ${r.unit}`, itemId: r.itemId, qty: r.qty, requiredBy: r.neededBy })),
    ];
    return { shipments: [...shipments].sort((a, b) => b.id.localeCompare(a.id)), items, needs };
  },

  /** 3.1 — new order. Linking a requisition moves it to WAITING_RESTOCK; linking a protocol gives its short lines a real ETA. */
  async createShipment(input: { supplier: string; eta: string; lines: { itemId: string; qty: number }[]; forRef: string; requiredBy?: string }, actor: Actor) {
    const supplier = min(input.supplier, 3, 'Nhà cung cấp');
    if (!isDate(input.eta)) throw new Error('Ngày dự kiến về theo dạng dd/mm/yyyy.');
    if (!input.lines.length) throw new Error('Thêm ít nhất 1 mặt hàng.');
    const [all, items] = await Promise.all([get<ShipmentOrder[]>('/shipments'), get<StockItem[]>('/inventory')]);
    const lines = input.lines.map((l) => {
      const it = items.find((i) => i.id === l.itemId);
      if (!it) throw new Error('Mặt hàng không có trong danh mục.');
      return { itemId: it.id, name: it.name, unit: it.unit, qty: posInt(l.qty, `Số lượng ${it.name}`), received: null, lot: null, expiry: null };
    });
    const forRef = input.forRef || 'bổ sung tồn';
    const s: ShipmentOrder = {
      id: nextId(all.map((x) => x.id), 'SHIP-'), supplier, orderedAt: now().slice(0, 5) + '/2026', status: 'ORDERED', eta: input.eta, forRef,
      requiredBy: input.requiredBy || undefined, item: summary(lines), lines,
      history: [{ at: now(), who: actor.name, text: `tạo đơn nhập${forRef !== 'bổ sung tồn' ? ` · liên kết ${forRef}` : ''}` }],
    };
    const { data } = await http.post<ShipmentOrder>('/shipments', s);

    if (forRef.startsWith('RQ-')) {
      const r = await get<Requisition>(`/requisitions/${forRef}`);
      await http.patch(`/requisitions/${r.id}`, { status: 'WAITING_RESTOCK', shipmentId: data.id, history: [{ at: now(), who: actor.name, text: `chờ đơn nhập ${data.id} (ETA ${data.eta.slice(0, 5)})`, tone: 'warning' }, ...r.history] });
    }
    if (forRef.startsWith('PD-')) {
      const p = await get<Protocol>(`/protocols/${forRef}`);
      if (p.stock) {
        const ids = new Set(lines.map((l) => l.itemId));
        const stockLines = p.stock.lines.map((l) => (l.short > 0 && ids.has(l.itemId) ? { ...l, eta: data.eta, shipment: data.id } : l));
        await saveProtocol(p, { stock: { ...p.stock, lines: stockLines } }, { who: actor.name, text: `đặt hàng ${data.id} · ETA ${data.eta.slice(0, 5)}`, at: now() });
      }
    }
    await addAudit(actor, { action: 'CREATE_SHIPMENT', label: 'Tạo đơn nhập hàng', object: `${data.id} · ${supplier}`, area: 'med', to: `ORDERED · ETA ${data.eta}`, reason: data.item });
    return data;
  },

  async markInTransit(s: ShipmentOrder, actor: Actor) {
    if (s.status !== 'ORDERED') throw new Error('Chỉ đơn “Đã đặt” mới chuyển sang “Đang giao”.');
    const { data } = await http.patch<ShipmentOrder>(`/shipments/${s.id}`, { status: 'IN_TRANSIT', history: push(s, { at: now(), who: actor.name, text: 'nhà cung cấp đã xuất hàng · đang giao', tone: 'info' }) });
    await addAudit(actor, { action: 'SHIPMENT_IN_TRANSIT', label: 'Cập nhật lô hàng', object: s.id, area: 'med', from: s.status, to: 'IN_TRANSIT' });
    return data;
  },

  /** 2.5 / 3.2 — new ETA. If it passes the date a protocol needs the medicine, the vet is warned to re-assess (DELAYED_MEDICINE). The warehouse never changes the medicine. */
  async updateEta(s: ShipmentOrder, eta: string, reason: string, actor: Actor) {
    if (!OPEN_SHIPMENT.includes(s.status)) throw new Error('Lô hàng đã đóng.');
    if (!isDate(eta)) throw new Error('ETA mới theo dạng dd/mm/yyyy.');
    const why = min(reason, 10, 'Lý do');
    const delayed = dateKey(eta) > dateKey(s.eta);
    const history = push(s, { at: now(), who: actor.name, text: `cập nhật ETA ${s.eta.slice(0, 5)} → ${eta.slice(0, 5)}: ${why}`, tone: delayed ? 'warning' : 'info' });
    const { data } = await http.patch<ShipmentOrder>(`/shipments/${s.id}`, { eta, etaOld: s.eta, status: delayed ? 'DELAYED' : s.status, history });

    const warned: string[] = [];
    for (const p of await linkedProtocols(s)) {
      if (!p.stock) continue;
      const ids = new Set(s.lines.map((l) => l.itemId));
      const lines = p.stock.lines.map((l) => (l.short > 0 && ids.has(l.itemId) ? { ...l, eta, shipment: s.id } : l));
      const isLate = late(eta, p.requiredBy);
      const toReview = isLate && p.state !== 'REQUIRES_VET_REVIEW';
      await saveProtocol(p, { stock: { ...p.stock, lines }, ...(toReview ? goTo(p, 'REQUIRES_VET_REVIEW') : {}), delayed: isLate || p.delayed, wait: p.wait ? { ...p.wait, eta } : p.wait },
        { tone: isLate ? 'danger' : 'warning', who: isLate ? 'Hệ thống' : actor.name, text: isLate ? `gắn DELAYED_MEDICINE · ETA ${eta.slice(0, 5)} sau mốc cần thuốc ${p.requiredBy.slice(0, 5)} · báo BS ${p.vet}` : `ETA mới ${eta.slice(0, 5)}`, at: now() });
      if (isLate) warned.push(p.id);
    }
    if (warned.length) await http.patch(`/shipments/${s.id}`, { history: [{ at: now(), who: 'Hệ thống', text: `gắn DELAYED_MEDICINE · báo bác sĩ (${warned.join(', ')})`, tone: 'danger' }, ...data.history] });
    await addAudit(actor, { action: 'UPDATE_SHIPMENT_ETA', label: 'Cập nhật ETA lô hàng', object: s.id, area: 'med', from: s.eta, to: eta, reason: why });
    return { shipment: data, warned };
  },

  async cancelShipment(s: ShipmentOrder, reason: string, actor: Actor) {
    if (!OPEN_SHIPMENT.includes(s.status)) throw new Error('Lô hàng đã đóng.');
    const why = min(reason, 10, 'Lý do hủy');
    const { data } = await http.patch<ShipmentOrder>(`/shipments/${s.id}`, { status: 'CANCELLED', cancelReason: why, history: push(s, { at: now(), who: actor.name, text: `hủy đơn: ${why}`, tone: 'danger' }) });
    await addAudit(actor, { action: 'CANCEL_SHIPMENT', label: 'Hủy đơn nhập', object: s.id, area: 'med', from: s.status, to: 'CANCELLED', reason: why });
    return data;
  },

  /**
   * 3.3 / 3.4 — receive what actually arrived (quantity, lot, expiry), then:
   *  - protocols waiting for it: hold what is now available; when nothing is short the vet must review again before dispensing;
   *  - requisitions waiting for it: ready to issue, the Groom is told to come.
   */
  async receive(s: ShipmentOrder, input: { itemId: string; received: number; lot: string; expiry: string }[], actor: Actor) {
    if (!OPEN_SHIPMENT.includes(s.status)) throw new Error('Lô hàng đã đóng.');
    let items = await get<StockItem[]>('/inventory');
    const lines = s.lines.map((l) => {
      const r = input.find((x) => x.itemId === l.itemId);
      const qty = r?.received ?? 0;
      if (!Number.isInteger(qty) || qty < 0) throw new Error(`${l.name}: số lượng nhận phải là số nguyên ≥ 0.`);
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      if (qty > 0 && tracksLots(it)) {
        if (!r?.lot.trim()) throw new Error(`${l.name}: nhập số lô.`);
        if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(r.expiry)) throw new Error(`${l.name}: hạn dùng theo dạng mm/yyyy.`);
      }
      return { ...l, received: qty, lot: r?.lot.trim() || null, expiry: r?.expiry.trim() || null };
    });
    if (lines.every((l) => !l.received)) throw new Error('Chưa nhập số lượng thực nhận.');
    for (const l of lines.filter((x) => x.received)) {
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      await moveStock(it, 'RECEIVE', l.received as number, { ref: s.id, lot: l.lot ?? undefined, expiry: l.expiry ?? undefined, note: `Nhận từ ${s.supplier}${l.received !== l.qty ? ` (đặt ${l.qty}, nhận ${l.received})` : ''}` }, actor);
    }
    const partial = lines.some((l) => (l.received ?? 0) < l.qty);
    const isLate = late(now().slice(0, 5) + '/2026', s.requiredBy);
    const history = push(s, { at: now(), who: actor.name, text: `nhận hàng: ${lines.map((l) => `${l.name} ${l.received}/${l.qty}`).join(', ')}${partial ? ' · thiếu so với đơn' : ''}`, tone: partial ? 'warning' : 'success' });
    const { data } = await http.patch<ShipmentOrder>(`/shipments/${s.id}`, { status: 'RECEIVED', receivedAt: now(), lines, history });

    // Protocols: hold the new stock for their short lines, then ask the vet to review (spec 2.2 step 7).
    const notified: string[] = [];
    items = await get<StockItem[]>('/inventory');
    for (const p of await linkedProtocols(s)) {
      if (!p.stock) continue;
      const stockLines = [];
      for (const l of p.stock.lines) {
        const it = items.find((i) => i.id === l.itemId);
        if (l.short > 0 && it && lines.some((x) => x.itemId === l.itemId)) {
          const add = Math.min(l.short, available(it));
          if (add > 0) {
            const upd = await moveStock(it, 'HOLD', add, { ref: p.id, note: `Giữ hàng mới về (${s.id}) cho phác đồ ${p.id}` }, actor);
            items = items.map((i) => (i.id === upd.id ? upd : i));
          }
          stockLines.push({ ...l, held: l.held + add, available: l.available + add, short: l.short - add, eta: l.short - add > 0 ? l.eta : null });
        } else stockLines.push(l);
      }
      const done = stockLines.every((l) => l.short === 0);
      await saveProtocol(p, { stock: { ...p.stock, lines: stockLines }, ...(done && p.state !== 'REQUIRES_VET_REVIEW' ? goTo(p, 'REQUIRES_VET_REVIEW') : {}),
        note: done ? `Hàng đã về (${s.id}) — bác sĩ rà soát lại tình trạng ngựa trước khi cấp phát.` : p.note },
      { who: actor.name, text: `hàng về ${s.id}${isLate ? ' (trễ so với mốc cần thuốc)' : ''} · báo BS ${p.vet} rà soát lại`, at: now() });
      notified.push(p.id);
    }
    // Requisitions waiting for this shipment.
    const reqs = (await get<Requisition[]>('/requisitions')).filter((r) => r.status === 'WAITING_RESTOCK' && (r.shipmentId === s.id || r.id === s.forRef));
    for (const r of reqs) {
      await http.patch(`/requisitions/${r.id}`, { status: 'APPROVED_FOR_ISSUE', history: [{ at: now(), who: actor.name, text: `hàng về (${s.id}) · báo ${r.by} đến nhận`, tone: 'success' }, ...r.history] });
      notified.push(r.id);
    }
    await addAudit(actor, { action: 'RECEIVE_SHIPMENT', label: 'Nhận hàng nhập kho', object: `${s.id} · ${s.supplier}`, area: 'med', from: s.status, to: 'RECEIVED', reason: lines.map((l) => `${l.name} ${l.received}`).join(', ') });
    return { shipment: data, notified };
  },
};
