import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import {
  addMeal,
  copyDay,
  deleteMeal,
  fetchDayNote,
  previewCopyDay,
  updateMeal,
  upsertDayNote,
  upsertFoodStatus,
  type CopyMode,
} from '../lib/data';
import { dayKey, fmt } from '../lib/date';
import { LIKING_OPTIONS, MEAL_SLOTS, REACTION_OPTIONS, TEXTURES, t } from '../lib/i18n';
import type { Liking, MealItem, MealSlot, ReactionStatus, Texture } from '../lib/types';
import { CategoryDot } from './CategoryDot';

interface Props {
  day: Date;
  meals: MealItem[];
  onClose: () => void;
  onChanged: () => void;
}

const COMMON_FOODS = ['Plátano', 'Aguacate', 'Huevo', 'Patata', 'Pera', 'Pan'];

export function DayModal({ day, meals, onClose, onChanged }: Props) {
  const { session } = useAuth();
  const { choose, confirm } = useConfirm();
  const { showToast } = useToast();
  const [note, setNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyTo, setCopyTo] = useState('');
  const [addingSlot, setAddingSlot] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<MealItem | null>(null);

  const key = dayKey(day);
  const dayItems = useMemo(() => meals.filter((m) => m.day === key), [meals, key]);
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    for (const meal of meals) {
      if (meal.name.trim()) names.add(meal.name.trim());
    }
    for (const name of COMMON_FOODS) names.add(name);
    return Array.from(names).slice(0, 10);
  }, [meals]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !addingSlot && !editing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addingSlot, editing, onClose]);

  useEffect(() => {
    let active = true;
    setNoteLoaded(false);
    fetchDayNote(key)
      .then((n) => {
        if (active) {
          setNote(n?.note ?? '');
          setNoteLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setNoteLoaded(true);
          setNoteState('error');
        }
      });
    return () => {
      active = false;
    };
  }, [key]);

  async function saveNote() {
    if (!session || !noteLoaded) return;
    setNoteState('saving');
    try {
      await upsertDayNote(key, note, session.user.id);
      setNoteState('saved');
      window.setTimeout(() => setNoteState('idle'), 1600);
    } catch {
      setNoteState('error');
    }
  }

  async function handleDelete(item: MealItem) {
    const ok = await confirm({
      title: t.confirm.deleteFood,
      body: `${item.name} se eliminará de ${fmt.fullDay(day)}.`,
      choices: [
        { value: 'confirm', label: t.confirm.delete, variant: 'danger' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (!ok) return;
    await deleteMeal(item.id);
    showToast({ title: 'Alimento eliminado', tone: 'ok' });
    onChanged();
  }

  async function handleCopy() {
    if (!session || !copyTo) return;
    const preview = await previewCopyDay(key, copyTo);
    if (preview.sourceCount === 0) {
      showToast({ title: t.meals.nothingToCopy, tone: 'info' });
      return;
    }
    const choice = await choose({
      title: t.confirm.copyDay,
      body:
        `Se copiarán ${preview.sourceCount} alimentos a ${preview.destinationFrom}. ` +
        (preview.hasConflicts
          ? `El destino ya tiene ${preview.destinationCount} alimentos.`
          : 'El destino está vacío.'),
      choices: [
        { value: 'append', label: t.meals.append, variant: 'primary' },
        { value: 'replace', label: t.meals.replace, variant: 'danger' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (choice !== 'append' && choice !== 'replace') return;
    const n = await copyDay(key, copyTo, session.user.id, choice as CopyMode);
    showToast({ title: `${t.meals.copied} (${n})`, tone: 'ok' });
    onChanged();
  }

  return (
    <div className="modal-backdrop day-detail-backdrop" onClick={onClose}>
      <div
        className="modal day-detail"
        role="dialog"
        aria-modal="true"
        aria-label={fmt.fullDay(day)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head day-detail-head">
          <div>
            <p className="eyebrow">{t.nav.today}</p>
            <h2>{fmt.fullDay(day)}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t.meals.close}>
            Cerrar
          </button>
        </header>

        <div className="modal-body day-detail-body">
          <section className="day-summary-strip">
            <div>
              <strong>{dayItems.length}</strong>
              <span>{t.today.foodsToday}</span>
            </div>
            <div>
              <strong>{dayItems.filter((m) => m.is_new).length}</strong>
              <span>{t.today.newToday}</span>
            </div>
            <div>
              <strong>{dayItems.filter((m) => m.reaction === 'reaction').length}</strong>
              <span>{t.today.reactionsToday}</span>
            </div>
          </section>

          <div className="meal-timeline">
            {MEAL_SLOTS.map((slot) => (
              <MealSlotSection
                key={slot}
                slot={slot}
                items={dayItems.filter((m) => m.slot === slot)}
                onAdd={() => setAddingSlot(slot)}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <section className="day-notes-panel">
            <div className="section-title-row">
              <h3>{t.meals.dayNotes}</h3>
              {noteState === 'saving' && <span className="muted small">Guardando…</span>}
              {noteState === 'saved' && <span className="ok-text small">✓ {t.categories.saved}</span>}
              {noteState === 'error' && <span className="error-text small">No se pudo guardar</span>}
            </div>
            <textarea
              className="day-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteState('idle');
              }}
              onBlur={saveNote}
              placeholder={t.meals.dayNotesPlaceholder}
              rows={3}
              aria-label={t.meals.dayNotes}
            />
          </section>

          <section className="copy-row">
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
            </div>
          </section>
        </div>

        {(addingSlot || editing) && session && (
          <AddFoodSheet
            day={day}
            slot={addingSlot ?? editing?.slot ?? 'breakfast'}
            item={editing}
            suggestions={suggestions}
            onClose={() => {
              setAddingSlot(null);
              setEditing(null);
            }}
            onSaved={async (created) => {
              onChanged();
              setAddingSlot(null);
              setEditing(null);
              if (created) {
                showToast({
                  title: 'Alimento añadido',
                  tone: 'ok',
                  actionLabel: 'Deshacer',
                  onAction: async () => {
                    await deleteMeal(created.id);
                    onChanged();
                  },
                });
              } else {
                showToast({ title: 'Cambios guardados', tone: 'ok' });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function MealSlotSection({
  slot,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  slot: MealSlot;
  items: MealItem[];
  onAdd: () => void;
  onEdit: (item: MealItem) => void;
  onDelete: (item: MealItem) => void;
}) {
  return (
    <section className="meal-slot-section">
      <div className="section-title-row">
        <h3>{t.slots[slot]}</h3>
        <button className="ghost small-btn" onClick={onAdd}>
          {t.meals.addFood}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="muted small">{t.meals.empty}</p>
      ) : (
        <div className="meal-row-list">
          {items.map((item) => (
            <article className={`meal-row ${item.reaction === 'reaction' ? 'has-reaction' : ''}`} key={item.id}>
              <div className="meal-row-main">
                <CategoryDot categoryId={item.category_id} />
                <div>
                  <strong>{item.name}</strong>
                  <div className="meal-meta">
                    {item.texture && <span>{t.textures[item.texture].label}</span>}
                    {item.is_new && <span>✨ {t.meals.isNew}</span>}
                    {item.liking && <span>{t.reactions[item.liking].label}</span>}
                    {item.reaction && <span>{t.reactions[item.reaction].label}</span>}
                    {item.notes && <span>Nota</span>}
                  </div>
                </div>
              </div>
              <div className="meal-row-actions">
                <button className="chip-btn" onClick={() => onEdit(item)} aria-label={t.meals.edit}>
                  Editar
                </button>
                <button className="chip-btn danger-text" onClick={() => void onDelete(item)} aria-label={t.meals.delete}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AddFoodSheet({
  day,
  slot,
  item,
  suggestions,
  onClose,
  onSaved,
}: {
  day: Date;
  slot: MealSlot;
  item: MealItem | null;
  suggestions: string[];
  onClose: () => void;
  onSaved: (created: MealItem | null) => void;
}) {
  const { session } = useAuth();
  const { categories } = useCategories();
  const [name, setName] = useState(item?.name ?? '');
  const [slotValue, setSlotValue] = useState<MealSlot>(item?.slot ?? slot);
  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? '');
  const [texture, setTexture] = useState<Texture | null>(item?.texture ?? null);
  const [isNew, setIsNew] = useState(item?.is_new ?? false);
  const [liking, setLiking] = useState<Liking | null>(item?.liking ?? null);
  const [reaction, setReaction] = useState<ReactionStatus | null>(item?.reaction ?? null);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !name.trim()) return;
    setBusy(true);
    try {
      if (item) {
        await updateMeal(item.id, {
          name: name.trim(),
          slot: slotValue,
          category_id: categoryId || null,
          texture,
          is_new: isNew,
          liking,
          reaction,
          notes: notes.trim() || null,
        });
        await upsertFoodStatus({
          name: name.trim(),
          liking,
          reaction,
          notes: notes.trim(),
          userId: session.user.id,
          categoryId: categoryId || null,
        });
        onSaved(null);
      } else {
        const created = await addMeal({
          userId: session.user.id,
          day: dayKey(day),
          slot: slotValue,
          name: name.trim(),
          categoryId: categoryId || null,
          texture,
          isNew,
          liking,
          reaction,
          notes: notes.trim() || null,
        });
        await upsertFoodStatus({
          name: name.trim(),
          liking,
          reaction,
          notes: notes.trim(),
          userId: session.user.id,
          categoryId: categoryId || null,
        });
        onSaved(created);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="add-food-sheet" onSubmit={save} onClick={(e) => e.stopPropagation()}>
        <header className="section-title-row">
          <h3>{item ? t.meals.edit : t.meals.addFood}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="suggestion-row">
          {suggestions.slice(0, 8).map((suggestion) => (
            <button key={suggestion} type="button" className="food-suggestion" onClick={() => setName(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>

        <label>
          {t.meals.foodName}
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={120} />
        </label>
        <label>
          Franja
          <select value={slotValue} onChange={(e) => setSlotValue(e.target.value as MealSlot)}>
            {MEAL_SLOTS.map((mealSlot) => (
              <option key={mealSlot} value={mealSlot}>
                {t.slots[mealSlot]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.meals.category}
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="segmented-field">
          <span>{t.meals.texture}</span>
          <div className="text-segments">
            {TEXTURES.map((tx) => (
              <button
                key={tx}
                type="button"
                className={texture === tx ? 'active' : ''}
                onClick={() => setTexture(texture === tx ? null : tx)}
                aria-pressed={texture === tx}
              >
                {t.textures[tx].label}
              </button>
            ))}
          </div>
        </div>

        <div className="segmented-field">
          <span>{t.foods.howLiked}</span>
          <div className="text-segments">
            {LIKING_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={liking === option ? 'active' : ''}
                onClick={() => setLiking(liking === option ? null : option)}
                aria-pressed={liking === option}
              >
                {t.reactions[option].label}
              </button>
            ))}
          </div>
        </div>

        <div className="segmented-field">
          <span>{t.foods.howReacted}</span>
          <div className="text-segments">
            {REACTION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={reaction === option ? 'active' : ''}
                onClick={() => setReaction(reaction === option ? null : option)}
                aria-pressed={reaction === option}
              >
                {t.reactions[option].label}
              </button>
            ))}
          </div>
        </div>

        <label className="new-check large-check">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          {t.meals.isNew}
        </label>

        <label>
          Nota
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        <button type="submit" className="primary" disabled={busy || !name.trim()}>
          {item ? t.meals.save : t.meals.add}
        </button>
      </form>
    </div>
  );
}
