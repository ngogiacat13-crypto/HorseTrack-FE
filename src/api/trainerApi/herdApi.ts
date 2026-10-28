import type { Actor } from '../managerApi';
import { be, beData, USE_BACKEND } from '../beClient';
import type { FeedRequest } from '../vetApi';
import type { TrainingPlan, TrainingSession, Tournament, RaceProposal, Vaccination, Stall } from './types';
import { get, myHorses, getMyHorse, ofHorses, withLiveStatus } from './shared';

export const herdApi = {
  async getHerd(actor: Actor) {
    const [horses, plans, sessions, vaccinations, stats, feedRequests] = await Promise.all([
      myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<TrainingSession[]>('/trainingSessions'), get<Vaccination[]>('/vaccinations'),
      USE_BACKEND
        ? beData<{ totalActivePlans: number; todaysSessions: number; injuredHorses: number }>(be.get('/training-plans/dashboard-stats')).catch(() => null)
        : Promise.resolve(null),
      USE_BACKEND ? get<FeedRequest[]>('/feedRequests').catch(() => [] as FeedRequest[]) : Promise.resolve([] as FeedRequest[]),
    ]);
    return { horses, plans: await withLiveStatus(ofHorses(plans, horses), sessions), sessions: ofHorses(sessions, horses), vaccinations: ofHorses(vaccinations, horses), stats, feedRequests };
  },

  async getHorse(id: string, actor: Actor) {
    const [horse, plans, sessions, vaccinations, proposals, tournaments, feedRequests] = await Promise.all([
      getMyHorse(id, actor),
      get<TrainingPlan[]>('/trainingPlans', { horseId: id }),
      get<TrainingSession[]>('/trainingSessions', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }),
      get<RaceProposal[]>('/raceProposals', { horseId: id }),
      get<Tournament[]>('/tournaments'),
      USE_BACKEND ? get<FeedRequest[]>('/feedRequests', { horseId: id }).catch(() => [] as FeedRequest[]) : Promise.resolve([] as FeedRequest[]),
    ]);
    return { horse, plans: await withLiveStatus(plans, sessions), sessions, vaccinations, proposals, tournaments, feedRequests };
  },


  async getStable(actor: Actor) {
    const [stalls, horses] = await Promise.all([get<Stall[]>('/stalls'), myHorses(actor)]);
    const mine = new Set(horses.map((h) => h.id));
    const visibleStalls = stalls.filter((st) => !st.horseId || mine.has(st.horseId));
    return { stalls: visibleStalls, horses };
  },
};
