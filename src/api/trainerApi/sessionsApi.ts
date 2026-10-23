import { DEMO_NOW, http } from '../http';
import { USE_BACKEND, be, notOnServer } from '../beClient';
import { invalidate } from '../hybridAdapter';
import { type Actor, addAudit } from '../managerApi';
import type { Intensity, TrainingPlan, TrainingSession } from './types';
import { get, nextId, getMyHorse, getHorseChecked } from './shared';

export const sessionsApi = {
  async getSession(id: string, actor: Actor) {
    const session = await get<TrainingSession>(`/trainingSessions/${id}`);
    const [horse, plan, history] = await Promise.all([
      getMyHorse(session.horseId, actor),
      get<TrainingPlan>(`/trainingPlans/${session.planId}`),
      get<TrainingSession[]>('/trainingSessions', { horseId: session.horseId }),
    ]);
    const previousMax = history
      .filter((h) => h.id !== session.id && h.status === 'COMPLETED' && h.readings.length)
      .map((h) => Math.max(...h.readings.map((r) => r.hr)))[0] ?? null;
    return { session, horse, plan, previousMax };
  },

  async stopAndRequestVet(s: TrainingSession, note: string, actor: Actor) {
    if (USE_BACKEND) {
      if (note.trim().length < 10) throw new Error('Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.');
      const peak = s.readings[s.readings.length - 1];
      await be.put(`/training-sessions/${s.id}/stop`, { reason: note.trim(), requestVet: true, severity: 'HIGH', heartRate: peak?.hr });
      invalidate('trainingSessions', 'trainingPlans', 'vetCases');
      return { ...s, status: 'WAITING_VET' as const };
    }
    await getMyHorse(s.horseId, actor);
    if (s.status !== 'PAUSED_PENDING_TRAINER') throw new Error('Phiên này không còn chờ quyết định.');
    if (note.trim().length < 10) throw new Error('Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.');
    const cases = await get<{ id: string }[]>('/vetCases');
    const caseId = nextId(cases.map((c) => c.id), 'C-');
    const peak = s.readings[s.readings.length - 1];
    await http.post('/vetCases', {
      id: caseId, horseId: s.horseId, horse: s.horseName, source: 'SESSION_STOP', sessionId: s.id, type: 'Nghi vấn sau phiên tập',
      severity: 'HIGH', status: 'NEW', sender: actor.name, at: DEMO_NOW.short,
      note: `Nhịp tim ${peak?.hr} bpm (ngưỡng ${s.thresholds.hr}). ${note.trim()}`,
    });
    await http.patch(`/horses/${s.horseId}`, { pendingCase: caseId });
    await http.patch(`/trainingPlans/${s.planId}`, { status: 'PAUSED', pausedReason: `Phiên ${s.id} vượt ngưỡng — chờ BS đánh giá ca ${caseId}` });
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, {
      status: 'STOPPED', decision: { type: 'STOP_VET', by: actor.name, at: DEMO_NOW.time, caseId, note: note.trim() },
    });
    await addAudit(actor, { action: 'STOP_SESSION_REQUEST_VET', label: 'Dừng phiên, gửi ca khám', object: `${s.id} · ${s.horseName}`, area: 'train', from: 'PAUSED_PENDING_TRAINER', to: `STOPPED · tạo ${caseId}`, reason: note.trim() });
    return data;
  },

  async adjustAndContinue(s: TrainingSession, adj: { intensity: Intensity; distanceM: number; hrLimit: number; note: string }, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('điều chỉnh giáo án và cho tiếp tục phiên');
    if (s.status !== 'PAUSED_PENDING_TRAINER') throw new Error('Phiên này không còn chờ quyết định.');
    await getHorseChecked(s.horseId, actor);
    const last = (s.recovery ?? [])[(s.recovery ?? []).length - 1];
    if (!last || last.hr >= s.thresholds.hr) throw new Error(`Nhịp tim hồi phục chưa về dưới ngưỡng ${s.thresholds.hr} bpm — không thể tiếp tục (BR_02).`);
    if (adj.note.trim().length < 10) throw new Error('Ghi rõ nội dung điều chỉnh ít nhất 10 ký tự.');
    const plan = await get<TrainingPlan>(`/trainingPlans/${s.planId}`);
    const phases = plan.phases.map((p) => (p.no === s.phaseNo ? { ...p, intensity: adj.intensity, distanceM: adj.distanceM, hrLimit: adj.hrLimit } : p));
    await http.patch(`/trainingPlans/${plan.id}`, { phases });
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, {
      status: 'RESUMED',
      thresholds: { ...s.thresholds, hr: adj.hrLimit },
      decision: { type: 'ADJUST_CONTINUE', by: actor.name, at: DEMO_NOW.time, note: adj.note.trim(), adjustment: { intensity: adj.intensity, distanceM: adj.distanceM, hrLimit: adj.hrLimit } },
    });
    await addAudit(actor, { action: 'ADJUST_AND_CONTINUE', label: 'Điều chỉnh & tiếp tục phiên', object: `${s.id} · ${s.horseName}`, area: 'train', from: 'PAUSED_PENDING_TRAINER', to: `RESUMED · ${adj.intensity} · ${adj.distanceM} m`, reason: adj.note.trim() });
    return data;
  },

};
