import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_HOME } from '../api/mockData';
import { AuthShell } from '../components/auth/AuthShell';
import { Icon } from '../components/ui/Icon';
import { Busy, Callout, Field, PasswordInput, TextInput } from '../components/ui/Ht';
import { useForm } from '../hooks/useForm';

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';

const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'Quản lý CLB', initials: 'QL' },
  { username: 'duchung', role: 'HLV trưởng', initials: 'HL' },
  { username: 'thihuong', role: 'Bác sĩ thú y', initials: 'BS' },
  { username: 'vantoan', role: 'Người chăm ngựa', initials: 'MP' },
  { username: 'hoanglan', role: 'Chủ ngựa', initials: 'CN' },
  { username: 'vankho', role: 'Quản lý kho', initials: 'QK' },
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const passwordRef = useRef<HTMLDivElement>(null);

  const form = useForm({ username: '', password: '' }, (v) => ({
    username: v.username.trim() ? undefined : 'Vui lòng nhập tên đăng nhập / email / SĐT',
    password: v.password ? undefined : 'Vui lòng nhập mật khẩu',
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!form.check()) return;
    form.setSubmitting(true);
    try {
      const user = await login(form.values.username.trim(), form.values.password);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err: any) {
      setServerError(err?.message || 'Đăng nhập thất bại');
      form.setSubmitting(false);
    }
  };

  const pickDemo = (username: string) => {
    form.reset({ username, password: 'password123' });
    setServerError('');
    passwordRef.current?.querySelector('input')?.focus();
  };

  return (
    <AuthShell
      eyebrow="Câu lạc bộ đua ngựa"
      headline="Chuồng ngựa, y tế và tài chính — trên một màn hình."
      lede="Đăng nhập một lần, hệ thống đưa bạn đến đúng không gian làm việc theo vai trò."
      points={[
        { icon: 'pulse', title: 'Huấn luyện an toàn', text: 'Phiên tập tự dừng khi nhịp tim vượt ngưỡng.' },
        { icon: 'shield', title: 'Bác sĩ quyết định y tế', text: 'Khóa huấn luyện, phác đồ và kho thuốc liên thông.' },
        { icon: 'receipt', title: 'Hóa đơn minh bạch', text: 'Nhắc hạn và thanh toán VNPay được xác minh.' },
      ]}
      foot="6 vai trò · Asia/Ho_Chi_Minh"
      barRight={<span style={{ fontSize: 13, color: 'var(--muted)' }}>Chủ ngựa mới? <Link className="ht-link" to="/register">Đăng ký</Link></span>}
    >
      <h1 className="ht-auth__title">Đăng nhập</h1>
      <p className="ht-auth__sub">Dùng tên đăng nhập, email hoặc số điện thoại.</p>

      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}

      <form onSubmit={onSubmit} noValidate>
        <Field label="Tên đăng nhập / Email / SĐT" htmlFor="username" error={form.errors.username}>
          <TextInput icon="user" autoComplete="username" placeholder="vd: nguyenminh" {...form.field('username')} />
        </Field>

        <div ref={passwordRef}>
          <Field label="Mật khẩu" htmlFor="password" error={form.errors.password}>
            <PasswordInput autoComplete="current-password" placeholder="Nhập mật khẩu" {...form.field('password')} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <Link className="ht-link" to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
          </div>
        </div>

        <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 8 }} disabled={form.submitting} aria-busy={form.submitting || undefined}>
          <Busy busy={form.submitting} label="Đang đăng nhập…"><span>Đăng nhập</span><Icon name="arrow" /></Busy>
        </button>
      </form>

      {SHOW_DEMO && (
        <div className="ht-demo" aria-label="Tài khoản demo">
          <div className="ht-demo__head">
            <span><b>Tài khoản demo</b> · bấm để điền</span>
            <span>mật khẩu <span className="ht-mono" style={{ fontSize: 12 }}>password123</span></span>
          </div>
          <div className="ht-demo__list">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.username} type="button" className="ht-demo-row" onClick={() => pickDemo(a.username)}>
                <i className="ht-avatar">{a.initials}</i>
                <span><b>{a.username}</b><small>{a.role}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ht-auth__footer">Bạn là chủ ngựa mới? <Link className="ht-link" to="/register">Đăng ký tài khoản</Link></div>
    </AuthShell>
  );
};
