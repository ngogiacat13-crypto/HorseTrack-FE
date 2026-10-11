import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AuthShell } from '../components/auth/AuthShell';
import { Icon } from '../components/ui/Icon';
import { Busy, Callout, Field, PasswordInput, StrengthMeter, TextInput } from '../components/ui/Ht';
import { useForm } from '../hooks/useForm';

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';
const RESEND_SECONDS = 45;

/* Six single-digit boxes; paste fills all. */
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void; invalid?: boolean; labelledBy: string }> = ({ value, onChange, invalid, labelledBy }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const setAt = (i: number, d: string) => {
    const next = digits.slice(); next[i] = d;
    onChange(next.join('').slice(0, 6));
  };
  return (
    <div className="ht-otp" role="group" aria-labelledby={labelledBy} aria-invalid={invalid || undefined}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chữ số ${i + 1}`}
          value={d}
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, c);
            if (c && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }}
          onPaste={(e) => {
            const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (!p) return;
            e.preventDefault();
            onChange(p);
            refs.current[Math.min(p.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
};

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contact, setContact] = useState('');
  const [serverError, setServerError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [reveal, setReveal] = useState(false);
  const firstOtp = useRef<HTMLDivElement>(null);

  const form1 = useForm({ contact: '' }, (v) => ({
    contact: v.contact.trim() ? undefined : 'Vui lòng nhập Email hoặc Số điện thoại',
  }));
  const form2 = useForm({ otp: '', newPassword: '', confirmPassword: '' }, (v) => ({
    otp: !v.otp ? 'Vui lòng nhập OTP' : v.otp.length !== 6 ? 'OTP gồm 6 chữ số' : undefined,
    newPassword: !v.newPassword ? 'Vui lòng nhập mật khẩu mới' : v.newPassword.length < 8 ? 'Tối thiểu 8 ký tự' : undefined,
    confirmPassword: !v.confirmPassword ? 'Vui lòng xác nhận mật khẩu' : v.confirmPassword !== v.newPassword ? 'Mật khẩu xác nhận không khớp' : undefined,
  }));

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step !== 3) return;
    const t = window.setTimeout(() => navigate('/login'), 3000);
    return () => window.clearTimeout(t);
  }, [step, navigate]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setServerError('');
    if (!form1.check()) return;
    form1.setSubmitting(true);
    try {
      await authApi.sendOtp(form1.values.contact.trim());
      setContact(form1.values.contact.trim());
      setStep(2);
      setResendIn(RESEND_SECONDS);
      window.setTimeout(() => firstOtp.current?.querySelector('input')?.focus(), 0);
    } catch (err: any) {
      setServerError(err?.message || 'Không thể gửi OTP, vui lòng thử lại.');
    } finally {
      form1.setSubmitting(false);
    }
  };

  const resend = async () => {
    await authApi.sendOtp(contact);
    setResendIn(RESEND_SECONDS);
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!form2.check()) return;
    form2.setSubmitting(true);
    try {
      await authApi.resetPassword(contact, form2.values.otp, form2.values.newPassword);
      setStep(3);
    } catch (err: any) {
      setServerError(err?.message || 'Đặt lại mật khẩu thất bại.');
      form2.setServerErrors({ otp: ' ' });
    } finally {
      form2.setSubmitting(false);
    }
  };

  const otpError = form2.errors.otp?.trim();

  return (
    <AuthShell
      narrow
      logoHeight={56}
      eyebrow="Khôi phục tài khoản"
      headline="Đặt lại mật khẩu trong 2 bước."
      lede="Mã khôi phục gồm 6 chữ số, gửi tới email hoặc số điện thoại đã đăng ký."
      points={[
        { icon: 'mail', title: 'Xác minh liên hệ', text: 'Nhập email hoặc SĐT của tài khoản.' },
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

      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}

      {step === 1 && (
        <>
          <h1 className="ht-auth__title">Quên mật khẩu?</h1>
          <p className="ht-auth__sub">Nhập email hoặc số điện thoại đã đăng ký để nhận mã khôi phục.</p>
          <form onSubmit={sendCode} noValidate>
            <Field label="Email hoặc số điện thoại" htmlFor="contact" required error={form1.errors.contact}>
              <TextInput icon="mail" autoComplete="username" placeholder="vd: minh@horsetrack.vn" {...form1.field('contact')} />
            </Field>
            <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" disabled={form1.submitting} aria-busy={form1.submitting || undefined}>
              <Busy busy={form1.submitting} label="Đang gửi mã…"><Icon name="send" /><span>Gửi mã khôi phục</span></Busy>
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="ht-auth__title">Nhập mã khôi phục</h1>
          <p className="ht-auth__sub">
            Mã đã gửi đến <b className="ht-mono" style={{ color: 'var(--foreground)' }}>{contact}</b> ·{' '}
            <button type="button" className="ht-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 600 }}
              onClick={() => { setStep(1); setServerError(''); form2.reset(); }}>Đổi</button>
          </p>
          <form onSubmit={reset} noValidate>
            <div className="ht-field" ref={firstOtp}>
              <div className="ht-field__top">
                <span className="ht-label" id="otp-label">Mã OTP (6 chữ số)<span className="ht-req">*</span></span>
                <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={resendIn > 0} onClick={resend} style={{ height: 24, padding: '0 6px', fontSize: 12 }}>
                  {resendIn > 0 ? <>Gửi lại sau&nbsp;<span className="ht-mono" style={{ fontSize: 12 }}>00:{String(resendIn).padStart(2, '0')}</span></> : 'Gửi lại mã'}
                </button>
              </div>
              <OtpInput labelledBy="otp-label" value={form2.values.otp} invalid={!!form2.errors.otp}
                onChange={(v) => { form2.setValues((s) => ({ ...s, otp: v })); form2.setServerErrors({}); }} />
              {otpError && <div className="ht-error" role="alert"><Icon name="alert" /><span>{otpError}</span></div>}
            </div>

            {SHOW_DEMO && (
              <Callout tone="demo" title="DEMO ONLY" style={{ margin: '-4px 0 16px' }}>
                Không gửi mã thật. Nhập <b className="ht-mono">123456</b> để tiếp tục.
              </Callout>
            )}

            <div className="ht-grid-2">
              <Field label="Mật khẩu mới" htmlFor="newPassword" required error={form2.errors.newPassword}>
                <PasswordInput autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" revealed={reveal} onRevealChange={setReveal} {...form2.field('newPassword')} />
                <StrengthMeter value={form2.values.newPassword} showLabel={false} />
              </Field>
              <Field label="Xác nhận mật khẩu" htmlFor="confirmPassword" required error={form2.errors.confirmPassword}>
                <TextInput icon="lock" type={reveal ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" {...form2.field('confirmPassword')} />
              </Field>
            </div>

            <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 4 }} disabled={form2.submitting} aria-busy={form2.submitting || undefined}>
              <Busy busy={form2.submitting} label="Đang xử lý…">Đặt lại mật khẩu</Busy>
            </button>
          </form>
        </>
      )}

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
