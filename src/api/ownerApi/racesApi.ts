import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import type { RaceProposal, Tournament } from '../trainerApi';
import { get, min, now, DENIED } from './shared';
import { USE_BACKEND, notOnServer } from '../beClient';

export const racesApi = {
  async getMyProposals(actor: Actor) {
    const [proposals, tournaments] = await Promise.all([get<RaceProposal[]>('/raceProposals'), get<Tournament[]>('/tournaments')]);
    return proposals
      .filter((p) => p.owner === actor.name)
      .sort((a, b) => b.id.localeCompare(a.id))
      .map((p) => ({ proposal: p, tournament: tournaments.find((t) => t.id === p.tournamentId) }));
  },

  async respondProposal(p: RaceProposal, agree: boolean, note: string, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('trả lời đề xuất thi đấu');
    if (p.owner !== actor.name) throw new Error(DENIED);
    if (p.status !== 'WAITING_OWNER') throw new Error('Đề xuất không ở bước chờ chủ ngựa xác nhận.');
    const reason = agree ? note.trim() : min(note, 10, 'Lý do từ chối');
    const to = agree ? 'WAITING_VET_EXAM' : 'OWNER_DECLINED';
    const ownerResponse: RaceProposal['ownerResponse'] = { agree, at: `${DEMO_NOW.date} ${DEMO_NOW.time}`, reason: reason || undefined };
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, {
      status: to, ownerResponse,
      history: [{ at: now(), who: actor.name, text: agree ? `chủ ngựa đồng ý tham gia${reason ? `: “${reason}”` : ''}` : `chủ ngựa từ chối: “${reason}”`, tone: agree ? 'success' : 'danger' }, ...p.history],
    });
    await addAudit(actor, { action: agree ? 'OWNER_APPROVE_RACE' : 'OWNER_DECLINE_RACE', label: agree ? 'Chủ ngựa đồng ý thi đấu' : 'Chủ ngựa từ chối thi đấu', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'WAITING_OWNER', to, reason: reason || undefined });
    return data;
  },
};
