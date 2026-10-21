import { http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import { be, beData, USE_BACKEND } from '../beClient';
import { invalidate } from '../hybridAdapter';
import type { Horse, PlanPhase, TrainingPlan } from './types';
import { get, nextId, myHorses, ofHorses, getHorseChecked, withLiveStatus, CURRENT_PLAN } from './shared';

const beCreatePlan = async (horse: Horse, name: string, input: { type: string; goal: string; startDate: string; phases: PlanPhase[] }): Promise<TrainingPlan> => {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [dd, mm, yyyy] = input.startDate.split('/').map(Number);
  const start = new Date(yyyy, mm - 1, dd);
  const weeks = input.phases.reduce((s, p) => s + (Number(p.weeks) || 0), 0) || 1;
  const end = new Date(start.getTime() + (weeks * 7 - 1) * 864e5);
  const goal = [`[${input.type} · ${input.phases.length} giai đoạn · ${weeks} tuần]`, input.goal.trim()].filter(Boolean).join(' ').slice(0, 500);
  const planId = await beData<number>(be.post('/training-plans', { horseId: Number(horse.id), planName: name, startDate: iso(start), endDate: iso(end), goal }));
  invalidate('trainingPlans', 'trainingSessions');
  return {
    id: String(planId), horseId: horse.id, horseName: horse.name, name, type: input.type, goal: input.goal,
    phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1 })), currentPhase: 1, week: 1, status: 'ACTIVE', startDate: input.startDate, createdBy: '—',
  };
};

export const plansApi = {
  async getPlans(actor: Actor) {
    const [plans, horses] = await Promise.all([get<TrainingPlan[]>('/trainingPlans'), myHorses(actor)]);
    return { plans: await withLiveStatus(ofHorses(plans, horses)), horses };
  },

  async createPlan(input: { horseId: string; name: string; type: string; goal: string; startDate: string; phases: PlanPhase[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const name = input.name.trim();
    if (name.length < 5 || name.length > 80) throw new Error('Tên giáo án từ 5 đến 80 ký tự.');
    if (!input.phases.length) throw new Error('Giáo án cần ít nhất 1 giai đoạn.');
    if (USE_BACKEND) return beCreatePlan(horse, name, input);
    const all = await get<TrainingPlan[]>('/trainingPlans');
    const old = all.filter((p) => p.horseId === horse.id && CURRENT_PLAN.includes(p.status));
    await Promise.all(old.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'REPLACED' })));
    const plan: TrainingPlan = {
      id: nextId(all.map((p) => p.id), 'KH-'), horseId: horse.id, horseName: horse.name, name, type: input.type, goal: input.goal,
      phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1 })), currentPhase: 1, week: 1, status: 'PLANNED',
      startDate: input.startDate, createdBy: actor.name,
    };
    const { data } = await http.post<TrainingPlan>('/trainingPlans', plan);
    await addAudit(actor, { action: 'CREATE_TRAINING_PLAN', label: 'Tạo giáo án', object: `${data.id} · ${horse.name}`, area: 'train', to: `${name} · ${input.type} · ${input.phases.length} giai đoạn`, reason: input.goal });
    return data;
  },

};
