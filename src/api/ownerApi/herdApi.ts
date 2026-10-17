import type { Actor } from '../managerApi';
import type { Horse, RaceProposal, Tournament, TrainingPlan, TrainingSession, Vaccination } from '../trainerApi';
import { isOpenProtocol, type Protocol, type VetCase } from '../vetApi';
import { invoiceDue, isPaid } from './labels';
import { get, myHorse, myHorses } from './shared';
import type { OwnerInvoice, RaceResult } from './types';

const results = (h: Horse) => h.raceResults ?? [];

/** Starts / wins / top 3 / best rank from the results entered into the system (1.3). */
export const raceStats = (rs: RaceResult[]) => ({
  starts: rs.length,
  wins: rs.filter((r) => r.rank === 1).length,
  top3: rs.filter((r) => r.rank <= 3).length,
  best: rs.length ? Math.min(...rs.map((r) => r.rank)) : null,
});

/* 1.1–1.3 Ngựa của tôi · 4.1–4.3 thông tin y tế chỉ xem (BR_09) */
export const herdApi = {
  async getMyHorses(actor: Actor) {
    const [horses, plans, protocols, proposals, invoices] = await Promise.all([
      myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<Protocol[]>('/protocols'), get<RaceProposal[]>('/raceProposals'), get<OwnerInvoice[]>('/invoices'),
    ]);
    const mine = invoices.filter((i) => i.owner === actor.name);
    return {
      horses: horses.map((h) => ({
        horse: h,
        plan: plans.find((p) => p.horseId === h.id && p.status === 'ACTIVE') ?? null,
        protocol: protocols.find((p) => p.horseId === h.id && p.state !== 'SUPERSEDED' && isOpenProtocol(p)) ?? null,
        stats: raceStats(results(h)),
      })),
      waitingProposals: proposals.filter((p) => p.owner === actor.name && p.status === 'WAITING_OWNER'),
      openInvoices: mine.filter((i) => !isPaid(i)).map((i) => ({ invoice: i, due: invoiceDue(i) })),
    };
  },

  async getMyHorse(id: string, actor: Actor) {
    const horse = await myHorse(id, actor);
    const [plans, sessions, protocols, cases, vaccinations, proposals, tournaments, invoices] = await Promise.all([
      get<TrainingPlan[]>('/trainingPlans', { horseId: id }), get<TrainingSession[]>('/trainingSessions', { horseId: id }),
      get<Protocol[]>('/protocols', { horseId: id }), get<VetCase[]>('/vetCases', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }), get<RaceProposal[]>('/raceProposals', { horseId: id }),
      get<Tournament[]>('/tournaments'), get<OwnerInvoice[]>('/invoices', { horseId: id }),
    ]);
    const rs = results(horse).slice().sort((a, b) => b.date.split('/').reverse().join('').localeCompare(a.date.split('/').reverse().join('')));
    // 4.3 — medical costs already billed + the estimate of open protocols (not billed yet).
    const billed = invoices.filter((i) => i.owner === actor.name).flatMap((i) => i.lines.filter((l) => l.kind === 'MED').map((l) => ({ ...l, invoiceId: i.id, paid: isPaid(i) })));
    const shown = protocols.filter((p) => p.state !== 'SUPERSEDED');
    return {
      horse,
      plan: plans.find((p) => p.status === 'ACTIVE') ?? null,
      sessions: sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'STOPPED').slice(-5).reverse(),
      protocols: shown,
      cases: cases.slice().sort((a, b) => b.id.localeCompare(a.id)),
      vaccinations,
      proposals: proposals.map((p) => ({ proposal: p, tournament: tournaments.find((t) => t.id === p.tournamentId) })),
      results: rs,
      stats: raceStats(rs),
      medicalCost: { billed, estimate: shown.filter(isOpenProtocol).map((p) => ({ id: p.id, diagnosis: p.diagnosis, cost: p.cost })) },
    };
  },
};
