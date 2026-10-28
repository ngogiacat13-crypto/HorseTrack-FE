import { be, beData } from './beClient';
import type { InvoiceStatus } from './managerApi';
import type { InvoiceLine, LineKind, OwnerInvoice, Payment, PaymentStatus } from './ownerApi/types';

type Money = number | string | null | undefined;

interface BeInvoiceLine { category: string; categoryLabel?: string | null; description?: string | null; amount: Money; serviceDate?: string | null }
interface BeTransaction {
  transactionId: number; invoiceId?: number | null; invoiceCode?: string | null; amount: Money; transactionRef?: string | null; gatewayTransId?: string | null;
  status: string; createdAt?: string | null; verifiedAt?: string | null; notes?: string | null;
}
export interface BeInvoice {
  invoiceId: number; invoiceCode?: string | null; horseId?: number | null; horseName?: string | null; ownerId: number; ownerName?: string | null;
  ownerServiceStatus?: string | null; billingMonth?: string | null; issuedAt?: string | null; dueDate?: string | null; status: string;
  subtotal?: Money; principal?: Money; lateFee?: Money; reactivationFee?: Money; amountDue?: Money; amountPaid?: Money;
  daysOverdue?: number | null; suspensionEligible?: boolean | null; lines?: BeInvoiceLine[] | null; transactions?: BeTransaction[] | null;
}
interface BePage<T> { content: T[] }
interface BeReport {
  fromMonth: string; toMonth: string;
  totals: { billed: Money; collected: Money; collectionRate: Money; outstandingPrincipal: Money; invoicesIssued: number; invoicesOverdue: number };
  months: { month: string; billed: Money; collected: Money }[];
  revenueByService: { label?: string | null; category: string; billed: Money }[];
  debtAgeing: { bucket: string; label?: string | null; invoiceCount: number; principal: Money }[];
  debtByOwner: { ownerName?: string | null; serviceStatus?: string | null; openInvoices: number; totalDue: Money }[];
}

export type BeOwnerInvoice = OwnerInvoice & {
  beId: number; beOwnerId: number; lateFee: number; reactivationFee: number; amountDue: number; amountPaid: number; suspensionEligible: boolean;
};

const num = (value: Money) => Number(value ?? 0) || 0;
const dmy = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
const stamp = (iso?: string | null) => (iso ? `${dmy(iso)} ${iso.slice(11, 16)}` : '—');
const period = (month?: string | null) => (month ? `${month.slice(5, 7)}/${month.slice(0, 4)}` : '—');
const millions = (value: Money) => Math.round(num(value) / 100_000) / 10;

const LINE_KIND: Record<string, LineKind> = {
  BOARDING: 'STABLE', DAILY_CARE: 'STABLE', MEDICATION: 'MED', TREATMENT: 'MED', VET: 'MED', TRAINING: 'TRAIN', COMPETITION: 'TRAIN',
};
const TRANSACTION_STATUS: Record<string, PaymentStatus> = { PENDING_VERIFICATION: 'PENDING_VERIFY', VERIFIED: 'VERIFIED', FAILED: 'FAILED' };

const invoiceStatus = (i: BeInvoice): InvoiceStatus => {
  const service = (i.ownerServiceStatus ?? '').toUpperCase();
  if (i.status === 'PAID' || i.status === 'REFUNDED') return service === 'REACTIVATION_PENDING' ? 'REACTIVATION_PENDING' : 'PAID';
  if (service === 'SUSPENDED') return 'SUSPENDED';
  return i.status === 'OVERDUE' || num(i.daysOverdue) > 0 ? 'OVERDUE' : 'UNPAID';
};

const mapLine = (l: BeInvoiceLine, billingMonth?: string | null): InvoiceLine => ({
  label: l.description || l.categoryLabel || l.category, kind: LINE_KIND[l.category] ?? 'STABLE', period: period(billingMonth), amount: num(l.amount),
});

export const mapTransaction = (t: BeTransaction, owner: string, horse: string): Payment => ({
  id: t.transactionRef || `TXN-${t.transactionId}`, invoiceId: t.invoiceCode ?? `INV-${t.invoiceId}`, owner, horse, amount: num(t.amount), method: 'VNPay',
  status: TRANSACTION_STATUS[t.status] ?? 'PENDING_VERIFY', createdAt: stamp(t.createdAt), verifiedAt: t.verifiedAt ? stamp(t.verifiedAt) : null,
  bankRef: t.gatewayTransId ?? null, note: t.notes ?? '',
});

export const mapInvoice = (i: BeInvoice): BeOwnerInvoice => {
  const lines = (i.lines ?? []).map((l) => mapLine(l, i.billingMonth));
  const verified = (i.transactions ?? []).filter((t) => t.status === 'VERIFIED');
  return {
    id: i.invoiceCode ?? `INV-${i.invoiceId}`, beId: i.invoiceId, beOwnerId: i.ownerId,
    horse: i.horseName ?? '—', horseId: i.horseId != null ? String(i.horseId) : null, owner: i.ownerName ?? `Chủ ngựa #${i.ownerId}`,
    period: period(i.billingMonth), dueDate: dmy(i.dueDate), issuedAt: dmy(i.issuedAt), amount: num(i.principal ?? i.subtotal),
    overdueDays: num(i.daysOverdue), status: invoiceStatus(i), paidRef: verified.length ? `${verified[0].transactionRef ?? verified[0].transactionId} · ${dmy(verified[0].verifiedAt)}` : undefined,
    service: `${i.status === 'REFUNDED' ? 'Đã hoàn tiền · ' : ''}${[...new Set((i.lines ?? []).map((l) => l.categoryLabel || l.category))].join(' · ') || '—'}`, lines,
    lateFee: num(i.lateFee), reactivationFee: num(i.reactivationFee), amountDue: num(i.amountDue), amountPaid: num(i.amountPaid),
    suspensionEligible: !!i.suspensionEligible,
  };
};

const ownerInvoiceDetails = async () => {
  const list = await beData<BeInvoice[]>(be.get('/owner/invoices', { params: { includeClosed: true } }));
  return Promise.all(list.filter((i) => i.status !== 'CANCELLED').map((i) => beData<BeInvoice>(be.get(`/owner/invoices/${i.invoiceId}`)).catch(() => i)));
};

export const loadInvoices = async (role?: string) => {
  if (role === 'ClubManager') {
    const page = await beData<BePage<BeInvoice>>(be.get('/billing/invoices', { params: { page: 0, size: 500 } })).catch(() => null);
    return page ? page.content.filter((i) => i.status !== 'CANCELLED').map(mapInvoice) : null;
  }
  if (role === 'HorseOwner') return (await ownerInvoiceDetails().catch(() => null))?.map(mapInvoice) ?? null;
  return null;
};

export const loadPayments = async (role?: string) => {
  if (role !== 'HorseOwner') return null;
  const [details, history] = await Promise.all([ownerInvoiceDetails().catch(() => null), beData<BeTransaction[]>(be.get('/owner/invoices/payment-history')).catch(() => [])]);
  if (!details) return null;
  const horseOf = new Map(details.map((i) => [i.invoiceId, { owner: i.ownerName ?? '—', horse: i.horseName ?? '—' }]));
  const all = [...details.flatMap((i) => i.transactions ?? []), ...history];
  const unique = [...new Map(all.map((t) => [t.transactionId, t])).values()];
  return unique.map((t) => {
    const ref = horseOf.get(t.invoiceId ?? -1) ?? { owner: '—', horse: '—' };
    return mapTransaction(t, ref.owner, ref.horse);
  });
};

export const financeBe = {
  suspendOwner: (ownerId: number, reason: string) => be.put(`/billing/owners/${ownerId}/suspend`, { reason }),
  reactivateOwner: (ownerId: number) => be.put(`/billing/owners/${ownerId}/reactivate`),
  startVnPay: (invoiceId: number) => beData<{ paymentUrl: string; txnRef: string; transactionId: number }>(be.post(`/owner/invoices/${invoiceId}/vnpay`)),

  async report() {
    const r = await beData<BeReport>(be.get('/reports/finance'));
    const months = r.months ?? [];
    return {
      period: `${period(r.fromMonth)} – ${period(r.toMonth)}`,
      collected: millions(r.totals.collected), billed: millions(r.totals.billed), billedCount: r.totals.invoicesIssued,
      rate: Math.round(num(r.totals.collectionRate) * 10) / 10, rateDelta: null as number | null,
      overdue: millions((r.debtAgeing ?? []).filter((b) => b.bucket !== 'NOT_DUE').reduce((s, b) => s + num(b.principal), 0)), overdueCount: r.totals.invoicesOverdue,
      months: months.map((m, index) => ({ m: `T${Number(m.month.slice(5, 7))}`, billed: millions(m.billed), collected: millions(m.collected), q: index >= months.length - 3 })),
      byService: (r.revenueByService ?? []).map((c) => ({ name: c.label || c.category, amount: num(c.billed) })),
      aging: (r.debtAgeing ?? []).map((b) => ({
        bucket: b.label || b.bucket, tone: b.bucket === 'NOT_DUE' ? 'warning' as const : 'danger' as const, suspended: false,
        ids: `${b.invoiceCount} hóa đơn`, count: b.invoiceCount, amount: num(b.principal),
      })),
      byOwner: (r.debtByOwner ?? []).map((o) => ({ owner: o.ownerName ?? '—', ids: `${o.openInvoices} hóa đơn`, amount: num(o.totalDue), suspended: o.serviceStatus === 'SUSPENDED' })),
    };
  },
};
