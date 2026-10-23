import { DEMO_NOW, http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { Tournament, RaceProposal } from './types';
import { raceBlock } from './labels';
import { get, nextId, myHorses, getMyHorse, ofHorses } from './shared';
import { USE_BACKEND, notOnServer } from '../beClient';

export const racesApi = {
  async getRaces(actor: Actor) {
    const [tournaments, proposals, horses] = await Promise.all([get<Tournament[]>('/tournaments'), get<RaceProposal[]>('/raceProposals'), myHorses(actor)]);
    return { tournaments, proposals: ofHorses(proposals, horses), horses };
  },

  async createProposal(input: { horseId: string; tournamentId: string; note: string }, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('tạo đề xuất thi đấu');
    const [horse, tournament, existing] = await Promise.all([
      getMyHorse(input.horseId, actor), get<Tournament>(`/tournaments/${input.tournamentId}`), get<RaceProposal[]>('/raceProposals', { horseId: input.horseId }),
    ]);
    const block = raceBlock(horse);
    if (block) throw new Error(`${horse.name}: ${block}`);
    if (tournament.finished) throw new Error('Giải đấu đã kết thúc.');
    const dup = existing.find((p) => p.tournamentId === tournament.id && !['VET_FAILED', 'OWNER_DECLINED', 'REJECTED_BY_ORGANIZER'].includes(p.status));
    if (dup) throw new Error(`${horse.name} đã có đề xuất ${dup.id} cho giải này.`);
    const all = await get<RaceProposal[]>('/raceProposals');
    const proposal: RaceProposal = {
      id: nextId(all.map((p) => p.id), 'DX-'), horseId: horse.id, horseName: horse.name, owner: horse.owner, tournamentId: tournament.id,
      status: 'WAITING_OWNER', createdAt: DEMO_NOW.date, createdBy: actor.name, note: input.note.trim() || undefined,
      history: [{ at: DEMO_NOW.short, who: actor.name, text: 'tạo đề xuất · chờ chủ ngựa đồng ý' }],
      vetResult: null, ownerResponse: null, result: null,
    };
    const { data } = await http.post<RaceProposal>('/raceProposals', proposal);
    await addAudit(actor, { action: 'CREATE_RACE_PROPOSAL', label: 'Tạo đề xuất thi đấu', object: `${data.id} · ${horse.name}`, area: 'train', to: 'WAITING_OWNER', reason: `${tournament.name} · ${tournament.date}` });
    return data;
  },

  async markSubmitted(p: RaceProposal, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('đánh dấu đã gửi hồ sơ ban tổ chức');
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'READY_TO_SUBMIT') throw new Error('Chỉ gửi hồ sơ khi chủ ngựa đã đồng ý.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: 'đánh dấu đã gửi hồ sơ cho ban tổ chức (ngoài hệ thống)' }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status: 'SUBMITTED', history });
    await addAudit(actor, { action: 'MARK_PROPOSAL_SUBMITTED', label: 'Cập nhật đã gửi BTC', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'READY_TO_SUBMIT', to: 'SUBMITTED' });
    return data;
  },

  async markOrganizerRejected(p: RaceProposal, reason: string, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('ghi nhận ban tổ chức từ chối');
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'SUBMITTED') throw new Error('Chỉ cập nhật khi hồ sơ đã gửi ban tổ chức.');
    if (reason.trim().length < 10) throw new Error('Lý do ít nhất 10 ký tự.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: `ban tổ chức từ chối: ${reason.trim()}`, tone: 'danger' as const }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status: 'REJECTED_BY_ORGANIZER', organizerReason: reason.trim(), history });
    await addAudit(actor, { action: 'MARK_ORGANIZER_REJECTED', label: 'Ban tổ chức từ chối', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'SUBMITTED', to: 'REJECTED_BY_ORGANIZER', reason: reason.trim() });
    return data;
  },

  async recordResult(p: RaceProposal, result: { rank: number; time: string; note: string }, actor: Actor) {
    if (USE_BACKEND) throw notOnServer('ghi kết quả thi đấu');
    await getMyHorse(p.horseId, actor);
    if (p.status !== 'SUBMITTED') throw new Error('Chỉ nhập kết quả cho hồ sơ đã gửi ban tổ chức.');
    if (!Number.isInteger(result.rank) || result.rank < 1) throw new Error('Thứ hạng phải là số nguyên ≥ 1.');
    if (!/^\d{1,2}:\d{2}\.\d{2}$/.test(result.time)) throw new Error('Thời gian theo dạng m:ss.cc, ví dụ 1:38.42.');
    const history = [{ at: DEMO_NOW.short, who: actor.name, text: `nhập kết quả: Hạng ${result.rank} · ${result.time}`, tone: 'success' as const }, ...p.history];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, {
      status: 'RESULT_RECORDED', result: { rank: result.rank, time: result.time, note: result.note.trim() || undefined }, history,
    });
    await addAudit(actor, { action: 'RECORD_RACE_RESULT', label: 'Nhập kết quả thi đấu', object: `${p.id} · ${p.horseName}`, area: 'train', from: 'SUBMITTED', to: `Hạng ${result.rank} · ${result.time}` });
    return data;
  },

};
