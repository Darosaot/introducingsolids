import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AllergenBadge } from '../components/AllergenBadge';
import { SafetyBadge } from '../components/SafetyBadge';
import { ReactionGroup } from '../components/ReactionGroup';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useToast } from '../context/ToastContext';
import { ageInMonthsOn } from '../lib/baby';
import { foodSafetyWarnings } from '../lib/safety';
import {
  DEFAULT_FOOD_FILTERS,
  fetchBabyProfile,
  fetchFoodsTried,
  filterFoods,
  isRecentlyIntroduced,
  updateFoodCategory,
  upsertFoodStatus,
} from '../lib/data';
import { dayKey, fmt, fromKey } from '../lib/date';
import { LIKING_OPTIONS, REACTION_OPTIONS, t } from '../lib/i18n';
import type { Category, FoodFilters, FoodTried, Liking, ReactionStatus } from '../lib/types';

type ReactionPatch = { liking?: Liking | null; reaction?: ReactionStatus | null };

export function FoodsPage() {
  const { session } = useAuth();
  const { categories, byId } = useCategories();
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [ageMonths, setAgeMonths] = useState<number | null>(null);
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FOOD_FILTERS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [foodRows, baby] = await Promise.all([
        fetchFoodsTried(),
        fetchBabyProfile().catch(() => null),
      ]);
      setFoods(foodRows);
      setAgeMonths(ageInMonthsOn(baby?.birth_date));
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

  const todayKey = useMemo(() => dayKey(new Date()), []);
  const visibleFoods = useMemo(() => filterFoods(foods, filters, todayKey), [foods, filters, todayKey]);

  async function saveStatus(food: FoodTried, patch: ReactionPatch, notes: string) {
    if (!session) return;
    const liking = 'liking' in patch ? patch.liking ?? null : food.liking ?? null;
    const reaction = 'reaction' in patch ? patch.reaction ?? null : food.reaction ?? null;
    const previous = foods;
    setFoods((prev) =>
      prev.map((f) =>
        f.nameKey === food.nameKey
          ? {
              ...f,
              liking,
              reaction,
              notes,
              status: {
                name_key: food.nameKey,
                display_name: f.name,
                liking,
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
        liking,
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
              ageMonths={ageMonths}
              isRecent={isRecentlyIntroduced(food, todayKey)}
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
        value={filters.liking}
        onChange={(e) => onChange({ ...filters, liking: e.target.value as FoodFilters['liking'] })}
        aria-label={t.foods.howLiked}
      >
        <option value="">{t.foods.allLiking}</option>
        {LIKING_OPTIONS.map((liking) => (
          <option value={liking} key={liking}>
            {t.reactions[liking].label}
          </option>
        ))}
        <option value="unrated">{t.foods.unrated}</option>
      </select>
      <select
        value={filters.reaction}
        onChange={(e) => onChange({ ...filters, reaction: e.target.value as FoodFilters['reaction'] })}
        aria-label={t.foods.howReacted}
      >
        <option value="">{t.foods.allReactions}</option>
        {REACTION_OPTIONS.map((reaction) => (
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
  ageMonths,
  isRecent,
  onSave,
  onCategory,
}: {
  food: FoodTried;
  color: string;
  categoryName: string;
  categories: Category[];
  ageMonths: number | null;
  isRecent: boolean;
  onSave: (food: FoodTried, patch: ReactionPatch, notes: string) => void;
  onCategory: (food: FoodTried, categoryId: string | null) => void;
}) {
  const [notes, setNotes] = useState(food.notes ?? '');
  const liking = food.liking ?? null;
  const reaction = food.reaction ?? null;
  const safetyWarnings = foodSafetyWarnings(food.name, ageMonths);

  return (
    <article className={`food-card library-card ${reaction === 'reaction' ? 'has-reaction' : ''}`} style={{ borderLeftColor: color }}>
      <div className="food-head">
        <div>
          <Link className="food-name-link" to={`/alimentos/${encodeURIComponent(food.nameKey)}`}>
            {food.name}
          </Link>
          <div className="muted small">{categoryName}</div>
        </div>
        {isRecent && <span className="new-badge" title={t.foods.newBadge}>✨</span>}
      </div>

      <div className="food-stats">
        <span>{t.foods.firstTried}: {fmt.weekdayDay(fromKey(food.firstDay))}</span>
        <span>{t.foods.lastOffered}: {fmt.weekdayDay(fromKey(food.lastDay))}</span>
        <span>{food.count} {food.count === 1 ? t.foods.once : t.foods.times}</span>
      </div>

      <AllergenBadge keys={food.allergenKeys} />
      <SafetyBadge warnings={safetyWarnings} />

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

      <div className="reaction-columns">
        <ReactionGroup
          label={t.foods.howLiked}
          options={LIKING_OPTIONS}
          value={liking}
          onSelect={(liking) => onSave(food, { liking }, notes)}
        />
        <ReactionGroup
          label={t.foods.howReacted}
          options={REACTION_OPTIONS}
          value={reaction}
          onSelect={(reaction) => onSave(food, { reaction }, notes)}
        />
      </div>

      <input
        className="food-notes"
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if ((food.notes ?? '') !== notes) onSave(food, {}, notes);
        }}
        placeholder={t.foods.notesPlaceholder}
        aria-label={t.foods.notesPlaceholder}
      />
    </article>
  );
}
