import React, { useEffect, useState } from 'react';
import type { ApiError } from '../../../api/http';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Field, TextInput } from '../../../components/ui/Ht';

const RESEND_SECONDS = 60;

export const OtpStep: React.FC<{
  email: string; ttlSeconds: number; demoHint?: boolean;
  onVerify: (otp: string) => Promise<unknown>; onResend: () => Promise<unknown>; onBack: () => void; onDone: () => void;
}> = ({ email, ttlSeconds, demoHint, onVerify, onResend, onBack, onDone }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) return setError('Mã OTP gồm 6 chữ số.');
    setBusy(true);
    setError('');
    try {
      await onVerify(otp.trim());
      onDone();
    } catch (err) {
      setError((err as ApiError)?.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await onResend();
      setInfo(`Đã gửi lại mã OTP tới ${email}.`);
      setWait(RESEND_SECONDS);
    } catch (err) {
      setError((err as ApiError)?.message || 'Không gửi lại được mã OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="ht-auth__title">Xác thực email</h1>
      <p className="ht-auth__sub">
        Mã OTP 6 chữ số đã được gửi tới <b style={{ color: 'var(--foreground)' }}>{email}</b>. Mã có hiệu lực {Math.round(ttlSeconds / 60)} phút.
      </p>
      {demoHint && <Callout tone="demo" title="DEMO ONLY" style={{ marginBottom: 16 }}>Chế độ dữ liệu mẫu: nhập mã <b>123456</b>.</Callout>}
      {info && <Callout tone="success" style={{ marginBottom: 16 }}>{info}</Callout>}
      {error && <Callout tone="danger" style={{ marginBottom: 16 }} testId="register-otp-error">{error}</Callout>}
      <form onSubmit={verify} noValidate data-testid="register-otp-form">
        <Field label="Mã OTP" htmlFor="otp" required>
          <TextInput id="otp" name="otp" icon="key" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 chữ số"
            value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} data-testid="register-otp-input" />
        </Field>
        <div className="ht-row-between" style={{ marginTop: 8 }}>
          <button type="button" className="ht-btn ht-btn--secondary" onClick={onBack} disabled={busy} data-testid="register-otp-back">
            <Icon name="back" />Sửa thông tin
          </button>
          <button type="submit" className="ht-btn ht-btn--primary" style={{ padding: '0 28px' }} disabled={busy} aria-busy={busy || undefined} data-testid="register-otp-submit">
            <Busy busy={busy} label="Đang xác thực…"><span>Xác thực & tạo tài khoản</span><Icon name="arrow" /></Busy>
          </button>
        </div>
      </form>
      <div className="ht-auth__footer">
        Chưa nhận được mã?{' '}
        {wait > 0
          ? <span style={{ color: 'var(--muted)' }}>Gửi lại sau {wait}s</span>
          : <button type="button" className="ht-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={resend} disabled={busy} data-testid="register-otp-resend">Gửi lại mã</button>}
      </div>
    </>
  );
};
