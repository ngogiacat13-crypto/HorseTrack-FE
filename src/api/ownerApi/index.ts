import { herdApi } from './herdApi';
import { racesApi } from './racesApi';
import { financeApi } from './financeApi';
import { registrationsApi } from './registrationsApi';
import { USE_BACKEND } from '../beClient';
import { http } from '../http';
import { financeBe, type BeOwnerInvoice } from '../beFinance';
import type { Actor } from '../managerApi';
import type { Payment } from './types';

export * from './types';
export * from './labels';
export { raceStats } from './herdApi';

const vnPayBe = {
  async startPayment(id: string, _actor: Actor): Promise<Payment> {
    const { data: invoice } = await http.get<BeOwnerInvoice>(`/invoices/${encodeURIComponent(id)}`);
    const { paymentUrl } = await financeBe.startVnPay(invoice.beId);
    window.location.assign(paymentUrl);
    return new Promise<Payment>(() => undefined);
  },
};

const base = { ...herdApi, ...racesApi, ...financeApi, ...registrationsApi };
export const ownerApi: typeof base = USE_BACKEND ? { ...base, ...vnPayBe } : base;
