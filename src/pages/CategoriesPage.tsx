import { useEffect, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { updateCategory } from '../lib/data';
import { t } from '../lib/i18n';
import type { Category } from '../lib/types';

/** Colores por defecto por clave de categoría (para restaurar). */
const DEFAULT_COLORS: Record<string, string> = {
  protein: '#E11D48',
  legumes: '#92400E',
  vegetables: '#16A34A',
  fruit: '#F97316',
  dairy: '#3B82F6',
  grains: '#CA8A04',
  other: '#6B7280',
};

export function CategoriesPage() {
  const { categories, refresh } = useCategories();
  const [draft, setDraft] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.categories.title}</h1>
        <p className="muted">{t.categories.subtitle}</p>
      </header>

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
            <span className="chip static" style={{ borderColor: c.color }}>
              <span className="cat-dot" style={{ backgroundColor: c.color }} />
              <span className="chip-name">{c.name}</span>
            </span>
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
    </div>
  );
}
