import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayModal } from '../components/DayModal';
import { CategoryDot } from '../components/CategoryDot';
import {
  buildDashboardSummary,
  fetchBabyProfile,
  fetchDayNote,
  fetchFoodsTried,
  fetchMealsInRange,
  fetchPlannedMealsInRange,
} from '../lib/data';
import { dayKey, fmt } from '../lib/date';
import { MEAL_SLOTS, t } from '../lib/i18n';
import type { BabyProfile, DashboardSummary, FoodTried, MealItem, PlannedMeal } from '../lib/types';

export function TodayPage() {
  const [today] = useState(() => new Date());
  const todayKey = dayKey(today);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [planned, setPlanned] = useState<PlannedMeal[]>([]);
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

  return (
    <div className="page today-page">
      <header className="today-hero">
        <div>
          <p className="eyebrow">{fmt.fullDay(today)}</p>
          <h1>{profile?.name ? `Hoy con ${profile.name}` : t.today.title}</h1>
          <p className="muted">{t.today.subtitle}</p>
        </div>
        <button className="primary" onClick={() => setShowDay(true)}>
          {t.today.addFood}
        </button>
      </header>

      {loading ? (
        <p className="muted">{t.common.loading}</p>
      ) : (
        <>
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
                  <button className="primary" onClick={() => setShowDay(true)}>
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

      {showDay && <DayModal day={today} meals={meals} onClose={() => setShowDay(false)} onChanged={load} />}
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
