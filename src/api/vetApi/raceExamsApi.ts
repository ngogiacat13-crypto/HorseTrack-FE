import { http } from '../http';
import { USE_BACKEND, be, beData } from '../beClient';
import { mapMedicine } from '../beDomain';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, RaceProposal, Tournament } from '../trainerApi';
import type { InventoryItem, Protocol, VetHorse } from './types';
import { get, now, min } from './shared';

export const raceExamsApi = {
  async getRaceExams() {
    const [loaded, tournaments, horses, protocols, inventory, waiting, done] = await Promise.all([
      get<RaceProposal[]>('/raceProposals'), get<Tournament[]>('/tournaments'), get<VetHorse[]>('/horses'), get<Protocol[]>('/protocols'), get<InventoryItem[]>('/inventory'),
      USE_BACKEND ? beData<{ proposalCode: string }[]>(be.get('/prerace-exams', { params: { tab: 'CHO_KHAM' } })).catch(() => []) : Promise.resolve([]),
      USE_BACKEND ? beData<{ proposalCode: string }[]>(be.get('/prerace-exams', { params: { tab: 'DA_CO_KET_QUA' } })).catch(() => []) : Promise.resolve([]),
    ]);
    const codes = new Set([...waiting, ...done].map((e) => e.proposalCode));
    const matched = loaded.filter((p) => codes.has(p.id));
    const proposals = matched.length ? matched : loaded;
    return { proposals, tournaments, horses, protocols, inventory };
  },

  async getMedicines() {
    if (USE_BACKEND) {
      const meds = await beData<Parameters<typeof mapMedicine>[0][]>(be.get('/medical-management/medications'));
      return meds.map((m) => mapMedicine(m) as unknown as InventoryItem);
    }
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
    const status = input.pass ? 'READY_TO_SUBMIT' : 'VET_FAILED';
    const history = [
      { at: now(), who: `BS ${actor.name}`, text: input.pass ? 'kết luận ĐẠT · gửi kết quả cho chủ ngựa và HLV' : `kết luận KHÔNG ĐẠT: ${note}`, tone: input.pass ? 'success' as const : 'danger' as const },
      ...p.history,
    ];
    const { data } = await http.patch<RaceProposal>(`/raceProposals/${p.id}`, { status, vetResult, history });
    await addAudit(actor, { action: input.pass ? 'RACE_EXAM_PASS' : 'RACE_EXAM_FAIL', label: 'Khám trước thi đấu', object: `${p.id} · ${p.horseName}`, area: 'med', from: 'WAITING_VET_EXAM', to: input.pass ? 'READY_TO_SUBMIT' : 'VET_FAILED', reason: note });
    return data;
  },
};
