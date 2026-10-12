// ==================== API — HLV TRƯỞNG (HeadTrainer) ====================
// REST calls (axios → mock db.json or json-server). Business rules enforced here, not only in the UI:
//  - BR_01: a horse under a veterinary training lock cannot get a plan, a session, a "continue" decision or a race proposal.
//  - BR_02: a paused session may only continue after an adjustment AND when the recovery heart rate is back under the threshold.
//  - BR_04: race proposal goes HLV → vet pre-race exam → owner consent; submission to the organizer is a manual step.
// One file per area; pages import everything from 'api/trainerApi'.
import { herdApi } from './herdApi';
import { plansApi } from './plansApi';
import { scheduleApi } from './scheduleApi';
import { sessionsApi } from './sessionsApi';
import { racesApi } from './racesApi';

export * from './types';
export * from './labels';

export const trainerApi = { ...herdApi, ...plansApi, ...scheduleApi, ...sessionsApi, ...racesApi };
