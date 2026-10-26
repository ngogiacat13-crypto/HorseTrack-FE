import { http } from '../http';
import { type Actor, addAudit } from '../managerApi';
import type { HealthStatus, Horse, TrainingSession } from '../trainerApi';
import type { Severity, CaseExam, VetCase, Protocol, VetHorse } from './types';
import { PROTOCOL_LABEL, isOpenProtocol } from './labels';
import { get, now, min, addHistory } from './shared';

export const casesApi = {
  async getCases() {
    const [cases, horses, protocols, sessions] = await Promise.all([
      get<VetCase[]>('/vetCases'), get<VetHorse[]>('/horses'), get<Protocol[]>('/protocols'), get<TrainingSession[]>('/trainingSessions'),
    ]);
    const linked = new Set(cases.map((c) => c.sessionId).filter(Boolean));
    return { cases, horses, protocols, sessions: sessions.filter((s) => linked.has(s.id)) };
  },

  async examineCase(c: VetCase, input: { symptoms: string; diagnosis: string; severity: Severity; plan: string; health: HealthStatus }, actor: Actor) {
    if (c.status === 'CLOSED') throw new Error('Ca đã đóng.');
    const exam: CaseExam = {
      symptoms: min(input.symptoms, 10, 'Triệu chứng'), diagnosis: min(input.diagnosis, 5, 'Chẩn đoán'), plan: min(input.plan, 10, 'Hướng xử lý'),
      severity: input.severity, health: input.health, by: actor.name, at: now(),
    };
    const horse = await get<Horse>(`/horses/${c.horseId}`);
    const { data } = await http.patch<VetCase>(`/vetCases/${c.id}`, { exam, severity: input.severity, status: 'MONITORING' });
    await http.patch(`/horses/${horse.id}`, { health: input.health, pendingCase: horse.pendingCase === c.id ? null : horse.pendingCase });
    await addHistory(horse, `Khám ${c.type.toLowerCase()} · #${c.id} — ${exam.diagnosis}`, input.severity === 'HIGH' ? 'danger' : 'warning');
    await addAudit(actor, { action: 'RECORD_EXAM', label: 'Ghi nhận ca khám', object: `${c.id} · ${c.horse}`, area: 'med', from: c.status, to: 'MONITORING', reason: exam.diagnosis });
    return data;
  },

  async closeCase(c: VetCase, outcome: string, actor: Actor) {
    if (c.status === 'CLOSED') throw new Error('Ca đã đóng.');
    if (!c.exam) throw new Error('Ghi nhận khám trước khi đóng ca.');
    const protocols = await get<Protocol[]>('/protocols', { caseId: c.id });
    const caseKey = String((c as VetCase & { beId?: number }).beId ?? '');
    const open = protocols.find((p) => isOpenProtocol(p) && (p.caseId === c.id || (!!caseKey && p.caseId === caseKey)));
    if (open) throw new Error(`Phác đồ ${open.id} còn đang mở (${PROTOCOL_LABEL[open.state][0]}) — hoàn tất hoặc hủy trước khi đóng ca.`);
    const { data } = await http.patch<VetCase>(`/vetCases/${c.id}`, { status: 'CLOSED', outcome: min(outcome, 10, 'Kết luận') });
    await addAudit(actor, { action: 'CLOSE_CASE', label: 'Đóng ca khám', object: `${c.id} · ${c.horse}`, area: 'med', from: c.status, to: 'CLOSED', reason: outcome.trim() });
    return data;
  },

};
