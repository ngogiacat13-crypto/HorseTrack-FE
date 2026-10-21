import type { ProtocolState } from '../managerApi';
import type { CaseSource, Severity, CaseStatus, Protocol } from './types';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
export const SOURCE_LABEL: Record<CaseSource, string> = { SESSION_STOP: 'Dừng phiên', GROOM_REPORT: 'Mã phu báo', TRAINER_REQUEST: 'HLV yêu cầu' };
export const SEVERITY_LABEL: Record<Severity, [string, Tone]> = { HIGH: ['Cao', 'danger'], MEDIUM: ['Trung bình', 'warning'], LOW: ['Thấp', 'success'] };
export const CASE_LABEL: Record<CaseStatus, [string, Tone]> = { NEW: ['Chờ xử lý', 'info'], MONITORING: ['Đang theo dõi', 'warning'], CLOSED: ['Đã đóng', 'neutral'] };
export const PROTOCOL_LABEL: Record<ProtocolState, [string, Tone]> = {
  DRAFT: ['Bản nháp', 'neutral'],
  WAITING_STOCK_CHECK: ['Chờ kho kiểm tồn', 'info'],
  STOCK_SHORTAGE: ['Thiếu vật tư — chờ BS quyết định', 'danger'],
  STOCK_AVAILABLE: ['Kho đủ hàng — chờ BS xác nhận', 'info'],
  WAITING_RESTOCK: ['Chờ hàng về', 'warning'],
  REQUIRES_VET_REVIEW: ['Cần BS đánh giá lại', 'danger'],
  VET_CONFIRMED: ['BS đã xác nhận', 'success'],
  READY_FOR_DISPENSING: ['Chờ kho cấp phát', 'success'],
  IN_TREATMENT: ['Đang điều trị', 'success'],
  ON_HOLD_PAYMENT: ['Tạm dừng · chờ chủ ngựa thanh toán', 'danger'],
  COMPLETED: ['Hoàn tất', 'neutral'],
  SUPERSEDED: ['Đã bị thay thế', 'neutral'],
  CANCELLED: ['Đã hủy', 'neutral'],
};
export const PROTOCOL_FLOW: ProtocolState[] = ['DRAFT', 'WAITING_STOCK_CHECK', 'STOCK_AVAILABLE', 'VET_CONFIRMED', 'READY_FOR_DISPENSING', 'IN_TREATMENT', 'COMPLETED'];
export const VET_ACTION_STATES: ProtocolState[] = ['DRAFT', 'STOCK_SHORTAGE', 'STOCK_AVAILABLE', 'REQUIRES_VET_REVIEW', 'IN_TREATMENT', 'ON_HOLD_PAYMENT'];
const CLOSED_STATES: ProtocolState[] = ['COMPLETED', 'SUPERSEDED', 'CANCELLED'];
export const isOpenProtocol = (p: Pick<Protocol, 'state'>) => !CLOSED_STATES.includes(p.state);

export const INJURY_SEVERITIES = ['Nhẹ', 'Trung bình', 'Nặng'] as const;
export const BODY_PARTS: { part: string; x: number; y: number }[] = [
  { part: 'Đầu', x: 20, y: 17 },
  { part: 'Cổ', x: 33, y: 25 },
  { part: 'Vai', x: 38, y: 40 },
  { part: 'Ngực', x: 35, y: 50 },
  { part: 'Lưng', x: 53, y: 38 },
  { part: 'Bụng', x: 55, y: 52 },
  { part: 'Hông · mông', x: 71, y: 42 },
  { part: 'Đuôi', x: 84, y: 52 },
  { part: 'Chân trước trái', x: 39, y: 66 },
  { part: 'Chân trước phải', x: 44, y: 70 },
  { part: 'Gối trước', x: 39, y: 74 },
  { part: 'Móng trước', x: 38, y: 93 },
  { part: 'Chân sau trái', x: 72, y: 64 },
  { part: 'Chân sau phải', x: 79, y: 67 },
  { part: 'Khuỷu chân sau', x: 80, y: 72 },
  { part: 'Móng sau trái', x: 72, y: 93 },
  { part: 'Móng sau phải', x: 80, y: 93 },
];
