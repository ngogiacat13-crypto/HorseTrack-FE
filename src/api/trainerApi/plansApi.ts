import { http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { PlanPhase, TrainingPlan } from './types';
import { get, nextId, myHorses, ofHorses, getHorseChecked } from './shared';

export const plansApi = {
  /* ----- Training plans (1.2) ----- */
  async getPlans(actor: Actor) {
    const [plans, horses] = await Promise.all([get<TrainingPlan[]>('/trainingPlans'), myHorses(actor)]);
    return { plans: ofHorses(plans, horses), horses };
  },

  async createPlan(input: { horseId: string; name: string; type: string; goal: string; startDate: string; phases: PlanPhase[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const name = input.name.trim();
    if (name.length < 5 || name.length > 80) throw new Error('Tên giáo án từ 5 đến 80 ký tự.');
    if (!input.phases.length) throw new Error('Giáo án cần ít nhất 1 giai đoạn.');
    const all = await get<TrainingPlan[]>('/trainingPlans');
    // One running plan per horse: the old ACTIVE/PAUSED one is marked REPLACED.
    const old = all.filter((p) => p.horseId === horse.id && (p.status === 'ACTIVE' || p.status === 'PAUSED'));
    await Promise.all(old.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'REPLACED' })));
    const plan: TrainingPlan = {
      id: nextId(all.map((p) => p.id), 'KH-'), horseId: horse.id, horseName: horse.name, name, type: input.type, goal: input.goal,
      phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1 })), currentPhase: 1, week: 1, status: 'ACTIVE',
      startDate: input.startDate, createdBy: actor.name,
    };
    const { data } = await http.post<TrainingPlan>('/trainingPlans', plan);
    await addAudit(actor, { action: 'CREATE_TRAINING_PLAN', label: 'Tạo giáo án', object: `${data.id} · ${horse.name}`, area: 'train', to: `${name} · ${input.type} · ${input.phases.length} giai đoạn`, reason: input.goal });
    return data;
  },

};
