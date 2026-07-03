import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { updateTheme } from '../lib/data';
import type { Theme } from '../lib/types';
import { useAuth } from './AuthContext';

export const THEMES: Theme[] = ['verde', 'rosa', 'azul', 'neutro'];
const STORAGE_KEY = 'blw-theme';

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as string[]).includes(v);
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();

  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return isTheme(stored) ? stored : 'verde';
  });

  // Aplica el tema al <html> siempre que cambie (evita parpadeo al arrancar).
  useEffect(() => {
    apply(theme);
  }, [theme]);

  // Al cargar el perfil, el tema guardado del usuario manda.
  useEffect(() => {
    if (profile && isTheme(profile.theme) && profile.theme !== theme) {
      setThemeState(profile.theme);
      localStorage.setItem(STORAGE_KEY, profile.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem(STORAGE_KEY, t);
      if (session) {
        void updateTheme(session.user.id, t).catch((e) =>
          console.error('No se pudo guardar el tema:', e),
        );
      }
    },
    [session],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
