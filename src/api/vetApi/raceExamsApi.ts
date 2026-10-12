import { http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, RaceProposal, Tournament } from '../trainerApi';
import type { InventoryItem, Protocol, VetHorse } from './types';
import { get, now, min } from './shared';

export const raceExamsApi = {
  /* ----- 5.x Pre-race exam (BR_04) ----- */
  async getRaceExams() {
    const [proposals, tournaments, horses, protocols, inventory] = await Promise.all([
      get<RaceProposal[]>('/raceProposals'), get<Tournament[]>('/tournaments'), get<VetHorse[]>('/horses'), get<Protocol[]>('/protocols'), get<InventoryItem[]>('/inventory'),
    ]);
    return { proposals, tournaments, horses, protocols, inventory };
  },

  /* ----- Medicine catalogue (read-only for the vet; stock is owned by the warehouse) ----- */
  async getMedicines() {
    const inventory = await get<InventoryItem[]>('/inventory');
    return inventory.filter((i) => i.category !== 'Thức ăn');
  },


  async recordRaceExam(p: RaceProposal, input: { pass: boolean; note: string; conditions: string }, actor: Actor) {
    if (p.status !== 'WAITING_VET_EXAM') throw new Error('Đề xuất này không chờ khám trước thi đấu.');
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    if (input.pass && horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện — không thể kết luận ĐẠT (BR_01).`);
    if (input.pass && (horse.health === 'INJURED' || horse.health === 'QUARANTINE')) throw new Error(`${horse.name} đang ${horse.health === 'INJURED' ? 'chấn thương' : 'cách ly'} — không thể kết luận ĐẠT.`);
    const note = min(input.note, 10, input.pass ? 'Nhận xét khám' : 'Lý do không đạt');
    const vetResult = { pass: input.pass, by: actor.name, at: now(), note, conditions: input.conditions.trim() || undefined };
    const status = input.pass ? 'WAITING_OWNER' : 'VET_FAILED';
    const history = [
      { at: now(), who: `BS ${actor.name}`, text: input.pass ? 'kết luận ĐẠT · gửi kết quả cho chủ ngựa và HLV' : `kết luận KHÔNG ĐẠT: ${note}`, tone: input.pass ? 'success' as const : 'danger' as const },
      ...p.history,
    ];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status, vetResult, history });
    await addAudit(actor, { action: input.pass ? 'RACE_EXAM_PASS' : 'RACE_EXAM_FAIL', label: 'Khám trước thi đấu', object: `${p.id} · ${p.horseName}`, area: 'med', from: 'WAITING_VET_EXAM', to: input.pass ? 'VET_PASSED → WAITING_OWNER' : 'VET_FAILED', reason: note });
    return data;
  },
};
