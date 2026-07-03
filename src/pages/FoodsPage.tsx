import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AllergenBadge } from '../components/AllergenBadge';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useToast } from '../context/ToastContext';
import {
  DEFAULT_FOOD_FILTERS,
  fetchFoodsTried,
  filterFoods,
  updateFoodCategory,
  upsertFoodStatus,
} from '../lib/data';
import { fmt, fromKey } from '../lib/date';
import { REACTIONS, t } from '../lib/i18n';
import type { Category, FoodFilters, FoodTried, Reaction } from '../lib/types';

export function FoodsPage() {
  const { session } = useAuth();
  const { categories, byId } = useCategories();
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FOOD_FILTERS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFoods(await fetchFoodsTried());
    } catch (e) {
      console.error('Error cargando alimentos:', e);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleFoods = useMemo(() => filterFoods(foods, filters), [foods, filters]);

  async function saveStatus(food: FoodTried, reaction: Reaction | null, notes: string) {
    if (!session) return;
    const previous = foods;
    setFoods((prev) =>
      prev.map((f) =>
        f.nameKey === food.nameKey
          ? {
              ...f,
              reaction,
              notes,
              status: {
                name_key: food.nameKey,
                display_name: f.name,
                reaction,
                notes,
                category_id: f.categoryId,
                is_allergen: f.isAllergen,
                allergen_keys: f.allergenKeys,
                favorite: f.favorite,
                first_tried_day: f.firstDay,
                last_offered_day: f.lastDay,
                offer_count: f.count,
              },
            }
          : f,
      ),
    );
    try {
      await upsertFoodStatus({
        name: food.name,
        reaction,
        notes,
        userId: session.user.id,
        categoryId: food.categoryId,
        isAllergen: food.isAllergen,
        allergenKeys: food.allergenKeys,
        favorite: food.favorite,
      });
      showToast({ title: t.foods.saved, tone: 'ok' });
    } catch {
      setFoods(previous);
      showToast({ title: t.common.error, tone: 'error' });
    }
  }

  async function changeCategory(food: FoodTried, categoryId: string | null) {
    const previous = foods;
    setFoods((prev) => prev.map((f) => (f.nameKey === food.nameKey ? { ...f, categoryId } : f)));
    try {
      await updateFoodCategory(food.nameKey, categoryId);
      await load();
      showToast({ title: t.categories.saved, tone: 'ok' });
    } catch {
      setFoods(previous);
      showToast({ title: t.common.error, tone: 'error' });
    }
  }

  return (
    <div className="page foods-page">
      <header className="page-head">
        <h1>{t.foods.title}</h1>
        <p className="muted">{t.foods.subtitle}</p>
      </header>

      <FoodSearchFilters filters={filters} categories={categories} onChange={setFilters} />

      {loading ? (
        <p className="muted">{t.common.loading}</p>
      ) : foods.length === 0 ? (
        <p className="muted">{t.foods.empty}</p>
      ) : (
        <div className="food-library-grid">
          {visibleFoods.map((food) => (
            <FoodCard
              key={food.nameKey}
              food={food}
              color={(food.categoryId && byId[food.categoryId]?.color) || '#CBD5E1'}
              categoryName={(food.categoryId && byId[food.categoryId]?.name) || t.foods.noCategory}
              categories={categories}
              onSave={saveStatus}
              onCategory={changeCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FoodSearchFilters({
  filters,
  categories,
  onChange,
}: {
  filters: FoodFilters;
  categories: Category[];
  onChange: (filters: FoodFilters) => void;
}) {
  return (
    <section className="filter-bar">
      <input
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        placeholder={t.foods.search}
        aria-label={t.foods.search}
      />
      <select
        value={filters.categoryId}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
        aria-label={t.meals.category}
      >
        <option value="">{t.foods.allCategories}</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        value={filters.reaction}
        onChange={(e) => onChange({ ...filters, reaction: e.target.value as FoodFilters['reaction'] })}
        aria-label={t.foods.allReactions}
      >
        <option value="">{t.foods.allReactions}</option>
        {REACTIONS.map((reaction) => (
          <option value={reaction} key={reaction}>
            {t.reactions[reaction].label}
          </option>
        ))}
        <option value="unrated">{t.foods.unrated}</option>
      </select>
      <select
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value as FoodFilters['sort'] })}
        aria-label={t.foods.sort}
      >
        <option value="name">{t.foods.sortName}</option>
        <option value="first">{t.foods.sortFirst}</option>
        <option value="last">{t.foods.sortLast}</option>
        <option value="count">{t.foods.sortCount}</option>
      </select>
      <label className="toggle-pill">
        <input
          type="checkbox"
          checked={filters.onlyNew}
          onChange={(e) => onChange({ ...filters, onlyNew: e.target.checked })}
        />
        {t.foods.onlyNew}
      </label>
      <label className="toggle-pill">
        <input
          type="checkbox"
          checked={filters.onlyAllergens}
          onChange={(e) => onChange({ ...filters, onlyAllergens: e.target.checked })}
        />
        {t.foods.onlyAllergens}
      </label>
    </section>
  );
}

function FoodCard({
  food,
  color,
  categoryName,
  categories,
  onSave,
  onCategory,
}: {
  food: FoodTried;
  color: string;
  categoryName: string;
  categories: Category[];
  onSave: (food: FoodTried, reaction: Reaction | null, notes: string) => void;
  onCategory: (food: FoodTried, categoryId: string | null) => void;
}) {
  const [notes, setNotes] = useState(food.notes ?? '');
  const reaction = food.reaction ?? null;

  return (
    <article className={`food-card library-card ${reaction === 'reaction' ? 'has-reaction' : ''}`} style={{ borderLeftColor: color }}>
      <div className="food-head">
        <div>
          <Link className="food-name-link" to={`/alimentos/${encodeURIComponent(food.nameKey)}`}>
            {food.name}
          </Link>
          <div className="muted small">{categoryName}</div>
        </div>
        {food.isNew && <span className="new-badge" title={t.foods.newBadge}>✨</span>}
      </div>

      <div className="food-stats">
        <span>{t.foods.firstTried}: {fmt.weekdayDay(fromKey(food.firstDay))}</span>
        <span>{t.foods.lastOffered}: {fmt.weekdayDay(fromKey(food.lastDay))}</span>
        <span>{food.count} {food.count === 1 ? t.foods.once : t.foods.times}</span>
      </div>

      <AllergenBadge keys={food.allergenKeys} />

      <label className="food-cat-row">
        <span className="muted small">{t.meals.category}</span>
        <select
          value={food.categoryId ?? ''}
          onChange={(e) => onCategory(food, e.target.value || null)}
          aria-label={`${t.meals.category} — ${food.name}`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="food-reactions" role="group" aria-label={t.foods.howItWent}>
        {REACTIONS.map((r) => (
          <button
            key={r}
            className={`reaction-btn ${reaction === r ? 'active' : ''}`}
            onClick={() => onSave(food, reaction === r ? null : r, notes)}
            title={t.reactions[r].label}
            aria-pressed={reaction === r}
          >
            <span aria-hidden>{t.reactions[r].icon}</span>
            <span className="reaction-label">{t.reactions[r].label}</span>
          </button>
        ))}
      </div>

      <input
        className="food-notes"
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if ((food.notes ?? '') !== notes) onSave(food, reaction, notes);
        }}
        placeholder={t.foods.notesPlaceholder}
        aria-label={t.foods.notesPlaceholder}
      />
    </article>
  );
}
