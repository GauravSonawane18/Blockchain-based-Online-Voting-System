import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, UserPlus } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', walletAddress: '' });
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('email', form.email);
      fd.append('password', form.password);
      if (form.walletAddress) fd.append('walletAddress', form.walletAddress);
      if (idFile) fd.append('idDocument', idFile);
      await authAPI.register(fd);
      toast.success('Registration submitted! Pending admin approval.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 70% 50%, rgba(0,136,255,0.04) 0%, transparent 60%), var(--bg)',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 0 40px rgba(0,255,136,0.3)'
          }}>
            <Zap size={28} color="#0a0a0f" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6 }}>Register to Vote</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Submit your details for admin verification</p>
        </div>

        <div className="card fade-in">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Full Name</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required placeholder="Gaurav Sonawane" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="voter@example.com" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Min 6 characters" />
            </div>
            <div className="input-group">
              <label>Wallet Address (optional)</label>
              <input value={form.walletAddress} onChange={e => setForm({...form, walletAddress: e.target.value})} placeholder="0x..." style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </div>
            <div className="input-group">
              <label>ID Document (optional)</label>
              <input type="file" accept="image/*,.pdf" onChange={e => setIdFile(e.target.files[0])} style={{ padding: '8px 14px' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Aadhaar, passport, or driver's license</span>
            </div>
            <div style={{ background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 6, padding: 12, fontSize: 12, color: '#ffaa44' }}>
              ⚠ Registration requires admin approval before you can vote.
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
              <UserPlus size={14} /> {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
