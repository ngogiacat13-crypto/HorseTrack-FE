import { daysFromToday } from '../vetApi/dates';
import type { InvoiceDue, OwnerInvoice, PaymentStatus } from './types';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export const HORSE_BREEDS = [
  'Thoroughbred', 'Arabian', 'Quarter Horse', 'Standardbred', 'Anglo-Arab', 'Akhal-Teke', 'Andalusian', 'Appaloosa',
  'Friesian', 'Hanoverian', 'Holsteiner', 'Trakehner', 'Warmblood', 'Morgan', 'Mustang', 'Paint Horse',
  'Percheron', 'Clydesdale', 'Shire', 'Mông Cổ', 'Ngựa bạch Việt Nam', 'Ngựa cỏ Việt Nam', 'Ngựa lai',
] as const;
export const HEIGHT_MIN_CM = 120;
export const HEIGHT_MAX_CM = 205;
const CM_PER_HAND = 10.16;
const foldBreed = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
export const knownBreed = (v: string) => HORSE_BREEDS.find((b) => foldBreed(b) === foldBreed(v));
export const parseHands = (v: string) => {
  const n = Number.parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
export const parseCm = (v: string) => {
  const s = v.trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
  const meters = s.match(/^(\d)m(\d{0,2})$/);
  if (meters) return Number(meters[1]) * 100 + Number(meters[2].padEnd(2, '0'));
  const n = Number.parseFloat(s.replace(/cm$|m$/, ''));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n < 3 ? n * 100 : n);
};
export const cmToHands = (cm: number) => Math.round((cm / CM_PER_HAND) * 10) / 10;
export const handsToCm = (hands: number) => Math.round(hands * CM_PER_HAND);

export const POLICY = {
  graceDays: 10,
  penaltyRate: 0.05,
  suspendDays: 25,
  reactivationFee: 1_000_000,
};

const PAID_STATES = ['PAID', 'ACTIVE', 'REACTIVATION_PENDING'];
export const isPaid = (i: Pick<OwnerInvoice, 'status'>) => PAID_STATES.includes(i.status);

type BackendDue = { lateFee?: number; reactivationFee?: number; amountDue?: number };

export const invoiceDue = (i: OwnerInvoice): InvoiceDue => {
  if (isPaid(i)) return { overdueDays: 0, penalty: 0, reactivationFee: 0, total: i.amount, group: 'PAID' };
  const backend = i as OwnerInvoice & BackendDue;
  if (typeof backend.amountDue === 'number') {
    const group = i.status === 'SUSPENDED' ? 'SUSPENDED' : i.overdueDays > 0 ? 'OVERDUE' : 'UNPAID';
    return { overdueDays: i.overdueDays, penalty: backend.lateFee ?? 0, reactivationFee: backend.reactivationFee ?? 0, total: backend.amountDue, group };
  }
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
