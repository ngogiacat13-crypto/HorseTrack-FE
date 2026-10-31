import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor, type ChecklistItem, type Registration } from '../managerApi';
import { DENIED, get, min, myHorses, nextId, now } from './shared';
import type { NewRegistration, UploadedDoc } from './types';
import { HEIGHT_MAX_CM, HEIGHT_MIN_CM, knownBreed, parseCm } from './labels';
import { USE_BACKEND, be } from '../beClient';
import { invalidate } from '../hybridAdapter';
import { PHONE_RE } from '../../components/ui/Ht/password';

const CHECKS: [ChecklistItem['key'], string][] = [
  ['identity', 'Danh tính chủ ngựa'], ['health', 'Giấy chứng nhận sức khỏe còn hiệu lực'], ['ownership', 'Giấy tờ sở hữu hợp lệ'],
];
const docMeta = (d: UploadedDoc) => `${(d.name.split('.').pop() ?? '').toUpperCase()} · ${(d.size / 1048576).toFixed(1).replace('.', ',')} MB · ${DEMO_NOW.date.slice(0, 5)}`;

const UPLOAD_TIMEOUT_MS = 120000;

const uploadDocs = async (horseId: number | undefined, files: NewRegistration['files']) => {
  if (!horseId) throw new Error('Đã gửi hồ sơ nhưng không lấy được mã ngựa để đính kèm giấy tờ — mở lại hồ sơ và tải giấy tờ lên.');
  const docs: [string, UploadedDoc | null][] = [['OWNERSHIP', files.ownership], ['OTHER', files.health]];
  for (const [docType, doc] of docs) {
    if (!doc?.file) continue;
    const form = new FormData();
    form.append('file', doc.file);
    form.append('docType', docType);
    await be.post(`/horses/${horseId}/registration-attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: UPLOAD_TIMEOUT_MS });
  }
  invalidate('registrations');
};

const validate = (r: NewRegistration) => {
  min(r.name, 2, 'Tên ngựa');
  if (!knownBreed(r.breed)) throw new Error('Giống ngựa: chọn một giống trong danh sách gợi ý.');
  if (!Number.isInteger(r.age) || r.age < 2 || r.age > 25) throw new Error('Tuổi phải là số nguyên 2–25.');
  min(r.color, 2, 'Màu lông');
  const cm = parseCm(r.height);
  if (!(cm >= HEIGHT_MIN_CM && cm <= HEIGHT_MAX_CM)) throw new Error(`Chiều cao đến vai tính bằng cm, từ ${HEIGHT_MIN_CM} đến ${HEIGHT_MAX_CM} (vd 165 hoặc 1m65).`);
  if (!(r.weight >= 100 && r.weight <= 1200)) throw new Error('Cân nặng từ 100 đến 1200 kg.');
  if (!PHONE_RE.test(r.phone)) throw new Error('Tài khoản của bạn chưa có số điện thoại hợp lệ — cập nhật tại Hồ sơ cá nhân rồi gửi lại.');
  if (!r.files.ownership) throw new Error('Tải lên giấy tờ sở hữu.');
  if (!r.files.health) throw new Error('Tải lên giấy chứng nhận sức khỏe.');
  if (r.files.ownership.name === r.files.health.name && r.files.ownership.size === r.files.health.size) throw new Error('Giấy tờ sở hữu và giấy chứng nhận sức khỏe đang là cùng một tệp — hãy chọn đúng từng loại giấy tờ.');
};

export const registrationsApi = {
  async getMyRegistrations(actor: Actor) {
    return (await get<Registration[]>('/registrations')).filter((r) => r.owner.fullName === actor.name).sort((a, b) => b.id.localeCompare(a.id));
  },

  async getMyRegistration(id: string, actor: Actor) {
    const r = await get<Registration>(`/registrations/${id}`);
    if (r.owner.fullName !== actor.name) throw new Error(DENIED);
    return r;
  },

  async submitRegistration(input: NewRegistration, actor: Actor & { email?: string }, resubmit?: Registration) {
    validate(input);
    if (resubmit && !(resubmit.status === 'Rejected' && resubmit.decidedNote === 'Cho phép nộp lại')) throw new Error('Hồ sơ này không được phép nộp lại.');
    const horses = await myHorses(actor);
    const all = await get<Registration[]>('/registrations');
    const id = resubmit?.id ?? nextId(all.map((r) => r.id), 'REG-');
    const docs: [string, UploadedDoc | null][] = [['Giấy tờ sở hữu', input.files.ownership], ['Giấy chứng nhận sức khỏe', input.files.health]];
    const reg: Registration = {
      id,
      horse: { name: input.name.trim(), breed: knownBreed(input.breed) ?? input.breed.trim(), sex: input.sex, age: input.age, code: `HT-${id.slice(-4)}` },
      owner: { fullName: actor.name, email: actor.email ?? '', phone: input.phone },
      submittedAt: `${DEMO_NOW.date} ${DEMO_NOW.time}`, waitingDays: 0, passed: 0, status: 'Pending', firstIssue: undefined,
      ownerExtra: { otherHorses: horses.map((h) => h.name).join(', ') || '—' },
      horseExtra: { color: input.color.trim(), height: `${parseCm(input.height)} cm`, weight: input.weight || 0, passport: '—', healthCert: '—' },
      checklist: CHECKS.map(([key, label]) => ({ key, label, detail: 'Chờ Quản lý CLB kiểm tra.', passed: false })),
      attachments: docs.filter(([, d]) => d).map(([name, d]) => ({ name, meta: docMeta(d as UploadedDoc) })),
      history: [
        { who: 'Hệ thống', text: 'kiểm tra trường bắt buộc: đủ · chuyển PENDING_REVIEW', at: now() },
        { who: actor.name, text: resubmit ? 'nộp lại hồ sơ (RESUBMITTED)' : 'gửi hồ sơ', at: now() },
        ...(resubmit?.history ?? []),
      ],
    };
    const { data } = resubmit ? await http.put<Registration>(`/registrations/${id}`, reg) : await http.post<Registration>('/registrations', reg);
    if (USE_BACKEND) await uploadDocs(resubmit?.beId ?? data.beId, input.files);
    await addAudit(actor, { action: resubmit ? 'RESUBMIT_REGISTRATION' : 'SUBMIT_REGISTRATION', label: resubmit ? 'Nộp lại hồ sơ ngựa' : 'Gửi hồ sơ đăng ký ngựa', object: `${id} · ${reg.horse.name}`, area: 'reg', from: resubmit ? 'REJECTED' : undefined, to: 'PENDING_REVIEW' });
    return data;
  },
};
