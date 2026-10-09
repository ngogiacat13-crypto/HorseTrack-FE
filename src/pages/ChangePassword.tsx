import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '../api/mockData';
import './auth.css';

export const ChangePassword: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);

    const formik = useFormik({
        initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            oldPassword: Yup.string().required('Vui lòng nhập mật khẩu hiện tại'),
            newPassword: Yup.string()
                .required('Vui lòng nhập mật khẩu mới')
                .min(8, 'Tối thiểu 8 ký tự')
                .notOneOf([Yup.ref('oldPassword')], 'Mật khẩu mới không được trùng mật khẩu cũ'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), undefined], 'Mật khẩu xác nhận không khớp')
                .required('Vui lòng xác nhận mật khẩu mới'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            setStatus(null);
            try {
                if (!user) throw new Error('Bạn chưa đăng nhập.');
                await authApi.changePassword(user.userId, values.oldPassword, values.newPassword);
                setStatus({ type: 'success', msg: 'Đổi mật khẩu thành công!' });
                resetForm();
            } catch (err: any) {
                setStatus({ type: 'danger', msg: err.message || 'Đổi mật khẩu thất bại.' });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="auth-page" style={{ minHeight: 'auto', background: 'transparent', padding: 0 }}>
            <div className="auth-card mx-auto">
                <h1 className="auth-title">Đổi mật khẩu</h1>
                <p className="auth-sub">
                    Tài khoản: <strong>{user?.fullname}</strong> — để bảo mật, vui lòng nhập mật khẩu hiện tại.
                </p>

                {status && <div className={`alert alert-${status.type} py-2 small`}>{status.msg}</div>}

                <form onSubmit={formik.handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Mật khẩu hiện tại *</label>
                        <input
                            type="password"
                            className={`form-control ${formik.touched.oldPassword && formik.errors.oldPassword ? 'is-invalid' : ''}`}
                            placeholder="Nhập mật khẩu đang dùng"
                            {...formik.getFieldProps('oldPassword')}
                        />
                        {formik.touched.oldPassword && formik.errors.oldPassword && (
                            <div className="invalid-feedback">{formik.errors.oldPassword}</div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold">Mật khẩu mới *</label>
                        <input
                            type="password"
                            className={`form-control ${formik.touched.newPassword && formik.errors.newPassword ? 'is-invalid' : ''}`}
                            placeholder="Tối thiểu 8 ký tự"
                            {...formik.getFieldProps('newPassword')}
                        />
                        {formik.touched.newPassword && formik.errors.newPassword && (
                            <div className="invalid-feedback">{formik.errors.newPassword}</div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold">Xác nhận mật khẩu mới *</label>
                        <input
                            type="password"
                            className={`form-control ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'is-invalid' : ''}`}
                            placeholder="Nhập lại mật khẩu mới"
                            {...formik.getFieldProps('confirmPassword')}
                        />
                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                            <div className="invalid-feedback">{formik.errors.confirmPassword}</div>
                        )}
                    </div>

                    <button type="submit" className="auth-btn-primary" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>
        </div>
    );
};