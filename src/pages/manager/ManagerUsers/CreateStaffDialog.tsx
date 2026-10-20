import React from 'react';
import { BE_STAFF_ROLE, managerApi, type ManagedUser, type StaffRole } from '../../../api/managerApi';
import { USE_BACKEND } from '../../../api/beClient';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useForm } from '../../../hooks/useForm';
import { Callout, Dialog, Field, PASSWORD_RE, PASSWORD_RULE, PasswordInput, TextInput, USERNAME_RE, USERNAME_RULE, useToast } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

const PHONE_RE = /^(0|\+84)(\d{9,10})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_ROLES: StaffRole[] = ['HeadTrainer', 'Veterinarian', 'Groom', 'WarehouseManager'];
const ZONES = ['Khu A', 'Khu B', 'Khu C'];

/* 5.1 — staff accounts are created by the Club Manager (only Horse Owners sign up by themselves).
   Backend: POST /api/v1/auth/staff/create (Club Manager token). */
export const CreateStaffDialog: React.FC<{ onClose: () => void; onDone: (u: ManagedUser) => void }> = ({ onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const toast = useToast();
  const form = useForm(
    { role: 'HeadTrainer', fullName: '', username: '', email: '', phone: '', password: '', licenseNumber: '', specialization: '' },
    (v) => ({
      fullName: v.fullName.trim() ? undefined : 'Vui lòng nhập họ và tên',
      username: !v.username.trim() ? 'Vui lòng nhập tên đăng nhập' : !USERNAME_RE.test(v.username.trim()) ? USERNAME_RULE : undefined,
      email: !v.email.trim() ? 'Vui lòng nhập email' : !EMAIL_RE.test(v.email.trim()) ? 'Email không hợp lệ' : undefined,
      phone: v.phone && !PHONE_RE.test(v.phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : undefined,
      password: !v.password ? 'Vui lòng nhập mật khẩu tạm' : !PASSWORD_RE.test(v.password) ? PASSWORD_RULE : undefined,
      specialization: v.role === 'Groom' && !v.specialization ? 'Chọn khu chuồng phụ trách' : undefined,
    }),
  );
  const role = form.values.role as StaffRole;
  const supported = (r: StaffRole) => !USE_BACKEND || !!BE_STAFF_ROLE[r];
  const setRole = (r: StaffRole) => form.setValues((s) => ({ ...s, role: r, licenseNumber: '', specialization: '' }));

  const submit = async () => {
    if (!form.check()) return;
    const v = form.values;
    const out: { user?: ManagedUser } = {};
    const ok = await run(async () => {
      const { emailNote, emailFailed, ...user } = await managerApi.createStaff({ ...v, role }, actor);
      out.user = user;
      // Backend: tell whether the login details were emailed (or failed: the manager must send them another way)
      toast(emailNote ?? `Đã tạo tài khoản ${v.username.trim()} · ${ROLE_LABEL[role]}.`);
      if (emailFailed) window.alert(emailNote);
    });
    if (ok && out.user) onDone(out.user);
  };

  return (
    <Dialog open onClose={onClose} icon="usercog" tone="brand" width={640} busy={busy} busyLabel="Đang tạo…"
      title="Tạo tài khoản nhân viên" sub="Nhân viên không tự đăng ký. Quản lý CLB tạo tài khoản và gửi tên đăng nhập + mật khẩu tạm cho nhân viên."
      confirmLabel="Tạo tài khoản" onConfirm={submit}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}

      <div className="ht-label" style={{ marginBottom: 8 }}>Vai trò</div>
      <div className="ht-roles" style={{ marginBottom: 16 }}>
        {STAFF_ROLES.map((r) => (
          <label key={r} className="ht-role">
            <input type="radio" name="staff-role" value={r} checked={role === r} disabled={!supported(r)} onChange={() => setRole(r)} />
            {ROLE_LABEL[r]}{!supported(r) && ' · backend chưa hỗ trợ'}
          </label>
        ))}
      </div>

      <Field label="Họ và tên" htmlFor="fullName" required error={form.errors.fullName}>
        <TextInput icon="user" placeholder="VD: Trần Đức Hùng" {...form.field('fullName')} />
      </Field>
      <div className="ht-grid-2">
        <Field label="Tên đăng nhập" htmlFor="username" required error={form.errors.username}>
          <TextInput icon="at" autoComplete="off" placeholder="vd: duchung" {...form.field('username')} />
        </Field>
        <Field label="Mật khẩu tạm" htmlFor="password" required error={form.errors.password}>
          <PasswordInput autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" {...form.field('password')} />
        </Field>
      </div>
      <div className="ht-grid-2">
        <Field label="Email" htmlFor="email" required error={form.errors.email}>
          <TextInput icon="mail" type="email" placeholder="ten@horsetrack.vn" {...form.field('email')} />
        </Field>
        <Field label="Số điện thoại" htmlFor="phone" error={form.errors.phone}>
          <TextInput icon="phone" type="tel" placeholder="090 123 4567" {...form.field('phone')} />
        </Field>
      </div>

      {(role === 'HeadTrainer' || role === 'Veterinarian') && (
        <div className="ht-grid-2">
          <Field label="Số chứng chỉ hành nghề" htmlFor="licenseNumber" hint="Không bắt buộc">
            <TextInput icon="file" placeholder={role === 'Veterinarian' ? 'VD: BSTY-2021-0456' : 'VD: HLV-2020-0123'} {...form.field('licenseNumber')} />
          </Field>
          {role === 'Veterinarian' && (
            <Field label="Nơi công tác / phòng khám" htmlFor="specialization" hint="Không bắt buộc">
              <TextInput icon="heart" placeholder="VD: Phòng khám thú y CLB" {...form.field('specialization')} />
            </Field>
          )}
        </div>
      )}
      {role === 'Groom' && (
        <Field label="Khu chuồng phụ trách" htmlFor="specialization" required error={form.errors.specialization}>
          <select id="specialization" className="ht-input" value={form.values.specialization}
            onChange={(e) => form.setValues((s) => ({ ...s, specialization: e.target.value }))}>
            <option value="">— Chọn khu —</option>
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </Field>
      )}
    </Dialog>
  );
};
