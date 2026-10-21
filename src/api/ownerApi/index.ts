import { herdApi } from './herdApi';
import { racesApi } from './racesApi';
import { financeApi } from './financeApi';
import { registrationsApi } from './registrationsApi';

export * from './types';
export * from './labels';
export { raceStats } from './herdApi';

export const ownerApi = { ...herdApi, ...racesApi, ...financeApi, ...registrationsApi };
