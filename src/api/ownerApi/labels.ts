import { daysFromToday } from '../vetApi/dates';
import type { InvoiceDue, OwnerInvoice, PaymentStatus } from './types';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export const POLICY = {
  graceDays: 10,
  penaltyRate: 0.05,
  suspendDays: 25,
  reactivationFee: 1_000_000,
};

const PAID_STATES = ['PAID', 'ACTIVE', 'REACTIVATION_PENDING'];
export const isPaid = (i: Pick<OwnerInvoice, 'status'>) => PAID_STATES.includes(i.status);

export const invoiceDue = (i: OwnerInvoice): InvoiceDue => {
  if (isPaid(i)) return { overdueDays: 0, penalty: 0, reactivationFee: 0, total: i.amount, group: 'PAID' };
  const overdueDays = Math.max(0, -daysFromToday(i.dueDate));
  const penalty = overdueDays > POLICY.graceDays ? Math.round((i.amount * POLICY.penaltyRate) / 1000) * 1000 : 0;
  const suspended = i.status === 'SUSPENDED';
  const reactivationFee = suspended ? POLICY.reactivationFee : 0;
  return {
    overdueDays, penalty, reactivationFee, total: i.amount + penalty + reactivationFee,
    group: suspended ? 'SUSPENDED' : overdueDays > 0 ? 'OVERDUE' : 'UNPAID',
  };
};

export const DUE_LABEL: Record<InvoiceDue['group'], [string, Tone]> = {
  UNPAID: ['Chưa thanh toán', 'warning'], OVERDUE: ['Quá hạn', 'danger'], SUSPENDED: ['Đình chỉ', 'danger'], PAID: ['Đã thanh toán', 'success'],
};
export const invoiceLabel = (i: OwnerInvoice): [string, Tone] =>
  i.status === 'REACTIVATION_PENDING' ? ['Đã thanh toán · chờ kích hoạt lại', 'info'] : DUE_LABEL[invoiceDue(i).group];

export const PAYMENT_LABEL: Record<PaymentStatus, [string, Tone]> = {
  INIT: ['Khởi tạo', 'neutral'], PROCESSING: ['Đang xử lý', 'info'], PENDING_VERIFY: ['Chờ xác minh', 'warning'],
  VERIFIED: ['Đã xác minh', 'success'], FAILED: ['Thất bại', 'danger'],
};

export const isFinishedPayment = (p: { status: PaymentStatus }) => p.status === 'VERIFIED' || p.status === 'FAILED';
export const HISTORY_LABEL: Record<'VERIFIED' | 'FAILED', [string, Tone]> = {
  VERIFIED: ['Thanh toán thành công', 'success'], FAILED: ['Thất bại', 'danger'],
};
