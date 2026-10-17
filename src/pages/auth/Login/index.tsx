import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { ROLE_HOME } from '../../../api/mockData';
import type { ApiError } from '../../../api/http';
import { AuthShell } from '../../../components/auth/AuthShell';
import { Icon } from '../../../components/ui/Icon';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { Busy, Callout } from '../../../components/ui/Ht';
import { FocusFirstError, FormikField } from '../../../components/form/FormikField';
import { PATH } from '../../../routers/routerPath';

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';

const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'Quản lý CLB', initials: 'QL' },
  { username: 'duchung', role: 'HLV trưởng', initials: 'HL' },
  { username: 'thihuong', role: 'Bác sĩ thú y', initials: 'BS' },
  { username: 'vantoan', role: 'Người chăm ngựa', initials: 'MP' },
  { username: 'hoanglan', role: 'Chủ ngựa', initials: 'CN' },
  { username: 'vankho', role: 'Quản lý kho', initials: 'QK' },
];

const schema = Yup.object({
  username: Yup.string().trim().required('Vui lòng nhập tên đăng nhập / email / SĐT'),
  password: Yup.string().required('Vui lòng nhập mật khẩu'),
});

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const passwordRef = useRef<HTMLDivElement>(null);

  // useFormik = the hook form of <Formik>; used here because the demo buttons outside the <form> also fill it.
  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: schema,
    onSubmit: async (v) => {
      setServerError('');
      try {
        const user = await login(v.username.trim(), v.password);
        navigate(ROLE_HOME[user.role], { replace: true });
      } catch (err) {
        setServerError((err as ApiError)?.message || 'Đăng nhập thất bại');
      }
    },
  });
  const submitting = formik.isSubmitting;

  const pickDemo = (username: string) => {
    formik.resetForm({ values: { username, password: 'password123' } });
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

      <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} noValidate>
        <FocusFirstError />
        <FormikField name="username" label="Tên đăng nhập / Email / SĐT" icon="user" autoComplete="username" placeholder="vd: nguyenminh" />

        <div ref={passwordRef}>
          <FormikField name="password" label="Mật khẩu" password autoComplete="current-password" placeholder="Nhập mật khẩu" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <Link className="ht-link" to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
          </div>
        </div>

        <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 8 }} disabled={submitting} aria-busy={submitting || undefined}>
          <Busy busy={submitting} label="Đang đăng nhập…"><span>Đăng nhập</span><Icon name="arrow" /></Busy>
        </button>
      </form>
      </FormikProvider>

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

      <div className="ht-auth__footer">Bạn là chủ ngựa mới? <Link className="ht-link" to="/register">Đăng ký tài khoản</Link> · <Link className="ht-link" to={PATH.landing}>Giới thiệu HorseTrack</Link></div>
    </AuthShell>
  );
};
