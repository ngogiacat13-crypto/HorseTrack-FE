import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../../api/authApi';
import type { ApiError } from '../../../api/http';
import { AuthShell } from '../../../components/auth/AuthShell';
import { Icon } from '../../../components/ui/Icon';
import { Callout, Loading } from '../../../components/ui/Ht';

type State = { kind: 'loading' } | { kind: 'ok'; email: string } | { kind: 'error'; message: string };

export const ConfirmAccount: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>(token ? { kind: 'loading' } : { kind: 'error', message: 'Liên kết xác nhận thiếu mã. Mở lại đúng liên kết trong email.' });
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    authApi.confirmStaffAccount(token)
      .then((r) => setState({ kind: 'ok', email: r.email }))
      .catch((e: ApiError) => setState({ kind: 'error', message: e?.message || 'Liên kết xác nhận không hợp lệ hoặc đã hết hạn.' }));
  }, [token]);

  return (
    <AuthShell
      narrow
      logoHeight={56}
      eyebrow="Dành cho nhân viên"
      headline="Kích hoạt tài khoản nhân viên."
      lede="Quản lý CLB đã tạo tài khoản cho bạn. Xác nhận email để bắt đầu nhận công việc."
      points={[
        { icon: 'mail', title: 'Xác nhận email', text: 'Bấm liên kết trong email Quản lý CLB gửi.' },
        { icon: 'key', title: 'Đăng nhập & đổi mật khẩu', text: 'Dùng mật khẩu tạm trong email, rồi đổi mật khẩu mới.' },
      ]}
      foot="Liên kết hết hạn? Nhờ Quản lý CLB gửi lại mail xác nhận."
      barRight={<Link className="ht-link" to="/login" style={{ fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="back" />Đăng nhập</Link>}
    >
      <h1 className="ht-auth__title">Xác nhận tài khoản</h1>
      {state.kind === 'loading' && <Loading />}
      {state.kind === 'ok' && (
        <div data-testid="confirm-account-ok">
          <Callout tone="success" title="Đã kích hoạt tài khoản" style={{ marginBottom: 20 }}>
            Đăng nhập bằng <b>{state.email}</b> và mật khẩu tạm trong email, sau đó đổi mật khẩu ở menu tài khoản.
          </Callout>
          <Link className="ht-btn ht-btn--primary" to="/login" data-testid="confirm-account-login">Đăng nhập ngay<Icon name="arrow" /></Link>
        </div>
      )}
      {state.kind === 'error' && (
        <div data-testid="confirm-account-error">
          <Callout tone="danger" title="Không xác nhận được" style={{ marginBottom: 20 }}>{state.message}</Callout>
          <Link className="ht-btn ht-btn--secondary" to="/login">Về trang đăng nhập</Link>
        </div>
      )}
    </AuthShell>
  );
};
