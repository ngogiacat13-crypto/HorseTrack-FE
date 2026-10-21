import type { Actor } from '../managerApi';
import type { TrainingPlan, TrainingSession, Tournament, RaceProposal, Vaccination, Stall } from './types';
import { get, myHorses, getMyHorse, ofHorses, withLiveStatus } from './shared';

export const herdApi = {
  async getHerd(actor: Actor) {
    const [horses, plans, sessions, vaccinations] = await Promise.all([
      myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<TrainingSession[]>('/trainingSessions'), get<Vaccination[]>('/vaccinations'),
    ]);
    return { horses, plans: await withLiveStatus(ofHorses(plans, horses), sessions), sessions: ofHorses(sessions, horses), vaccinations: ofHorses(vaccinations, horses) };
  },

  async getHorse(id: string, actor: Actor) {
    const [horse, plans, sessions, vaccinations, proposals, tournaments] = await Promise.all([
      getMyHorse(id, actor),
      get<TrainingPlan[]>('/trainingPlans', { horseId: id }),
      get<TrainingSession[]>('/trainingSessions', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }),
      get<RaceProposal[]>('/raceProposals', { horseId: id }),
      get<Tournament[]>('/tournaments'),
    ]);
    return { horse, plans: await withLiveStatus(plans, sessions), sessions, vaccinations, proposals, tournaments };
  },


  async getStable(actor: Actor) {
    const [stalls, horses] = await Promise.all([get<Stall[]>('/stalls'), myHorses(actor)]);
    const mine = new Set(horses.map((h) => h.id));
    const visibleStalls = stalls.filter((st) => !st.horseId || mine.has(st.horseId));
    return { stalls: visibleStalls, horses };
  },
};
