import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import {
  addPlannedMeal,
  completePlannedMeal,
  deletePlannedMeal,
  fetchFoodsTried,
  fetchPlannedMealsInRange,
  isRecentlyIntroduced,
} from '../lib/data';
import { hasTriedFood } from '../lib/catalog';
import { FoodPicker } from '../components/FoodPicker';
import { dayKey, fmt, weekDays } from '../lib/date';
import { MEAL_SLOTS, TEXTURES, t } from '../lib/i18n';
import type { FoodTried, MealSlot, PlannedMeal, Texture } from '../lib/types';

export function PlannerPage() {
  const { session } = useAuth();
  const { categories } = useCategories();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [cursor] = useState(() => new Date());
  const days = useMemo(() => weekDays(cursor), [cursor]);
  const [planned, setPlanned] = useState<PlannedMeal[]>([]);
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [form, setForm] = useState({
    day: dayKey(new Date()),
    slot: 'lunch' as MealSlot,
    name: '',
    categoryId: '',
    texture: '' as Texture | '',
  });

  const load = useCallback(async () => {
    const [plans, foodRows] = await Promise.all([
      fetchPlannedMealsInRange(dayKey(days[0]), dayKey(days[6])),
      fetchFoodsTried(),
    ]);
    setPlanned(plans);
    setFoods(foodRows);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !form.name.trim()) return;
    await addPlannedMeal({
      userId: session.user.id,
      day: form.day,
      slot: form.slot,
      name: form.name.trim(),
      categoryId: form.categoryId || categories[0]?.id || null,
      texture: form.texture || null,
      // Detección automática: es nuevo si aún no se ha registrado nunca.
      isNew: !hasTriedFood(foods, form.name),
    });
    setForm((prev) => ({ ...prev, name: '' }));
    showToast({ title: t.meals.planned, tone: 'ok' });
    await load();
  }

  async function complete(plan: PlannedMeal) {
    if (!session) return;
    await completePlannedMeal(plan, session.user.id);
    showToast({ title: 'Comida registrada', tone: 'ok' });
    await load();
  }

  async function remove(plan: PlannedMeal) {
    const ok = await confirm({
      title: 'Eliminar planificación',
      body: `${plan.name} se quitará de la planificación.`,
    });
    if (!ok) return;
    await deletePlannedMeal(plan.id);
    await load();
  }

  const shoppingList = useMemo(() => {
    return Array.from(new Set(planned.filter((p) => !p.completed_meal_item_id).map((p) => p.name))).sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }, [planned]);

  const todayKey = dayKey(new Date());
  const retryFoods = foods.filter((food) => food.liking === 'disliked' || (!food.liking && food.count <= 2)).slice(0, 5);
  const newIdeas = foods
    .filter((food) => isRecentlyIntroduced(food, todayKey))
    .sort((a, b) => b.firstDay.localeCompare(a.firstDay))
    .slice(0, 5);

  return (
    <div className="page planner-page">
      <header className="page-head">
        <h1>{t.planner.title}</h1>
        <p className="muted">{t.planner.subtitle}</p>
      </header>

      <form className="planner-form" onSubmit={addPlan}>
        <input
          type="date"
          value={form.day}
          onChange={(e) => setForm({ ...form, day: e.target.value })}
          aria-label="Día"
        />
        <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value as MealSlot })}>
          {MEAL_SLOTS.map((slot) => (
            <option key={slot} value={slot}>{t.slots[slot]}</option>
          ))}
        </select>
        <FoodPicker
          value={form.name}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
          onPick={(option) => {
            setForm((prev) => ({
              ...prev,
              name: option.name,
              categoryId: option.categoryId ?? prev.categoryId,
            }));
          }}
          foods={foods}
          placeholder={t.meals.foodName}
          ariaLabel={t.meals.foodName}
        />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">{t.meals.category}</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>{category.name}</option>
          ))}
        </select>
        <select value={form.texture} onChange={(e) => setForm({ ...form, texture: e.target.value as Texture | '' })}>
          <option value="">{t.meals.texture}</option>
          {TEXTURES.map((texture) => (
            <option value={texture} key={texture}>{t.textures[texture].label}</option>
          ))}
        </select>
        <button className="primary" type="submit" disabled={!form.name.trim()}>
          {t.planner.add}
        </button>
      </form>

      <section className="planner-grid">
        {days.map((day) => {
          const key = dayKey(day);
          const dayPlans = planned.filter((plan) => plan.day === key);
          return (
            <article className="planner-day" key={key}>
              <h2>{fmt.weekdayDay(day)}</h2>
              {dayPlans.length === 0 ? (
                <p className="muted small">{t.planner.empty}</p>
              ) : (
                dayPlans.map((plan) => (
                  <div className={`planned-item ${plan.completed_meal_item_id ? 'is-complete' : ''}`} key={plan.id}>
                    <div>
                      <strong>{plan.name}</strong>
                      <span>{t.slots[plan.slot]}{plan.is_new ? ` · ${t.meals.isNew}` : ''}</span>
                    </div>
                    <div className="planned-actions">
                      {!plan.completed_meal_item_id && (
                        <button className="ghost small-btn" onClick={() => void complete(plan)}>
                          {t.planner.complete}
                        </button>
                      )}
                      <button className="chip-btn danger-text" onClick={() => void remove(plan)}>
                        {t.meals.delete}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </article>
          );
        })}
      </section>

      <section className="insight-grid">
        <SideList title={t.planner.shopping} items={shoppingList} empty="La lista aparecerá con alimentos planificados." />
        <SideList title={t.planner.retry} items={retryFoods.map((food) => food.name)} empty={t.today.noSuggestions} />
        <SideList title={t.planner.newThisWeek} items={newIdeas.map((food) => food.name)} empty="Cuando registres alimentos por primera vez aparecerán aquí." />
      </section>
    </div>
  );
}

function SideList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="insight-panel">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted small">{empty}</p>
      ) : (
        <div className="mini-list">
          {items.map((item) => <span className="mini-list-item" key={item}>{item}</span>)}
        </div>
      )}
    </section>
  );
}
