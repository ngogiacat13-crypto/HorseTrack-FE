import { overviewApi } from './overviewApi';
import { casesApi } from './casesApi';
import { healthApi } from './healthApi';
import { protocolsApi } from './protocolsApi';
import { vaccinationsApi } from './vaccinationsApi';
import { raceExamsApi } from './raceExamsApi';
import { USE_BACKEND } from '../beClient';
import { vetProtocolBe } from '../beActions';

export * from './types';
export * from './labels';
export * from './dates';
export * from './drugs';
export { protoCost, stockShort } from './shared';

const base = { ...overviewApi, ...casesApi, ...healthApi, ...protocolsApi, ...vaccinationsApi, ...raceExamsApi };
export const vetApi: typeof base = USE_BACKEND ? { ...base, ...vetProtocolBe } : base;
