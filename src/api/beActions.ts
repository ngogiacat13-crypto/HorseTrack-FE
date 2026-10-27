import { be, beData } from './beClient';
import { http } from './http';
import { invalidate } from './hybridAdapter';
import { expiryIso, iso, mapItem, mapPo, mapProtocol, mapReq, me } from './beDomain';
import { addAudit, type Actor } from './managerApi';
import type { ProtoPhase, Protocol } from './vetApi/types';
import type { MoveKind } from './warehouseApi/inventoryApi';
import type { Requisition, ShipmentOrder, StockCheck, StockItem } from './warehouseApi/types';


type Row = Record<string, unknown>;
const beId = (row: unknown) => {
  const r = row as { beId?: number; id?: string };
  return r.beId ?? Number(String(r.id ?? '').replace(/\D/g, ''));
};
const itemIds = async () => {
  const rows = (await http.get<Row[]>('/inventory')).data;
  return new Map(rows.map((r) => [String(r.id), beId(r)]));
};
const after = (...names: string[]) => invalidate(...names);

const toBePhases = async (phases: ProtoPhase[]) => {
  const ids = await itemIds();
  return phases.map((ph, i) => ({
    phaseNo: i + 1, phaseName: ph.name.trim(), startDate: iso(ph.startDate), durationDays: ph.days, goal: ph.goal?.trim() || undefined,
    items: ph.items.map((it) => {
      const id = ids.get(it.itemId) ?? Number(it.itemId.replace(/\D/g, ''));
      if (!id) throw new Error(`${it.name}: chưa có trong danh mục thuốc của hệ thống.`);
      return { itemId: id, quantity: it.qty };
    }),
  }));
};
const numOrUndef = (v?: string | null) => (v && /\d/.test(v) ? Number(v.replace(/\D/g, '')) : undefined);

export const vetProtocolBe = {
  async createProtocol(input: { horseId: string; caseId: string; diagnosis: string; requiredBy: string; phases: ProtoPhase[]; replaces?: string | null }, _send: boolean, actor: Actor) {
    if (input.diagnosis.trim().length < 5) throw new Error('Chẩn đoán ít nhất 5 ký tự.');
    if (!input.phases.some((ph) => ph.items.length)) throw new Error('Thêm ít nhất 1 thuốc/vật tư để gửi kiểm tồn.');
    const body = {
      horseId: Number(input.horseId), caseId: numOrUndef(input.caseId), diagnosis: input.diagnosis.trim(), requiredBy: iso(input.requiredBy),
      phases: await toBePhases(input.phases),
    };
    const p = input.replaces
      ? await beData<Parameters<typeof mapProtocol>[0]>(be.post(`/medical-management/protocols/${numOrUndef(input.replaces)}/new-version`, body))
      : await beData<Parameters<typeof mapProtocol>[0]>(be.post('/medical-management/protocols', body));
    after('protocols');
    await addAudit(actor, { action: 'CREATE_PROTOCOL', label: 'Lập phác đồ', object: `${p.protocolCode} · ${p.horseName}`, area: 'med', to: p.state, reason: body.diagnosis });
    return mapProtocol(p) as unknown as Protocol;
  },
  async addItemsDuringTreatment(p: Protocol, adds: { phaseNo: number; itemId: string; qty: number }[], reason: string, actor: Actor) {
    const why = reason.trim();
    if (why.length < 5) throw new Error('Lý do bổ sung thuốc ít nhất 5 ký tự.');
    const ids = await itemIds();
    let last: Parameters<typeof mapProtocol>[0] | null = null;
    for (const a of adds) {
      const itemId = ids.get(a.itemId) ?? Number(a.itemId.replace(/D/g, ''));
      last = await beData<Parameters<typeof mapProtocol>[0]>(be.post(`/medical-management/protocols/${beId(p)}/items`, { phaseNo: a.phaseNo, itemId, quantity: a.qty, reason: why }));
    }
    after('protocols', 'inventory', 'invoices');
    await addAudit(actor, { action: 'ADD_PROTOCOL_ITEMS', label: 'Bổ sung thuốc khi điều trị', object: `${p.id} · ${p.horse}`, area: 'med', to: `${adds.length} dòng`, reason: why });
    return (last ? mapProtocol(last) : p) as unknown as Protocol;
  },
  async sendStockCheck(p: Protocol) {
    return p;
  },
  async cancelDraft(p: Protocol, _actor: Actor, reason = '') {
    const why = reason.trim() || (p.state === 'DRAFT' ? 'Hủy bản nháp' : '');
    if (why.length < 10 && p.state !== 'DRAFT') throw new Error('Lý do hủy phác đồ ít nhất 10 ký tự.');
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/medical-management/protocols/${beId(p)}/cancel`, { content: why }));
    after('protocols');
    return mapProtocol(r) as unknown as Protocol;
  },
  async waitRestock(p: Protocol, note: string) {
    const eta = p.stock?.lines.filter((l) => l.short > 0).map((l) => l.eta).filter(Boolean).sort().pop();
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/medical-management/protocols/${beId(p)}/wait-restock`, { waitEta: iso(eta ?? undefined), note: note.trim() }));
    after('protocols');
    return mapProtocol(r) as unknown as Protocol;
  },
  async confirmProtocol(p: Protocol) {
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/medical-management/protocols/${beId(p)}/confirm`));
    after('protocols');
    return mapProtocol(r) as unknown as Protocol;
  },
  async addProgress(p: Protocol, text: string) {
    if (text.trim().length < 5) throw new Error('Ghi chú tiến triển ít nhất 5 ký tự.');
    const phaseNo = Number(text.match(/Hoàn thành giai đoạn (\d+)/)?.[1]);
    if (phaseNo > 0) {
      if (p.dispensedPhases != null && !p.dispensedPhases.includes(phaseNo)) throw new Error(`Chưa cấp thuốc giai đoạn ${phaseNo}. Kho phải cấp thuốc giai đoạn này trước khi hoàn thành.`);
      const phase = p.phases.find((ph) => ph.no === phaseNo);
      if (phase?.invoiceStatus && !p.emergency && ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'].includes(phase.invoiceStatus)) throw new Error(`Chủ ngựa chưa thanh toán chi phí giai đoạn ${phaseNo}. Chưa thể kết thúc giai đoạn.`);
    }
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.post(`/medical-management/protocols/${beId(p)}/progress-notes`, { content: text.trim() }));
    after('protocols');
    return mapProtocol(r) as unknown as Protocol;
  },
  async completeProtocol(p: Protocol, outcome: string) {
    if (outcome.trim().length < 10) throw new Error('Kết quả điều trị ít nhất 10 ký tự.');
    const done = new Set(p.progress.map((n) => Number(n.text.match(/Hoàn thành giai đoạn (\d+)/)?.[1])).filter((n) => n > 0));
    const missing = p.phases.find((ph) => !done.has(ph.no));
    if (missing) throw new Error(`Phải hoàn thành giai đoạn ${missing.no} (${missing.name}) trước khi kết thúc phác đồ.`);
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/medical-management/protocols/${beId(p)}/complete`, { content: outcome.trim() }));
    after('protocols');
    return mapProtocol(r) as unknown as Protocol;
  },
};

const MOVE: Record<MoveKind, string> = { RECEIVE: 'RECEIVE', ISSUE: 'ISSUE', ADJUST: 'ADJUST' };

export const warehouseBe = {
  async moveStock(item: StockItem, input: { kind: MoveKind; qty: number; lot: string; expiry: string; note: string }, actor: Actor) {
    if (!input.qty) throw new Error('Nhập số lượng.');
    if (input.note.trim().length < (input.kind === 'RECEIVE' ? 5 : 10)) throw new Error(input.kind === 'RECEIVE' ? 'Ghi chú nhập ít nhất 5 ký tự.' : 'Lý do ít nhất 10 ký tự.');
    const r = await beData<{ item: Parameters<typeof mapItem>[0]; lowStockWarning?: string | null }>(be.post('/inventory/stock-movements', {
      itemId: beId(item), movementType: MOVE[input.kind], quantity: input.qty, lotNo: input.lot.trim() || undefined,
      expiryDate: expiryIso(input.expiry.trim()), note: input.note.trim(),
    }));
    after('inventory', 'stockTx');
    await addAudit(actor, { action: `STOCK_${input.kind}`, label: 'Cập nhật tồn', object: `${item.id} · ${item.name}`, area: 'med', from: `${item.onHand} ${item.unit}`, to: `${r.item.currentStock} ${item.unit}`, reason: input.note.trim() });
    return mapItem(r.item) as unknown as StockItem;
  },
  async setSafety(item: StockItem, safety: number) {
    if (!Number.isInteger(safety) || safety < 0) throw new Error('Ngưỡng an toàn là số nguyên ≥ 0.');
    const r = await beData<Parameters<typeof mapItem>[0]>(be.put(`/inventory/items/${beId(item)}/safety-level`, { minSafetyStock: safety }));
    after('inventory');
    return mapItem(r) as unknown as StockItem;
  },

  async respondStock(p: Protocol, etaFor: Record<string, string | null>) {
    const [items, ships] = await Promise.all([http.get<StockItem[]>('/inventory'), http.get<ShipmentOrder[]>('/shipments')]);
    const need = new Map<string, number>();
    p.phases.forEach((ph) => ph.items.forEach((it) => {
      if (!Number.isInteger(it.qty) || it.qty < 1) throw new Error(`${it.name}: số lượng theo phác đồ phải là số nguyên ≥ 1.`);
      need.set(it.itemId, (need.get(it.itemId) ?? 0) + it.qty);
    }));
    const shortages = [...need].flatMap(([code, qty]) => {
      const it = items.data.find((i) => i.id === code);
      if (!it) throw new Error(`Không tìm thấy thuốc/vật tư ${code} trong danh mục kho.`);
      const avail = it ? Math.max(0, it.onHand - it.held) : 0;
      if (avail >= qty) return [];
      const etaId = etaFor[code] ?? Object.entries(etaFor).find(([key]) => key.endsWith(`:${code}`))?.[1] ?? null;
      const ship = etaId ? ships.data.find((s) => s.id === etaId) : undefined;
      return [{ itemId: beId(it), qtyNeeded: qty, qtyShort: qty - avail, eta: iso(ship?.eta), purchaseOrderId: ship ? beId(ship) : undefined }];
    });
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/inventory/protocols/${beId(p)}/stock-check`, { shortages, note: shortages.length ? 'Kho báo thiếu' : 'Kho đủ hàng, đã giữ' }));
    after('protocols', 'inventory', 'stockTx');
    return mapProtocol(r) as unknown as Protocol;
  },
  async reviewSupplements(p: Protocol) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ duyệt thuốc bổ sung khi phác đồ đang điều trị.');
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/inventory/protocols/${beId(p)}/supplements/review`));
    after('protocols', 'inventory', 'invoices');
    return mapProtocol(r) as unknown as Protocol;
  },
  async dispense(p: Protocol, input?: { phaseNos?: number[] }) {
    const phaseNos = input?.phaseNos?.filter((n) => Number.isInteger(n));
    if (p.state === 'ON_HOLD_PAYMENT') throw new Error('Phác đồ đang chờ thanh toán, chưa cấp thêm thuốc.');
    if (p.state !== 'READY_FOR_DISPENSING' && !(p.state === 'IN_TREATMENT' && !!phaseNos?.length)) throw new Error('Chỉ cấp phát phác đồ đã được bác sĩ xác nhận.');
    const r = await beData<Parameters<typeof mapProtocol>[0]>(be.put(`/inventory/protocols/${beId(p)}/dispense`, phaseNos?.length ? { phaseNos } : {}));
    after('protocols', 'inventory', 'stockTx');
    return mapProtocol(r) as unknown as Protocol;
  },

  async createShipment(input: { supplier: string; eta: string; lines: { itemId: string; qty: number }[]; forRef: string; requiredBy?: string }) {
    if (!input.lines.length) throw new Error('Thêm ít nhất 1 mặt hàng.');
    const [suppliers, ids] = await Promise.all([beData<{ supplierId: number; supplierName: string; isActive: boolean }[]>(be.get('/inventory/suppliers')), itemIds()]);
    const sup = suppliers.find((s) => s.supplierName.toLowerCase() === input.supplier.trim().toLowerCase()) ;
    if (!sup) throw new Error(suppliers.some((s) => s.isActive) ? `Không có nhà cung cấp "${input.supplier.trim()}" — chọn trong danh sách hoặc thêm ở mục Nhà cung cấp.` : 'Chưa có nhà cung cấp — thêm ở mục Nhà cung cấp trước.');
    if (!sup.isActive) throw new Error(`${sup.supplierName} đã ngừng hợp tác.`);
    const ref = input.forRef ?? '';
    const protocols = ref.startsWith('PD-') ? (await http.get<{ id: string; beId?: number }[]>('/protocols')).data : [];
    const protocolId = protocols.find((p) => p.id === ref)?.beId ?? (ref.startsWith('PD-') ? numOrUndef(ref) : undefined);
    const r = await beData<Parameters<typeof mapPo>[0]>(be.post('/inventory/purchase-orders', {
      supplierId: sup.supplierId, purpose: ref.startsWith('PD-') ? 'PROTOCOL' : ref.startsWith('RQ-') ? 'REQUISITION' : 'RESTOCK',
      protocolId, requisitionId: ref.startsWith('RQ-') ? numOrUndef(ref) : undefined,
      expectedDeliveryDate: iso(input.eta), requiredBy: iso(input.requiredBy), note: ref || undefined,
      lines: input.lines.map((l) => ({ itemId: ids.get(l.itemId) ?? numOrUndef(l.itemId), quantity: l.qty })),
    }));
    after('shipments', 'requisitions', 'protocols');
    return mapPo(r) as unknown as ShipmentOrder;
  },
  async markInTransit(s: ShipmentOrder) {
    const r = await beData<Parameters<typeof mapPo>[0]>(be.put(`/inventory/purchase-orders/${beId(s)}/in-transit`));
    after('shipments');
    return mapPo(r) as unknown as ShipmentOrder;
  },
  async updateEta(s: ShipmentOrder, eta: string, reason: string) {
    if (reason.trim().length < 5) throw new Error('Lý do đổi ngày ít nhất 5 ký tự.');
    const r = await beData<Parameters<typeof mapPo>[0] & { etaLaterThanRequired?: boolean }>(be.put(`/inventory/purchase-orders/${beId(s)}/eta`, { expectedDeliveryDate: iso(eta), note: reason.trim() }));
    after('shipments', 'protocols');
    const shipment = mapPo(r) as unknown as ShipmentOrder;
    return { shipment, warned: r.etaLaterThanRequired && shipment.forRef.startsWith('PD-') ? [shipment.forRef] : [] };
  },
  async cancelShipment(s: ShipmentOrder, reason: string) {
    if (reason.trim().length < 5) throw new Error('Lý do hủy ít nhất 5 ký tự.');
    const r = await beData<Parameters<typeof mapPo>[0]>(be.put(`/inventory/purchase-orders/${beId(s)}/cancel`, { reason: reason.trim() }));
    after('shipments', 'requisitions');
    return mapPo(r) as unknown as ShipmentOrder;
  },
  async receive(s: ShipmentOrder, input: { itemId: string; received: number; lot: string; expiry: string }[]) {
    const lines = input.map((l) => {
      const line = s.lines.find((x) => x.itemId === l.itemId) as unknown as { poLineId?: number } | undefined;
      return { poLineId: line?.poLineId, quantityReceived: l.received, lotNo: l.lot.trim() || undefined, expiryDate: expiryIso(l.expiry.trim()) };
    });
    const r = await beData<Parameters<typeof mapPo>[0]>(be.put(`/inventory/purchase-orders/${beId(s)}/receive`, { lines, note: 'Nhận hàng' }));
    after('shipments', 'inventory', 'stockTx', 'requisitions', 'protocols');
    const shipment = mapPo(r) as unknown as ShipmentOrder;
    return { shipment, notified: shipment.forRef.startsWith('RQ-') ? [shipment.forRef] : [] };
  },

  async issue(r: Requisition, input: { qty: number; to: string }) {
    const x = await beData<Parameters<typeof mapReq>[0]>(be.put(`/inventory/supply-requests/${beId(r)}/issue`, { issuedQuantity: input.qty, note: `Giao cho ${input.to.trim()}` }));
    after('requisitions', 'inventory', 'stockTx');
    return mapReq(x) as unknown as Requisition;
  },
  async waitRestock(r: Requisition) {
    const x = await beData<Parameters<typeof mapReq>[0]>(be.put(`/inventory/supply-requests/${beId(r)}/wait-restock`));
    after('requisitions');
    return mapReq(x) as unknown as Requisition;
  },
  async reject(r: Requisition, reason: string) {
    if (reason.trim().length < 10) throw new Error('Lý do từ chối ít nhất 10 ký tự.');
    const x = await beData<Parameters<typeof mapReq>[0]>(be.put(`/inventory/supply-requests/${beId(r)}/reject`, { reason: reason.trim() }));
    after('requisitions');
    return mapReq(x) as unknown as Requisition;
  },

  async submitCheck(input: { note: string; lines: { itemId: string; counted: number; reason: string }[] }) {
    if (!input.lines.length) throw new Error('Nhập số đếm cho ít nhất 1 mặt hàng.');
    const ids = await itemIds();
    const now = new Date();
    const body = {
      countMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, note: input.note.trim() || undefined,
      lines: input.lines.map((l) => ({ itemId: ids.get(l.itemId) ?? numOrUndef(l.itemId), countedQty: l.counted, reason: l.reason.trim() || undefined })),
    };
    const draft = await beData<{ countId: number }>(be.post('/inventory/stock-counts', body));
    await be.put(`/inventory/stock-counts/${draft.countId}/complete`);
    after('stockChecks', 'inventory', 'stockTx');
    const checks = (await http.get<(StockCheck & { beId?: number })[]>('/stockChecks')).data;
    return (checks.find((c) => c.beId === draft.countId) ?? checks[0]) as StockCheck;
  },
};

export const groomSupplyBe = {
  async cancelRequisition(r: Requisition, _actor: Actor) {
    await be.put(`/supply-requests/${(r as Requisition & { beId?: number }).beId}/cancel`);
    after('requisitions');
    return { ...r, status: 'CLOSED' as const };
  },

  async createRequisition(input: { itemId: string; qty: number; reason: string; neededBy: string }) {
    if (!Number.isInteger(input.qty) || input.qty < 1) throw new Error('Số lượng phải là số nguyên ≥ 1.');
    if (input.reason.trim().length < 10) throw new Error('Lý do ít nhất 10 ký tự.');
    const ids = await itemIds();
    const x = await beData<Parameters<typeof mapReq>[0]>(be.post('/supply-requests', {
      itemId: ids.get(input.itemId) ?? numOrUndef(input.itemId), quantity: input.qty, reason: input.reason.trim(), neededBy: iso(input.neededBy),
    }));
    after('requisitions');
    return mapReq(x) as unknown as Requisition;
  },
};

export const beRole = () => me()?.role;
