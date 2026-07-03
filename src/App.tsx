import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { FoodsPage } from './pages/FoodsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { t } from './lib/i18n';

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner" aria-label={t.common.loading} />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <CategoriesProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<CalendarPage />} />
            <Route path="alimentos" element={<FoodsPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CategoriesProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
