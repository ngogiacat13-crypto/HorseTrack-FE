// ==================== API — BÁC SĨ THÚ Y (Veterinarian) ====================
// Business rules enforced here, not only in the UI:
//  - BR_01: only the vet locks / unlocks training; a lock pauses the horse's running training plan.
//  - BR_03: the vet sets the medical diet and approves special feed; it overrides the normal ration.
//  - BR_04: pre-race exam — PASS moves the proposal to the owner, FAIL stops it. A locked/injured horse cannot pass.
//  - BR_07: the vet builds and confirms the protocol after the warehouse stock answer. No Club Manager approval.
//           A protocol replaced by a new version becomes SUPERSEDED and is never dispensed.
// One file per area; pages import everything from 'api/vetApi'.
import { overviewApi } from './overviewApi';
import { casesApi } from './casesApi';
import { healthApi } from './healthApi';
import { protocolsApi } from './protocolsApi';
import { vaccinationsApi } from './vaccinationsApi';
import { raceExamsApi } from './raceExamsApi';

export * from './types';
export * from './labels';
export * from './dates';
export * from './drugs';
export { protoCost, stockShort } from './shared';

export const vetApi = { ...overviewApi, ...casesApi, ...healthApi, ...protocolsApi, ...vaccinationsApi, ...raceExamsApi };
