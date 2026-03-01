import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', walletAddress: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.register({
        fullName:      form.fullName.trim(),
        email:         form.email.trim(),
        password:      form.password,
        walletAddress: form.walletAddress.trim() || null,
      });
      toast.success('Registration submitted! Wait for admin approval.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      toast.error(msg, { duration: 6000 });
    } finally { setLoading(false); }
  };

  const S = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f', padding: 24,
    },
    wrap:  { width: '100%', maxWidth: 460 },
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
    },
    notice: {
      padding: '10px 14px', background: 'rgba(251,146,60,0.08)',
      border: '1px solid rgba(251,146,60,0.25)', borderRadius: 8,
      color: '#fb923c', fontSize: 12, marginBottom: 4,
    },
    btnPrimary: {
      width: '100%', background: '#00ff88', color: '#0a0a0f', border: 'none',
      borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
    },
    divider: { border: 'none', borderTop: '1px solid #2a2a35', margin: '20px 0' },
  };

  const focusGreen = e => (e.target.style.borderColor = '#00ff88');
  const blurNormal = e => (e.target.style.borderColor = '#2a2a35');

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: '#00ff88', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 0 40px rgba(0,255,136,0.3)', fontSize: 24,
          }}>⚡</div>
          <h1 style={{ color: '#f0f0f5', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Register to Vote</h1>
          <p style={{ color: '#9090a0', fontSize: 13 }}>Submit your details for admin verification</p>
        </div>

        <div style={S.card}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={S.label}>Full Name *</label>
              <input type="text" value={form.fullName} required placeholder="Gaurav Sonawane"
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Email *</label>
              <input type="email" value={form.email} required placeholder="voter@example.com"
                onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Password *</label>
              <input type="password" value={form.password} required placeholder="Min 6 characters"
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Wallet Address (optional)</label>
              <input type="text" value={form.walletAddress} placeholder="0x..."
                onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                onFocus={focusGreen} onBlur={blurNormal} style={S.input} />
              <p style={{ fontSize: 11, color: '#55555f', marginTop: 4 }}>
                Your Ethereum wallet for blockchain voting (can be added later)
              </p>
            </div>

            <div style={S.notice}>
              ⚠️ Registration requires admin approval before you can vote.
            </div>

            <button type="submit" disabled={loading}
              style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              👤 {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>

          <hr style={S.divider} />
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9090a0' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 600 }}>
              Admin registered? Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}