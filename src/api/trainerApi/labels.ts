/* Display labels + small horse rules (BR_01 blocks) shared by pages. */
import type { HealthStatus, Horse, PlanStatus, SessionStatus, ProposalStatus, Stall } from './types';

export const HEALTH_LABEL: Record<HealthStatus, [string, 'success' | 'warning' | 'danger' | 'purple']> = {
  HEALTHY: ['Khỏe mạnh', 'success'], WATCH: ['Theo dõi', 'warning'], INJURED: ['Chấn thương', 'danger'], QUARANTINE: ['Cách ly', 'purple'],
};
export const SESSION_LABEL: Record<SessionStatus, [string, 'success' | 'warning' | 'danger' | 'info' | 'neutral']> = {
  SCHEDULED: ['Chưa bắt đầu', 'neutral'], IN_PROGRESS: ['Đang diễn ra', 'info'], PAUSED_PENDING_TRAINER: ['Tạm dừng — chờ HLV', 'warning'],
  RESUMED: ['Tiếp tục (đã điều chỉnh)', 'info'], STOPPED: ['Đã dừng', 'danger'], COMPLETED: ['Hoàn thành', 'success'],
};
export const PROPOSAL_LABEL: Record<ProposalStatus, [string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand']> = {
  PROPOSED: ['Mới tạo', 'neutral'], WAITING_VET_EXAM: ['Chờ BS khám', 'info'], VET_FAILED: ['Không đạt khám', 'danger'],
  WAITING_OWNER: ['Chờ chủ ngựa', 'warning'], OWNER_DECLINED: ['Chủ ngựa từ chối', 'danger'], READY_TO_SUBMIT: ['Sẵn sàng gửi BTC', 'brand'],
  SUBMITTED: ['Đã gửi BTC', 'info'], REJECTED_BY_ORGANIZER: ['BTC từ chối', 'danger'], RESULT_RECORDED: ['Đã có kết quả', 'success'],
};
export const PLAN_LABEL: Record<PlanStatus, [string, 'success' | 'warning' | 'neutral']> = {
  ACTIVE: ['Đang chạy', 'success'], PAUSED: ['Tạm dừng', 'warning'], COMPLETED: ['Hoàn tất', 'neutral'], REPLACED: ['Đã thay thế', 'neutral'],
};

/** Stable zone of a horse, from its stall (e.g. A-01 → "Khu A"). */
export const horseZone = (h: Horse, stalls: Stall[]) =>
  stalls.find((st) => st.id === h.stall)?.zone ?? `Khu ${h.stall.split('-')[0]}`;

/** Two-letter avatar text, e.g. Galaxy → GA. */
export const horseInitials = (name: string) => name.slice(0, 2).toUpperCase();

/** Why a horse cannot train or race right now (BR_01), or null when it can. */
export const trainingBlock = (h: Pick<Horse, 'trainingLocked' | 'lock' | 'health'>): string | null =>
  h.trainingLocked ? `Đang khóa huấn luyện bởi BS ${h.lock?.by ?? ''} — ${h.lock?.reason ?? 'lý do y tế'} (BR_01).` : null;

export const raceBlock = (h: Horse): string | null =>
  trainingBlock(h) ?? (h.health === 'INJURED' || h.health === 'QUARANTINE' ? `${HEALTH_LABEL[h.health][0]} — không đủ điều kiện thi đấu.` : null);
