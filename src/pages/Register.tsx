import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/mockData';
import './auth.css';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .required('Vui lòng nhập tên đăng nhập')
        .min(4, 'Tối thiểu 4 ký tự'),
      password: Yup.string()
        .required('Vui lòng nhập mật khẩu')
        .min(8, 'Mật khẩu tối thiểu 8 ký tự'),
      fullname: Yup.string().required('Vui lòng nhập họ và tên'),
      email: Yup.string()
        .email('Email không hợp lệ')
        .required('Vui lòng nhập email'),
      phone: Yup.string()
        .matches(/^(0|\+84)(\d{9,10})$/, 'Số điện thoại không hợp lệ')
        .required('Vui lòng nhập số điện thoại'),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        await authApi.register(values);
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        if (err.field) {
          setErrors({ [err.field]: err.message });
        } else {
          setErrors({ email: 'Đã có lỗi xảy ra, vui lòng thử lại.' });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  /* ============ MÀN HÌNH ĐĂNG KÝ THÀNH CÔNG ============ */
  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-success-title">Đăng ký thành công!</h2>
            <p className="auth-success-msg">
              Tài khoản <strong>Chủ ngựa</strong> của bạn đã được tạo.
              <br />
              Đang chuyển về trang đăng nhập sau 3 giây...
            </p>
            <Link
              to="/login"
              className="auth-btn"
              style={{ textDecoration: 'none' }}
            >
              Về trang Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ============ FORM ĐĂNG KÝ ============ */
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header bước */}
        <div className="auth-step-header">
          <span className="auth-step-badge">BƯỚC 1/1</span>
          <span className="auth-step-percent">100%</span>
        </div>

        {/* Progress bar */}
        <div className="auth-progress">
          <div className="auth-progress-fill" style={{ width: '100%' }} />
        </div>

        {/* Tiêu đề */}
        <h1 className="auth-title" style={{ textAlign: 'left', fontSize: 22 }}>
          Đăng ký tài khoản Chủ ngựa
        </h1>
        <p className="auth-sub" style={{ textAlign: 'left', marginBottom: 20 }}>
          Tạo tài khoản để quản lý hồ sơ ngựa đua của bạn
        </p>

        {/* Info banner */}
        <div className="auth-info-banner">
          <strong>Vai trò mặc định:</strong> Chủ ngựa (Horse Owner).
          Hệ thống sẽ tự động gán quyền sau khi đăng ký thành công.
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} noValidate>
          {/* Row 1: username + password */}
          <div className="auth-row">
            <div className="auth-form-group">
              <label className="auth-label">Tên đăng nhập *</label>
              <input
                type="text"
                className={`auth-input ${
                  formik.touched.username && formik.errors.username ? 'is-invalid' : ''
                }`}
                placeholder="vd: nguyenminh"
                autoComplete="username"
                {...formik.getFieldProps('username')}
              />
              {formik.touched.username && formik.errors.username && (
                <div className="auth-error">{formik.errors.username}</div>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Mật khẩu *</label>
              <input
                type="password"
                className={`auth-input ${
                  formik.touched.password && formik.errors.password ? 'is-invalid' : ''
                }`}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                {...formik.getFieldProps('password')}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="auth-error">{formik.errors.password}</div>
              )}
            </div>
          </div>

          {/* Row 2: Họ và tên */}
          <div className="auth-form-group">
            <label className="auth-label">Họ và tên *</label>
            <input
              type="text"
              className={`auth-input ${
                formik.touched.fullname && formik.errors.fullname ? 'is-invalid' : ''
              }`}
              placeholder="Nguyễn Văn Minh"
              autoComplete="name"
              {...formik.getFieldProps('fullname')}
            />
            {formik.touched.fullname && formik.errors.fullname && (
              <div className="auth-error">{formik.errors.fullname}</div>
            )}
          </div>

          {/* Row 3: Email + Phone */}
          <div className="auth-row">
            <div className="auth-form-group">
              <label className="auth-label">Email *</label>
              <input
                type="email"
                className={`auth-input ${
                  formik.touched.email && formik.errors.email ? 'is-invalid' : ''
                }`}
                placeholder="you@example.com"
                autoComplete="email"
                {...formik.getFieldProps('email')}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="auth-error">{formik.errors.email}</div>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Số điện thoại *</label>
              <input
                type="tel"
                className={`auth-input ${
                  formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''
                }`}
                placeholder="090 123 4567"
                autoComplete="tel"
                {...formik.getFieldProps('phone')}
              />
              {formik.touched.phone && formik.errors.phone && (
                <div className="auth-error">{formik.errors.phone}</div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginTop: 12,
            }}
          >
            <Link
              to="/login"
              className="auth-btn auth-btn-secondary"
              style={{ width: 'auto', padding: '13px 24px', textDecoration: 'none' }}
            >
              ← Quay lại
            </Link>
            <button
              type="submit"
              className="auth-btn"
              style={{ width: 'auto', padding: '13px 32px' }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Đang xử lý...' : 'Đăng ký →'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};