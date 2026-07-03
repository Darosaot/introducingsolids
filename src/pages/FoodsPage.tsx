import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { fetchFoodsTried, upsertFoodStatus } from '../lib/data';
import { fmt, fromKey } from '../lib/date';
import { REACTIONS, t } from '../lib/i18n';
import type { FoodTried, Reaction } from '../lib/types';

export function FoodsPage() {
  const { session } = useAuth();
  const { categories, byId } = useCategories();
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFoodsTried()
      .then((f) => active && setFoods(f))
      .catch((e) => console.error('Error cargando alimentos:', e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Agrupa por categoría, respetando el orden de las categorías.
  const groups = useMemo(() => {
    const byCat = new Map<string, FoodTried[]>();
    for (const f of foods) {
      const key = f.categoryId ?? '__none__';
      const arr = byCat.get(key);
      if (arr) arr.push(f);
      else byCat.set(key, [f]);
    }
    const ordered: Array<{ id: string; name: string; color: string; items: FoodTried[] }> = [];
    for (const c of categories) {
      const items = byCat.get(c.id);
      if (items) ordered.push({ id: c.id, name: c.name, color: c.color, items });
    }
    const none = byCat.get('__none__');
    if (none) ordered.push({ id: '__none__', name: t.foods.noCategory, color: '#CBD5E1', items: none });
    return ordered;
  }, [foods, categories]);

  function updateLocal(nameKey: string, reaction: Reaction | null, notes: string) {
    setFoods((prev) =>
      prev.map((f) =>
        f.nameKey === nameKey
          ? { ...f, status: { name_key: nameKey, display_name: f.name, reaction, notes } }
          : f,
      ),
    );
  }

  async function saveStatus(food: FoodTried, reaction: Reaction | null, notes: string) {
    if (!session) return;
    updateLocal(food.nameKey, reaction, notes);
    await upsertFoodStatus({ name: food.name, reaction, notes, userId: session.user.id });
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.foods.title}</h1>
        <p className="muted">{t.foods.subtitle}</p>
      </header>

      {loading ? (
        <p className="muted">{t.common.loading}</p>
      ) : foods.length === 0 ? (
        <p className="muted">{t.foods.empty}</p>
      ) : (
        <div className="foods">
          {groups.map((g) => (
            <section className="foods-group" key={g.id}>
              <h2 className="foods-cat">
                <span className="cat-dot" style={{ backgroundColor: g.color }} />
                {g.name}
                <span className="muted small"> · {g.items.length}</span>
              </h2>
              <div className="foods-list">
                {g.items.map((food) => (
                  <FoodCard
                    key={food.nameKey}
                    food={food}
                    color={(food.categoryId && byId[food.categoryId]?.color) || '#CBD5E1'}
                    onSave={saveStatus}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodCard({
  food,
  color,
  onSave,
}: {
  food: FoodTried;
  color: string;
  onSave: (food: FoodTried, reaction: Reaction | null, notes: string) => void;
}) {
  const [notes, setNotes] = useState(food.status?.notes ?? '');
  const reaction = food.status?.reaction ?? null;

  return (
    <div className="food-card" style={{ borderLeftColor: color }}>
      <div className="food-head">
        <span className="food-name">{food.name}</span>
        {food.isNew && <span className="new-badge" title={t.foods.newBadge}>✨</span>}
        <span className="muted small">
          {food.count} {food.count === 1 ? t.foods.once : t.foods.times} ·{' '}
          {t.foods.firstTime}: {fmt.weekdayDay(fromKey(food.firstDay))}
        </span>
      </div>

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
          if ((food.status?.notes ?? '') !== notes) onSave(food, reaction, notes);
        }}
        placeholder={t.foods.notesPlaceholder}
        aria-label={t.foods.notesPlaceholder}
      />
    </div>
  );
}
