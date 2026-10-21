import { DEMO_NOW } from '../http';
import type { ReqStatus, ShipmentStatus, StockItem, TxType } from './types';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';
export const SHIPMENT_LABEL: Record<ShipmentStatus, [string, Tone]> = {
  ORDERED: ['Đã đặt', 'neutral'], IN_TRANSIT: ['Đang giao', 'info'], DELAYED: ['Bị trễ', 'danger'], RECEIVED: ['Đã nhận', 'success'], CANCELLED: ['Đã hủy', 'neutral'],
};
export const REQ_LABEL: Record<ReqStatus, [string, Tone]> = {
  SUBMITTED: ['Mới gửi', 'info'], CHECKING_STOCK: ['Đang kiểm tồn', 'info'], APPROVED_FOR_ISSUE: ['Sẵn sàng cấp', 'success'],
  WAITING_RESTOCK: ['Chờ hàng về', 'warning'], REJECTED: ['Đã từ chối', 'danger'], ISSUED: ['Đã cấp phát', 'success'], CLOSED: ['Đã đóng', 'neutral'],
};
export const TX_LABEL: Record<TxType, [string, Tone]> = {
  RECEIVE: ['Nhập kho', 'success'], ISSUE: ['Cấp phát / xuất', 'info'], ADJUST: ['Điều chỉnh', 'warning'], HOLD: ['Giữ tồn', 'neutral'], RELEASE: ['Trả giữ', 'neutral'],
};
export const OPEN_SHIPMENT: ShipmentStatus[] = ['ORDERED', 'IN_TRANSIT', 'DELAYED'];

export const available = (i: Pick<StockItem, 'onHand' | 'held'>) => Math.max(0, i.onHand - i.held);
export const belowSafety = (i: StockItem) => available(i) < i.safety;
export const tracksLots = (i: Pick<StockItem, 'category'>) => i.category === 'Thuốc' || i.category === 'Vaccine';

export const monthsLeft = (expiry: string) => {
  const [m, y] = expiry.split('/').map(Number);
  const [, dm, dy] = DEMO_NOW.date.split('/').map(Number);
  return (y - dy) * 12 + (m - dm);
};
export const byExpiry = <T extends { expiry: string }>(lots: T[]) =>
  [...lots].sort((a, b) => a.expiry.split('/').reverse().join('').localeCompare(b.expiry.split('/').reverse().join('')));
export const nearestLot = (i: StockItem) => byExpiry((i.lots ?? []).filter((l) => l.qty > 0))[0];
