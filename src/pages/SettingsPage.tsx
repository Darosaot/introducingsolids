import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useConfirm } from '../context/ConfirmContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addCategory, deleteCategory, fetchBabyProfile, saveBabyProfile, updateCategory } from '../lib/data';
import { formatBabyAge, formatSolidsTime } from '../lib/baby';
import { dayKey } from '../lib/date';
import { t } from '../lib/i18n';
import type { BabyProfile, Category } from '../lib/types';

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
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [draft, setDraft] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#22C55E');
  const [adding, setAdding] = useState(false);
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [babyForm, setBabyForm] = useState({
    name: 'Bebé',
    birthDate: '',
    solidsStartDate: '',
  });
  const [babyBusy, setBabyBusy] = useState(false);
  const [babyLoading, setBabyLoading] = useState(true);
  const todayKey = dayKey(new Date());

  useEffect(() => {
    setDraft(categories.map((c) => ({ ...c })));
  }, [categories]);

  useEffect(() => {
    let active = true;
    fetchBabyProfile()
      .then((profile) => {
        if (!active) return;
        setBaby(profile);
        setBabyForm({
          name: profile?.name ?? 'Bebé',
          birthDate: profile?.birth_date ?? '',
          solidsStartDate: profile?.solids_start_date ?? '',
        });
      })
      .catch(() => showToast({ title: t.common.error, tone: 'error' }))
      .finally(() => {
        if (active) setBabyLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  function set(id: string, patch: Partial<Category>) {
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSaved(false);
  }

  async function saveCategories() {
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
      showToast({ title: t.categories.saved, tone: 'ok' });
    } catch {
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function saveBaby(e: React.FormEvent) {
    e.preventDefault();
    setBabyBusy(true);
    try {
      const saved = await saveBabyProfile({
        id: baby?.id,
        name: babyForm.name,
        birthDate: babyForm.birthDate || null,
        solidsStartDate: babyForm.solidsStartDate || null,
      });
      setBaby(saved);
      setBabyForm({
        name: saved.name,
        birthDate: saved.birth_date ?? '',
        solidsStartDate: saved.solids_start_date ?? '',
      });
      showToast({ title: t.baby.saved, tone: 'ok' });
    } catch {
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setBabyBusy(false);
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
      showToast({ title: t.categories.saved, tone: 'ok' });
    } catch {
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const category = categories.find((c) => c.id === id);
    const ok = await confirm({
      title: t.confirm.deleteCategory,
      body: `${category?.name ?? 'Esta categoría'} se eliminará. Los alimentos que la usen quedarán sin categoría.`,
      choices: [
        { value: 'confirm', label: t.confirm.delete, variant: 'danger' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (!ok) return;
    await deleteCategory(id);
    await refresh();
    showToast({ title: 'Categoría eliminada', tone: 'ok' });
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.settings.title}</h1>
      </header>

      {/* --- Perfil del bebé --- */}
      <section className="settings-section">
        <h2>{t.baby.title}</h2>
        <p className="muted">{t.baby.subtitle}</p>
        {babyLoading ? (
          <p className="muted">{t.common.loading}</p>
        ) : (
          <form className="baby-profile-form" onSubmit={saveBaby}>
            <label>
              {t.baby.name}
              <input
                type="text"
                value={babyForm.name}
                onChange={(e) => setBabyForm((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={60}
              />
            </label>
            <label>
              {t.baby.birthDate}
              <input
                type="date"
                value={babyForm.birthDate}
                max={todayKey}
                onChange={(e) => setBabyForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </label>
            <label>
              {t.baby.solidsStartDate}
              <input
                type="date"
                value={babyForm.solidsStartDate}
                min={babyForm.birthDate || undefined}
                max={todayKey}
                onChange={(e) => setBabyForm((prev) => ({ ...prev, solidsStartDate: e.target.value }))}
              />
            </label>
            <button className="primary" type="submit" disabled={babyBusy || !babyForm.name.trim()}>
              {t.baby.save}
            </button>
          </form>
        )}
        {(babyForm.birthDate || babyForm.solidsStartDate) && (
          <div className="profile-preview">
            {babyForm.birthDate && <span>{formatBabyAge(babyForm.birthDate) ?? t.baby.ageUnavailable}</span>}
            {babyForm.solidsStartDate && <span>{formatSolidsTime(babyForm.solidsStartDate)}</span>}
          </div>
        )}
      </section>

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
          <button className="primary" onClick={saveCategories} disabled={busy}>
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
