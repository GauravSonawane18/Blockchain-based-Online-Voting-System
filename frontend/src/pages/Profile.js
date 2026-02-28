import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { User, Shield, Key } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authAPI.me().then(r => setUser(r.data));
  }, []);

  const setup2fa = async () => {
    setLoading(true);
    try {
      const r = await authAPI.setup2fa();
      setQr(r.data);
    } catch (err) {
      toast.error('Failed to setup 2FA');
    } finally { setLoading(false); }
  };

  const confirm2fa = async () => {
    setLoading(true);
    try {
      await authAPI.confirm2fa(code);
      toast.success('2FA enabled!');
      setQr(null); setCode('');
      authAPI.me().then(r => setUser(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  if (!user) return <p className="text-muted pulse">Loading...</p>;

  return (
    <div className="fade-in" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>Profile</h1>
        <p className="text-muted">Your account details</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#0a0a0f', fontFamily: 'var(--font-display)' }}>
            {user.fullName?.[0]}
          </div>
          <div>
            <h2 style={{ fontSize: 20 }}>{user.fullName}</h2>
            <p className="text-muted text-sm">{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Role', value: user.role },
            { label: 'Status', value: user.verificationStatus },
            { label: 'Voter ID', value: user.voterId || 'Pending' },
            { label: '2FA', value: user.is2faEnabled ? 'Enabled' : 'Disabled' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {user.walletAddress && (
          <div style={{ marginTop: 12, background: 'var(--bg3)', borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Wallet Address</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent2)', wordBreak: 'break-all' }}>{user.walletAddress}</div>
          </div>
        )}
      </div>

      {/* 2FA Setup */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={18} color="var(--accent)" />
          <h3 style={{ fontSize: 16 }}>Two-Factor Authentication</h3>
          {user.is2faEnabled && <span className="badge badge-green">Active</span>}
        </div>
        {!user.is2faEnabled && !qr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Enable 2FA for extra security during login.</p>
            <button className="btn btn-primary" onClick={setup2fa} disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Key size={14} /> {loading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
        {qr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Scan this QR code with Google Authenticator or Authy:</p>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, display: 'inline-block' }}>
              <QRCode value={qr.qrCodeUri} size={180} />
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Manual entry key:</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.1em' }}>{qr.secret}</div>
            </div>
            <div className="input-group">
              <label>Confirm with code from app</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6} style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 20, padding: 14 }} />
            </div>
            <button className="btn btn-primary" onClick={confirm2fa} disabled={loading || code.length < 6} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Confirming...' : 'Confirm & Enable 2FA'}
            </button>
          </div>
        )}
        {user.is2faEnabled && <p style={{ fontSize: 13, color: 'var(--text2)' }}>2FA is active. You will need your authenticator app on next login.</p>}
      </div>
    </div>
  );
}
