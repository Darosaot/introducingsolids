import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { FoodsPage } from './pages/FoodsPage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { PlannerPage } from './pages/PlannerPage';
import { TodayPage } from './pages/TodayPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { t } from './lib/i18n';

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function AppContent() {
  const { session, loading, needsHousehold } = useAuth();

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

  if (needsHousehold) {
    return <OnboardingPage />;
  }

  return (
    <CategoriesProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TodayPage />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="alimentos" element={<FoodsPage />} />
            <Route path="alimentos/:nameKey" element={<FoodDetailPage />} />
            <Route path="planificar" element={<PlannerPage />} />
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
      <ToastProvider>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
