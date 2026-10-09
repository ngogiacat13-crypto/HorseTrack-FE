import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/mockData';
import './auth.css';

export const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [contact, setContact] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState('');

    // -------- BƯỚC 1: Nhập email/sđt --------
    const form1 = useFormik({
        initialValues: { contact: '' },
        validationSchema: Yup.object({
            contact: Yup.string().required('Vui lòng nhập Email hoặc Số điện thoại'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            setServerError('');
            try {
                await authApi.sendOtp(values.contact);
                setContact(values.contact);
                setStep(2);
            } catch (err: any) {
                setServerError(err.message || 'Không thể gửi OTP, vui lòng thử lại.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    // -------- BƯỚC 2: Nhập OTP + mật khẩu mới --------
    const form2 = useFormik({
        initialValues: { otp: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            otp: Yup.string().required('Vui lòng nhập OTP').length(6, 'OTP gồm 6 chữ số'),
            newPassword: Yup.string().required('Vui lòng nhập mật khẩu mới').min(8, 'Tối thiểu 8 ký tự'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), undefined], 'Mật khẩu xác nhận không khớp')
                .required('Vui lòng xác nhận mật khẩu'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            setServerError('');
            try {
                await authApi.resetPassword(contact, values.otp, values.newPassword);
                setIsSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } catch (err: any) {
                setServerError(err.message || 'Đặt lại mật khẩu thất bại.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    // ---- Màn hình thành công ----
    if (isSuccess) {
        return (
            <div className="auth-page">
                <div className="auth-card text-center">
                    <div className="auth-success-icon">🔐</div>
                    <h2 className="auth-title">Đặt lại mật khẩu thành công!</h2>
                    <p className="auth-sub">Đang chuyển về trang đăng nhập sau 3 giây...</p>
                    <Link to="/login" className="auth-btn-primary d-block text-decoration-none text-white">
                        Về trang Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="text-center mb-2">
                    <span className="auth-step-badge">BƯỚC {step}/2</span>
                </div>
                <h1 className="auth-title">Quên mật khẩu</h1>
                <p className="auth-sub">
                    {step === 1
                        ? 'Nhập email hoặc SĐT đã đăng ký để nhận mã khôi phục'
                        : `Mã OTP đã được gửi đến ${contact}`}
                </p>

                {serverError && <div className="alert alert-danger py-2 small">{serverError}</div>}

                {step === 1 && (
                    <form onSubmit={form1.handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Email hoặc Số điện thoại *</label>
                            <input
                                type="text"
                                className={`form-control ${form1.touched.contact && form1.errors.contact ? 'is-invalid' : ''}`}
                                placeholder="vd: minh@horsetrack.vn"
                                {...form1.getFieldProps('contact')}
                            />
                            {form1.touched.contact && form1.errors.contact && (
                                <div className="invalid-feedback">{form1.errors.contact}</div>
                            )}
                        </div>
                        <button type="submit" className="auth-btn-primary" disabled={form1.isSubmitting}>
                            {form1.isSubmitting ? 'Đang gửi OTP...' : 'Gửi mã khôi phục'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={form2.handleSubmit}>
                        <div className="auth-contact-hint">
                            💡 <strong>Mã demo:</strong> Nhập <code>123456</code> để tiếp tục.
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-bold">Mã OTP (6 chữ số) *</label>
                            <input
                                type="text"
                                maxLength={6}
                                className={`form-control ${form2.touched.otp && form2.errors.otp ? 'is-invalid' : ''}`}
                                placeholder="123456"
                                {...form2.getFieldProps('otp')}
                            />
                            {form2.touched.otp && form2.errors.otp && (
                                <div className="invalid-feedback">{form2.errors.otp}</div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-bold">Mật khẩu mới *</label>
                            <input
                                type="password"
                                className={`form-control ${form2.touched.newPassword && form2.errors.newPassword ? 'is-invalid' : ''}`}
                                placeholder="Tối thiểu 8 ký tự"
                                {...form2.getFieldProps('newPassword')}
                            />
                            {form2.touched.newPassword && form2.errors.newPassword && (
                                <div className="invalid-feedback">{form2.errors.newPassword}</div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-bold">Xác nhận mật khẩu mới *</label>
                            <input
                                type="password"
                                className={`form-control ${form2.touched.confirmPassword && form2.errors.confirmPassword ? 'is-invalid' : ''}`}
                                placeholder="Nhập lại mật khẩu mới"
                                {...form2.getFieldProps('confirmPassword')}
                            />
                            {form2.touched.confirmPassword && form2.errors.confirmPassword && (
                                <div className="invalid-feedback">{form2.errors.confirmPassword}</div>
                            )}
                        </div>

                        <button type="submit" className="auth-btn-primary" disabled={form2.isSubmitting}>
                            {form2.isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">← Quay lại đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};