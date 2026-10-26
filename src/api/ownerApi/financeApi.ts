import { http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import { invoiceDue, isFinishedPayment, isPaid } from './labels';
import { DENIED, get, nextId, now, SYSTEM } from './shared';
import type { OwnerInvoice, Payment } from './types';

const mineOrDeny = (i: OwnerInvoice, actor: Actor) => { if (i.owner !== actor.name) throw new Error(DENIED); return i; };

export const financeApi = {
  async getMyInvoices(actor: Actor) {
    const [invoices, payments] = await Promise.all([get<OwnerInvoice[]>('/invoices'), get<Payment[]>('/payments')]);
    const mine = invoices.filter((i) => i.owner === actor.name).sort((a, b) => b.id.localeCompare(a.id));
    return { invoices: mine.map((i) => ({ invoice: i, due: invoiceDue(i) })), payments: payments.filter((p) => p.owner === actor.name) };
  },

  async getInvoice(id: string, actor: Actor) {
    const inv = mineOrDeny(await get<OwnerInvoice>(`/invoices/${id}`).catch(() => { throw new Error('Không tìm thấy hóa đơn.'); }), actor);
    const payments = (await get<Payment[]>('/payments', { invoiceId: id })).sort((a, b) => b.id.localeCompare(a.id));
    return { invoice: inv, due: invoiceDue(inv), payments };
  },

  async getOpenInvoices(actor: Actor) {
    const { invoices, payments } = await financeApi.getMyInvoices(actor);
    return { invoices: invoices.filter((x) => x.due.group !== 'PAID'), payments };
  },

  async getPaymentHistory(actor: Actor) {
    const { invoices, payments } = await financeApi.getMyInvoices(actor);
    const verified = payments.filter((p) => p.status === 'VERIFIED');
    return {
      payments: payments.filter(isFinishedPayment).sort((a, b) => b.id.localeCompare(a.id)),
      paid: verified.reduce((s, p) => s + p.amount, 0),
      owed: invoices.filter((x) => x.due.group !== 'PAID').reduce((s, x) => s + x.due.total, 0),
      invoices,
    };
  },

  async startPayment(id: string, actor: Actor) {
    const inv = mineOrDeny(await get<OwnerInvoice>(`/invoices/${id}`), actor);
    if (isPaid(inv)) throw new Error('Hóa đơn đã được thanh toán.');
    const all = await get<Payment[]>('/payments');
    const pending = all.find((p) => p.invoiceId === id && (p.status === 'PENDING_VERIFY' || p.status === 'PROCESSING'));
    if (pending) throw new Error(`Giao dịch ${pending.id} đang chờ xác minh — không tạo giao dịch trùng.`);
    const due = invoiceDue(inv);
    const p: Payment = {
      id: nextId(all.map((x) => x.id), 'TXN-', 5), invoiceId: id, owner: inv.owner, horse: inv.horse, amount: due.total, method: 'VNPay',
      status: 'INIT', createdAt: now(), verifiedAt: null, bankRef: null, note: '',
      breakdown: { base: inv.amount, penalty: due.penalty, reactivationFee: due.reactivationFee },
    };
    const { data } = await http.post<Payment>('/payments', p);
    await addAudit(actor, { action: 'START_PAYMENT', label: 'Tạo giao dịch VNPay', object: `${data.id} · ${id}`, area: 'fin', to: 'INIT', reason: `${due.total.toLocaleString('vi-VN')} ₫` });
    return data;
  },

  async getPayment(id: string, actor: Actor) {
    const p = await get<Payment>(`/payments/${id}`).catch(() => { throw new Error('Không tìm thấy giao dịch.'); });
    if (p.owner !== actor.name) throw new Error(DENIED);
    return { payment: p, invoice: await get<OwnerInvoice>(`/invoices/${p.invoiceId}`) };
  },

  async gatewayResult(p: Payment, result: 'SUCCESS' | 'FAILED' | 'PROCESSING', actor: Actor) {
    if (p.status !== 'INIT' && p.status !== 'PROCESSING') throw new Error('Giao dịch đã có kết quả.');
    const status = result === 'SUCCESS' ? 'PENDING_VERIFY' : result === 'FAILED' ? 'FAILED' : 'PROCESSING';
    const note = result === 'FAILED' ? 'Cổng VNPay báo thất bại' : result === 'PROCESSING' ? 'Ngân hàng đang xử lý' : 'Cổng trả về thành công — chờ máy chủ xác minh';
    const { data } = await http.patch<Payment>(`/payments/${p.id}`, { status, note });
    await addAudit(actor, { action: 'VNPAY_RETURN', label: 'Kết quả trả về từ VNPay', object: `${p.id} · ${p.invoiceId}`, area: 'fin', from: p.status, to: status });
    return data;
  },

  async serverVerify(p: Payment) {
    if (p.status !== 'PENDING_VERIFY') throw new Error('Chỉ xác minh giao dịch đang chờ xác minh.');
    const inv = await get<OwnerInvoice>(`/invoices/${p.invoiceId}`);
    const due = invoiceDue(inv);
    if (due.total !== p.amount) {
      await http.patch(`/payments/${p.id}`, { status: 'FAILED', note: `Sai số tiền: nhận ${p.amount}, cần ${due.total}` });
      throw new Error('Số tiền giao dịch không khớp số phải trả — giao dịch bị từ chối.');
    }
    const bankRef = `VNP${String(Date.now()).slice(-8)}`;
    const { data } = await http.patch<Payment>(`/payments/${p.id}`, { status: 'VERIFIED', verifiedAt: now(), bankRef, note: 'Máy chủ đã xác minh chữ ký, mã tham chiếu và số tiền' });
    const to = inv.status === 'SUSPENDED' ? 'REACTIVATION_PENDING' : 'PAID';
    await http.patch(`/invoices/${inv.id}`, { status: to, paidRef: p.id, overdueDays: 0 });
    const linkedLine = inv.lines.find((line) => line.protocolId && line.phaseNo);
    if (linkedLine?.protocolId && linkedLine.phaseNo) {
      const protocols = await get<{ id: string; phaseBilling?: { phaseNo: number; invoiceId: string | null; amount: number; status: string }[] }[]>('/protocols');
      const linked = protocols.find((protocol) => protocol.id === linkedLine.protocolId);
      if (linked) await http.patch(`/protocols/${linked.id}`, { phaseBilling: (linked.phaseBilling ?? []).map((billing) => billing.phaseNo === linkedLine.phaseNo ? { ...billing, status: 'PAID' } : billing) });
    }
    await addAudit(SYSTEM, { action: 'PAYMENT_VERIFIED', label: 'Xác minh thanh toán (IPN)', object: `${p.id} · ${inv.id}`, area: 'fin', from: inv.status, to, reason: `Mã NH ${bankRef} · ${p.amount.toLocaleString('vi-VN')} ₫` });
    return data;
  },
};
