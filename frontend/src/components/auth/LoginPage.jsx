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
      setMessage('เข้าสู่ระบบสำเร็จ กำลังพาไปหน้า issues');
      navigate('/issues');
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
                <h1 className="auth-heading">แจ้งปัญหาในแคมปัส</h1>
                <p className="auth-subheading">
                  ระบบแจ้งปัญหาออนไลน์ ติดตามความคืบหน้าได้ทุกที่ทุกเวลา
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
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="remember"
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">จดจำฉันไว้</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  ลืมรหัสผ่าน?
                </Link>
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
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            <div className="auth-divider">
              <span>หรือเข้าสู่ระบบด้วย</span>
            </div>

            <div className="social-login-buttons">
              <button
                type="button"
                className="btn btn--ghost btn--block social-btn"
                onClick={() => console.log('Google login')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block social-btn"
                onClick={() => console.log('GitHub login')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className="auth-footer">
              <span>© 2026 CampusVoice. All rights reserved.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
