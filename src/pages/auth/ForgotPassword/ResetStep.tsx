import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../../../api/authApi';
import { USE_BACKEND } from '../../../api/beClient';
import type { ApiError } from '../../../api/http';
import { OtpInput } from '../../../components/auth/OtpInput';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Field, PasswordInput, StrengthMeter, TextInput } from '../../../components/ui/Ht';
import { useForm } from '../../../hooks/useForm';

// backend mode sends a real code by email, so the fixed demo code does not apply
const SHOW_DEMO = !USE_BACKEND && (import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true');
const RESEND_SECONDS = 45;

/* Step 2 — OTP + new password. "Gửi lại mã" is available again after 45 seconds. */
export const ResetStep: React.FC<{ contact: string; onChangeContact: () => void; onDone: () => void }> = ({ contact, onChangeContact, onDone }) => {
  const [serverError, setServerError] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [reveal, setReveal] = useState(false);
  const otpBox = useRef<HTMLDivElement>(null);
  const form = useForm({ otp: '', newPassword: '', confirmPassword: '' }, (v) => ({
    otp: !v.otp ? 'Vui lòng nhập OTP' : v.otp.length !== 6 ? 'OTP gồm 6 chữ số' : undefined,
    newPassword: !v.newPassword ? 'Vui lòng nhập mật khẩu mới' : v.newPassword.length < 8 ? 'Tối thiểu 8 ký tự' : undefined,
    confirmPassword: !v.confirmPassword ? 'Vui lòng xác nhận mật khẩu' : v.confirmPassword !== v.newPassword ? 'Mật khẩu xác nhận không khớp' : undefined,
  }));

  useEffect(() => { otpBox.current?.querySelector('input')?.focus(); }, []);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const resend = async () => { await authApi.sendOtp(contact); setResendIn(RESEND_SECONDS); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!form.check()) return;
    form.setSubmitting(true);
    try {
      await authApi.resetPassword(contact, form.values.otp, form.values.newPassword);
      onDone();
    } catch (err) {
      const message = (err as ApiError)?.message || 'Đặt lại mật khẩu thất bại.';
      setServerError(message);
      form.setServerErrors(message.includes('trùng mật khẩu cũ') ? { newPassword: message } : { otp: ' ' });
    } finally {
      form.setSubmitting(false);
    }
  };
  const otpError = form.errors.otp?.trim();

  return (
    <>
      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}
      <h1 className="ht-auth__title">Nhập mã khôi phục</h1>
      <p className="ht-auth__sub">
        Mã đã gửi đến <b className="ht-mono" style={{ color: 'var(--foreground)' }}>{contact}</b> ·{' '}
        <button type="button" className="ht-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 600 }} onClick={onChangeContact}>Đổi</button>
      </p>
      <form onSubmit={submit} noValidate>
        <div className="ht-field" ref={otpBox}>
          <div className="ht-field__top">
            <span className="ht-label" id="otp-label">Mã OTP (6 chữ số)<span className="ht-req">*</span></span>
            <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={resendIn > 0} onClick={resend} style={{ height: 24, padding: '0 6px', fontSize: 12 }}>
              {resendIn > 0 ? <>Gửi lại sau&nbsp;<span className="ht-mono" style={{ fontSize: 12 }}>00:{String(resendIn).padStart(2, '0')}</span></> : 'Gửi lại mã'}
            </button>
          </div>
          <OtpInput labelledBy="otp-label" value={form.values.otp} invalid={!!form.errors.otp}
            onChange={(v) => { form.setValues((s) => ({ ...s, otp: v })); form.setServerErrors({}); }} />
          {otpError && <div className="ht-error" role="alert"><Icon name="alert" /><span>{otpError}</span></div>}
        </div>

        {SHOW_DEMO && (
          <Callout tone="demo" title="DEMO ONLY" style={{ margin: '-4px 0 16px' }}>
            Không gửi mã thật. Nhập <b className="ht-mono">123456</b> để tiếp tục.
          </Callout>
        )}

        <div className="ht-grid-2">
          <Field label="Mật khẩu mới" htmlFor="newPassword" required error={form.errors.newPassword}>
            <PasswordInput autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" revealed={reveal} onRevealChange={setReveal} {...form.field('newPassword')} />
            <StrengthMeter value={form.values.newPassword} showLabel={false} />
          </Field>
          <Field label="Xác nhận mật khẩu" htmlFor="confirmPassword" required error={form.errors.confirmPassword}>
            <TextInput icon="lock" type={reveal ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" {...form.field('confirmPassword')} />
          </Field>
        </div>

        <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 4 }} disabled={form.submitting} aria-busy={form.submitting || undefined}>
          <Busy busy={form.submitting} label="Đang xử lý…">Đặt lại mật khẩu</Busy>
        </button>
      </form>
    </>
  );
};
