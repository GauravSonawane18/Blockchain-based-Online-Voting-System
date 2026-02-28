import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Vote, BarChart2, User, Shield, LogOut, Menu, X, Zap } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [open, setOpen] = useState(false);

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/elections', icon: Vote, label: 'Elections' },
    { to: '/profile', icon: User, label: 'Profile' },
    ...(role === 'ADMIN' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100
      }}>
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="#0a0a0f" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>BlockVote</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 12px' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 6, marginBottom: 4, textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'rgba(0,255,136,0.08)' : 'transparent',
              fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
              transition: 'all 0.15s', letterSpacing: '0.03em',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logged in as</div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>{localStorage.getItem('email') || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2, textTransform: 'uppercase' }}>{role}</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
