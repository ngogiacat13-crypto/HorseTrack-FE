import React, { useState } from 'react';
import { Form, Formik, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../../auth/AuthContext';
import { authApi } from '../../../api/authApi';
import type { ApiError } from '../../../api/http';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Busy, Callout, PageHeader, Rules, StrengthMeter } from '../../../components/ui/Ht';
import { FocusFirstError, FormikField } from '../../../components/form/FormikField';
import { ROLE_LABEL } from '../../../components/layout/nav';

type Values = { oldPassword: string; newPassword: string; confirmPassword: string };
const EMPTY: Values = { oldPassword: '', newPassword: '', confirmPassword: '' };

/* Yup: the validation rules of the form, declared once. */
const schema = Yup.object({
  oldPassword: Yup.string().required('Vui lòng nhập mật khẩu hiện tại'),
  newPassword: Yup.string()
    .required('Vui lòng nhập mật khẩu mới')
    .min(8, 'Tối thiểu 8 ký tự')
    .notOneOf([Yup.ref('oldPassword')], 'Mật khẩu mới không được trùng mật khẩu cũ'),
  confirmPassword: Yup.string()
    .required('Vui lòng xác nhận mật khẩu mới')
    .oneOf([Yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp'),
});

export const ChangePassword: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ tone: 'success' | 'danger'; msg: React.ReactNode } | null>(null);
  const [reveal, setReveal] = useState(false);

  // Formik only calls this when the schema passes; isSubmitting stays true until the promise settles.
  const onSubmit = async (v: Values, { resetForm, setFieldError }: FormikHelpers<Values>) => {
    setStatus(null);
    try {
      if (!user) throw new Error('Bạn chưa đăng nhập.');
      await authApi.changePassword(user.userId, v.oldPassword, v.newPassword);
      setStatus({ tone: 'success', msg: <><b>Đổi mật khẩu thành công!</b> Dùng mật khẩu mới cho lần đăng nhập sau.</> });
      resetForm();
    } catch (err) {
      const msg = (err as ApiError)?.message || 'Đổi mật khẩu thất bại.';
      setStatus({ tone: 'danger', msg });
      if (/hiện tại/.test(msg)) setFieldError('oldPassword', 'Kiểm tra lại mật khẩu đang dùng');
    }
  };

  const initials = (user?.fullname ?? 'U').split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<>Tài khoản <Icon name="chev" size={14} /><b>Đổi mật khẩu</b></>}
        title="Đổi mật khẩu"
        sub="Để bảo mật, hãy nhập mật khẩu hiện tại trước khi đặt mật khẩu mới."
      />

      {/* Render props: <Formik> calls this function with the form state, so the side panel can read values too. */}
      <Formik initialValues={EMPTY} validationSchema={schema} onSubmit={onSubmit}>
        {({ values: v, isSubmitting, resetForm }) => (
          <div className="ht-cols" style={{ maxWidth: 1080 }}>
            <div>
              <section className="ht-card">
                <h2 className="ht-card__title">Mật khẩu đăng nhập</h2>
                <p className="ht-card__sub">Áp dụng cho tài khoản <b className="ht-mono" style={{ color: 'var(--foreground)' }}>{user?.username}</b>.</p>
                <hr className="ht-divider" />

                {status && <Callout tone={status.tone} style={{ marginBottom: 16 }}>{status.msg}</Callout>}

                <Form noValidate>
                  <FocusFirstError />
                  <FormikField name="oldPassword" label="Mật khẩu hiện tại" required password icon="key" autoComplete="current-password" placeholder="Nhập mật khẩu đang dùng" fieldStyle={{ maxWidth: 420 }} />
                  <div className="ht-grid-2">
                    <FormikField name="newPassword" label="Mật khẩu mới" required password autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" revealed={reveal} onRevealChange={setReveal}>
                      <StrengthMeter value={v.newPassword} showLabel={false} />
                    </FormikField>
                    <FormikField name="confirmPassword" label="Xác nhận mật khẩu mới" required icon="lock" type={reveal ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
                  </div>
                  <hr className="ht-divider" style={{ marginTop: 8 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="ht-btn ht-btn--secondary" onClick={() => { resetForm(); setStatus(null); }}>Hủy</button>
                    <button type="submit" className="ht-btn ht-btn--primary" disabled={isSubmitting} aria-busy={isSubmitting || undefined}>
                      <Busy busy={isSubmitting} label="Đang cập nhật…">Cập nhật mật khẩu</Busy>
                    </button>
                  </div>
                </Form>
              </section>
            </div>

            <div>
              <section className="ht-card" style={{ padding: 20 }}>
                <div className="ht-overline" style={{ marginBottom: 12 }}>Yêu cầu mật khẩu</div>
                <Rules items={[
                  { ok: v.newPassword.length >= 8, label: 'Tối thiểu 8 ký tự' },
                  { ok: !!v.newPassword && v.newPassword !== v.oldPassword, label: 'Khác mật khẩu hiện tại' },
                  { ok: !!v.confirmPassword && v.confirmPassword === v.newPassword, label: 'Xác nhận trùng khớp' },
                ]} />
              </section>

              <section className="ht-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <i className="ht-avatar ht-avatar--lg">{initials}</i>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user?.fullname}</div>
                    {user && <Badge tone="brand" plain style={{ marginTop: 4 }}>{ROLE_LABEL[user.role]}</Badge>}
                  </div>
                </div>
                <dl className="ht-kv">
                  <dt>Tên đăng nhập</dt><dd className="ht-mono">{user?.username}</dd>
                  <dt>Email</dt><dd>{user?.email}</dd>
                  <dt>Điện thoại</dt><dd className="ht-mono">{user?.phone}</dd>
                </dl>
              </section>
            </div>
          </div>
        )}
      </Formik>
    </div>
  );
};
