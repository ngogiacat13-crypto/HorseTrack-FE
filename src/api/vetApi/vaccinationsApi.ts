import { http } from '../http';
import { USE_BACKEND, be } from '../beClient';
import { invalidate } from '../hybridAdapter';
import { type Actor, addAudit } from '../managerApi';
import type { Horse, Vaccination } from '../trainerApi';
import type { VetHorse } from './types';
import { addMonths, isDate, daysFromToday } from './dates';
import { get, nextId, min, addHistory } from './shared';

export const vaccinationsApi = {
  async getVaccinations() {
    const [vaccinations, horses] = await Promise.all([get<Vaccination[]>('/vaccinations'), get<VetHorse[]>('/horses')]);
    return { vaccinations, horses };
  },

  async scheduleVaccination(input: { horseIds: string[]; kind: 'VACCINE' | 'DEWORM'; type: string; due: string; cycleMonths: number; note: string }, actor: Actor) {
    if (!input.horseIds.length) throw new Error('Chọn ít nhất 1 ngựa.');
    const type = min(input.type, 3, input.kind === 'DEWORM' ? 'Loại thuốc tẩy giun' : 'Loại vaccine');
    if (!isDate(input.due)) throw new Error('Ngày dự kiến theo dạng dd/mm/yyyy.');
    if (daysFromToday(input.due) < 0) throw new Error('Ngày dự kiến không được ở quá khứ.');
    if (input.kind === 'DEWORM' && (input.cycleMonths < 3 || input.cycleMonths > 6)) throw new Error('Chu kỳ tẩy giun từ 3 đến 6 tháng.');
    if (input.kind === 'VACCINE' && (input.cycleMonths < 1 || input.cycleMonths > 24)) throw new Error('Chu kỳ tiêm nhắc từ 1 đến 24 tháng.');
    if (USE_BACKEND) {
      await be.post('/vaccinations/schedule', { horseIds: input.horseIds.map(Number), kind: input.kind, medicineName: type, scheduledDate: input.due, cycleMonths: input.cycleMonths, notes: input.note.trim() || undefined });
      invalidate('vaccinations');
      await addAudit(actor, { action: input.kind === 'DEWORM' ? 'SCHEDULE_DEWORM' : 'SCHEDULE_VACCINE', label: input.kind === 'DEWORM' ? 'Tạo lịch tẩy giun' : 'Tạo lịch tiêm phòng', object: `${type} · ${input.horseIds.length} ngựa`, area: 'med', to: input.due });
      return (await get<Vaccination[]>('/vaccinations')).filter((v) => input.horseIds.includes(v.horseId) && v.type === type && v.status !== 'DONE');
    }
    const [all, horses] = await Promise.all([get<Vaccination[]>('/vaccinations'), get<Horse[]>('/horses')]);
    const dup = all.find((v) => input.horseIds.includes(v.horseId) && v.type.toLowerCase() === type.toLowerCase() && v.status !== 'DONE');
    if (dup) throw new Error(`${dup.horse} đã có lịch “${dup.type}” ngày ${dup.due}.`);
    const ids = all.map((v) => v.id);
    const created: Vaccination[] = [];
    for (const hid of input.horseIds) {
      const h = horses.find((x) => x.id === hid);
      if (!h) continue;
      const id = nextId(ids, 'VC-', 3);
      ids.push(id);
      const row = { id, horseId: h.id, horse: h.name, type, kind: input.kind, cycleMonths: input.cycleMonths, due: input.due, status: daysFromToday(input.due) <= 7 ? 'DUE_SOON' : 'SCHEDULED', note: input.note.trim() || undefined } as Vaccination;
      created.push((await http.post<Vaccination>('/vaccinations', row)).data);
    }
    await addAudit(actor, { action: input.kind === 'DEWORM' ? 'SCHEDULE_DEWORM' : 'SCHEDULE_VACCINE', label: input.kind === 'DEWORM' ? 'Tạo lịch tẩy giun' : 'Tạo lịch tiêm phòng', object: `${type} · ${created.map((c) => c.horse).join(', ')}`, area: 'med', to: `${input.due} · chu kỳ ${input.cycleMonths} tháng` });
    return created;
  },

  async recordVaccination(v: Vaccination, input: { doneAt: string; by: string }, actor: Actor) {
    if (v.status === 'DONE') throw new Error('Mũi này đã được ghi nhận.');
    if (!isDate(input.doneAt)) throw new Error('Ngày thực hiện theo dạng dd/mm/yyyy.');
    if (daysFromToday(input.doneAt) > 0) throw new Error('Ngày thực hiện không được sau hôm nay.');
    const by = min(input.by, 3, 'Người thực hiện');
    const ext = v as Vaccination & { cycleMonths?: number; kind?: string };
    if (USE_BACKEND) {
      await be.post(`/vaccinations/${encodeURIComponent(v.id)}/execute`, { doneAt: input.doneAt, note: `Người thực hiện: ${by}` });
      invalidate('vaccinations', 'horses');
      await addAudit(actor, { action: 'RECORD_VACCINATION', label: ext.kind === 'DEWORM' ? 'Ghi nhận tẩy giun' : 'Ghi nhận đã tiêm', object: `${v.id} · ${v.horse}`, area: 'med', from: v.status, to: 'DONE', reason: by });
      const all = await get<Vaccination[]>('/vaccinations');
      return { done: all.find((x) => x.id === v.id) ?? { ...v, status: 'DONE' as const, doneAt: input.doneAt, by }, next: all.find((x) => x.horseId === v.horseId && x.type === v.type && x.status !== 'DONE') ?? null };
    }
    const { data } = await http.patch<Vaccination>(`/vaccinations/${v.id}`, { status: 'DONE', doneAt: input.doneAt, by });
    let next: Vaccination | null = null;
    if (ext.cycleMonths) {
      const all = await get<Vaccination[]>('/vaccinations');
      const due = addMonths(input.doneAt, ext.cycleMonths);
      next = (await http.post<Vaccination>('/vaccinations', { ...ext, id: nextId(all.map((x) => x.id), 'VC-', 3), due, status: 'SCHEDULED', note: `Nhắc lại sau ${ext.cycleMonths} tháng`, doneAt: undefined, by: undefined })).data;
    }
    const horse = await get<Horse>(`/horses/${v.horseId}`);
    await addHistory(horse, `${v.type}`, 'success');
    await addAudit(actor, { action: 'RECORD_VACCINATION', label: ext.kind === 'DEWORM' ? 'Ghi nhận tẩy giun' : 'Ghi nhận đã tiêm', object: `${v.id} · ${v.horse}`, area: 'med', from: v.status, to: 'DONE', reason: `${v.type} · ${by}${next ? ` · nhắc lại ${next.due}` : ''}` });
    return { done: data, next };
  },

};
