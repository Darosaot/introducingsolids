import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { addCategory, deleteCategory, updateCategory } from '../lib/data';
import { t } from '../lib/i18n';
import type { Category } from '../lib/types';

const DEFAULT_COLORS: Record<string, string> = {
  protein: '#E11D48',
  legumes: '#92400E',
  vegetables: '#16A34A',
  fruit: '#F97316',
  dairy: '#3B82F6',
  grains: '#CA8A04',
  other: '#6B7280',
};

const THEME_SWATCH: Record<string, string> = {
  verde: '#6d9773',
  rosa: '#c76b98',
  azul: '#4f83cc',
  neutro: '#64748b',
};

export function SettingsPage() {
  const { session } = useAuth();
  const { categories, refresh } = useCategories();
  const { theme, setTheme } = useTheme();

  const [draft, setDraft] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#22C55E');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setDraft(categories.map((c) => ({ ...c })));
  }, [categories]);

  function set(id: string, patch: Partial<Category>) {
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const changed = draft.filter((d) => {
        const orig = categories.find((c) => c.id === d.id);
        return orig && (orig.name !== d.name || orig.color !== d.color);
      });
      await Promise.all(
        changed.map((c) => updateCategory(c.id, { name: c.name, color: c.color })),
      );
      await refresh();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  function resetColors() {
    setDraft((d) => d.map((c) => ({ ...c, color: DEFAULT_COLORS[c.key] ?? c.color })));
    setSaved(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !session) return;
    setAdding(true);
    try {
      await addCategory({ userId: session.user.id, name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#22C55E');
      await refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.categories.confirmDelete)) return;
    await deleteCategory(id);
    await refresh();
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.settings.title}</h1>
      </header>

      {/* --- Apariencia --- */}
      <section className="settings-section">
        <h2>{t.themes.title}</h2>
        <p className="muted">{t.themes.subtitle}</p>
        <div className="theme-grid">
          {THEMES.map((th) => (
            <button
              key={th}
              className={`theme-card ${theme === th ? 'active' : ''}`}
              onClick={() => setTheme(th)}
              aria-pressed={theme === th}
            >
              <span className="theme-dot" style={{ backgroundColor: THEME_SWATCH[th] }} />
              {t.themes[th]}
            </button>
          ))}
        </div>
      </section>

      {/* --- Categorías --- */}
      <section className="settings-section">
        <h2>{t.categories.title}</h2>
        <p className="muted">{t.categories.subtitle}</p>

        <div className="cat-editor">
          {draft.map((c) => (
            <div className="cat-row" key={c.id}>
              <input
                className="color-input"
                type="color"
                value={c.color}
                onChange={(e) => set(c.id, { color: e.target.value })}
                aria-label={`${t.categories.color} — ${c.name}`}
              />
              <input
                className="cat-name-input"
                type="text"
                value={c.name}
                onChange={(e) => set(c.id, { name: e.target.value })}
                aria-label={t.categories.name}
                maxLength={40}
              />
              <button
                className="danger small-btn"
                onClick={() => handleDelete(c.id)}
                aria-label={t.categories.deleteAria}
              >
                {t.meals.delete}
              </button>
            </div>
          ))}
        </div>

        <div className="cat-actions">
          <button className="primary" onClick={save} disabled={busy}>
            {t.categories.save}
          </button>
          <button className="ghost" onClick={resetColors} disabled={busy}>
            {t.categories.reset}
          </button>
          {saved && <span className="ok-text">✓ {t.categories.saved}</span>}
        </div>

        <form className="cat-new" onSubmit={handleAdd}>
          <h3>{t.categories.newTitle}</h3>
          <div className="cat-new-row">
            <input
              className="color-input"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              aria-label={t.categories.color}
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.categories.newNamePlaceholder}
              aria-label={t.categories.newNamePlaceholder}
              maxLength={40}
            />
            <button className="primary" type="submit" disabled={adding || !newName.trim()}>
              {t.categories.add}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
