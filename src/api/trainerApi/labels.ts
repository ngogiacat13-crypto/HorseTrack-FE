import type { HealthStatus, Horse, PlanStatus, SessionStatus, ProposalStatus, Stall, PlanPhase, StaffGuide, TrackType, TrainingPlan, TrainingSession } from './types';

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
  WAITLISTED: ['Đang chờ suất', 'neutral'], WAITING_TRAINER: ['Chờ HLV xác nhận', 'warning'], WAITING_PAYMENT: ['Chờ nộp lệ phí', 'brand'],
  REGISTERED: ['Đã đăng ký', 'success'], TRAINER_REJECTED: ['HLV từ chối', 'danger'], TRAINER_EXPIRED: ['HLV quá hạn', 'danger'],
  VET_EXPIRED: ['Quá hạn khám', 'danger'], PAYMENT_EXPIRED: ['Quá hạn lệ phí', 'danger'], CANCELLED: ['Đã hủy', 'neutral'],
  INELIGIBLE: ['Không đủ điều kiện', 'neutral'], NO_SLOT: ['Hết suất', 'neutral'],
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

export const TRACK_TYPES: TrackType[] = ['SYNTHETIC', 'DIRT', 'TURF'];
export const TRACK_LABEL: Record<TrackType, string> = { SYNTHETIC: 'Cỏ nhân tạo', DIRT: 'Đường đất', TURF: 'Đường cỏ' };
export const trackLabel = (code?: string | null) => (code ? TRACK_LABEL[code as TrackType] ?? code : '');
export const planTrack = (plan?: Pick<TrainingPlan, 'phases' | 'currentPhase'> | null) =>
  (plan?.phases.find((p) => p.no === plan.currentPhase) ?? plan?.phases[0])?.trackType ?? null;

export const PLAN_GUIDE: Record<string, StaffGuide> = {
  'Sức bền': {
    summary: 'Mã phu đưa ngựa ra đúng loại đường của giáo án và giữ nhịp đều suốt buổi. Không thúc tốc độ. Mục tiêu là duy trì thể lực, không phải chạy hết sức.',
    steps: [
      'Dắt ngựa bước đi 5 phút trên đúng loại đường của giáo án để khởi động.',
      'Chuyển sang nước kiệu hoặc phi nhẹ theo cường độ ghi trên giáo án và giữ đều đến gần cuối buổi.',
      'Đo nhịp tim và tốc độ theo các mốc buổi tập. Nếu vượt ngưỡng, dừng bài và báo huấn luyện viên.',
      'Hạ tốc độ dần trong 5 phút cuối, rồi dắt bộ về chuồng.',
      'Ghi đủ chỉ số vào phiên trước khi kết thúc buổi.',
    ],
  },
  'Tốc độ': {
    summary: 'Mã phu cho ngựa chạy các đoạn nhanh ngắn và cho nghỉ giữa các đoạn. Không giữ tốc độ cao liên tục.',
    steps: [
      'Khởi động bước và kiệu 8–10 phút trên đúng loại đường.',
      'Chạy các đoạn phi nhanh ngắn theo cường độ giáo án, xen kẽ đi bộ để hồi sức.',
      'Đo nhịp tim sau mỗi đoạn nhanh. Gần ngưỡng thì ngừng đoạn nhanh và chuyển sang đi bộ.',
      'Kết thúc bằng đi bộ thả lỏng đến khi nhịp tim hạ, rồi đưa về chuồng.',
      'Ghi từng lần đo vào phiên.',
    ],
  },
  'Phục hồi': {
    summary: 'Mã phu chỉ cho ngựa vận động rất nhẹ để hồi phục. Không phi nước đại và không đổi hướng đột ngột.',
    steps: [
      'Dắt bước hoặc cho kiệu rất nhẹ trên đúng loại đường.',
      'Giữ cường độ nhẹ suốt buổi, dù ngựa có vẻ muốn chạy nhanh hơn.',
      'Quan sát dáng đi. Nếu ngựa khập khiễng hoặc miễn cưỡng, dừng ngay và báo huấn luyện viên.',
      'Đo nhịp tim hồi phục khi đứng nghỉ cuối buổi.',
      'Đưa về chuồng và ghi chỉ số vào phiên.',
    ],
  },
  'Kỹ thuật': {
    summary: 'Mã phu tập xuất phát, vào cua và giữ hàng theo hiệu lệnh. Tốc độ phục vụ bài kỹ thuật, không phải bài đua tốc độ.',
    steps: [
      'Khởi động đi bộ trên đúng loại đường.',
      'Tập xuất phát đúng hiệu lệnh, vào cua và giữ hàng theo nội dung giáo án.',
      'Giữ tốc độ ở mức giáo án cho phép. Không tự nâng lên phi nước đại.',
      'Dừng bài nếu ngựa lệch hướng, mất kiểm soát hoặc vượt ngưỡng nhịp tim, rồi báo huấn luyện viên.',
      'Thả lỏng bằng đi bộ và ghi chỉ số trước khi về chuồng.',
    ],
  },
};
export const guideOf = (type?: string | null) => (type ? PLAN_GUIDE[type.trim()] ?? null : null);

export const planAdjustable = (plan: Pick<TrainingPlan, 'id' | 'status'>, sessions: TrainingSession[]) =>
  plan.status === 'PLANNED' && sessions.filter((s) => s.planId === plan.id).every((s) => s.cancelled || (s.status === 'SCHEDULED' && !s.confirmed));

export const PHASE_UNKNOWN = 'Server chưa lưu cường độ / đường tập của giai đoạn';
export const phaseLoad = (ph: PlanPhase) => (ph.estimated ? PHASE_UNKNOWN : `${ph.intensity} · ${trackLabel(ph.trackType) || (ph.distanceM ? `${ph.distanceM} m` : 'chưa có đường tập')} · ${ph.sessionsPerWeek} buổi/tuần`);
export const phaseHr = (ph: PlanPhase) => `≤ ${ph.hrLimit} bpm${ph.estimated ? ' (ngưỡng mặc định server)' : ''}`;
export const OPEN_PLAN: PlanStatus[] = ['PLANNED', 'ACTIVE', 'PAUSED'];
