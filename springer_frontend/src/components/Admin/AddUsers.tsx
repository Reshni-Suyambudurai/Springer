import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../services/admin.api';
import type { AppError } from '../../services/api.error';
import '../../css/Admin/AddUsers.css';

const ROLE_OPTIONS = [
  { label: 'TA Manager',           value: 'TA_MANAGER' },
  { label: 'TA Head',              value: 'TA_HEAD' },
  { label: 'Hiring Manager',       value: 'HIRING_MANAGER' },
  { label: 'Panel Member',         value: 'MEMBERS' },
  { label: 'Training Coordinator', value: 'TRAINING_COORDINATOR' },
  { label: 'System Admin',         value: 'SYSTEM_ADMIN' },
];

const DEPARTMENT_OPTIONS = [
  'Data and Analytics',
  'Product Engineering',
  'ServiceNow',
  'AI Engineer',
  'Sales',
  'Administration',
  'HR'
];

const LOCATION_OPTIONS = [
  'Chennai',
  'Bangalore',
  'Coimbatore',
  'Pune',
];

interface UserForm {
  username: string;
  email: string;
  password: string;
  roleName: string;
  department: string;
  location: string;
}

const INITIAL_FORM: UserForm = {
  username: '',
  email: '',
  password: '',
  roleName: '',
  department: '',
  location: '',
};

function AddUsers() {
  const [form, setForm] = useState<UserForm>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): boolean => {
    const next: Partial<UserForm> = {};
    if (!form.username.trim())              next.username   = 'Username is required';
    else if (form.username.trim().length < 3) next.username = 'Username must be at least 3 characters';
    if (!form.email.trim())                 next.email     = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email)) next.email     = 'Enter a valid email address';
    if (!form.password.trim())              next.password  = 'Password is required';
    else if (form.password.length < 6)      next.password  = 'Password must be at least 6 characters';
    if (!form.roleName)                     next.roleName  = 'Role is required';
    if (!form.department)                   next.department = 'Department is required';
    if (!form.location)                     next.location  = 'Location is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminApi.createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        roleName: form.roleName,
        department: form.department,
        location: form.location,
      });
      showToast('User created successfully', 'success');
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      const appErr = err as AppError;
      showToast(appErr?.message ?? 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <div className="au-page">

      {/* Top bar — same pattern as Manage */}
      <div className="au-header-bar">
        <div className="au-header-left">
          <div className="t-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-8 0v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="12" y1="14" x2="12" y2="20" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
          </div>
          <div>
            <h1 className="t-page-title">Add User</h1>
           
          </div>
        </div>
      </div>

      <div className="au-separator" />

      {/* Centered card */}
      <div className="au-body">
        <div className="au-card">

        {/* Form */}
        <form className="au-form" onSubmit={handleSubmit} noValidate>
          <div className="au-form-cols">

            {/* ── Left column: Username, Password, Role ── */}
            <div className="au-form-col">

              {/* Username */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="username">
                  Username <span className="au-required">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className={`au-input${errors.username ? ' au-input--error' : ''}`}
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <span className="au-error-msg">{errors.username || '\u00A0'}</span>
              </div>

              {/* Password */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="password">
                  Password <span className="au-required">*</span>
                </label>
                <div className="au-input-password-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`au-input au-input-password${errors.password ? ' au-input--error' : ''}`}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="au-toggle-pw"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="au-error-msg">{errors.password || '\u00A0'}</span>
              </div>

              {/* Role */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="roleName">
                  Role <span className="au-required">*</span>
                </label>
                <select
                  id="roleName"
                  name="roleName"
                  className={`au-select${errors.roleName ? ' au-select--error' : ''}`}
                  value={form.roleName}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select role...</option>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <span className="au-error-msg">{errors.roleName || '\u00A0'}</span>
              </div>

            </div>

            {/* ── Right column: Email, Department, Location ── */}
            <div className="au-form-col">

              {/* Email */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="email">
                  Email <span className="au-required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`au-input${errors.email ? ' au-input--error' : ''}`}
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <span className="au-error-msg">{errors.email || '\u00A0'}</span>
              </div>

              {/* Department */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="department">
                  Department <span className="au-required">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  className={`au-select${errors.department ? ' au-select--error' : ''}`}
                  value={form.department}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select department...</option>
                  {DEPARTMENT_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="au-error-msg">{errors.department || '\u00A0'}</span>
              </div>

              {/* Location */}
              <div className="au-field-group">
                <label className="au-label" htmlFor="location">
                  Location <span className="au-required">*</span>
                </label>
                <select
                  id="location"
                  name="location"
                  className={`au-select${errors.location ? ' au-select--error' : ''}`}
                  value={form.location}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select location...</option>
                  {LOCATION_OPTIONS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <span className="au-error-msg">{errors.location || '\u00A0'}</span>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="au-actions">
            <Button
              type="button"
              variant="outlined"
              className="t-btn-secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="t-btn-primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={18} className="au-spinner" /> : 'Create User'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default AddUsers;
