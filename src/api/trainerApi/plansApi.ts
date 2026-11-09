import { http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import { be, beData, USE_BACKEND } from '../beClient';
import { invalidate } from '../hybridAdapter';
import { planAdjustable, trackLabel } from './labels';
import type { PlanPhase, TrainingPlan, TrainingSession } from './types';
import { get, nextId, myHorses, ofHorses, getHorseChecked, withLiveStatus, withPlanFlags, CURRENT_PLAN } from './shared';

export interface PlanInput { name: string; type: string; goal: string; startDate: string; phases: PlanPhase[] }

const dmyToDate = (dmy: string) => {
  const [dd, mm, yyyy] = dmy.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
};
const planEnd = (startDate: string, phases: PlanPhase[]) => {
  const weeks = phases.reduce((s, p) => s + (Number(p.weeks) || 0), 0) || 1;
  return new Date(dmyToDate(startDate).getTime() + (weeks * 7 - 1) * 864e5);
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const bePlanBody = (horseId: string, name: string, input: PlanInput) => ({
  horseId: Number(horseId), planName: name, startDate: iso(dmyToDate(input.startDate)), endDate: iso(planEnd(input.startDate, input.phases)),
  goal: input.goal.trim().slice(0, 500) || undefined, type: input.type.slice(0, 50),
  phases: input.phases.map((ph, i) => ({
    phaseNo: i + 1, name: ph.name.trim() || `Giai đoạn ${i + 1}`, weeks: Number(ph.weeks) || 1, intensity: ph.intensity,
    trackType: ph.trackType, sessionsPerWeek: Number(ph.sessionsPerWeek) || undefined, maxHeartRate: Number(ph.hrLimit) || undefined,
  })),
});

const assertPlanShape = (name: string, input: PlanInput) => {
  if (name.length < 5 || name.length > 80) throw new Error('Tên giáo án từ 5 đến 80 ký tự.');
  if (input.phases.length !== 1) throw new Error('Mỗi giáo án chỉ gồm đúng 1 giai đoạn. Hết giai đoạn này hãy kết thúc giáo án, rồi lập giáo án mới.');
  if (!input.phases[0].trackType) throw new Error('Phải chọn loại đường tập: Cỏ nhân tạo, Đường đất hoặc Đường cỏ.');
};

export const plansApi = {
  async getPlans(actor: Actor) {
    const [plans, horses, sessions, available] = await Promise.all([
      get<TrainingPlan[]>('/trainingPlans'),
      myHorses(actor),
      get<TrainingSession[]>('/trainingSessions'),
      USE_BACKEND ? beData<{ horseId: number }[]>(be.get('/horses/available-for-training')).catch(() => null) : Promise.resolve(null),
    ]);
    const availableIds = available ? available.map((h) => String(h.horseId)) : null;
    return { plans: withPlanFlags(await withLiveStatus(ofHorses(plans, horses), sessions), sessions), horses, sessions: ofHorses(sessions, horses), availableIds };
  },

  async createPlan(input: PlanInput & { horseId: string }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const name = input.name.trim();
    assertPlanShape(name, input);
    const phases = input.phases.map((ph, i) => ({ ...ph, no: i + 1 }));
    if (USE_BACKEND) {
      const planId = await beData<number>(be.post('/training-plans', bePlanBody(horse.id, name, input)));
      invalidate('trainingPlans', 'trainingSessions');
      return { id: String(planId), horseId: horse.id, horseName: horse.name, name, type: input.type, goal: input.goal, phases, currentPhase: 1, week: 1, status: 'PLANNED', startDate: input.startDate, createdBy: '—' } as TrainingPlan;
    }
    const all = await get<TrainingPlan[]>('/trainingPlans');
    const old = all.filter((p) => p.horseId === horse.id && CURRENT_PLAN.includes(p.status));
    await Promise.all(old.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'REPLACED' })));
    const plan: TrainingPlan = {
      id: nextId(all.map((p) => p.id), 'KH-'), horseId: horse.id, horseName: horse.name, name, type: input.type, goal: input.goal,
      phases, currentPhase: 1, week: 1, status: 'PLANNED',
      startDate: input.startDate, createdBy: actor.name,
    };
    const { data } = await http.post<TrainingPlan>('/trainingPlans', plan);
    await addAudit(actor, { action: 'CREATE_TRAINING_PLAN', label: 'Tạo giáo án', object: `${data.id} · ${horse.name}`, area: 'train', to: `${name} · ${input.type} · ${input.phases.length} giai đoạn`, reason: input.goal });
    return data;
  },

  async updatePlan(plan: TrainingPlan, input: PlanInput, actor: Actor) {
    const horse = await getHorseChecked(plan.horseId, actor);
    const name = input.name.trim();
    assertPlanShape(name, input);
    const phases = input.phases.map((ph, i) => ({ ...ph, no: i + 1 }));
    if (USE_BACKEND) {
      await be.put(`/training-plans/${plan.id}`, bePlanBody(horse.id, name, input));
      invalidate('trainingPlans', 'trainingSessions');
      return { ...plan, name, type: input.type, goal: input.goal, startDate: input.startDate, phases, currentPhase: 1 };
    }
    const sessions = await get<TrainingSession[]>('/trainingSessions');
    if (!planAdjustable(plan, sessions)) throw new Error('Nhân viên đã xác nhận buổi tập của giáo án này, không điều chỉnh được nữa.');
    const { data } = await http.patch<TrainingPlan>(`/trainingPlans/${plan.id}`, { name, type: input.type, goal: input.goal, startDate: input.startDate, phases, currentPhase: 1 });
    await addAudit(actor, { action: 'UPDATE_TRAINING_PLAN', label: 'Điều chỉnh giáo án', object: `${plan.id} · ${horse.name}`, area: 'train', from: `${plan.name} · ${plan.type}`, to: `${name} · ${input.type} · ${trackLabel(input.phases[0].trackType)}` });
    return data;
  },

  async cancelPlan(plan: TrainingPlan, reason: string, actor: Actor) {
    if (!plan.canCancel) throw new Error('Giáo án này không hủy được nữa.');
    const why = reason.trim();
    if (why.length < 5 || why.length > 500) throw new Error('Lý do hủy từ 5 đến 500 ký tự.');
    await getHorseChecked(plan.horseId, actor);
    if (USE_BACKEND) {
      await be.put(`/training-plans/${plan.id}/cancel`, { reason: why });
      invalidate('trainingPlans', 'trainingSessions');
      return;
    }
    const sessions = await get<{ id: string; planId: string; status: string }[]>('/trainingSessions');
    await Promise.all(sessions.filter((s) => s.planId === plan.id && s.status === 'SCHEDULED').map((s) => http.patch(`/trainingSessions/${s.id}`, { status: 'STOPPED' })));
    await http.patch(`/trainingPlans/${plan.id}`, { status: 'CANCELLED', pausedReason: why });
    await addAudit(actor, { action: 'CANCEL_TRAINING_PLAN', label: 'Hủy giáo án', object: `${plan.id} · ${plan.horseName}`, area: 'train', from: plan.status, to: 'CANCELLED', reason: why });
  },

  async resumePlan(plan: TrainingPlan, actor: Actor) {
    if (plan.status !== 'PAUSED') throw new Error('Chỉ cho chạy lại giáo án đang tạm dừng.');
    const horse = await getHorseChecked(plan.horseId, actor);
    if (horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện — giáo án chạy lại khi bác sĩ mở khóa.`);
    if (USE_BACKEND) {
      await be.put(`/training-plans/${plan.id}/resume`);
      invalidate('trainingPlans', 'trainingSessions');
      return;
    }
    await http.patch(`/trainingPlans/${plan.id}`, { status: 'ACTIVE', pausedReason: undefined });
    await addAudit(actor, { action: 'RESUME_TRAINING_PLAN', label: 'Cho giáo án chạy lại', object: `${plan.id} · ${plan.horseName}`, area: 'train', from: 'PAUSED', to: 'ACTIVE' });
  },
};

