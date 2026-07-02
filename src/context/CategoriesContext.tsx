import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { fetchCategories } from '../lib/data';
import type { Category } from '../lib/types';
import { useAuth } from './AuthContext';

interface CategoriesState {
  categories: Category[];
  byId: Record<string, Category>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesState | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setCategories([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (e) {
      console.error('Error cargando categorías:', e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const byId = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  return (
    <CategoriesContext.Provider value={{ categories, byId, loading, refresh }}>
      {children}
    </CategoriesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCategories(): CategoriesState {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories debe usarse dentro de <CategoriesProvider>');
  return ctx;
}
