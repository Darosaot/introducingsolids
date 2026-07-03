import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import {
  addMeal,
  copyDay,
  deleteMeal,
  fetchDayNote,
  updateMeal,
  upsertDayNote,
} from '../lib/data';
import { dayKey, fmt } from '../lib/date';
import { MEAL_SLOTS, TEXTURES, t } from '../lib/i18n';
import type { MealItem, MealSlot, Texture } from '../lib/types';
import { CategoryDot } from './CategoryDot';

interface Props {
  day: Date;
  meals: MealItem[];
  onClose: () => void;
  onChanged: () => void;
}

export function DayModal({ day, meals, onClose, onChanged }: Props) {
  const { session } = useAuth();
  const [note, setNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copyTo, setCopyTo] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Carga la nota del día al abrir.
  useEffect(() => {
    let active = true;
    fetchDayNote(dayKey(day))
      .then((n) => {
        if (active) {
          setNote(n?.note ?? '');
          setNoteLoaded(true);
        }
      })
      .catch(() => active && setNoteLoaded(true));
    return () => {
      active = false;
    };
  }, [day]);

  const dayItems = meals.filter((m) => m.day === dayKey(day));

  async function saveNote() {
    if (!session || !noteLoaded) return;
    await upsertDayNote(dayKey(day), note, session.user.id);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  }

  async function handleCopy() {
    if (!session || !copyTo) return;
    const n = await copyDay(dayKey(day), copyTo, session.user.id);
    setCopyMsg(n > 0 ? `✓ ${t.meals.copied}` : t.meals.nothingToCopy);
    setTimeout(() => setCopyMsg(''), 2000);
    if (n > 0) onChanged();
  }

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

          {/* Notas del día */}
          <section className="slot">
            <h3 className="slot-title">{t.meals.dayNotes}</h3>
            <textarea
              className="day-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteSaved(false);
              }}
              onBlur={saveNote}
              placeholder={t.meals.dayNotesPlaceholder}
              rows={2}
              aria-label={t.meals.dayNotes}
            />
            {noteSaved && <span className="ok-text small">✓ {t.categories.saved}</span>}
          </section>

          {/* Copiar día */}
          <section className="slot copy-row">
            <label className="copy-label">{t.meals.copyDayTo}</label>
            <div className="copy-controls">
              <input
                type="date"
                value={copyTo}
                onChange={(e) => setCopyTo(e.target.value)}
                aria-label={t.meals.copyDayTo}
              />
              <button className="ghost" onClick={handleCopy} disabled={!copyTo}>
                {t.meals.copyDay}
              </button>
              {copyMsg && <span className="ok-text small">{copyMsg}</span>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Selector segmentado de textura (opcional). */
function TextureSelect({
  value,
  onChange,
}: {
  value: Texture | null;
  onChange: (t: Texture | null) => void;
}) {
  return (
    <div className="texture-select" role="group" aria-label={t.meals.texture}>
      {TEXTURES.map((tx) => (
        <button
          key={tx}
          type="button"
          className={value === tx ? 'active' : ''}
          onClick={() => onChange(value === tx ? null : tx)}
          title={t.textures[tx].label}
          aria-pressed={value === tx}
        >
          {t.textures[tx].icon}
        </button>
      ))}
    </div>
  );
}

/** Iconos de un chip: textura + distintivo de "nuevo". */
function ItemBadges({ item }: { item: MealItem }) {
  return (
    <>
      {item.texture && (
        <span className="texture-icon" title={t.textures[item.texture].label}>
          {t.textures[item.texture].icon}
        </span>
      )}
      {item.is_new && (
        <span className="new-badge" title={t.meals.isNew}>
          ✨
        </span>
      )}
    </>
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
  const [texture, setTexture] = useState<Texture | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultCat = useMemo(() => categories[0]?.id ?? '', [categories]);

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
        texture,
        isNew,
      });
      setName('');
      setTexture(null);
      setIsNew(false);
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
              <ItemBadges item={item} />
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
        <TextureSelect value={texture} onChange={setTexture} />
        <label className="new-check" title={t.meals.isNew}>
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          ✨ {t.meals.isNewShort}
        </label>
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
  const [texture, setTexture] = useState<Texture | null>(item.texture);
  const [isNew, setIsNew] = useState(item.is_new);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updateMeal(item.id, {
        name: name.trim(),
        category_id: categoryId || null,
        texture,
        is_new: isNew,
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
        <TextureSelect value={texture} onChange={setTexture} />
        <label className="new-check" title={t.meals.isNew}>
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          ✨ {t.meals.isNewShort}
        </label>
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
