import { DEMO_NOW, http } from '../../api/http';
import { USE_BACKEND, be, beData } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';
import { type Actor, addAudit } from '../../api/managerApi';

export type RefundStatus = 'PENDING' | 'DONE';
export interface Refund {
  id: string; invoiceId: string; invoiceCode: string; horseName: string;
  ownerName: string; ownerEmail: string; ownerPhone: string; amount: number; reason: string;
  status: RefundStatus; statusLabel: string; requestedAt: string; requestedKey: string;
  transactionRef: string; transferredOn: string; transferredBy: string; confirmedBy: string; confirmedAt: string; note: string;
  canConfirm: boolean;
}
export interface RefundConfirm { transactionRef: string; transferredOn: string; transferredBy: string; note: string }

interface BeRefund {
  refundId: number; invoiceId: number; invoiceCode: string; horseName?: string | null; ownerName?: string | null; ownerEmail?: string | null; ownerPhone?: string | null;
  amount: number; reason?: string | null; status: string; statusLabel?: string | null; requestedAt?: string | null;
  transactionRef?: string | null; transferredOn?: string | null; transferredBy?: string | null; confirmedByName?: string | null; confirmedAt?: string | null; note?: string | null;
  canConfirm?: boolean | null;
}

export const REFUND_LABEL: Record<RefundStatus, string> = { PENDING: 'Chờ hoàn', DONE: 'Đã hoàn' };

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dmy = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const sortKey = (dmyTime: string) => dmyTime.replace(/^(\d{2})\/(\d{2})\/(\d{4})/, '$3$2$1');

const fromBe = (r: BeRefund): Refund => {
  const status: RefundStatus = (r.status ?? '').toUpperCase() === 'DONE' ? 'DONE' : 'PENDING';
  return {
    id: String(r.refundId), invoiceId: String(r.invoiceId), invoiceCode: r.invoiceCode, horseName: r.horseName ?? '—',
    ownerName: r.ownerName ?? '—', ownerEmail: r.ownerEmail ?? '', ownerPhone: r.ownerPhone ?? '', amount: Number(r.amount ?? 0), reason: r.reason ?? '',
    status, statusLabel: r.statusLabel ?? REFUND_LABEL[status], requestedAt: stamp(r.requestedAt), requestedKey: r.requestedAt ?? '',
    transactionRef: r.transactionRef ?? '', transferredOn: dmy(r.transferredOn), transferredBy: r.transferredBy ?? '',
    confirmedBy: r.confirmedByName ?? '', confirmedAt: stamp(r.confirmedAt), note: r.note ?? '', canConfirm: !!r.canConfirm,
  };
};

const todayIso = () => DEMO_NOW.date.split('/').reverse().join('-');

const checkConfirm = (input: RefundConfirm) => {
  const ref = input.transactionRef.trim();
  const by = input.transferredBy.trim();
  if (!ref) throw new Error('Nhập mã giao dịch chuyển tiền.');
  if (ref.length > 100) throw new Error('Mã giao dịch tối đa 100 ký tự.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transferredOn)) throw new Error('Chọn ngày chuyển tiền.');
  if (input.transferredOn > todayIso()) throw new Error('Ngày chuyển không được ở tương lai.');
  if (!by) throw new Error('Nhập người chuyển tiền.');
  if (by.length > 150) throw new Error('Người chuyển tối đa 150 ký tự.');
  if (input.note.trim().length > 500) throw new Error('Ghi chú tối đa 500 ký tự.');
  return { transactionRef: ref, transferredOn: input.transferredOn, transferredBy: by, note: input.note.trim() || undefined };
};

export const refundsApi = {
  todayIso,

  async list(): Promise<Refund[]> {
    if (USE_BACKEND) return (await beData<BeRefund[]>(be.get('/billing/refunds'))).map(fromBe);
    const { data } = await http.get<Omit<Refund, 'statusLabel' | 'canConfirm' | 'requestedKey'>[]>('/refunds');
    return data.map((r) => ({ ...r, statusLabel: REFUND_LABEL[r.status], canConfirm: r.status === 'PENDING', requestedKey: sortKey(r.requestedAt) }));
  },

  async confirm(refund: Refund, input: RefundConfirm, actor: Actor) {
    const body = checkConfirm(input);
    if (USE_BACKEND) {
      await be.put(`/billing/refunds/${refund.id}/confirm`, body);
      invalidate('invoices', 'auditLogs');
      return;
    }
    if (!refund.canConfirm) throw new Error(`Khoản hoàn này đã được xác nhận ngày ${refund.confirmedAt}.`);
    await http.patch(`/refunds/${refund.id}`, {
      status: 'DONE', transactionRef: body.transactionRef, transferredOn: dmy(body.transferredOn), transferredBy: body.transferredBy,
      note: body.note ?? '', confirmedBy: actor.name, confirmedAt: `${DEMO_NOW.date} ${DEMO_NOW.time}`,
    });
    await http.patch(`/invoices/${refund.invoiceId}`, { status: 'REFUNDED' });
    await addAudit(actor, { action: 'REFUND_CONFIRMED', label: 'Xác nhận hoàn tiền', object: `${refund.invoiceCode} · ${refund.ownerName}`, area: 'fin', from: 'REFUND_PENDING', to: 'REFUNDED', reason: `${body.transactionRef} · ${body.transferredBy}` });
  },
};
