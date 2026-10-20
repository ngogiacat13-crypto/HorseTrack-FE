import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../../components/auth/AuthShell';
import { Icon } from '../../../components/ui/Icon';
import { ContactStep } from './ContactStep';
import { ResetStep } from './ResetStep';

/* Quên mật khẩu: 1) email → OTP · 2) OTP + mật khẩu mới · 3) xong, tự về trang đăng nhập sau 3 giây. */
export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contact, setContact] = useState('');

  useEffect(() => {
    if (step !== 3) return;
    const t = window.setTimeout(() => navigate('/login'), 3000);
    return () => window.clearTimeout(t);
  }, [step, navigate]);

  return (
    <AuthShell
      narrow
      logoHeight={56}
      eyebrow="Khôi phục tài khoản"
      headline="Đặt lại mật khẩu trong 2 bước."
      lede="Mã khôi phục gồm 6 chữ số, gửi tới email đã đăng ký."
      points={[
        { icon: 'mail', title: 'Xác minh email', text: 'Nhập email của tài khoản.' },
        { icon: 'key', title: 'Nhập mã và mật khẩu mới', text: 'Mật khẩu mới có hiệu lực ngay.' },
      ]}
      foot="Không nhận được mã? Liên hệ Quản lý CLB."
      barRight={<Link className="ht-link" to="/login" style={{ fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="back" />Quay lại đăng nhập</Link>}
    >
      <ol className="ht-stepper" style={{ marginBottom: 24 }} aria-label="Tiến trình">
        <li className="ht-step" data-state={step === 1 ? 'current' : 'done'}>
          <span className="ht-step__dot">{step === 1 ? '1' : <Icon name="check" />}</span>Xác minh liên hệ
        </li>
        <li className="ht-step-line" data-done={step > 1} aria-hidden="true" />
        <li className="ht-step" data-state={step === 2 ? 'current' : step === 3 ? 'done' : undefined}>
          <span className="ht-step__dot">{step === 3 ? <Icon name="check" /> : '2'}</span>Mã OTP &amp; mật khẩu mới
        </li>
      </ol>

      {step === 1 && <ContactStep onSent={(c) => { setContact(c); setStep(2); }} />}
      {step === 2 && <ResetStep contact={contact} onChangeContact={() => setStep(1)} onDone={() => setStep(3)} />}
      {step === 3 && (
        <div className="ht-done">
          <span className="ht-done__icon"><Icon name="check" /></span>
          <h1 className="ht-auth__title" style={{ fontSize: 24, lineHeight: '32px' }}>Đã đặt lại mật khẩu</h1>
          <p className="ht-auth__sub" style={{ marginBottom: 20 }}>Dùng mật khẩu mới để đăng nhập. Tự chuyển về trang đăng nhập sau 3 giây…</p>
          <Link className="ht-btn ht-btn--primary" to="/login">Về trang đăng nhập</Link>
        </div>
      )}

      {step !== 3 && <div className="ht-auth__footer">Nhớ ra mật khẩu? <Link className="ht-link" to="/login">Đăng nhập</Link></div>}
    </AuthShell>
  );
};
