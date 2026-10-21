import { tasksApi } from './tasksApi';
import { sessionsApi } from './sessionsApi';
import { reportsApi } from './reportsApi';
import { USE_BACKEND } from '../beClient';
import { groomSupplyBe } from '../beActions';

export * from './types';
export { lateBy } from './tasksApi';
export { CANCELLABLE } from './reportsApi';

const base = { ...tasksApi, ...sessionsApi, ...reportsApi };
export const groomApi: typeof base = USE_BACKEND ? { ...base, ...groomSupplyBe } : base;
