import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const initialValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  const levels = [
    { score: 0, label: 'อ่อนมาก', color: 'bg-red-500' },
    { score: 1, label: 'อ่อน', color: 'bg-red-400' },
    { score: 2, label: 'ปานกลาง', color: 'bg-yellow-500' },
    { score: 3, label: 'ดี', color: 'bg-blue-500' },
    { score: 4, label: 'แข็งแรง', color: 'bg-green-500' },
    { score: 5, label: 'แข็งแรงมาก', color: 'bg-green-600' }
  ];
  
  return levels[score] || levels[0];
}

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'กรอกชื่อที่ต้องการแสดงในระบบก่อน';
  }

  if (!values.email.trim()) {
    errors.email = 'กรอกอีเมลก่อน';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'รูปแบบอีเมลยังไม่ถูกต้อง';
  }

  if (!values.password) {
    errors.password = 'กรอกรหัสผ่านก่อน';
  } else if (values.password.length < 8) {
    errors.password = 'รหัสผ่านควรยาวอย่างน้อย 8 ตัวอักษร';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'ยืนยันรหัสผ่านอีกครั้ง';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'รหัสผ่านสองช่องไม่ตรงกัน';
  }

  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

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

    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
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
      await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password
      });

      setIsErrorMessage(false);
      setMessage('สมัครสมาชิกสำเร็จแล้ว กำลังพาไปหน้า login');
      navigate('/login');
    } catch (error) {
      setIsErrorMessage(true);
      setMessage(
        error.response?.data?.message ||
          error.message ||
          'ยังไม่สามารถสมัครสมาชิกได้'
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
                  <span>🚀 เริ่มต้นใช้งาน</span>
                </div>
                <h1 className="auth-heading">สร้างบัญชีผู้ใช้</h1>
                <p className="auth-subheading">
                  สร้างบัญชีเพื่อแจ้งปัญหาและติดตามความคืบหน้าในมหาวิทยาลัย
                </p>
              </div>

              <div className="benefits-showcase">
                <div className="benefit-card benefit-card--primary">
                  <div className="benefit-visual">
                    <div className="benefit-icon-wrapper">
                      <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="benefit-content">
                    <h3>แจ้งปัญหาได้ทันที</h3>
                    <p>ถ่ายรูป แนบไฟล์ และอธิบายปัญหาได้ชัดเจน</p>
                  </div>
                </div>

                <div className="benefit-card benefit-card--secondary">
                  <div className="benefit-visual">
                    <div className="benefit-icon-wrapper">
                      <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="benefit-content">
                    <h3>รับการแจ้งเตือน</h3>
                    <p>อัปเดตผ่านอีเมลเมื่อมีการตอบกลับหรืออัปเดตสถานะ</p>
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
                <h2 className="section-title">สมัครสมาชิก</h2>
                <p className="section-copy">
                  สร้างบัญชีใหม่เพื่อเริ่มใช้งาน
                </p>
              </div>

              <div className="auth-switcher" aria-label="Authentication pages">
                <Link className="auth-switcher__item" to="/login">
                  Login
                </Link>
                <span className="auth-switcher__item is-active">Register</span>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row form-row--double">
                <div className="form-field">
                  <label htmlFor="register-name">
                    ชื่อที่แสดง
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="register-name"
                      className={`input ${errors.name ? 'input--error' : ''}`}
                      name="name"
                      type="text"
                      placeholder="เช่น Kittithat"
                      value={values.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                    {values.name && !errors.name && (
                      <div className="input-success-icon">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.name ? <p className="input-error">{errors.name}</p> : null}
                </div>

                <div className="form-field">
                  <label htmlFor="register-email">
                    อีเมล
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="register-email"
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
                  {errors.email ? <p className="input-error">{errors.email}</p> : null}
                </div>
              </div>

              <div className="form-row form-row--double">
                <div className="form-field">
                  <label htmlFor="register-password">
                    รหัสผ่าน
                  </label>
                  <div className="input-group">
                    <input
                      id="register-password"
                      className={`input ${errors.password ? 'input--error' : ''}`}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      value={values.password}
                      onChange={handleChange}
                      autoComplete="new-password"
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
                  {values.password && (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        <div 
                          className={`password-strength-fill ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="password-strength-label">{passwordStrength.label}</span>
                    </div>
                  )}
                  {errors.password ? (
                    <p className="input-error">{errors.password}</p>
                  ) : null}
                </div>

                <div className="form-field">
                  <label htmlFor="register-confirm-password">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="input-group">
                    <input
                      id="register-confirm-password"
                      className={`input ${errors.confirmPassword ? 'input--error' : ''}`}
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <div className="input-suffix">
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword ? (
                    <p className="input-error">{errors.confirmPassword}</p>
                  ) : values.confirmPassword && values.password === values.confirmPassword ? (
                    <p className="input-success">รหัสผ่านตรงกัน</p>
                  ) : null}
                </div>
              </div>

              <div className="auth-inline-links">
                <Link to="/login">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
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
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
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
