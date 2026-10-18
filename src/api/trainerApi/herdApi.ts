import type { Actor } from '../managerApi';
import type { TrainingPlan, TrainingSession, Tournament, RaceProposal, Vaccination, Stall } from './types';
import { get, myHorses, getMyHorse, ofHorses } from './shared';

export const herdApi = {
  /* ----- Herd overview (1.1, 4.2, 4.3) ----- */
  async getHerd(actor: Actor) {
    const [horses, plans, sessions, vaccinations] = await Promise.all([
      myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<TrainingSession[]>('/trainingSessions'), get<Vaccination[]>('/vaccinations'),
    ]);
    return { horses, plans: ofHorses(plans, horses), sessions: ofHorses(sessions, horses), vaccinations: ofHorses(vaccinations, horses) };
  },

  /* ----- Horse record (1.5, 4.1–4.3; read-only health) ----- */
  async getHorse(id: string, actor: Actor) {
    const [horse, plans, sessions, vaccinations, proposals, tournaments] = await Promise.all([
      getMyHorse(id, actor),
      get<TrainingPlan[]>('/trainingPlans', { horseId: id }),
      get<TrainingSession[]>('/trainingSessions', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }),
      get<RaceProposal[]>('/raceProposals', { horseId: id }),
      get<Tournament[]>('/tournaments'),
    ]);
    return { horse, plans, sessions, vaccinations, proposals, tournaments };
  },


  /* ----- Stable map (read-only for the trainer) ----- */
  async getStable(actor: Actor) {
    const [stalls, horses] = await Promise.all([get<Stall[]>('/stalls'), myHorses(actor)]);
    const mine = new Set(horses.map((h) => h.id));
    // HLV chỉ thấy chuồng trống và chuồng đang chứa ngựa do mình phụ trách.
    // Không hiển thị ngựa hoặc placeholder của HLV khác trên sơ đồ này.
    const visibleStalls = stalls.filter((st) => !st.horseId || mine.has(st.horseId));
    return { stalls: visibleStalls, horses };
  },
};
