import { be, type ApiResponse } from './beClient';
import { PROTOCOL_LABEL } from './vetApi/labels';
import type { ProtocolState } from './managerApi';


type Row = Record<string, unknown>;
export interface Me { id: string; name: string; role: string }
export const me = (): Me | null => {
  try {
    const u = JSON.parse(localStorage.getItem('horsetrack_user') ?? 'null') as { userId: string; fullname: string; role: string } | null;
    return u ? { id: u.userId, name: u.fullname, role: u.role } : null;
  } catch {
    return null;
  }
};
export const beGet = async <T,>(url: string, params?: Record<string, unknown>) => (await be.get<ApiResponse<T>>(url, { params })).data.data;

export const dmy = (iso?: string | null) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
export const dmyhm = (iso?: string | null) => (iso ? `${dmy(iso)}${iso.length > 15 ? ' ' + iso.slice(11, 16) : ''}` : '—');
export const dmhm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}${iso.length > 15 ? ' ' + iso.slice(11, 16) : ''}` : '—');
export const iso = (ddmmyyyy?: string | null) => {
  if (!ddmmyyyy) return undefined;
  const [d, m, y] = ddmmyyyy.split('/');
  return y && m && d ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ddmmyyyy;
};
const mmYYYY = (isoDate?: string | null) => (isoDate ? `${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}` : '—');
export const expiryIso = (mmyyyy?: string) => (mmyyyy && /^\d{2}\/\d{4}$/.test(mmyyyy) ? `${mmyyyy.slice(3)}-${mmyyyy.slice(0, 2)}-28` : undefined);

const CATEGORY: Record<string, string> = {
  FEED: 'Thức ăn', SUPPLEMENT: 'Thức ăn bổ sung', MEDICINE: 'Thuốc', VACCINE: 'Vaccine', MEDICAL_SUPPLY: 'Vật tư y tế',
  STABLE_SUPPLY: 'Vật tư chuồng trại', EQUIPMENT: 'Dụng cụ', OTHER: 'Khác',
};

interface BeItem {
  itemId: number; itemCode: string; itemName: string; category: string; itemGroup?: string | null; brand?: string | null; unit: string; unitPrice: number;
  currentStock: number; heldStock: number; minSafetyStock: number; route?: string | null; isControlled?: boolean; requiresPrescription?: boolean;
  withdrawalHours?: number | null; doseReference?: string | null; note?: string | null; lots?: { lotNo: string; expiryDate: string; quantity: number }[] | null;
}
interface BeMedicine { itemId: number; itemCode: string; itemName: string; category: string; itemGroup?: string | null; unit: string; unitPrice: number; availableStock: number; route?: string | null; isControlled?: boolean; withdrawalHours?: number | null; doseReference?: string | null }

export const mapItem = (i: BeItem): Row => ({
  id: i.itemCode, beId: i.itemId, name: i.itemName, category: CATEGORY[i.category] ?? i.category, group: i.itemGroup || CATEGORY[i.category] || i.category,
  route: i.route ?? '—', brand: i.brand ?? undefined, unit: i.unit, unitPrice: Number(i.unitPrice) || 0,
  onHand: Number(i.currentStock) || 0, held: Number(i.heldStock) || 0, safety: Number(i.minSafetyStock) || 0, note: i.note ?? undefined,
  doseRef: i.doseReference ?? undefined, detectionHours: i.withdrawalHours ?? undefined, rx: !!i.requiresPrescription, controlled: !!i.isControlled,
  lots: i.lots ? i.lots.map((l) => ({ lot: l.lotNo, expiry: mmYYYY(l.expiryDate), qty: Number(l.quantity) || 0 })) : undefined,
});
export const mapMedicine = (m: BeMedicine): Row => ({
  id: m.itemCode, beId: m.itemId, name: m.itemName, category: CATEGORY[m.category] ?? m.category, group: m.itemGroup || CATEGORY[m.category] || m.category,
  route: m.route ?? '—', unit: m.unit, unitPrice: Number(m.unitPrice) || 0, onHand: Number(m.availableStock) || 0, held: 0, safety: 0,
  doseRef: m.doseReference ?? undefined, detectionHours: m.withdrawalHours ?? undefined, controlled: !!m.isControlled,
});

export const loadInventory = async (): Promise<Row[] | null> => {
  const role = me()?.role;
  if (role === 'WarehouseManager') return (await beGet<BeItem[]>('/inventory/items')).map(mapItem);
  if (role === 'Veterinarian' || role === 'ClubManager') return (await beGet<BeMedicine[]>('/medical-management/medications')).map(mapMedicine);
  if (role === 'Groom') return (await beGet<BeItem[]>('/supply-requests/items').catch(() => null))?.map(mapItem) ?? null;
  return null;
};

interface BeProtocol {
  protocolId: number; protocolCode: string; horseId: number; horseName: string; vetName?: string; caseId?: number | null; versionNo?: number;
  replacesProtocolCode?: string | null; replacedByProtocolCode?: string | null; diagnosis: string; state: string; requiredBy?: string | null;
  isDelayed?: boolean; trainingLocked?: boolean; waitEta?: string | null; waitNote?: string | null; note?: string | null; outcome?: string | null;
  createdAt?: string; totalCost?: number; emergency?: boolean | null; isEmergency?: boolean | null;
  awaitingPaymentPhaseNo?: number | null; awaitingPaymentPhaseName?: string | null; awaitingPaymentInvoiceCode?: string | null;
  phases?: { phaseNo: number; phaseName: string; startDate: string; durationDays: number; goal?: string | null; invoiceStatus?: string | null; items: { itemId: number; itemCode: string; itemName: string; unit: string; quantity: number; unitPrice: number; dosage?: string | null }[] }[] | null;
  stockAnswer?: { itemId: number; itemName: string; unit: string; qtyNeeded: number; qtyAvailable: number; qtyHeld: number; qtyShort: number; eta?: string | null; purchaseOrderId?: number | null; status?: string | null; checkedByName?: string; checkedAt?: string }[] | null;
  progressNotes?: { writtenByName: string; writtenAt: string; content: string }[] | null;
}
const CLOSED = ['COMPLETED', 'SUPERSEDED', 'CANCELLED'];

export const mapProtocol = (p: BeProtocol): Row => {
  const beState = p.state === 'VET_CONFIRMED' ? 'READY_FOR_DISPENSING' : p.state;
  const state = (PROTOCOL_LABEL[beState as ProtocolState] ? beState : 'WAITING_STOCK_CHECK') as ProtocolState;
  const phases = (p.phases ?? []).map((ph) => ({
    no: ph.phaseNo, name: ph.phaseName, startDate: dmy(ph.startDate), days: ph.durationDays, goal: ph.goal ?? '', invoiceStatus: ph.invoiceStatus ?? null,
    items: ph.items.map((it) => ({ itemId: it.itemCode, beItemId: it.itemId, name: it.itemName, unit: it.unit, unitPrice: Number(it.unitPrice) || 0, qty: Number(it.quantity) || 0, dosage: it.dosage ?? undefined })),
  }));
  const dispensedMarked = (p.progressNotes ?? []).flatMap((n) => {
    const m = n.content.match(/Đã cấp thuốc giai đoạn (\d+)/);
    return m ? [Number(m[1])] : [];
  });
  const codeOf = new Map(phases.flatMap((ph) => ph.items.map((it) => [it.beItemId, it.itemId] as const)));
  const answer = p.stockAnswer ?? [];
  const tone = state === 'STOCK_SHORTAGE' || state === 'REQUIRES_VET_REVIEW' ? 'danger' : CLOSED.includes(state) ? 'neutral' : state === 'IN_TREATMENT' || state === 'READY_FOR_DISPENSING' ? 'success' : 'info';
  return {
    id: p.protocolCode, beId: p.protocolId, version: p.versionNo ?? 1, replaces: p.replacesProtocolCode ?? null, supersededBy: p.replacedByProtocolCode ?? null,
    horseId: String(p.horseId), horse: p.horseName, caseId: p.caseId ? String(p.caseId) : '—', diagnosis: p.diagnosis, vet: p.vetName ?? '—',
    createdAt: dmy(p.createdAt), requiredBy: dmy(p.requiredBy), phases, state, path: [state],
    stock: answer.length ? {
      at: dmhm(answer[0].checkedAt), by: answer[0].checkedByName ?? 'Kho',
      lines: answer.map((a) => ({
        itemId: codeOf.get(a.itemId) ?? String(a.itemId), name: a.itemName, unit: a.unit, need: a.qtyNeeded, available: a.qtyAvailable, held: a.qtyHeld,
        short: a.qtyShort, eta: a.eta ? dmy(a.eta) : null, lot: null, expiry: null, shipment: a.purchaseOrderId ? `SHIP-${String(a.purchaseOrderId).padStart(4, '0')}` : undefined, issued: a.status === 'ISSUED',
      })),
    } : null,
    wait: p.waitEta ? { eta: dmy(p.waitEta), requiredBy: dmy(p.requiredBy), at: '—', note: p.waitNote ?? '' } : null,
    delayed: !!p.isDelayed, progress: (p.progressNotes ?? []).map((n) => ({ at: dmhm(n.writtenAt), by: n.writtenByName, text: n.content })),
    outcome: p.outcome ?? null, emergency: !!p.emergency || !!p.isEmergency,
    awaitingPaymentPhaseNo: p.awaitingPaymentPhaseNo ?? null,
    awaitingPaymentPhaseName: p.awaitingPaymentPhaseName ?? null,
    awaitingPaymentInvoiceCode: p.awaitingPaymentInvoiceCode ?? null,
    dispensedPhases: dispensedMarked.length ? [...new Set(dispensedMarked)] : answer.length > 0 && answer.every((a) => a.status === 'ISSUED') ? phases.map((ph) => ph.no) : [],
    label: PROTOCOL_LABEL[state][0], tone, cost: Number(p.totalCost) || 0, trainingLocked: !!p.trainingLocked,
    open: !CLOSED.includes(state), materials: answer.map((a) => ({ item: `${a.itemName} · ${a.qtyNeeded} ${a.unit}`, status: a.qtyShort > 0 ? `Thiếu ${a.qtyShort}` : 'Đủ', tone: a.qtyShort > 0 ? 'danger' : 'success' })),
    note: p.note ?? '', log: [],
  };
};

export const loadProtocols = async (): Promise<Row[] | null> => {
  const role = me()?.role;
  const base = role === 'WarehouseManager' ? '/inventory/protocols' : role === 'Veterinarian' || role === 'ClubManager' ? '/medical-management/protocols' : null;
  if (!base) return null;
  return (await beGet<BeProtocol[]>(base)).map(mapProtocol);
};

interface BePo {
  orderId: number; orderCode: string; supplierName: string; purpose: string; status: string; expectedDeliveryDate?: string | null; previousEta?: string | null;
  requiredBy?: string | null; orderedAt?: string; receivedAt?: string | null; createdByName?: string; note?: string | null; protocolId?: number | null; requisitionId?: number | null;
  lines: { poLineId: number; itemId: number; itemCode: string; itemName: string; unit: string; quantityOrdered: number; quantityReceived?: number | null; lotNo?: string | null; expiryDate?: string | null }[];
}
export const mapPo = (o: BePo): Row => {
  const forRef = o.protocolId ? `PD-${String(o.protocolId).padStart(4, '0')}` : o.requisitionId ? `RQ-${String(o.requisitionId).padStart(4, '0')}` : 'Bổ sung tồn';
  const lines = o.lines.map((l) => ({
    itemId: l.itemCode, beItemId: l.itemId, poLineId: l.poLineId, name: l.itemName, unit: l.unit, qty: Number(l.quantityOrdered) || 0,
    received: o.status === 'RECEIVED' ? Number(l.quantityReceived) || 0 : null, lot: l.lotNo ?? null, expiry: l.expiryDate ? mmYYYY(l.expiryDate) : null,
  }));
  const cancel = o.note?.split('Hủy đơn:')[1]?.trim();
  return {
    id: o.orderCode, beId: o.orderId, supplier: o.supplierName, orderedAt: dmy(o.orderedAt), status: o.status, eta: dmy(o.expectedDeliveryDate),
    etaOld: o.previousEta ? dmy(o.previousEta) : undefined, requiredBy: o.requiredBy ? dmy(o.requiredBy) : undefined, forRef,
    item: lines.map((l) => `${l.name} · ${l.qty} ${l.unit}`).join(', '), lines,
    history: [{ at: dmhm(o.orderedAt), who: o.createdByName ?? 'Kho', text: `tạo đơn nhập${o.note ? ` · ${o.note}` : ''}` }],
    receivedAt: o.receivedAt ? dmhm(o.receivedAt) : undefined, cancelReason: cancel,
  };
};
export const loadShipments = async (): Promise<Row[] | null> =>
  me()?.role === 'WarehouseManager' ? (await beGet<BePo[]>('/inventory/purchase-orders')).map(mapPo) : null;

interface BeReq {
  requisitionId: number; requisitionCode: string; requestedByName: string; barnZone: string; itemId: number; itemCode: string; itemName: string; unit: string;
  quantity: number; reason: string; requestedAt: string; neededBy?: string | null; status: string; rejectReason?: string | null; issuedQuantity?: number | null;
  issuedByName?: string | null; issuedAt?: string | null; purchaseOrderCodes?: string[] | null;
}
const REQ_STATUS: Record<string, string> = { CANCELLED: 'CLOSED' };
export const mapReq = (r: BeReq): Row => {
  const history: Row[] = [{ at: dmhm(r.requestedAt), who: r.requestedByName, text: 'gửi yêu cầu' }];
  if (r.status === 'WAITING_RESTOCK') history.unshift({ at: '—', who: 'Kho', text: `chờ hàng về${r.purchaseOrderCodes?.length ? ` (${r.purchaseOrderCodes.join(', ')})` : ''}`, tone: 'warning' });
  if (r.status === 'REJECTED') history.unshift({ at: '—', who: 'Kho', text: `từ chối: ${r.rejectReason ?? ''}`, tone: 'danger' });
  if (r.issuedAt) history.unshift({ at: dmhm(r.issuedAt), who: r.issuedByName ?? 'Kho', text: `cấp ${r.issuedQuantity} ${r.unit}`, tone: 'success' });
  if (r.status === 'CANCELLED') history.unshift({ at: '—', who: r.requestedByName, text: 'hủy yêu cầu' });
  if (r.status === 'CLOSED') history.unshift({ at: '—', who: r.requestedByName, text: 'xác nhận đã nhận vật tư', tone: 'success' });
  return {
    id: r.requisitionCode, beId: r.requisitionId, by: r.requestedByName, zone: r.barnZone, itemId: r.itemCode, beItemId: r.itemId, item: r.itemName, unit: r.unit,
    qty: Number(r.quantity) || 0, reason: r.reason, at: dmhm(r.requestedAt), neededBy: dmy(r.neededBy), status: REQ_STATUS[r.status] ?? r.status,
    rejectReason: r.rejectReason ?? undefined, shipmentId: r.purchaseOrderCodes?.[0],
    issued: r.issuedAt ? { qty: Number(r.issuedQuantity) || 0, to: r.requestedByName, at: dmhm(r.issuedAt), by: r.issuedByName ?? 'Kho' } : undefined,
    history,
  };
};
export const loadRequisitions = async (): Promise<Row[] | null> => {
  const role = me()?.role;
  if (role === 'WarehouseManager') return (await beGet<BeReq[]>('/inventory/supply-requests')).map(mapReq);
  if (role === 'Groom') return (await beGet<BeReq[]>('/supply-requests/my')).map(mapReq);
  return null;
};

interface BeCount { countId: number; countCode: string; countMonth: string; status: string; countedByName?: string; countedAt?: string; note?: string | null; lines?: { itemCode: string; itemName: string; unit: string; systemQty: number; countedQty: number; reason?: string | null }[] | null }
export const loadStockChecks = async (): Promise<Row[] | null> => {
  if (me()?.role !== 'WarehouseManager') return null;
  const list = await beGet<BeCount[]>('/inventory/stock-counts');
  return list.map((c) => ({
    id: c.countCode, beId: c.countId, month: `${c.countMonth.slice(5, 7)}/${c.countMonth.slice(0, 4)}`, at: dmyhm(c.countedAt), by: c.countedByName ?? '—',
    status: 'DONE', note: c.note ?? '',
    lines: (c.lines ?? []).map((l) => ({ itemId: l.itemCode, item: l.itemName, unit: l.unit, system: Number(l.systemQty) || 0, counted: Number(l.countedQty) || 0, reason: l.reason ?? '' })),
  }));
};

interface BeTx { transactionId?: number | null; txCode?: string | null; txType?: string | null; itemCode?: string | null; itemName?: string | null; lotNo?: string | null; quantity?: number | null; balanceAfter?: number | null; refType?: string | null; refId?: number | null; performedByName?: string | null; performedAt?: string | null; note?: string | null }
const REF: Record<string, string> = { PROTOCOL: 'PD-', PURCHASE_ORDER: 'SHIP-', REQUISITION: 'RQ-', STOCK_COUNT: 'KK#' };
const KNOWN_TX = new Set(['RECEIVE', 'ISSUE', 'ADJUST', 'HOLD', 'RELEASE', 'RETURN']);
export const loadStockTx = async (): Promise<Row[] | null> => {
  if (me()?.role !== 'WarehouseManager') return null;
  const page = (await be.get<ApiResponse<{ content?: BeTx[] | null }>>('/inventory/transactions', { params: { page: 0, size: 500 }, timeout: 60000 })).data.data;
  return (page?.content ?? []).map((t, i) => {
    const raw = t.txType ?? '';
    const type = raw === 'DISPOSE' ? 'ISSUE' : KNOWN_TX.has(raw) ? raw : raw || 'ADJUST';
    const qty = Number(t.quantity) || 0;
    return {
      id: t.txCode || (t.transactionId != null ? `TX-${t.transactionId}` : `TX-${i + 1}`),
      at: dmhm(typeof t.performedAt === 'string' ? t.performedAt : null),
      type, itemId: t.itemCode ?? '', item: t.itemName ?? '—',
      qty: raw === 'ISSUE' || raw === 'DISPOSE' ? -Math.abs(qty) : qty, lot: t.lotNo ?? undefined,
      ref: t.refType && t.refType !== 'OTHER' ? `${REF[t.refType] ?? t.refType + ' '}${t.refId ?? ''}` : undefined,
      by: t.performedByName ?? '—', note: t.note ?? '', balance: Number(t.balanceAfter) || 0,
    };
  });
};

export interface BeUser {
  userId: number; username: string; fullName: string; email: string; phone?: string | null; roleName: string; role?: string | null; status?: string | null;
  isActive?: boolean; emailConfirmed?: boolean | null; lockReason?: string | null; openTasks?: number | null; horsesOwned?: number | null; lastLogin?: string | null; zones?: string[] | null; specialization?: string | null;
}
const FE_ROLE: Record<string, string> = {
  'Club Manager': 'ClubManager', 'Head Trainer': 'HeadTrainer', Trainer: 'HeadTrainer', Veterinarian: 'Veterinarian', Groom: 'Groom',
  'Warehouse Manager': 'WarehouseManager', 'Horse Owner': 'HorseOwner',
};
export const loadUsers = async (): Promise<Row[] | null> => {
  if (me()?.role !== 'ClubManager') return null;
  const page = await beGet<{ users: BeUser[]; totalElements: number }>('/users', { page: 0, size: 500 }).catch(() => null);
  const users = page && page.users.length >= page.totalElements ? page.users : await beGet<BeUser[]>('/users/all').catch(() => null);
  if (!users) return null;
  return users.map(mapUser);
};
export const mapUser = (u: BeUser): Row => ({
  id: String(u.userId), beId: u.userId, username: u.username, fullname: u.fullName, email: u.email, phone: u.phone ?? '',
  role: u.role || FE_ROLE[u.roleName] || u.roleName, status: u.status ?? (u.isActive === false ? 'LOCKED' : 'ACTIVE'),
  zones: u.zones ?? (u.specialization ? [u.specialization] : []),
  emailConfirmed: u.emailConfirmed !== false, lockReason: u.lockReason ?? undefined, openTasks: u.openTasks ?? 0, horsesOwned: u.horsesOwned ?? 0, lastLogin: u.lastLogin && /^\d{4}-\d{2}-\d{2}/.test(u.lastLogin) ? dmhm(u.lastLogin) : u.lastLogin || '—',
});

interface BeAudit { logId: number; userId?: number | null; username?: string | null; fullName?: string | null; actionType: string; targetTable: string; oldValue?: string | null; newValue?: string | null; ipAddress?: string | null; timestamp: string }
const AREA: Record<string, string> = {
  Users: 'acct', Horses: 'reg', Horse_Registrations: 'reg', Medical_Records: 'med', Treatment_Protocols: 'med', Inventory_Items: 'med', Stock_Transactions: 'med',
  Purchase_Orders: 'med', Supply_Requests: 'med', Training_Plans: 'train', Training_Sessions: 'train', Care_Tasks: 'train', Invoices: 'fin', Payment_Transactions: 'fin',
};
const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất', LOCK_ACCOUNT: 'Khóa tài khoản', UNLOCK_ACCOUNT: 'Mở khóa tài khoản', CHANGE_ROLE: 'Đổi vai trò',
  CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', CREATE_STAFF: 'Tạo tài khoản nhân viên',
  APPROVE_HORSE: 'Phê duyệt hồ sơ ngựa', REJECT_HORSE: 'Từ chối hồ sơ ngựa', VET_LOCK: 'Khóa huấn luyện', VET_UNLOCK: 'Mở khóa huấn luyện', ASSIGN_TRAINER: 'Phân công HLV phụ trách ngựa',
};
export const loadAuditLogs = async (): Promise<Row[] | null> => {
  if (me()?.role !== 'ClubManager') return null;
  const page = await beGet<{ content: BeAudit[] }>('/audit-logs/paged', { page: 0, size: 300 }).catch(() => null);
  if (!page) return null;
  const users = (await loadUsers()) ?? [];
  return page.content.map((l) => {
    const u = users.find((x) => x.beId === l.userId);
    const area = AREA[l.targetTable] ?? (/LOCK|ROLE|LOGIN|STAFF|PASSWORD/i.test(l.actionType) ? 'acct' : 'reg');
    return {
      id: l.logId, at: dmyhm(l.timestamp) + (l.timestamp.length > 18 ? l.timestamp.slice(16, 19) : ''), who: l.fullName || l.username || 'Hệ thống',
      role: (u?.role as string) ?? '—', action: l.actionType, label: ACTION_LABEL[l.actionType] ?? l.actionType.replace(/_/g, ' ').toLowerCase(),
      object: l.targetTable, area, ip: l.ipAddress ?? '—', from: l.oldValue ?? undefined, to: l.newValue ?? undefined,
      isLogin: /LOGIN|LOGOUT/.test(l.actionType),
    };
  });
};
