import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/authApi';
import type { ApiError } from '../../../api/http';
import { AuthShell } from '../../../components/auth/AuthShell';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Field, PasswordInput, StrengthMeter, TextInput } from '../../../components/ui/Ht';
import { useForm } from '../../../hooks/useForm';

const PHONE_RE = /^(0|\+84)(\d{9,10})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [doneUser, setDoneUser] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const form = useForm(
    { fullname: '', username: '', phone: '', email: '', password: '' },
    (v) => ({
      fullname: v.fullname.trim() ? undefined : 'Vui lòng nhập họ và tên',
      username: !v.username ? 'Vui lòng nhập tên đăng nhập' : v.username.length < 4 ? 'Tối thiểu 4 ký tự' : undefined,
      phone: !v.phone ? 'Vui lòng nhập số điện thoại' : !PHONE_RE.test(v.phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : undefined,
      email: !v.email ? 'Vui lòng nhập email' : !EMAIL_RE.test(v.email) ? 'Email không hợp lệ' : undefined,
      password: !v.password ? 'Vui lòng nhập mật khẩu' : v.password.length < 8 ? 'Mật khẩu tối thiểu 8 ký tự' : undefined,
    }),
  );

  useEffect(() => {
    if (!doneUser) return;
    if (count <= 0) { navigate('/login'); return; }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [doneUser, count, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!form.check()) return;
    form.setSubmitting(true);
    try {
      const v = form.values;
      await authApi.register({ ...v, phone: v.phone.replace(/\s/g, ''), fullname: v.fullname.trim() });
      setDoneUser(v.username);
    } catch (err) {
      const e = err as ApiError;
      if (e?.fields) form.setServerErrors(e.fields);
      else if (e?.field) form.setServerErrors({ [e.field]: e.message ?? 'Giá trị không hợp lệ.' });
      else form.setServerErrors({ email: 'Đã có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      form.setSubmitting(false);
    }
  };

  return (
    <AuthShell
      narrow
      logoHeight={60}
      eyebrow="Dành cho Chủ ngựa"
      headline="Theo dõi ngựa của bạn từ chuồng đến đường đua."
      points={[
        { step: 1, active: true, title: 'Tạo tài khoản', text: 'Mất khoảng 1 phút — bạn đang ở bước này.' },
        { step: 2, title: 'Gửi hồ sơ ngựa', text: 'Giấy sở hữu, giấy sức khỏe và microchip nếu có.' },
        { step: 3, title: 'Quản lý CLB duyệt', text: 'Hồ sơ hợp lệ sẽ được đưa vào danh sách quản lý.' },
      ]}
      foot="Vai trò: HorseOwner"
      barRight={<span style={{ fontSize: 13, color: 'var(--muted)' }}>Đã có tài khoản? <Link className="ht-link" to="/login">Đăng nhập</Link></span>}
    >
      {doneUser ? (
        <>
          <div className="ht-done">
            <span className="ht-done__icon"><Icon name="check" /></span>
            <h1 className="ht-auth__title" style={{ fontSize: 24, lineHeight: '32px' }}>Đăng ký thành công!</h1>
            <p className="ht-auth__sub" style={{ marginBottom: 20 }}>
              Tài khoản <b style={{ color: 'var(--foreground)' }}>Chủ ngựa</b> <span className="ht-mono">@{doneUser}</span> đã được tạo.<br />
              Đang chuyển về trang đăng nhập sau <b style={{ color: 'var(--foreground)' }}>{Math.max(count, 0)}</b> giây…
            </p>
            <Link className="ht-btn ht-btn--primary" to="/login">Về trang đăng nhập ngay</Link>
            <div className="ht-progress"><i style={{ width: `${((3 - count) / 3) * 100}%`, transition: 'width 1s linear' }} /></div>
          </div>
          <Callout tone="info" title="Bước tiếp theo" style={{ marginTop: 8 }}>
            Đăng nhập, vào <b>Ngựa của tôi → Đăng ký ngựa mới</b> để gửi hồ sơ cho Quản lý CLB duyệt.
          </Callout>
        </>
      ) : (
        <>
          <h1 className="ht-auth__title">Tạo tài khoản Chủ ngựa</h1>
          <p className="ht-auth__sub">Thông tin dùng để đăng nhập và nhận thông báo hóa đơn, thi đấu.</p>

          <Callout tone="info" title="Vai trò mặc định: Chủ ngựa" style={{ marginBottom: 20 }}>
            Các vai trò nhân sự (HLV, Bác sĩ, Kho, Mã phu) do Quản lý CLB cấp.
          </Callout>

          {submitAttempted && Object.keys(form.errors).length > 0 && (
            <Callout tone="danger" title={`Vui lòng kiểm tra ${Object.keys(form.errors).length} lỗi trước khi đăng ký`} style={{ marginBottom: 20 }}>
              <ul className="ht-form-error-list">
                {Object.entries(form.errors).map(([field, message]) => <li key={field}>{message}</li>)}
              </ul>
            </Callout>
          )}

          <form onSubmit={onSubmit} noValidate>
            <Field label="Họ và tên" htmlFor="fullname" required error={form.errors.fullname}>
              <TextInput icon="user" autoComplete="name" placeholder="Nguyễn Văn Minh" {...form.field('fullname')} />
            </Field>
            <div className="ht-grid-2">
              <Field label="Tên đăng nhập" htmlFor="username" required error={form.errors.username}>
                <TextInput icon="at" autoComplete="username" placeholder="vd: nguyenminh" {...form.field('username')} />
              </Field>
              <Field label="Số điện thoại" htmlFor="phone" required error={form.errors.phone}>
                <TextInput icon="phone" type="tel" autoComplete="tel" placeholder="090 123 4567" {...form.field('phone')} />
              </Field>
            </div>
            <Field label="Email" htmlFor="email" required error={form.errors.email}>
              <TextInput icon="mail" type="email" autoComplete="email" placeholder="ban@vidu.vn" {...form.field('email')} />
            </Field>
            <Field label="Mật khẩu" htmlFor="password" required error={form.errors.password}>
              <PasswordInput autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" {...form.field('password')} />
              <StrengthMeter value={form.values.password} showLabel={!form.errors.password} />
            </Field>

            <div className="ht-row-between" style={{ marginTop: 8 }}>
              <Link className="ht-btn ht-btn--secondary" to="/login"><Icon name="back" />Quay lại</Link>
              <button type="submit" className="ht-btn ht-btn--primary" style={{ padding: '0 28px' }} disabled={form.submitting} aria-busy={form.submitting || undefined}>
                <Busy busy={form.submitting} label="Đang xử lý…"><span>Tạo tài khoản</span><Icon name="arrow" /></Busy>
              </button>
            </div>
          </form>

          <div className="ht-auth__footer">Đã có tài khoản? <Link className="ht-link" to="/login">Đăng nhập</Link></div>
        </>
      )}
    </AuthShell>
  );
};
