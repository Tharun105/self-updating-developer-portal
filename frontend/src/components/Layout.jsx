import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from './StatusBadge.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: 'bi-grid-1x2', end: true },
  { to: '/services', label: 'Services', icon: 'bi-boxes' },
  { to: '/github', label: 'GitHub', icon: 'bi-github' },
  { to: '/docs', label: 'Documentation', icon: 'bi-journal-text' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...links, { to: '/admin', label: 'Admin', icon: 'bi-shield-lock' }] : links;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><i className="bi bi-diagram-3" /></span>
          <span>DevPortal</span>
        </div>
        <nav className="nav flex-column gap-1 px-2">
          {items.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${l.icon}`} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">Service catalogue that keeps itself current from GitHub.</div>
      </aside>
      {open && <div className="side-scrim" onClick={() => setOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button className="btn btn-light d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu">
            <i className="bi bi-list" />
          </button>
          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="text-end lh-sm">
              <div className="fw-semibold">{user.username}</div>
              <StatusBadge value={user.role} />
            </div>
            <button className="btn btn-outline-secondary btn-sm"
              onClick={() => { logout(); navigate('/login'); }}>
              <i className="bi bi-box-arrow-right" /> Sign out
            </button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
