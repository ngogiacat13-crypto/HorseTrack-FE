import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_HOME } from '../api/mockData';
import './auth.css';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: Yup.object({
      username: Yup.string().required('Vui lòng nhập tên đăng nhập / email / SĐT'),
      password: Yup.string().required('Vui lòng nhập mật khẩu'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      try {
        const user = await login(values.username, values.password);
        navigate(ROLE_HOME[user.role], { replace: true });
      } catch (err: any) {
        setServerError(err.message || 'Đăng nhập thất bại');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo + Tiêu đề */}
        <div className="auth-logo-wrap">
          <div className="auth-logo">🐴</div>
        </div>
        <h1 className="auth-title">HorseTrack</h1>
        <p className="auth-sub">
          Hệ thống quản lý huấn luyện &amp; chăm sóc ngựa đua
        </p>

        {/* Lỗi từ server */}
        {serverError && (
          <div className="auth-server-error">
            <span>⚠</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label">Tên đăng nhập / Email / SĐT</label>
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
            <label className="auth-label">Mật khẩu</label>
            <input
              type="password"
              className={`auth-input ${
                formik.touched.password && formik.errors.password ? 'is-invalid' : ''
              }`}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              {...formik.getFieldProps('password')}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="auth-error">{formik.errors.password}</div>
            )}
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập →'}
          </button>
        </form>

        {/* Footer link đăng ký */}
        <div className="auth-footer">
          Bạn là chủ ngựa mới?{' '}
          <Link to="/register" className="auth-link">
            Đăng ký tài khoản
          </Link>
        </div>

        {/* Demo hint */}
        <div className="auth-demo-hint">
          <strong>🎯 Tài khoản demo — mật khẩu: password123</strong>
          <div>
            👔 <code>admin</code> — Quản lý CLB &nbsp;·&nbsp;
            🐎 <code>duchung</code> — HLV Trưởng
          </div>
          <div>
            🩺 <code>thihuong</code> — Bác sĩ Thú y &nbsp;·&nbsp;
            🧹 <code>vantoan</code> — Người chăm ngựa
          </div>
          <div>
            🐴 <code>hoanglan</code> — Chủ ngựa &nbsp;·&nbsp;
            📦 <code>vankho</code> — Quản lý kho
          </div>
        </div>
      </div>
    </div>
  );
};