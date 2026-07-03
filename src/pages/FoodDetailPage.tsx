import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AllergenBadge } from '../components/AllergenBadge';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useToast } from '../context/ToastContext';
import {
  ALLERGENS,
  addPlannedMeal,
  fetchFoodDetail,
  updateFoodCategory,
  upsertFoodStatus,
} from '../lib/data';
import { dayKey, fmt, fromKey } from '../lib/date';
import { REACTIONS, t } from '../lib/i18n';
import type { AllergenKey, FoodDetail, Reaction } from '../lib/types';

export function FoodDetailPage() {
  const { nameKey = '' } = useParams();
  const { session } = useAuth();
  const { categories, byId } = useCategories();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<FoodDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFoodDetail(decodeURIComponent(nameKey));
      setDetail(data);
      setNotes(data?.notes ?? '');
    } finally {
      setLoading(false);
    }
  }, [nameKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus(patch: {
    reaction?: Reaction | null;
    categoryId?: string | null;
    allergenKeys?: AllergenKey[];
    isAllergen?: boolean;
    favorite?: boolean;
    notes?: string;
  }) {
    if (!session || !detail) return;
    const has = <Key extends keyof typeof patch>(key: Key) =>
      Object.prototype.hasOwnProperty.call(patch, key);
    await upsertFoodStatus({
      name: detail.name,
      reaction: has('reaction') ? patch.reaction ?? null : detail.reaction,
      notes: has('notes') ? patch.notes ?? '' : notes,
      userId: session.user.id,
      categoryId: has('categoryId') ? patch.categoryId ?? null : detail.categoryId,
      allergenKeys: has('allergenKeys') ? patch.allergenKeys ?? [] : detail.allergenKeys,
      isAllergen: has('isAllergen') ? patch.isAllergen ?? false : detail.isAllergen,
      favorite: has('favorite') ? patch.favorite ?? false : detail.favorite,
    });
    if (patch.categoryId !== undefined) await updateFoodCategory(detail.nameKey, patch.categoryId);
    showToast({ title: t.foods.saved, tone: 'ok' });
    await load();
  }

  async function planAgain() {
    if (!session || !detail) return;
    await addPlannedMeal({
      userId: session.user.id,
      day: dayKey(new Date()),
      slot: 'lunch',
      name: detail.name,
      categoryId: detail.categoryId,
      texture: detail.textures[0] ?? null,
      isNew: false,
      notes: '',
    });
    showToast({ title: t.meals.planned, message: `${detail.name} se añadió a hoy.`, tone: 'ok' });
  }

  if (loading) return <p className="muted">{t.common.loading}</p>;
  if (!detail) {
    return (
      <div className="page">
        <p className="muted">No se encontró este alimento.</p>
        <Link to="/alimentos">{t.nav.foods}</Link>
      </div>
    );
  }

  return (
    <div className="page food-detail-page">
      <Link className="link-btn" to="/alimentos">← {t.nav.foods}</Link>
      <header className="food-detail-hero">
        <div>
          <p className="eyebrow">{byId[detail.categoryId ?? '']?.name ?? t.foods.noCategory}</p>
          <h1>{detail.name}</h1>
          <AllergenBadge keys={detail.allergenKeys} />
        </div>
        <button className="primary" onClick={planAgain}>
          {t.foods.planAgain}
        </button>
      </header>

      <section className="metric-grid detail-metrics">
        <Metric label={t.foods.firstTried} value={fmt.weekdayDay(fromKey(detail.firstDay))} />
        <Metric label={t.foods.lastOffered} value={fmt.weekdayDay(fromKey(detail.lastDay))} />
        <Metric label={t.foods.timesOffered} value={detail.count} />
        <Metric label={t.meals.texture} value={detail.textures.map((tx) => t.textures[tx].label).join(', ') || 'Sin textura'} />
      </section>

      <section className="settings-section food-detail-controls">
        <h2>Estado del alimento</h2>
        <label>
          {t.meals.category}
          <select value={detail.categoryId ?? ''} onChange={(e) => void saveStatus({ categoryId: e.target.value || null })}>
            <option value="">{t.foods.noCategory}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="food-reactions" role="group" aria-label={t.foods.howItWent}>
          {REACTIONS.map((reaction) => (
            <button
              key={reaction}
              className={`reaction-btn ${detail.reaction === reaction ? 'active' : ''}`}
              onClick={() => void saveStatus({ reaction: detail.reaction === reaction ? null : reaction })}
            >
              {t.reactions[reaction].icon} {t.reactions[reaction].label}
            </button>
          ))}
        </div>
        <div className="allergen-checks">
          {ALLERGENS.map((allergen) => {
            const checked = detail.allergenKeys.includes(allergen.key);
            return (
              <label className="toggle-pill" key={allergen.key}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...detail.allergenKeys, allergen.key]
                      : detail.allergenKeys.filter((key) => key !== allergen.key);
                    void saveStatus({ allergenKeys: next, isAllergen: next.length > 0 });
                  }}
                />
                {allergen.label}
              </label>
            );
          })}
        </div>
        <label>
          {t.foods.notesPlaceholder}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => void saveStatus({ notes })} rows={3} />
        </label>
      </section>

      <section className="settings-section">
        <h2>Historial</h2>
        <div className="timeline-list">
          {detail.meals.map((meal) => (
            <article className="timeline-row" key={meal.id}>
              <div>
                <strong>{fmt.weekdayDay(fromKey(meal.day))}</strong>
                <span className="muted small">{t.slots[meal.slot]}</span>
              </div>
              <div>
                {meal.texture && <span>{t.textures[meal.texture].label}</span>}
                {meal.is_new && <span>✨ {t.meals.isNew}</span>}
                {meal.reaction && <span>{t.reactions[meal.reaction].label}</span>}
                {meal.notes && <span>{meal.notes}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
