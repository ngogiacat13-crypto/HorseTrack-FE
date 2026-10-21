import { DEMO_NOW, http } from '../http';
import { USE_BACKEND, be, beData } from '../beClient';
import { invalidate } from '../hybridAdapter';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, TrainingPlan, TrainingSession, Vaccination, Stall, Groom } from './types';
import { horseZone } from './labels';
import { get, nextId, myHorses, getMyHorse, ofHorses, getHorseChecked, withLiveStatus } from './shared';

const assertBePlan = (planId: string) => {
  if (!/^\d+$/.test(planId)) throw new Error(`Giáo án ${planId} chưa có trên hệ thống (chỉ lưu tạm trên trình duyệt). Tải lại trang và tạo lại giáo án cho ngựa này.`);
};

export const scheduleApi = {
  async getSchedule(actor: Actor) {
    const [sessions, horses, plans, grooms, vaccinations, stalls] = await Promise.all([
      get<TrainingSession[]>('/trainingSessions'), myHorses(actor), get<TrainingPlan[]>('/trainingPlans'), get<Groom[]>('/grooms'), get<Vaccination[]>('/vaccinations'), get<Stall[]>('/stalls'),
    ]);
    const zoneOf = (h: Horse) => horseZone(h, stalls);
    return {
      sessions: ofHorses(sessions, horses), horses, plans: await withLiveStatus(ofHorses(plans, horses), sessions), grooms, vaccinations: ofHorses(vaccinations, horses),
      zones: [...new Set(horses.map(zoneOf))].sort(),
      zoneOf,
    };
  },

  async getAssignableGrooms(planId: string): Promise<Groom[]> {
    assertBePlan(planId);
    const rows = await beData<{ userId: number; fullName: string; barnZone?: string | null }[]>(be.get('/training-plans/assignable-staff', { params: { planId } }));
    return rows.map((g) => ({ id: String(g.userId), name: g.fullName, zones: g.barnZone ? [g.barnZone.replace(/^Zone\s+/i, 'Khu ')] : [] }));
  },

  async assignSession(input: { horseId: string; date: string; time: string; groom: string; groomId?: string; track: string; metrics: string[] }, actor: Actor) {
    const horse = await getHorseChecked(input.horseId, actor);
    const plan = (await get<TrainingPlan[]>('/trainingPlans', { horseId: horse.id })).find((p) => p.status === 'PLANNED' || p.status === 'ACTIVE');
    if (!plan) throw new Error(`${horse.name} chưa có giáo án — tạo giáo án trước khi xếp lịch.`);
    const day = (d: string) => d.split('/').reverse().join('');
    if (day(input.date) < day(plan.startDate)) throw new Error(`Giáo án “${plan.name}” bắt đầu ngày ${plan.startDate} — không xếp phiên trước ngày này.`);
    if (USE_BACKEND) {
      assertBePlan(plan.id);
      if (!input.groomId) throw new Error('Chọn Mã phu thực hiện.');
      const [d, m, y] = input.date.split('/');
      const label = plan.type;
      await be.post(`/training-plans/${plan.id}/sessions`, {
        sessionDate: `${y}-${m}-${d}T${input.time}:00`, activityType: label,
        notes: `${input.track} · Ghi nhận: ${input.metrics.join(', ')}`, assignedToId: Number(input.groomId),
      });
      invalidate('trainingSessions', 'trainingPlans');
      return {
        id: '', horseId: horse.id, horseName: horse.name, planId: plan.id, phaseNo: 1, label, date: input.date, time: input.time,
        groom: input.groom, track: input.track, status: 'SCHEDULED', thresholds: { hr: 180, speed: 60 }, readings: [], metrics: input.metrics, decision: null, evaluation: null,
      } as TrainingSession;
    }
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
    await withLiveStatus([plan], [...all, data]);
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
