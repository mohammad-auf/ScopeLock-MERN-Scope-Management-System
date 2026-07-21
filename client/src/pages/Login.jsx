import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import InlineError from '../components/shared/InlineError';

/**
 * Login — Single page with Sign In / Register tabs
 * Route: /login  (public)
 */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin'); // 'signin' | 'register'

  // ── Sign In state
  const [signIn, setSignIn] = useState({ email: '', password: '' });
  const [signInErrors, setSignInErrors] = useState({});
  const [signInApiError, setSignInApiError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // ── Register state
  const [reg, setReg] = useState({ name: '', email: '', password: '', confirm: '' });
  const [regErrors, setRegErrors] = useState({});
  const [regApiError, setRegApiError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // ── Helpers
  const setField = (setter) => (field) => (e) =>
    setter((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Sign In validation
  const validateSignIn = () => {
    const errs = {};
    if (!signIn.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(signIn.email)) errs.email = 'Enter a valid email';
    if (!signIn.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const errs = validateSignIn();
    if (Object.keys(errs).length) { setSignInErrors(errs); return; }
    setSignInErrors({});
    setSignInApiError('');
    setSignInLoading(true);
    try {
      const { data } = await authAPI.login({ email: signIn.email.trim(), password: signIn.password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setSignInApiError(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  // ── Register validation
  const validateRegister = () => {
    const errs = {};
    if (!reg.name.trim()) errs.name = 'Name is required';
    else if (reg.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!reg.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(reg.email)) errs.email = 'Enter a valid email';

    if (!reg.password) errs.password = 'Password is required';
    else if (reg.password.length < 8) errs.password = 'Password must be at least 8 characters';

    if (!reg.confirm) errs.confirm = 'Please confirm your password';
    else if (reg.confirm !== reg.password) errs.confirm = 'Passwords do not match';

    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setRegApiError('');
    setRegLoading(true);
    try {
      const { data } = await authAPI.register({
        name: reg.name.trim(),
        email: reg.email.trim(),
        password: reg.password,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setRegApiError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <main className="auth-page" aria-label="Authentication">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-icon-lg">🔒</span>
          <h1 className="auth-brand">ScopeLock</h1>
          <p className="auth-tagline">Lock your scope. Bill what's extra.</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button
            id="tab-signin"
            role="tab"
            aria-selected={tab === 'signin'}
            aria-controls="panel-signin"
            className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
            onClick={() => setTab('signin')}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            role="tab"
            aria-selected={tab === 'register'}
            aria-controls="panel-register"
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        {/* ── Sign In Panel ─────────────────────────────────────────── */}
        <div
          id="panel-signin"
          role="tabpanel"
          aria-labelledby="tab-signin"
          hidden={tab !== 'signin'}
        >
          <form onSubmit={handleSignIn} noValidate>
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">Email</label>
              <input
                id="signin-email"
                type="email"
                className={`form-input${signInErrors.email ? ' input-error' : ''}`}
                value={signIn.email}
                onChange={setField(setSignIn)('email')}
                placeholder="you@example.com"
                autoComplete="email"
                aria-required="true"
                aria-describedby={signInErrors.email ? 'signin-email-err' : undefined}
              />
              <InlineError id="signin-email-err" message={signInErrors.email} />
            </div>

            <div className="form-group">
              <label htmlFor="signin-password" className="form-label">Password</label>
              <input
                id="signin-password"
                type="password"
                className={`form-input${signInErrors.password ? ' input-error' : ''}`}
                value={signIn.password}
                onChange={setField(setSignIn)('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-required="true"
                aria-describedby={signInErrors.password ? 'signin-pw-err' : undefined}
              />
              <InlineError id="signin-pw-err" message={signInErrors.password} />
            </div>

            {signInApiError && (
              <p role="alert" className="form-api-error">{signInApiError}</p>
            )}

            <button
              id="signin-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={signInLoading}
            >
              {signInLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ── Register Panel ────────────────────────────────────────── */}
        <div
          id="panel-register"
          role="tabpanel"
          aria-labelledby="tab-register"
          hidden={tab !== 'register'}
        >
          <form onSubmit={handleRegister} noValidate>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full name</label>
              <input
                id="reg-name"
                type="text"
                className={`form-input${regErrors.name ? ' input-error' : ''}`}
                value={reg.name}
                onChange={setField(setReg)('name')}
                placeholder="Jane Smith"
                autoComplete="name"
                aria-required="true"
                aria-describedby={regErrors.name ? 'reg-name-err' : undefined}
              />
              <InlineError id="reg-name-err" message={regErrors.name} />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
                type="email"
                className={`form-input${regErrors.email ? ' input-error' : ''}`}
                value={reg.email}
                onChange={setField(setReg)('email')}
                placeholder="you@example.com"
                autoComplete="email"
                aria-required="true"
                aria-describedby={regErrors.email ? 'reg-email-err' : undefined}
              />
              <InlineError id="reg-email-err" message={regErrors.email} />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password</label>
              <input
                id="reg-password"
                type="password"
                className={`form-input${regErrors.password ? ' input-error' : ''}`}
                value={reg.password}
                onChange={setField(setReg)('password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={regErrors.password ? 'reg-pw-err' : undefined}
              />
              <InlineError id="reg-pw-err" message={regErrors.password} />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">Confirm password</label>
              <input
                id="reg-confirm"
                type="password"
                className={`form-input${regErrors.confirm ? ' input-error' : ''}`}
                value={reg.confirm}
                onChange={setField(setReg)('confirm')}
                placeholder="Re-enter password"
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={regErrors.confirm ? 'reg-confirm-err' : undefined}
              />
              <InlineError id="reg-confirm-err" message={regErrors.confirm} />
            </div>

            {regApiError && (
              <p role="alert" className="form-api-error">{regApiError}</p>
            )}

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={regLoading}
            >
              {regLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;
