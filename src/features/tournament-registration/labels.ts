import type { Tone } from '../../components/ui/Ht';
import type { EntryStatus, RejectCode, TournamentStatus } from './types';

export const ENTRY_LABEL: Record<EntryStatus, [string, Tone]> = {
  WAITLISTED: ['Đang chờ suất', 'neutral'],
  WAITING_TRAINER: ['Chờ HLV xác nhận', 'warning'],
  WAITING_VET_EXAM: ['Chờ bác sĩ khám', 'info'],
  WAITING_PAYMENT: ['Chờ nộp lệ phí', 'brand'],
  REGISTERED: ['Đã đăng ký', 'success'],
  RESULTED: ['Đã có kết quả', 'success'],
  TRAINER_REJECTED: ['HLV từ chối', 'danger'],
  TRAINER_EXPIRED: ['HLV quá hạn', 'danger'],
  VET_FAILED: ['Không đạt khám', 'danger'],
  VET_EXPIRED: ['Quá hạn khám', 'danger'],
  PAYMENT_EXPIRED: ['Quá hạn lệ phí', 'danger'],
  OWNER_CANCELLED: ['Đã hủy', 'neutral'],
  NO_SLOT: ['Hết suất', 'neutral'],
};

export const TOURNAMENT_LABEL: Record<TournamentStatus, [string, Tone]> = {
  DRAFT: ['Bản nháp', 'neutral'], PUBLISHED: ['Đã công bố', 'success'], FINISHED: ['Đã kết thúc', 'info'],
};

export const REJECT_CODE_LABEL: Record<RejectCode, string> = {
  NOT_READY: 'Thể lực chưa đạt cho cự ly',
  HEALTH_RISK: 'Rủi ro sức khỏe khi thi đấu',
  SCHEDULE_CONFLICT: 'Trùng lịch huấn luyện quan trọng',
  DISTANCE_MISMATCH: 'Cự ly không phù hợp với ngựa',
  OTHER: 'Lý do khác',
};

export const STAGE_HINT: Partial<Record<EntryStatus, string>> = {
  WAITLISTED: 'Có suất trống thì tự động chuyển sang chờ HLV xác nhận.',
  WAITING_TRAINER: 'HLV xác nhận trong 2 ngày, quá hạn thì mất suất.',
  WAITING_VET_EXAM: 'Bác sĩ khám trong 3 ngày sau khi HLV xác nhận.',
  WAITING_PAYMENT: 'Nộp lệ phí trong 2 ngày sau khi khám đạt.',
  REGISTERED: 'CLB gửi hồ sơ cho ban tổ chức ngoài hệ thống.',
};

export const TOURNAMENT_DETAIL = (id: string) => `/manager/tournaments/${id}`;
