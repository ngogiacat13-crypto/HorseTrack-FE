import React, { useState } from 'react';
import { authApi } from '../../../api/authApi';
import type { ApiError } from '../../../api/http';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Field, TextInput } from '../../../components/ui/Ht';
import { useForm } from '../../../hooks/useForm';

/* Step 1 — email or phone of the account; the API sends a 6-digit OTP. */
export const ContactStep: React.FC<{ onSent: (contact: string) => void }> = ({ onSent }) => {
  const [serverError, setServerError] = useState('');
  const form = useForm({ contact: '' }, (v) => ({ contact: v.contact.trim() ? undefined : 'Vui lòng nhập Email hoặc Số điện thoại' }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!form.check()) return;
    form.setSubmitting(true);
    try {
      await authApi.sendOtp(form.values.contact.trim());
      onSent(form.values.contact.trim());
    } catch (err) {
      setServerError((err as ApiError)?.message || 'Không thể gửi OTP, vui lòng thử lại.');
    } finally {
      form.setSubmitting(false);
    }
  };

  return (
    <>
      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}
      <h1 className="ht-auth__title">Quên mật khẩu?</h1>
      <p className="ht-auth__sub">Nhập email hoặc số điện thoại đã đăng ký để nhận mã khôi phục.</p>
      <form onSubmit={send} noValidate>
        <Field label="Email hoặc số điện thoại" htmlFor="contact" required error={form.errors.contact}>
          <TextInput icon="mail" autoComplete="username" placeholder="vd: minh@horsetrack.vn" {...form.field('contact')} />
        </Field>
        <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" disabled={form.submitting} aria-busy={form.submitting || undefined}>
          <Busy busy={form.submitting} label="Đang gửi mã…"><Icon name="send" /><span>Gửi mã khôi phục</span></Busy>
        </button>
      </form>
    </>
  );
};
