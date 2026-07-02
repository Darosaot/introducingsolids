import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { addMeal, deleteMeal, updateMeal } from '../lib/data';
import { dayKey, fmt } from '../lib/date';
import { MEAL_SLOTS, t } from '../lib/i18n';
import type { MealItem, MealSlot } from '../lib/types';
import { CategoryDot } from './CategoryDot';

interface Props {
  day: Date;
  meals: MealItem[];
  onClose: () => void;
  onChanged: () => void;
}

export function DayModal({ day, meals, onClose, onChanged }: Props) {
  // Cierra con la tecla Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dayItems = meals.filter((m) => m.day === dayKey(day));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={fmt.fullDay(day)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2>{fmt.fullDay(day)}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t.meals.close}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {MEAL_SLOTS.map((slot) => (
            <SlotEditor
              key={slot}
              slot={slot}
              day={day}
              items={dayItems.filter((m) => m.slot === slot)}
              onChanged={onChanged}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotEditor({
  slot,
  day,
  items,
  onChanged,
}: {
  slot: MealSlot;
  day: Date;
  items: MealItem[];
  onChanged: () => void;
}) {
  const { session } = useAuth();
  const { categories } = useCategories();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultCat = useMemo(() => categories[0]?.id ?? '', [categories]);

  // Fija la categoría por defecto en cuanto las categorías estén disponibles,
  // para no guardar nunca un alimento sin categoría por descuido.
  useEffect(() => {
    if (!categoryId && defaultCat) setCategoryId(defaultCat);
  }, [defaultCat, categoryId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !session) return;
    setBusy(true);
    try {
      await addMeal({
        userId: session.user.id,
        day: dayKey(day),
        slot,
        name: trimmed,
        categoryId: categoryId || defaultCat || null,
      });
      setName('');
      setCategoryId('');
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.meals.confirmDelete)) return;
    await deleteMeal(id);
    onChanged();
  }

  return (
    <section className="slot">
      <h3 className="slot-title">{t.slots[slot]}</h3>

      <ul className="chip-list">
        {items.length === 0 && <li className="muted small">{t.meals.empty}</li>}
        {items.map((item) =>
          editingId === item.id ? (
            <ChipEditor
              key={item.id}
              item={item}
              onDone={() => {
                setEditingId(null);
                onChanged();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <li key={item.id} className="chip">
              <CategoryDot categoryId={item.category_id} />
              <span className="chip-name">{item.name}</span>
              <button
                className="chip-btn"
                onClick={() => setEditingId(item.id)}
                aria-label={t.meals.edit}
              >
                ✎
              </button>
              <button
                className="chip-btn"
                onClick={() => handleDelete(item.id)}
                aria-label={t.meals.delete}
              >
                🗑
              </button>
            </li>
          ),
        )}
      </ul>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.meals.foodName}
          aria-label={`${t.meals.foodName} — ${t.slots[slot]}`}
          maxLength={120}
        />
        <select
          value={categoryId || defaultCat}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label={t.meals.category}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy || !name.trim() || categories.length === 0}>
          {t.meals.add}
        </button>
      </form>
    </section>
  );
}

function ChipEditor({
  item,
  onDone,
  onCancel,
}: {
  item: MealItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { categories } = useCategories();
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.category_id ?? '');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updateMeal(item.id, {
        name: name.trim(),
        category_id: categoryId || null,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="chip editing">
      <form className="add-form" onSubmit={save}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={t.meals.foodName}
          autoFocus
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy}>
          {t.meals.save}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          {t.meals.cancel}
        </button>
      </form>
    </li>
  );
}
