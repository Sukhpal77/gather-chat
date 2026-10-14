'use client';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '@/lib/client-api';

export default function AuthScreen({ onAuthenticated, initialError }) {
  const [mode, setMode] = useState('login');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState(initialError || '');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('reset');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);
  function changeMode(next) {
    setMode(next);
    setError('');
    setNotice('');
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'forgot') {
        const data = await api('/auth/forgot', { method: 'POST', body: values });
        setNotice(data.message);
      } else if (mode === 'reset') {
        const data = await api('/auth/reset', {
          method: 'POST',
          body: { ...values, token: resetToken },
        });
        changeMode('login');
        setNotice(data.message);
        window.history.replaceState({}, '', '/');
      } else {
        const data = await api(`/auth/${mode}`, { method: 'POST', body: values });
        onAuthenticated(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    login: 'A little closer,\nevery day.',
    register: 'Good conversations\nstart here.',
    forgot: 'Let’s get you\nback in.',
    reset: 'A fresh start\nfor your account.',
  };
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-mark">
            <MessageCircle size={24} fill="currentColor" />
          </span>
          gather<span className="brand-period">.</span>
        </a>
        <div className="story-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> A SPACE FOR YOUR PEOPLE
          </span>
          <h1>
            Less distance.
            <br />
            More <em>connection.</em>
          </h1>
          <p>
            Big ideas, small updates, and everything in between. Bring your conversations together.
          </p>
        </div>
        <div className="story-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-orbit orbit-three" />
          <div className="floating-note note-one">
            <span className="mini-avatar">JL</span>
            <div>
              <strong>Jamie Lee</strong>
              <p>Same time, same place? ☕</p>
            </div>
            <span className="note-time">now</span>
          </div>
          <div className="floating-note note-two">
            <span className="mini-avatar peach">AR</span>
            <div>
              <strong>Alex Rivera</strong>
              <p>Wouldn’t miss it.</p>
            </div>
            <span>✓✓</span>
          </div>
          <span className="art-spark spark-one">
            <Sparkles size={28} />
          </span>
          <span className="art-spark spark-two">
            <MessageCircle size={32} />
          </span>
          <span className="art-center">
            <Users size={52} strokeWidth={1.25} />
          </span>
        </div>
        <div className="story-footer">
          <ShieldCheck size={17} /> Your conversations. Your circle.
          <span>
            MADE FOR CONNECTION <ArrowUpRight size={14} />
          </span>
        </div>
      </section>
      <section className="auth-form-area">
        <span className="auth-topline">YOUR PEOPLE ARE ONE MESSAGE AWAY</span>
        <div className="auth-form-card">
          <span className="eyebrow">
            {mode === 'register' ? 'MAKE YOURSELF AT HOME' : 'WELCOME TO GATHER'}
          </span>
          <h2>
            {titles[mode].split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in and pick up where you left off.'
              : mode === 'register'
                ? 'Create your account. Find your people.'
                : 'We’ll help you securely update your password.'}
          </p>
          {['login', 'register'].includes(mode) && (
            <div className="auth-tabs">
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                onClick={() => changeMode('register')}
              >
                Create account
              </button>
            </div>
          )}
          <form onSubmit={submit} key={mode}>
            {mode === 'register' && (
              <>
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    maxLength={80}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Username
                  <input
                    name="username"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9_]+"
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                </label>
              </>
            )}
            {mode !== 'reset' && (
              <label>
                {mode === 'login' ? 'Email or username' : 'Email address'}
                <input
                  name={mode === 'login' ? 'login' : 'email'}
                  type={mode === 'login' ? 'text' : 'email'}
                  required
                  placeholder={mode === 'login' ? 'you@example.com' : 'Your email address'}
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                />
              </label>
            )}
            {mode !== 'forgot' && (
              <label>
                <span className="label-row">
                  {mode === 'reset' ? 'New password' : 'Password'}
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => changeMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <span className="password-input">
                  <input
                    name="password"
                    aria-label={mode === 'reset' ? 'New password' : 'Password'}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'login' ? 1 : 8}
                    maxLength={72}
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {notice && (
              <div className="form-success" role="status">
                {notice}
              </div>
            )}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy
                ? 'One moment…'
                : {
                    login: 'Sign in to Gather',
                    register: 'Create your account',
                    forgot: 'Send reset link',
                    reset: 'Update password',
                  }[mode]}
              <ArrowRight size={18} />
            </button>
          </form>
          {['forgot', 'reset'].includes(mode) ? (
            <button className="text-button back-login" onClick={() => changeMode('login')}>
              Back to sign in
            </button>
          ) : (
            <p className="auth-bottom">
              A quieter corner of the internet.
              <br />
              <span>No noise. Just your people.</span>
            </p>
          )}
        </div>
        <span className="auth-copyright">© {new Date().getFullYear()} Gather. Stay connected.</span>
      </section>
    </main>
  );
}
