import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', totpCode: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      if (res.data.requires2fa) {
        setStep('2fa');
        toast('2FA required', { icon: '🔐' });
      } else {
        saveAndGo(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      toast.error(msg, { duration: 8000 });
    } finally { setLoading(false); }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verify2fa({ email: form.email, totpCode: form.totpCode });
      saveAndGo(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || '2FA failed');
    } finally { setLoading(false); }
  };

  const saveAndGo = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      email:    data.email,
      fullName: data.fullName,
      role:     data.role,
      voterId:  data.voterId,
    }));
    toast.success('Welcome back!');
    navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const S = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f', padding: 24,
    },
    wrap:  { width: '100%', maxWidth: 420 },
    logoBox: {
      width: 56, height: 56, background: '#00ff88', borderRadius: 14,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, boxShadow: '0 0 40px rgba(0,255,136,0.3)', fontSize: 26,
    },
    card: {
      background: '#111118', border: '1px solid #2a2a35',
      borderRadius: 12, padding: 28,
    },
    label: {
      display: 'block', fontSize: 11, fontWeight: 700, color: '#9090a0',
      marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase',
    },
    input: {
      width: '100%', background: '#18181f', border: '1px solid #2a2a35',
      borderRadius: 8, color: '#f0f0f5', fontFamily: 'inherit',
      fontSize: 14, padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    },
    btnPrimary: {
      width: '100%', background: '#00ff88', color: '#0a0a0f', border: 'none',
      borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
    },
    btnSecondary: {
      width: '100%', background: '#18181f', color: '#9090a0',
      border: '1px solid #2a2a35', borderRadius: 8, padding: '10px 20px',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    },
    divider: { border: 'none', borderTop: '1px solid #2a2a35', margin: '20px 0' },
  };

  const focusGreen = e => (e.target.style.borderColor = '#00ff88');
  const blurNormal = e => (e.target.style.borderColor = '#2a2a35');

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={S.logoBox}>⚡</div>
          <h1 style={{ color: '#f0f0f5', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>BlockVote</h1>
          <p style={{ color: '#9090a0', fontSize: 13 }}>Secure blockchain-powered voting</p>
        </div>

        <div style={S.card}>
          <h2 style={{ color: '#f0f0f5', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            {step === '2fa' ? '2-Factor Authentication' : 'Sign In'}
          </h2>

          {step === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>Email</label>
                <input type="email" value={form.email} required placeholder="admin@evoting.com"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input type="password" value={form.password} required placeholder="••••••••"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
              </div>
              <button type="submit" disabled={loading}
                style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                🔒 {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#9090a0', fontSize: 13, padding: 12,
                background: 'rgba(0,170,255,0.08)', borderRadius: 8, border: '1px solid rgba(0,170,255,0.2)' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <div>
                <label style={S.label}>Authentication Code</label>
                <input type="text" value={form.totpCode} required placeholder="000000" maxLength={6} autoFocus
                  onChange={e => setForm({ ...form, totpCode: e.target.value })}
                  onFocus={focusGreen} onBlur={blurNormal}
                  style={{ ...S.input, letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 }} />
              </div>
              <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
                🔑 {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" onClick={() => setStep('login')} style={S.btnSecondary}>
                ← Back
              </button>
            </form>
          )}

          <hr style={S.divider} />
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9090a0' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 600 }}>
              Register as voter
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#55555f' }}>
          Admin account?{' '}
          <Link to="/login" style={{ color: '#9090a0', textDecoration: 'none' }}>
            Already on login page
          </Link>
        </p>
      </div>
    </div>
  );
}