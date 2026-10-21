import { herdApi } from './herdApi';
import { plansApi } from './plansApi';
import { scheduleApi } from './scheduleApi';
import { sessionsApi } from './sessionsApi';
import { racesApi } from './racesApi';

export * from './types';
export * from './labels';

export const trainerApi = { ...herdApi, ...plansApi, ...scheduleApi, ...sessionsApi, ...racesApi };
