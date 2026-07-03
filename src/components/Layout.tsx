import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/i18n';

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
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.today}
          </NavLink>
          <NavLink to="/calendario" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.calendar}
          </NavLink>
          <NavLink to="/alimentos" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.foods}
          </NavLink>
          <NavLink to="/planificar" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.planner}
          </NavLink>
          <NavLink to="/ajustes" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.settings}
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t.nav.admin}
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
