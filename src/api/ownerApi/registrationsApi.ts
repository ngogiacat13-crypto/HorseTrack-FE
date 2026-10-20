import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor, type ChecklistItem, type Registration } from '../managerApi';
import { DENIED, get, min, myHorses, nextId, now } from './shared';
import type { NewRegistration, UploadedDoc } from './types';

const CHECKS: [ChecklistItem['key'], string][] = [
  ['identity', 'Danh tính chủ ngựa'], ['health', 'Giấy chứng nhận sức khỏe còn hiệu lực'], ['ownership', 'Giấy tờ sở hữu hợp lệ'],
];
const docMeta = (d: UploadedDoc) => `${(d.name.split('.').pop() ?? '').toUpperCase()} · ${(d.size / 1048576).toFixed(1).replace('.', ',')} MB · ${DEMO_NOW.date.slice(0, 5)}`;

/** Required-field check done by the system before the file reaches the Club Manager (Flow 1, step 2). */
const validate = (r: NewRegistration) => {
  min(r.name, 2, 'Tên ngựa');
  min(r.breed, 2, 'Giống');
  if (!Number.isInteger(r.age) || r.age < 2 || r.age > 25) throw new Error('Tuổi phải là số nguyên 2–25.');
  min(r.color, 2, 'Màu lông');
  min(r.passport, 4, 'Số hộ chiếu ngựa');
  if (!/^0\d{9}$/.test(r.phone)) throw new Error('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
  if (!r.files.ownership) throw new Error('Tải lên giấy tờ sở hữu.');
  if (!r.files.health) throw new Error('Tải lên giấy chứng nhận sức khỏe.');
};

/* 1.4 Đăng ký ngựa mới → hàng chờ duyệt của Quản lý CLB (PENDING_REVIEW). */
export const registrationsApi = {
  async getMyRegistrations(actor: Actor) {
    return (await get<Registration[]>('/registrations')).filter((r) => r.owner.fullName === actor.name).sort((a, b) => b.id.localeCompare(a.id));
  },

  async getMyRegistration(id: string, actor: Actor) {
    const r = await get<Registration>(`/registrations/${id}`);
    if (r.owner.fullName !== actor.name) throw new Error(DENIED);
    return r;
  },

  /** New file, or a resubmission of a rejected one when the manager allowed it (RESUBMITTED). */
  async submitRegistration(input: NewRegistration, actor: Actor & { email?: string }, resubmit?: Registration) {
    validate(input);
    if (resubmit && !(resubmit.status === 'Rejected' && resubmit.decidedNote === 'Cho phép nộp lại')) throw new Error('Hồ sơ này không được phép nộp lại.');
    const horses = await myHorses(actor);
    const all = await get<Registration[]>('/registrations');
    const id = resubmit?.id ?? nextId(all.map((r) => r.id), 'REG-');
    const docs: [string, UploadedDoc | null][] = [['Giấy tờ sở hữu', input.files.ownership], ['Giấy chứng nhận sức khỏe', input.files.health]];
    const reg: Registration = {
      id,
      horse: { name: input.name.trim(), breed: input.breed.trim(), sex: input.sex, age: input.age, code: `HT-${id.slice(-4)}` },
      owner: { fullName: actor.name, email: actor.email ?? '', phone: input.phone },
      submittedAt: `${DEMO_NOW.date} ${DEMO_NOW.time}`, waitingDays: 0, passed: 0, status: 'Pending', firstIssue: undefined,
      ownerExtra: { otherHorses: horses.map((h) => h.name).join(', ') || '—' },
      horseExtra: { color: input.color.trim(), height: input.height.trim() || '—', weight: input.weight || 0, passport: input.passport.trim(), healthCert: input.healthCert.trim() || '—' },
      checklist: CHECKS.map(([key, label]) => ({ key, label, detail: 'Chờ Quản lý CLB kiểm tra.', passed: false })),
      attachments: docs.filter(([, d]) => d).map(([name, d]) => ({ name, meta: docMeta(d as UploadedDoc) })),
      history: [
        { who: 'Hệ thống', text: 'kiểm tra trường bắt buộc: đủ · chuyển PENDING_REVIEW', at: now() },
        { who: actor.name, text: resubmit ? 'nộp lại hồ sơ (RESUBMITTED)' : 'gửi hồ sơ', at: now() },
        ...(resubmit?.history ?? []),
      ],
    };
    const { data } = resubmit ? await http.put<Registration>(`/registrations/${id}`, reg) : await http.post<Registration>('/registrations', reg);
    await addAudit(actor, { action: resubmit ? 'RESUBMIT_REGISTRATION' : 'SUBMIT_REGISTRATION', label: resubmit ? 'Nộp lại hồ sơ ngựa' : 'Gửi hồ sơ đăng ký ngựa', object: `${id} · ${reg.horse.name}`, area: 'reg', from: resubmit ? 'REJECTED' : undefined, to: 'PENDING_REVIEW' });
    return data;
  },
};
