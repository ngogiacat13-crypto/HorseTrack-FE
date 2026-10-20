// ==================== API — NGƯỜI CHĂM NGỰA (Groom) ====================
// The Groom does the daily care, runs the sessions the trainer assigned and reports problems:
//  - BR_05: task SLA 45 minutes; a late task is reported to the Club Manager.
//  - BR_01: a session cannot start while the horse is under a vet lock.
//  - BR_02: a reading over the threshold pauses the session (PAUSED_PENDING_TRAINER); the Groom cannot skip it.
//  - BR_03: the vet diet is read-only for the Groom; changes go to the vet as a request.
import { tasksApi } from './tasksApi';
import { sessionsApi } from './sessionsApi';
import { reportsApi } from './reportsApi';
import { USE_BACKEND } from '../beClient';
import { groomSupplyBe } from '../beActions';

export * from './types';
export { lateBy } from './tasksApi';

const base = { ...tasksApi, ...sessionsApi, ...reportsApi };
// dev:be → supply requests go to /api/v1/supply-requests
export const groomApi: typeof base = USE_BACKEND ? { ...base, ...groomSupplyBe } : base;
