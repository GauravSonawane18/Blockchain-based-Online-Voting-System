import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, Lock, KeyRound } from 'lucide-react';

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
      const msg = err.response?.data?.message
               || err.response?.data?.error
               || 'Login failed';
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
    localStorage.setItem('email', data.email);
    localStorage.setItem('role', data.role);
    localStorage.setItem('fullName', data.fullName);
    toast.success('Welcome back!');
    navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 50%, rgba(0,255,136,0.04) 0%, transparent 60%), var(--bg)',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 0 40px rgba(0,255,136,0.3)'
          }}>
            <Zap size={28} color="#0a0a0f" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6 }}>BlockVote</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Secure blockchain-powered voting</p>
        </div>

        <div className="card fade-in">
          <h2 style={{ fontSize: 20, marginBottom: 24 }}>
            {step === '2fa' ? '2-Factor Authentication' : 'Sign In'}
          </h2>

          {step === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required placeholder="admin@evoting.com" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ marginTop: 8, justifyContent: 'center' }}>
                <Lock size={14} /> {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--text2)', fontSize: 13, padding: 12,
                background: 'rgba(0,136,255,0.08)', borderRadius: 6,
                border: '1px solid rgba(0,136,255,0.2)' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <div className="input-group">
                <label>Authentication Code</label>
                <input type="text" value={form.totpCode}
                  onChange={e => setForm({...form, totpCode: e.target.value})}
                  required placeholder="000000" maxLength={6} autoFocus
                  style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ justifyContent: 'center' }}>
                <KeyRound size={14} /> {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setStep('login')} style={{ justifyContent: 'center' }}>
                Back
              </button>
            </form>
          )}

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
            No account? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register as voter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
