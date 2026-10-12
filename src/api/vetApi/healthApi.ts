import { DEMO_NOW, http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, Injury, RaceProposal, TrainingPlan, Vaccination } from '../trainerApi';
import type { VetCase, Protocol, MedicalDiet, FeedRequest, VetHorse } from './types';
import { INJURY_SEVERITIES } from './labels';
import { get, nextId, now, min, addHistory } from './shared';

export const healthApi = {
  /* ----- Horse health record (1.3, 1.4, 3.1–3.4) ----- */
  async getHorseHealth(id: string) {
    const [horse, cases, protocols, vaccinations, proposals, feedRequests] = await Promise.all([
      get<VetHorse>(`/horses/${id}`), get<VetCase[]>('/vetCases', { horseId: id }), get<Protocol[]>('/protocols', { horseId: id }),
      get<Vaccination[]>('/vaccinations', { horseId: id }), get<RaceProposal[]>('/raceProposals', { horseId: id }), get<FeedRequest[]>('/feedRequests', { horseId: id }),
    ]);
    return { horse, cases, protocols, vaccinations, proposals, feedRequests };
  },

  async addInjury(horse: Horse, input: { part: string; severity: string; note: string; x: number; y: number; caseId?: string }, actor: Actor) {
    if (!input.part.trim()) throw new Error('Chọn bộ phận bị ảnh hưởng.');
    if (!(INJURY_SEVERITIES as readonly string[]).includes(input.severity)) throw new Error('Chọn mức độ.');
    const note = min(input.note, 5, 'Mô tả');
    const all = horse.injuries ?? [];
    const injury: Injury & { id: string; caseId?: string } = {
      id: nextId(all.map((i) => (i as { id?: string }).id ?? ''), 'INJ-', 2) + '-' + horse.id.slice(2, 5),
      part: input.part.trim(), severity: input.severity, note, date: DEMO_NOW.date, vet: actor.name,
      x: Math.round(Math.min(98, Math.max(2, input.x))), y: Math.round(Math.min(98, Math.max(2, input.y))), caseId: input.caseId || undefined,
    };
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { injuries: [injury, ...all] });
    await addAudit(actor, { action: 'MARK_INJURY', label: 'Đánh dấu chấn thương 2D', object: `${horse.name} · ${injury.part}`, area: 'med', to: input.severity, reason: note });
    return data;
  },

  async removeInjury(horse: Horse, injuryId: string, actor: Actor) {
    const all = horse.injuries as (Injury & { id?: string })[];
    const target = all.find((i) => i.id === injuryId);
    if (!target) throw new Error('Không tìm thấy vết đánh dấu.');
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { injuries: all.filter((i) => i.id !== injuryId) });
    await addAudit(actor, { action: 'REMOVE_INJURY', label: 'Gỡ đánh dấu chấn thương', object: `${horse.name} · ${target.part}`, area: 'med', from: target.severity, to: 'đã gỡ' });
    return data;
  },

  /** 3.1 — BR_01. Pauses the running training plan; the trainer can no longer schedule or continue sessions. */
  async lockTraining(horse: Horse, input: { reason: string; review: string }, actor: Actor) {
    if (horse.trainingLocked) throw new Error(`${horse.name} đang bị khóa huấn luyện.`);
    const reason = min(input.reason, 10, 'Lý do khóa');
    const review = min(input.review, 10, 'Điều kiện đánh giá lại');
    const lock = { by: actor.name, at: DEMO_NOW.date, reason, review };
    const plans = await get<TrainingPlan[]>('/trainingPlans', { horseId: horse.id, status: 'ACTIVE' });
    await Promise.all(plans.map((p) => http.patch(`/trainingPlans/${p.id}`, { status: 'PAUSED', pausedReason: `Tạm dừng do BS ${actor.name} khóa huấn luyện — ${reason}` })));
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { trainingLocked: true, lock });
    await addHistory({ ...horse, ...data }, 'Khóa huấn luyện (BR_01)', 'danger');
    await addAudit(actor, { action: 'LOCK_TRAINING', label: 'Khóa huấn luyện', object: horse.name, area: 'med', from: 'Được tập', to: 'Khóa tập', reason });
    return { horse: data, pausedPlans: plans.length };
  },

  /** 3.2 — BR_01. Only the vet unlocks. Paused plans stay paused: the trainer decides when to resume. */
  async unlockTraining(horse: Horse, note: string, actor: Actor) {
    if (!horse.trainingLocked) throw new Error(`${horse.name} không bị khóa huấn luyện.`);
    const why = min(note, 10, 'Đánh giá đủ điều kiện');
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { trainingLocked: false, lock: null });
    await addHistory({ ...horse, ...data }, 'Mở khóa huấn luyện — đủ điều kiện y tế', 'success');
    await addAudit(actor, { action: 'UNLOCK_TRAINING', label: 'Mở khóa huấn luyện', object: horse.name, area: 'med', from: 'Khóa tập', to: 'Được tập', reason: why });
    return data;
  },

  /** 3.3 — BR_03. null removes the medical diet (back to the normal ration). */
  async setDiet(horse: VetHorse, diet: Omit<MedicalDiet, 'by' | 'at'> | null, actor: Actor) {
    if (diet) {
      if (![diet.morning, diet.noon, diet.evening].some((m) => m.trim())) throw new Error('Nhập ít nhất một bữa.');
      min(diet.note, 10, 'Lý do / ghi chú chỉ định');
    }
    const medicalDiet: MedicalDiet | null = diet ? { ...diet, by: actor.name, at: DEMO_NOW.date } : null;
    const { data } = await http.patch<VetHorse>(`/horses/${horse.id}`, { medicalDiet });
    await addAudit(actor, {
      action: diet ? 'SET_MEDICAL_DIET' : 'CLEAR_MEDICAL_DIET', label: diet ? 'Chỉ định khẩu phần y tế' : 'Bỏ khẩu phần y tế', object: horse.name, area: 'med',
      from: horse.medicalDiet ? 'Khẩu phần y tế' : 'Khẩu phần thường', to: diet ? 'Khẩu phần y tế' : 'Khẩu phần thường', reason: diet?.note,
    });
    return data;
  },

  /** 3.4 — approve / reject a special feed request. Approved feed is added to the medical diet. */
  async decideFeed(req: FeedRequest, approve: boolean, note: string, actor: Actor) {
    if (req.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý.');
    if (!approve) min(note, 10, 'Lý do từ chối');
    const { data } = await http.patch<FeedRequest>(`/feedRequests/${req.id}`, { status: approve ? 'APPROVED' : 'REJECTED', vetNote: note.trim() || undefined, decidedBy: actor.name, decidedAt: now() });
    if (approve) {
      const horse = await get<VetHorse>(`/horses/${req.horseId}`);
      const base = horse.medicalDiet ?? { by: actor.name, at: DEMO_NOW.date, morning: '', noon: '', evening: '', special: '', note: 'Bổ sung thức ăn đặc biệt.' };
      await http.patch(`/horses/${req.horseId}`, { medicalDiet: { ...base, special: [base.special, req.item].filter(Boolean).join('; '), by: actor.name, at: DEMO_NOW.date } });
    }
    await addAudit(actor, { action: approve ? 'APPROVE_SPECIAL_FEED' : 'REJECT_SPECIAL_FEED', label: approve ? 'Duyệt thức ăn đặc biệt' : 'Từ chối thức ăn đặc biệt', object: `${req.id} · ${req.horse}`, area: 'med', from: 'PENDING', to: approve ? 'APPROVED' : 'REJECTED', reason: note.trim() || req.item });
    return data;
  },

};
