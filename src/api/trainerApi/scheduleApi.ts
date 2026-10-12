import { DEMO_NOW, http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, TrainingPlan, TrainingSession, Vaccination, Stall, Groom } from './types';
import { horseZone } from './labels';
import { get, nextId, myHorses, getMyHorse, ofHorses, getHorseChecked } from './shared';

export const scheduleApi = {
  /* ----- Schedule (1.3, 1.4) ----- */
  async getSchedule(actor: Actor) {
    const [sessions, horses, plans, grooms, vaccinations, stalls] = await Promise.all([
      get<TrainingSession[]>('/trainingSessions'), myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<Groom[]>('/grooms'), get<Vaccination[]>('/vaccinations'), get<Stall[]>('/stalls'),
    ]);
    const zoneOf = (h: Horse) => horseZone(h, stalls);
    return {
      sessions: ofHorses(sessions, horses), horses, plans: ofHorses(plans, horses), grooms, vaccinations: ofHorses(vaccinations, horses),
      zones: [...new Set(horses.map(zoneOf))].sort(), // only zones that hold this trainer's horses
      zoneOf,
    };
  },

  async assignSession(input: { horseId: string; date: string; time: string; groom: string; track: string; metrics: string[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const [plan] = await get<TrainingPlan[]>('/trainingPlans', { horseId: horse.id, status: 'ACTIVE' });
    if (!plan) throw new Error(`${horse.name} chưa có giáo án đang chạy — tạo giáo án trước khi xếp lịch.`);
    // Mã phu must be in charge of the horse's stable zone.
    const [stalls, grooms] = await Promise.all([get<Stall[]>('/stalls'), get<Groom[]>('/grooms')]);
    const zone = horseZone(horse, stalls);
    const groom = grooms.find((g) => g.name === input.groom);
    if (!groom || !groom.zones.includes(zone)) throw new Error(`${input.groom || 'Mã phu này'} không phụ trách ${zone} — chọn Mã phu của ${zone}.`);
    const phase = plan.phases.find((p) => p.no === plan.currentPhase) ?? plan.phases[0];
    const all = await get<TrainingSession[]>('/trainingSessions');
    const clash = all.find((s) => s.horseId === horse.id && s.date === input.date && s.time === input.time);
    if (clash) throw new Error(`${horse.name} đã có phiên ${clash.id} lúc ${input.time} ngày ${input.date}.`);
    const session: TrainingSession = {
      id: nextId(all.map((s) => s.id), 'S-'), horseId: horse.id, horseName: horse.name, planId: plan.id, phaseNo: phase.no,
      label: `${plan.type} · P${phase.no}`, date: input.date, time: input.time, groom: input.groom, track: input.track,
      status: 'SCHEDULED', thresholds: { hr: phase.hrLimit, speed: 60 }, readings: [], metrics: input.metrics, decision: null, evaluation: null,
    };
    const { data } = await http.post<TrainingSession>('/trainingSessions', session);
    await addAudit(actor, { action: 'ASSIGN_SESSION', label: 'Phân công phiên tập', object: `${data.id} · ${horse.name}`, area: 'train', to: `${input.date} ${input.time} · ${input.groom}`, reason: `${data.label} · ${input.track}` });
    return data;
  },

  async evaluateSession(s: TrainingSession, score: number, comment: string, actor: Actor) {
    await getMyHorse(s.horseId, actor);
    if (s.status !== 'COMPLETED') throw new Error('Chỉ đánh giá được phiên đã hoàn thành.');
    if (!Number.isInteger(score) || score < 1 || score > 10) throw new Error('Điểm phong độ phải từ 1 đến 10.');
    const evaluation = { score, comment: comment.trim(), by: actor.name, at: DEMO_NOW.short };
    const { data } = await http.patch<TrainingSession>(`/trainingSessions/${s.id}`, { evaluation });
    await addAudit(actor, { action: 'EVALUATE_SESSION', label: 'Đánh giá phong độ', object: `${s.id} · ${s.horseName}`, area: 'train', to: `${score}/10`, reason: comment.trim() || undefined });
    return data;
  },

};
