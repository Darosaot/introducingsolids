import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayModal } from '../components/DayModal';
import { CategoryDot } from '../components/CategoryDot';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useToast } from '../context/ToastContext';
import { formatBabyAge, formatSolidsTime, needsBabyProfileSetup } from '../lib/baby';
import {
  addMeal,
  ALLERGENS,
  allergenIntroductionStatuses,
  buildDashboardSummary,
  deleteMeal,
  fetchBabyProfile,
  fetchDayNote,
  fetchFoodsTried,
  fetchMealsInRange,
  fetchPlannedMealsInRange,
  foodsIntroducedBy,
  foodNameKey,
  GUIDE_FOOD_IDEAS,
  inferAllergenKeys,
  upsertFoodStatus,
} from '../lib/data';
import { dayKey, fmt, fromKey } from '../lib/date';
import { MEAL_SLOTS, t } from '../lib/i18n';
import type { BabyProfile, Category, DashboardSummary, FoodTried, MealItem, MealSlot, PlannedMeal } from '../lib/types';

export function TodayPage() {
  const [today] = useState(() => new Date());
  const todayKey = dayKey(today);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [planned, setPlanned] = useState<PlannedMeal[]>([]);
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDay, setShowDay] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [baby, todayMeals, note, foodRows, plannedToday] = await Promise.all([
        fetchBabyProfile().catch(() => null),
        fetchMealsInRange(todayKey, todayKey),
        fetchDayNote(todayKey).catch(() => null),
        fetchFoodsTried(),
        fetchPlannedMealsInRange(todayKey, todayKey).catch(() => []),
      ]);
      setProfile(baby);
      setMeals(todayMeals);
      setPlanned(plannedToday);
      setFoods(foodRows);
      setSummary(buildDashboardSummary({ todayMeals, dayNote: note, foods: foodRows, plannedToday, todayKey }));
    } finally {
      setLoading(false);
    }
  }, [todayKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const bySlot = useMemo(() => {
    const map = new Map(MEAL_SLOTS.map((slot) => [slot, [] as MealItem[]]));
    for (const meal of meals) map.get(meal.slot)?.push(meal);
    return map;
  }, [meals]);

  const babyAge = formatBabyAge(profile?.birth_date, today);
  const solidsTime = formatSolidsTime(profile?.solids_start_date, today);
  const introducedFoods = useMemo(() => foodsIntroducedBy(foods, todayKey), [foods, todayKey]);
  const allergenStatuses = useMemo(() => allergenIntroductionStatuses(introducedFoods), [introducedFoods]);

  const focusQuickAdd = useCallback(() => {
    quickInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    quickInputRef.current?.focus();
  }, []);

  return (
    <div className="page today-page">
      <header className="today-hero">
        <div>
          <p className="eyebrow">{fmt.fullDay(today)}</p>
          <h1>{profile?.name ? `Hoy con ${profile.name}` : t.today.title}</h1>
          {(babyAge || solidsTime) && (
            <div className="baby-milestones" aria-label={`${t.baby.age} y ${t.baby.solidsAge}`}>
              {babyAge && <span>{babyAge}</span>}
              {solidsTime && <span>{solidsTime}</span>}
            </div>
          )}
          <p className="muted">{t.today.subtitle}</p>
        </div>
        <button className="primary" onClick={focusQuickAdd}>
          {t.today.quickAdd}
        </button>
      </header>

      {loading ? (
        <p className="muted">{t.common.loading}</p>
      ) : (
        <>
          {needsBabyProfileSetup(profile) && <BabySetupNudge />}
          <QuickAddMeal todayKey={todayKey} foods={introducedFoods} inputRef={quickInputRef} onSaved={load} />

          <section className="today-grid">
            <div className="today-main-panel">
              <div className="section-title-row">
                <h2>{t.today.title}</h2>
                <button className="ghost small-btn" onClick={() => setShowDay(true)}>
                  Abrir día
                </button>
              </div>
              {meals.length === 0 ? (
                <div className="empty-state">
                  <strong>{t.today.empty}</strong>
                  <button className="primary" onClick={focusQuickAdd}>
                    {t.today.addFood}
                  </button>
                </div>
              ) : (
                <div className="today-slot-list">
                  {MEAL_SLOTS.map((slot) => {
                    const slotMeals = bySlot.get(slot) ?? [];
                    return (
                      <section className="today-slot" key={slot}>
                        <h3>{t.slots[slot]}</h3>
                        {slotMeals.length === 0 ? (
                          <span className="muted small">{t.meals.empty}</span>
                        ) : (
                          slotMeals.map((meal) => (
                            <span className="chip static" key={meal.id}>
                              <CategoryDot categoryId={meal.category_id} />
                              {meal.name}
                              {meal.is_new && <span className="new-badge">✨</span>}
                              {meal.reaction === 'reaction' && <span className="reaction-warn">Reacción</span>}
                            </span>
                          ))
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="summary-panel">
              <h2>{t.today.summary}</h2>
              <div className="metric-grid">
                <Metric value={summary?.totalFoodsToday ?? 0} label={t.today.foodsToday} />
                <Metric value={summary?.newFoodsToday ?? 0} label={t.today.newToday} />
                <Metric value={summary?.reactionCountToday ?? 0} label={t.today.reactionsToday} />
                <Metric value={summary?.hasDayNote ? 'Sí' : 'No'} label={t.today.noteToday} />
              </div>
              <div className="allergen-progress">
                <span>{t.today.allergens}</span>
                <strong>
                  {summary?.allergensIntroduced ?? 0}/{summary?.allergenTotal ?? 0}
                </strong>
              </div>
              <AllergenGuide statuses={allergenStatuses} />
            </aside>
          </section>

          <section className="insight-grid">
            <InsightList title={t.today.planned} foods={planned.map((p) => p.name)} empty="Nada planificado." />
            <InsightFoodList title={t.today.recentNew} foods={summary?.recentNewFoods ?? []} />
            <InsightFoodList title={t.today.watch} foods={summary?.reactionsToWatch ?? []} />
            <InsightFoodList title={t.today.suggestions} foods={summary?.foodsToRetry ?? []} empty={t.today.noSuggestions} />
          </section>
        </>
      )}

      {showDay && (
        <DayModal
          day={today}
          meals={meals}
          foodSuggestions={introducedFoods}
          onClose={() => setShowDay(false)}
          onChanged={load}
        />
      )}
      <button className="fab-add" onClick={focusQuickAdd} aria-label={t.today.quickAdd}>
        +
      </button>
    </div>
  );
}

interface QuickSuggestion {
  name: string;
  categoryId: string | null;
  tried: boolean;
  note: string;
}

function buildQuickSuggestions(foods: FoodTried[], categories: Category[]): QuickSuggestion[] {
  const categoriesByKey = new Map(categories.map((category) => [category.key, category]));
  const history = foods
    .slice()
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (a.lastDay !== b.lastDay) return b.lastDay.localeCompare(a.lastDay);
      return b.count - a.count;
    })
    .map((food) => ({
      name: food.name,
      categoryId: food.categoryId,
      tried: true,
      note: `${food.count} ${food.count === 1 ? t.foods.once : t.foods.times}`,
    }));

  const seen = new Set(history.map((item) => foodNameKey(item.name)));
  const guideIdeas = GUIDE_FOOD_IDEAS
    .filter((idea) => !seen.has(foodNameKey(idea.name)))
    .map((idea) => ({
      name: idea.name,
      categoryId: categoriesByKey.get(idea.categoryKey)?.id ?? null,
      tried: false,
      note: `${idea.reason}: ${idea.note}`,
    }));

  return [...history, ...guideIdeas];
}

function QuickAddMeal({
  todayKey,
  foods,
  inputRef,
  onSaved,
}: {
  todayKey: string;
  foods: FoodTried[];
  inputRef: React.RefObject<HTMLInputElement>;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const suggestions = useMemo(() => buildQuickSuggestions(foods, categories), [foods, categories]);
  const [name, setName] = useState('');
  const [slot, setSlot] = useState<MealSlot>('lunch');
  const [categoryId, setCategoryId] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const normalizedName = foodNameKey(name);
  const exactSuggestion = suggestions.find((suggestion) => foodNameKey(suggestion.name) === normalizedName);
  const alreadyTried = foods.some((food) => food.nameKey === normalizedName);
  const allergenKeys = useMemo(() => inferAllergenKeys(name), [name]);
  const recentNewFood = useMemo(() => {
    if (!normalizedName) return null;
    const today = fromKey(todayKey);
    return foods.find((food) => {
      const ageDays = Math.floor((today.getTime() - fromKey(food.firstDay).getTime()) / 86_400_000);
      return food.isNew && food.nameKey !== normalizedName && ageDays >= 0 && ageDays < 3;
    }) ?? null;
  }, [foods, normalizedName, todayKey]);

  function applySuggestion(suggestion: QuickSuggestion) {
    setName(suggestion.name);
    if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
    setIsNew(!suggestion.tried);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!session || !trimmed) return;
    setBusy(true);
    try {
      const effectiveCategory = categoryId || exactSuggestion?.categoryId || categories[0]?.id || null;
      const created = await addMeal({
        userId: session.user.id,
        day: todayKey,
        slot,
        name: trimmed,
        categoryId: effectiveCategory,
        isNew: !alreadyTried && isNew,
      });
      if (!alreadyTried && allergenKeys.length > 0) {
        await upsertFoodStatus({
          name: trimmed,
          liking: null,
          reaction: null,
          notes: '',
          userId: session.user.id,
          categoryId: effectiveCategory,
          isAllergen: true,
          allergenKeys,
        });
      }
      setName('');
      setIsNew(true);
      showToast({
        title: t.today.quickAdded,
        tone: 'ok',
        actionLabel: 'Deshacer',
        onAction: async () => {
          await deleteMeal(created.id);
          onSaved();
        },
      });
      onSaved();
    } catch {
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="quick-add-card" id="quick-add">
      <div className="quick-add-head">
        <div>
          <h2>{t.today.quickAdd}</h2>
          <p className="muted">{t.today.quickAddHint}</p>
        </div>
        <span className="guide-pill">{t.today.guideHint}</span>
      </div>
      <form className="quick-add-form" onSubmit={save}>
        <div className="quick-name-field">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              const next = e.target.value;
              const match = suggestions.find((suggestion) => foodNameKey(suggestion.name) === foodNameKey(next));
              setName(next);
              if (match?.categoryId) setCategoryId(match.categoryId);
              if (match) setIsNew(!match.tried);
            }}
            list="quick-food-suggestions"
            placeholder={t.today.quickAddPlaceholder}
            maxLength={120}
            aria-label={t.meals.foodName}
          />
          <datalist id="quick-food-suggestions">
            {suggestions.slice(0, 40).map((suggestion) => (
              <option key={suggestion.name} value={suggestion.name} />
            ))}
          </datalist>
        </div>
        <select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)} aria-label="Franja">
          {MEAL_SLOTS.map((mealSlot) => (
            <option key={mealSlot} value={mealSlot}>
              {t.slots[mealSlot]}
            </option>
          ))}
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label={t.meals.category}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="new-check quick-new-check">
          <input
            type="checkbox"
            checked={!alreadyTried && isNew}
            disabled={alreadyTried}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          {t.meals.isNewShort}
        </label>
        <button className="primary" type="submit" disabled={busy || !name.trim()}>
          {t.meals.add}
        </button>
      </form>
      <div className="suggestion-row quick-suggestions" aria-label="Sugerencias">
        {suggestions.slice(0, 10).map((suggestion) => (
          <button key={suggestion.name} type="button" className="food-suggestion" onClick={() => applySuggestion(suggestion)}>
            <span>{suggestion.name}</span>
            <small>{suggestion.tried ? suggestion.note : suggestion.note.split(':')[0]}</small>
          </button>
        ))}
      </div>
      <div className="quick-guide-notes">
        <span>{t.today.guideRule}</span>
        {allergenKeys.length > 0 && (
          <strong>
            {t.today.allergenDetected}: {allergenKeys.map((key) => tAllergenLabel(key)).join(', ')}
          </strong>
        )}
        {recentNewFood && <span>Nuevo reciente: {recentNewFood.name}. Evita mezclar nuevas introducciones hoy si estás observando tolerancia.</span>}
      </div>
    </section>
  );
}

function tAllergenLabel(key: string): string {
  return ALLERGENS.find((allergen) => allergen.key === key)?.label ?? key;
}

function BabySetupNudge() {
  return (
    <section className="setup-nudge">
      <div>
        <h2>{t.baby.setupTitle}</h2>
        <p>{t.baby.setupBody}</p>
      </div>
      <Link className="primary-link" to="/ajustes">
        {t.baby.setupAction}
      </Link>
    </section>
  );
}

function AllergenGuide({ statuses }: { statuses: ReturnType<typeof allergenIntroductionStatuses> }) {
  const introduced = statuses.filter((status) => status.introduced);
  const pending = statuses.filter((status) => !status.introduced);

  return (
    <div className="allergen-guide">
      <p>{t.today.guideRule}</p>
      <div className="allergen-guide-columns">
        <div>
          <strong>{t.today.pendingAllergens}</strong>
          <div className="mini-list">
            {pending.slice(0, 5).map((status) => (
              <span className="mini-list-item" key={status.key}>{status.label}</span>
            ))}
            {pending.length === 0 && <span className="mini-list-item">Completos</span>}
          </div>
        </div>
        <div>
          <strong>{t.today.introducedAllergens}</strong>
          <div className="mini-list">
            {introduced.slice(0, 5).map((status) => (
              <span className="mini-list-item" key={status.key}>
                {status.label}{status.firstDay ? ` · ${fmt.weekdayDay(fromKey(status.firstDay))}` : ''}
              </span>
            ))}
            {introduced.length === 0 && <span className="mini-list-item">Ninguno aún</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InsightList({ title, foods, empty }: { title: string; foods: string[]; empty: string }) {
  return (
    <section className="insight-panel">
      <h2>{title}</h2>
      {foods.length === 0 ? (
        <p className="muted small">{empty}</p>
      ) : (
        <div className="mini-list">
          {foods.map((food) => (
            <span className="mini-list-item" key={food}>{food}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function InsightFoodList({
  title,
  foods,
  empty = 'Sin datos todavía.',
}: {
  title: string;
  foods: FoodTried[];
  empty?: string;
}) {
  return (
    <section className="insight-panel">
      <h2>{title}</h2>
      {foods.length === 0 ? (
        <p className="muted small">{empty}</p>
      ) : (
        <div className="mini-list">
          {foods.map((food) => (
            <Link className="mini-list-item" to={`/alimentos/${encodeURIComponent(food.nameKey)}`} key={food.nameKey}>
              {food.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
