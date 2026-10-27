import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

const schema = Yup.object({
  username: Yup.string().trim().required('Vui lòng nhập tên đăng nhập, email hoặc số điện thoại'),
  password: Yup.string().required('Vui lòng nhập mật khẩu'),
});

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [params] = useSearchParams();
  const confirmed = params.get('confirmed');
  const confirmMessage = params.get('message');

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
      <p className="ht-auth__sub" data-testid="login-identifier-hint">Dùng tên đăng nhập, email hoặc số điện thoại.</p>

      {confirmed && (
        <Callout tone={confirmed === 'true' ? 'success' : 'danger'} testId="login-confirm-result" style={{ marginBottom: 16 }}>
          {confirmMessage || (confirmed === 'true' ? 'Đã xác nhận tài khoản. Đăng nhập bằng email và mật khẩu tạm trong email.' : 'Liên kết xác nhận không hợp lệ hoặc đã hết hạn.')}
        </Callout>
      )}
      {serverError && <Callout tone="danger" testId="login-error" style={{ marginBottom: 16 }}>{serverError}</Callout>}

      <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} noValidate data-testid="login-form">
        <FocusFirstError />
        <FormikField name="username" label="Tên đăng nhập / Email / Số điện thoại" icon="user" autoComplete="username" placeholder="vd: nguyenminh, ten@gmail.com hoặc 0912345678" />

        <div>
          <FormikField name="password" label="Mật khẩu" password autoComplete="current-password" placeholder="Nhập mật khẩu" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <Link className="ht-link" to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
          </div>
        </div>

        <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" data-testid="login-submit" style={{ marginTop: 8 }} disabled={submitting} aria-busy={submitting || undefined}>
          <Busy busy={submitting} label="Đang đăng nhập…"><span>Đăng nhập</span><Icon name="arrow" /></Busy>
        </button>
      </form>
      </FormikProvider>

      <div className="ht-auth__footer">Bạn là chủ ngựa mới? <Link className="ht-link" to="/register">Đăng ký tài khoản</Link> · <Link className="ht-link" to={PATH.landing}>Giới thiệu HorseTrack</Link></div>
    </AuthShell>
  );
};
