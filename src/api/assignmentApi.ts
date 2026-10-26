import { be, beData, USE_BACKEND, type ApiResponse } from './beClient';

export interface AssignmentRequest {
  requestId: number;
  requestType: 'TRAINER_HORSE' | 'TRAINER_RELEASE' | 'GROOM_ZONE';
  targetUserId: number;
  targetName?: string | null;
  horseId?: number | null;
  horseName?: string | null;
  previousName?: string | null;
  barnZone?: string | null;
  previousZone?: string | null;
}

export const assignmentApi = {
  mine: () => (USE_BACKEND ? beData(be.get<ApiResponse<AssignmentRequest[]>>('/assignments/mine')) : Promise.resolve([] as AssignmentRequest[])),
  pending: () => beData(be.get<ApiResponse<AssignmentRequest[]>>('/assignments/pending')).catch(() => [] as AssignmentRequest[]),
  accept: (id: number) => be.put(`/assignments/${id}/accept`),
  reject: (id: number, reason: string) => be.put(`/assignments/${id}/reject`, { reason }),
};

export const assignmentText = (r: AssignmentRequest) => {
  if (r.requestType === 'TRAINER_HORSE') {
    return r.previousName
      ? `Nhận ngựa ${r.horseName} (đang do ${r.previousName} phụ trách). Bạn xác nhận thì phân công mới có hiệu lực.`
      : `Nhận phụ trách ngựa ${r.horseName}.`;
  }
  if (r.requestType === 'TRAINER_RELEASE') return `Bỏ phân công khỏi ngựa ${r.horseName}. Bạn vẫn phụ trách nếu từ chối.`;
  if (r.barnZone) return `Nhận khu ${r.barnZone}${r.previousZone ? ` (hiện tại: ${r.previousZone})` : ''}.`;
  return `Bỏ khu chăm sóc${r.previousZone ? ` ${r.previousZone}` : ''}.`;
};
