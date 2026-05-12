import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const initialValues = {
  email: '',
  password: ''
};

function validate(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = 'กรอกอีเมลก่อน';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'รูปแบบอีเมลยังไม่ถูกต้อง';
  }

  if (!values.password) {
    errors.password = 'กรอกรหัสผ่านก่อน';
  }

  return errors;
}

function getLoginPayload(data) {
  return {
    token: data?.token ?? data?.accessToken ?? data?.jwt ?? '',
    user: data?.user ?? data?.data?.user ?? null
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value
    }));

    setErrors((current) => ({
      ...current,
      [name]: ''
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setMessage('');

    if (Object.keys(nextErrors).length > 0) {
      setIsErrorMessage(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', values);
      const payload = getLoginPayload(data);

      if (!payload.token || !payload.user) {
        throw new Error('รูปแบบ response จาก login ยังไม่ครบ');
      }

      login(payload.user, payload.token);
      setIsErrorMessage(false);
      const isAdmin = payload.user?.role === 'admin' || payload.user?.role === 'staff';
      navigate(isAdmin ? '/dashboard' : '/issues');
    } catch (error) {
      setIsErrorMessage(true);
      setMessage(
        error.response?.data?.message ||
          error.message ||
          'ยังไม่สามารถเข้าสู่ระบบได้'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <div className="auth-layout">
        <section className="auth-panel">
          <div className="auth-panel-content">
            <div>
              <div className="auth-brand">
                <span className="auth-brand-mark">CV</span>
                <span>CampusVoice</span>
              </div>

              <div className="premium-hero">
                <div className="hero-badge">
                  <span>🎓 สำหรับนักศึกษา</span>
                </div>
                <h1 className="auth-heading">แจ้งปัญหา</h1>
                <p className="auth-subheading">
                  ระบบแจ้งปัญหาออนไลน์ในมหาลัย ติดตามความคืบหน้าได้ทุกที่ทุกเวลา
                </p>
              </div>

              <div className="benefits-showcase">
                <div className="benefit-card benefit-card--primary">
                  <div className="benefit-visual">
                    <div className="benefit-icon-wrapper">
                      <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="benefit-content">
                    <h3>แจ้งปัญหาได้ทุกประเภท</h3>
                    <p>อาคาร สิ่งอำนวยความสะดวก บริการ และกิจกรรมในมหาวิทยาลัย</p>
                  </div>
                </div>

                <div className="benefit-card benefit-card--secondary">
                  <div className="benefit-visual">
                    <div className="benefit-icon-wrapper">
                      <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="benefit-content">
                    <h3>ติดตามความคืบหน้า</h3>
                    <p>อัปเดตสถานะแบบเรียลไทม์ตลอดการดำเนินการ</p>
                  </div>
                </div>

                <div className="benefit-card benefit-card--accent">
                  <div className="benefit-visual">
                    <div className="benefit-icon-wrapper">
                      <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="benefit-content">
                    <h3>ร่วมแก้ไขปัญหา</h3>
                    <p>โหวตและคอมเมนต์เพื่อช่วยแก้ไขปัญหาด้วยกัน</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card card card--elevated auth-form-card">
          <div className="card__body">
            <div className="auth-card-header">
              <div>
                <h2 className="section-title">เข้าสู่ระบบ</h2>
                <p className="section-copy">
                  ใช้อีเมลมหาวิทยาลัยเพื่อเข้าใช้งาน
                </p>
              </div>

              <div className="auth-switcher" aria-label="Authentication pages">
                <span className="auth-switcher__item is-active">Login</span>
                <Link className="auth-switcher__item" to="/register">
                  Register
                </Link>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label htmlFor="login-email">
                  Email
                </label>
                <div className="input-wrapper">
                  <input
                    id="login-email"
                    className={`input ${errors.email ? 'input--error' : ''}`}
                    name="email"
                    type="email"
                    placeholder="student@campusvoice.ac.th"
                    value={values.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {values.email && !errors.email && (
                    <div className="input-success-icon">
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {errors.email ? (
                  <p className="input-error">{errors.email}</p>
                ) : null}
              </div>

              <div className="form-field">
                <label htmlFor="login-password">
                  Password
                </label>
                <div className="input-group">
                  <input
                    id="login-password"
                    className={`input ${errors.password ? 'input--error' : ''}`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่าน"
                    value={values.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <div className="input-suffix">
                    <button
                      className="btn btn--ghost btn--sm"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {errors.password ? (
                  <p className="input-error">{errors.password}</p>
                ) : null}
              </div>

              <div className="auth-inline-links">
                <Link to="/register">ยังไม่มีบัญชี? สมัครเลย</Link>
              </div>

              {message ? (
                <p
                  className={`form-message ${
                    isErrorMessage ? 'form-message--error' : 'form-message--success'
                  }`}
                >
                  {message}
                </p>
              ) : null}

              <button
                className="btn btn--primary btn--block btn--pill"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading-spinner">
                    <svg className="spinning-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <span>© 2026 CampusVoice. All rights reserved.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
