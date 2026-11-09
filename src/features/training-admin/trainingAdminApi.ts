import { http } from '../../api/http';
import { USE_BACKEND, be, beData } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';
import { type Actor, addAudit } from '../../api/managerApi';
import { planTrack, trackLabel, type TrackType, type TrainingPlan, type TrainingSession } from '../../api/trainerApi';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export interface AdminPlan {
  id: string; name: string; horseName: string; type: string; startDate: string; endDate: string;
  status: string; statusLabel: string; tone: Tone; open: boolean; track: TrackType | null; canForceCancel: boolean;
}
export interface AdminSession { id: string; date: string; time: string; groom: string; status: string; statusLabel: string; tone: Tone; canForceClose: boolean }

const PLAN_LABEL: Record<string, [string, Tone]> = {
  PENDING: ['Chưa bắt đầu', 'neutral'], ACTIVE: ['Đang chạy', 'success'], PAUSED: ['Tạm dừng', 'warning'], COMPLETED: ['Hoàn tất', 'neutral'], CANCELLED: ['Đã hủy', 'neutral'],
};
const SESSION_LABEL: Record<string, [string, Tone]> = {
  PENDING: ['Chờ Mã phu xác nhận', 'neutral'], CONFIRMED: ['Đã xác nhận', 'info'], IN_PROGRESS: ['Đang tập', 'info'], PAUSED: ['Tạm dừng', 'warning'],
  WAITING_VET: ['Chờ bác sĩ', 'danger'], COMPLETED: ['Hoàn thành', 'success'], STOPPED: ['Đã dừng', 'danger'], CANCELLED: ['Đã hủy', 'neutral'],
};
const OPEN_PLAN = ['PENDING', 'ACTIVE', 'PAUSED'];
const FINISHED_SESSION = ['COMPLETED', 'STOPPED', 'CANCELLED', 'WAITING_VET'];
const FE_PLAN_STATUS: Record<string, string> = { PLANNED: 'PENDING', ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', REPLACED: 'CANCELLED', CANCELLED: 'CANCELLED' };

const dmy = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
const label = (map: Record<string, [string, Tone]>, status: string): [string, Tone] => map[status] ?? [status, 'neutral'];

interface BePhase { trackType?: string | null; current?: boolean | null }
interface BePlan { planId: number; planName: string; horseName: string; startDate: string; endDate: string; status: string; type?: string | null; trackType?: string | null; phases?: BePhase[] | null; canForceCancel?: boolean | null }
interface BeSession { sessionId: number; sessionDate: string; status: string; assignedToName?: string | null; canForceClose?: boolean | null }

const toPlan = (id: string, name: string, horseName: string, type: string, startDate: string, endDate: string, status: string, track: TrackType | null, canForceCancel: boolean): AdminPlan => {
  const [statusLabel, tone] = label(PLAN_LABEL, status);
  return { id, name, horseName, type: type || '—', startDate, endDate, status, statusLabel, tone, open: OPEN_PLAN.includes(status), track, canForceCancel };
};
const toSession = (id: string, sessionDate: string, time: string, groom: string, status: string, canForceClose: boolean): AdminSession => {
  const [statusLabel, tone] = label(SESSION_LABEL, status);
  return { id, date: sessionDate, time, groom, status, statusLabel, tone, canForceClose };
};

const feSessionStatus = (s: TrainingSession) => {
  if (s.status === 'SCHEDULED') return s.confirmed ? 'CONFIRMED' : 'PENDING';
  if (s.status === 'PAUSED_PENDING_TRAINER') return 'PAUSED';
  if (s.status === 'RESUMED') return 'IN_PROGRESS';
  if (s.status === 'STOPPED') return s.decision?.type === 'STOP_VET' ? 'WAITING_VET' : s.cancelled ? 'CANCELLED' : 'STOPPED';
  return s.status;
};

const checkReason = (reason: string) => {
  const why = reason.trim();
  if (why.length < 5 || why.length > 500) throw new Error('Lý do từ 5 đến 500 ký tự.');
  return why;
};

export const trainingAdminApi = {
  async plans(): Promise<AdminPlan[]> {
    if (USE_BACKEND) {
      const page = await beData<{ content: BePlan[] }>(be.get('/training-plans', { params: { page: 0, size: 500 } }));
      return page.content.map((p) => {
        const track = (p.trackType ?? (p.phases?.find((ph) => ph.current) ?? p.phases?.[0])?.trackType ?? null) as TrackType | null;
        const status = (p.status ?? '').toUpperCase();
        return toPlan(String(p.planId), p.planName, p.horseName, p.type ?? '', dmy(p.startDate), dmy(p.endDate), status, track, !!p.canForceCancel);
      });
    }
    const { data } = await http.get<TrainingPlan[]>('/trainingPlans');
    return data.map((p) => {
      const status = FE_PLAN_STATUS[p.status] ?? p.status;
      return toPlan(p.id, p.name, p.horseName, p.type, p.startDate, '—', status, planTrack(p), OPEN_PLAN.includes(status));
    });
  },

  async sessions(planId: string): Promise<AdminSession[]> {
    if (USE_BACKEND) {
      const detail = await beData<{ sessions?: BeSession[] | null }>(be.get(`/training-plans/${planId}`));
      return (detail.sessions ?? []).map((s) => toSession(String(s.sessionId), dmy(s.sessionDate), s.sessionDate?.slice(11, 16) ?? '—', s.assignedToName ?? '—', (s.status ?? '').toUpperCase(), !!s.canForceClose));
    }
    const { data } = await http.get<TrainingSession[]>('/trainingSessions', { params: { planId } });
    return data.map((s) => {
      const status = feSessionStatus(s);
      return toSession(s.id, s.date, s.time, s.groom, status, !FINISHED_SESSION.includes(status));
    });
  },

  async forceCancel(plan: AdminPlan, reason: string, actor: Actor) {
    const why = checkReason(reason);
    if (USE_BACKEND) {
      await be.put(`/training-plans/${plan.id}/force-cancel`, { reason: why });
      invalidate('trainingPlans', 'trainingSessions', 'auditLogs');
      return;
    }
    const { data } = await http.get<TrainingSession[]>('/trainingSessions', { params: { planId: plan.id } });
    const open = data.filter((s) => !FINISHED_SESSION.includes(feSessionStatus(s)));
    await Promise.all(open.map((s) => http.patch(`/trainingSessions/${s.id}`, { status: 'STOPPED', cancelled: s.status === 'SCHEDULED' })));
    await http.patch(`/trainingPlans/${plan.id}`, { status: 'CANCELLED', pausedReason: why });
    await addAudit(actor, { action: 'FORCE_CANCEL_TRAINING_PLAN', label: 'Hủy cưỡng chế giáo án', object: `${plan.id} · ${plan.horseName}`, area: 'train', from: plan.status, to: 'CANCELLED', reason: why });
  },

  async forceClose(plan: AdminPlan, session: AdminSession, reason: string, actor: Actor) {
    const why = checkReason(reason);
    if (USE_BACKEND) {
      await be.put(`/training-sessions/${session.id}/force-close`, { reason: why });
      invalidate('trainingPlans', 'trainingSessions', 'auditLogs');
      return;
    }
    const notStarted = session.status === 'PENDING' || session.status === 'CONFIRMED';
    await http.patch(`/trainingSessions/${session.id}`, { status: 'STOPPED', cancelled: notStarted, pausedReason: why });
    await addAudit(actor, { action: 'FORCE_CLOSE_SESSION', label: 'Đóng cưỡng chế buổi tập', object: `${session.id} · ${plan.horseName}`, area: 'train', from: session.status, to: notStarted ? 'CANCELLED' : 'STOPPED', reason: why });
  },

  async setTrack(plan: AdminPlan, track: TrackType, actor: Actor) {
    if (!track) throw new Error('Chọn loại đường tập.');
    if (USE_BACKEND) {
      await be.put(`/training-plans/${plan.id}/track`, { trackType: track });
      invalidate('trainingPlans', 'trainingSessions', 'auditLogs');
      return;
    }
    const { data } = await http.get<TrainingPlan>(`/trainingPlans/${plan.id}`);
    await http.patch(`/trainingPlans/${plan.id}`, { phases: data.phases.map((ph) => ({ ...ph, trackType: track })) });
    await addAudit(actor, { action: 'SET_PLAN_TRACK', label: 'Gán loại đường cho giáo án', object: `${plan.id} · ${plan.horseName}`, area: 'train', to: trackLabel(track) });
  },
};
