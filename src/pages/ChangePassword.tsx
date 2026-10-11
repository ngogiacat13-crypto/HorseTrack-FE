import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '../api/mockData';
import { Icon } from '../components/ui/Icon';
import { Badge, Busy, Callout, Field, PageHeader, PasswordInput, Rules, StrengthMeter, TextInput } from '../components/ui/Ht';
import { useForm } from '../hooks/useForm';
import { ROLE_LABEL } from '../components/layout/nav';

export const ChangePassword: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ tone: 'success' | 'danger'; msg: React.ReactNode } | null>(null);
  const [reveal, setReveal] = useState(false);

  const form = useForm({ oldPassword: '', newPassword: '', confirmPassword: '' }, (v) => ({
    oldPassword: v.oldPassword ? undefined : 'Vui lòng nhập mật khẩu hiện tại',
    newPassword: !v.newPassword ? 'Vui lòng nhập mật khẩu mới'
      : v.newPassword.length < 8 ? 'Tối thiểu 8 ký tự'
      : v.newPassword === v.oldPassword ? 'Mật khẩu mới không được trùng mật khẩu cũ' : undefined,
    confirmPassword: !v.confirmPassword ? 'Vui lòng xác nhận mật khẩu mới'
      : v.confirmPassword !== v.newPassword ? 'Mật khẩu xác nhận không khớp' : undefined,
  }));
  const v = form.values;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!form.check()) return;
    form.setSubmitting(true);
    try {
      if (!user) throw new Error('Bạn chưa đăng nhập.');
      await authApi.changePassword(user.userId, v.oldPassword, v.newPassword);
      setStatus({ tone: 'success', msg: <><b>Đổi mật khẩu thành công!</b> Dùng mật khẩu mới cho lần đăng nhập sau.</> });
      form.reset();
    } catch (err: any) {
      const msg = err?.message || 'Đổi mật khẩu thất bại.';
      setStatus({ tone: 'danger', msg });
      if (/hiện tại/.test(msg)) form.setServerErrors({ oldPassword: 'Kiểm tra lại mật khẩu đang dùng' });
    } finally {
      form.setSubmitting(false);
    }
  };

  const initials = (user?.fullname ?? 'U').split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<>Tài khoản <Icon name="chev" size={14} /><b>Đổi mật khẩu</b></>}
        title="Đổi mật khẩu"
        sub="Để bảo mật, hãy nhập mật khẩu hiện tại trước khi đặt mật khẩu mới."
      />

      <div className="ht-cols" style={{ maxWidth: 1080 }}>
        <div>
          <section className="ht-card">
            <h2 className="ht-card__title">Mật khẩu đăng nhập</h2>
            <p className="ht-card__sub">Áp dụng cho tài khoản <b className="ht-mono" style={{ color: 'var(--foreground)' }}>{user?.username}</b>.</p>
            <hr className="ht-divider" />

            {status && <Callout tone={status.tone} style={{ marginBottom: 16 }}>{status.msg}</Callout>}

            <form onSubmit={onSubmit} noValidate>
              <Field label="Mật khẩu hiện tại" htmlFor="oldPassword" required error={form.errors.oldPassword} style={{ maxWidth: 420 }}>
                <PasswordInput icon="key" autoComplete="current-password" placeholder="Nhập mật khẩu đang dùng" {...form.field('oldPassword')} />
              </Field>
              <div className="ht-grid-2">
                <Field label="Mật khẩu mới" htmlFor="newPassword" required error={form.errors.newPassword}>
                  <PasswordInput autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" revealed={reveal} onRevealChange={setReveal} {...form.field('newPassword')} />
                  <StrengthMeter value={v.newPassword} showLabel={false} />
                </Field>
                <Field label="Xác nhận mật khẩu mới" htmlFor="confirmPassword" required error={form.errors.confirmPassword}>
                  <TextInput icon="lock" type={reveal ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" {...form.field('confirmPassword')} />
                </Field>
              </div>
              <hr className="ht-divider" style={{ marginTop: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="ht-btn ht-btn--secondary" onClick={() => { form.reset(); setStatus(null); }}>Hủy</button>
                <button type="submit" className="ht-btn ht-btn--primary" disabled={form.submitting} aria-busy={form.submitting || undefined}>
                  <Busy busy={form.submitting} label="Đang cập nhật…">Cập nhật mật khẩu</Busy>
                </button>
              </div>
            </form>
          </section>
        </div>

        <div>
          <section className="ht-card" style={{ padding: 20 }}>
            <div className="ht-overline" style={{ marginBottom: 12 }}>Yêu cầu mật khẩu</div>
            <Rules items={[
              { ok: v.newPassword.length >= 8, label: 'Tối thiểu 8 ký tự' },
              { ok: !!v.newPassword && v.newPassword !== v.oldPassword, label: 'Khác mật khẩu hiện tại' },
              { ok: !!v.confirmPassword && v.confirmPassword === v.newPassword, label: 'Xác nhận trùng khớp' },
            ]} />
          </section>

          <section className="ht-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <i className="ht-avatar ht-avatar--lg">{initials}</i>
              <div>
                <div style={{ fontWeight: 600 }}>{user?.fullname}</div>
                {user && <Badge tone="brand" plain style={{ marginTop: 4 }}>{ROLE_LABEL[user.role]}</Badge>}
              </div>
            </div>
            <dl className="ht-kv">
              <dt>Tên đăng nhập</dt><dd className="ht-mono">{user?.username}</dd>
              <dt>Email</dt><dd>{user?.email}</dd>
              <dt>Điện thoại</dt><dd className="ht-mono">{user?.phone}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};
