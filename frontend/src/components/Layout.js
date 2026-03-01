import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Vote, User, ShieldCheck, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const voterLinks = [
    { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
    { to: '/elections',  label: 'Elections',  icon: Vote },
    { to: '/profile',    label: 'Profile',    icon: User },
  ];

  const adminLinks = [
    { to: '/admin',      label: 'Dashboard', icon: ShieldCheck },
    { to: '/elections',  label: 'Elections',  icon: Vote },
    { to: '/profile',    label: 'Profile',    icon: User },
  ];

  const links = isAdmin ? adminLinks : voterLinks;

  // All sidebar styles are inline to avoid CSS variable dependency issues
  const S = {
    shell: { display: 'flex', minHeight: '100vh', background: '#0a0a0f' },
    sidebar: {
      width: 220, background: '#111118', borderRight: '1px solid #2a2a35',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    },
    logoArea: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '20px 20px 16px', borderBottom: '1px solid #2a2a35',
    },
    logoIcon: {
      width: 32, height: 32, background: '#00ff88', borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, flexShrink: 0,
    },
    logoText: { color: '#f0f0f5', fontWeight: 800, fontSize: 17 },
    nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
    footer: { padding: 16, borderTop: '1px solid #2a2a35' },
    loggedInAs: { fontSize: 10, color: '#55555f', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' },
    userEmail: { fontSize: 11, color: '#9090a0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    userRole: { fontSize: 10, color: '#00ff88', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 },
    logoutBtn: {
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '8px 12px', background: 'rgba(248,113,113,0.08)',
      border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7,
      color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit',
    },
    main: { marginLeft: 220, flex: 1, padding: '32px 36px', minHeight: '100vh' },
  };

  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.logoArea}>
          <div style={S.logoIcon}>⚡</div>
          <span style={S.logoText}>BlockVote</span>
        </div>

        <nav style={S.nav}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                color: isActive ? '#00ff88' : '#9090a0',
                background: isActive ? 'rgba(0,255,136,0.06)' : 'transparent',
                borderLeft: isActive ? '3px solid #00ff88' : '3px solid transparent',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={S.footer}>
          <div style={S.loggedInAs}>Logged in as</div>
          <div style={S.userEmail}>{user.email || '—'}</div>
          <div style={S.userRole}>{user.role || 'VOTER'}</div>
          <button style={S.logoutBtn} onClick={logout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main style={S.main}>
        <Outlet />
      </main>
    </div>
  );
}