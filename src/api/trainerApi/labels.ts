import type { HealthStatus, Horse, PlanStatus, SessionStatus, ProposalStatus, Stall, PlanPhase } from './types';

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
  PLANNED: ['Chưa bắt đầu', 'neutral'], ACTIVE: ['Đang chạy', 'success'], PAUSED: ['Tạm dừng', 'warning'], COMPLETED: ['Hoàn tất', 'neutral'], REPLACED: ['Đã thay thế', 'neutral'], CANCELLED: ['Đã hủy', 'neutral'],
};

export const horseZone = (h: Horse, stalls: Stall[]) =>
  stalls.find((st) => st.id === h.stall)?.zone ?? `Khu ${h.stall.split('-')[0]}`;

export const horseInitials = (name: string) => name.slice(0, 2).toUpperCase();

export const trainingBlock = (h: Pick<Horse, 'trainingLocked' | 'lock' | 'health'>): string | null =>
  h.trainingLocked ? `Đang khóa huấn luyện bởi BS ${h.lock?.by ?? ''} — ${h.lock?.reason ?? 'lý do y tế'} (BR_01).` : null;

export const raceBlock = (h: Horse): string | null =>
  trainingBlock(h) ?? (h.health === 'INJURED' || h.health === 'QUARANTINE' ? `${HEALTH_LABEL[h.health][0]} — không đủ điều kiện thi đấu.` : null);

export const PHASE_UNKNOWN = 'Server chưa lưu cường độ / cự ly giai đoạn';
export const phaseLoad = (ph: PlanPhase) => (ph.estimated ? PHASE_UNKNOWN : `${ph.intensity} · ${ph.distanceM} m · ${ph.sessionsPerWeek} buổi/tuần`);
export const phaseHr = (ph: PlanPhase) => `≤ ${ph.hrLimit} bpm${ph.estimated ? ' (ngưỡng mặc định server)' : ''}`;
export const OPEN_PLAN: PlanStatus[] = ['PLANNED', 'ACTIVE', 'PAUSED'];
