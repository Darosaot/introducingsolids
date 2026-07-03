import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/i18n';

const NAV_ITEMS = [
  { to: '/', label: t.nav.today, icon: '🏠', end: true },
  { to: '/calendario', label: t.nav.calendar, icon: '📅' },
  { to: '/alimentos', label: t.nav.foods, icon: '🥣' },
  { to: '/planificar', label: t.nav.planner, icon: '🗓' },
  { to: '/ajustes', label: t.nav.settings, icon: '⚙' },
];

export function Layout() {
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span aria-hidden>🍼</span>
          <span className="topbar-title">{t.appName}</span>
        </div>

        <nav className="topnav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              aria-label={item.label}
            >
              <span className="nav-icon" aria-hidden>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden>🔒</span>
              <span className="nav-label">{t.nav.admin}</span>
            </NavLink>
          )}
        </nav>

        <div className="topbar-user">
          <span className="muted small hide-mobile">{profile?.email}</span>
          <button className="ghost" onClick={() => void signOut()}>
            {t.nav.signOut}
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
