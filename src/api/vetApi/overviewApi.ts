import type { RaceProposal, Vaccination } from '../trainerApi';
import type { VetCase, Protocol, FeedRequest, VetHorse } from './types';
import { get } from './shared';

export const overviewApi = {
  /* ----- Dashboard: herd health ----- */
  async getOverview() {
    const [horses, cases, protocols, vaccinations, proposals, feedRequests] = await Promise.all([
      get<VetHorse[]>('/horses'), get<VetCase[]>('/vetCases'), get<Protocol[]>('/protocols'), get<Vaccination[]>('/vaccinations'),
      get<RaceProposal[]>('/raceProposals'), get<FeedRequest[]>('/feedRequests'),
    ]);
    return { horses, cases, protocols, vaccinations, proposals, feedRequests };
  },

};
