// ==================== API — CHỦ NGỰA (HorseOwner) ====================
//  - BR_09: every read is limited to the horses / invoices / proposals of the signed-in owner.
//  - BR_04: the owner agrees or declines before the pre-race vet exam; agree → WAITING_VET_EXAM.
//  - BR_12/13/14: penalty after 10 days, suspension at 25 days, reactivation fee; an invoice is PAID only
//    after the server-side VNPay check — never because the return page said "success".
import { herdApi } from './herdApi';
import { racesApi } from './racesApi';
import { financeApi } from './financeApi';
import { registrationsApi } from './registrationsApi';

export * from './types';
export * from './labels';
export { raceStats } from './herdApi';

export const ownerApi = { ...herdApi, ...racesApi, ...financeApi, ...registrationsApi };
