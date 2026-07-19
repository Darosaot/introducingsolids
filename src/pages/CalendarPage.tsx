import { useCallback, useEffect, useMemo, useState } from 'react';
import { Legend } from '../components/Legend';
import { DayModal } from '../components/DayModal';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import {
  DayView,
  MonthView,
  WeekView,
  YearView,
} from '../components/CalendarViews';
import { copyWeek, fetchFoodsTried, fetchMealsInRange, previewCopyWeek, type CopyMode } from '../lib/data';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  dayKey,
  fmt,
  fromKey,
  monthGrid,
  weekDays,
  yearMonths,
} from '../lib/date';
import { t } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';
import type { FoodTried, MealItem } from '../lib/types';

type View = 'day' | 'week' | 'month' | 'year';

/** Rango [desde, hasta] (claves ISO) que hay que cargar según la vista. */
function rangeFor(view: View, cursor: Date): [string, string] {
  if (view === 'day') return [dayKey(cursor), dayKey(cursor)];
  if (view === 'week') {
    const d = weekDays(cursor);
    return [dayKey(d[0]), dayKey(d[6])];
  }
  if (view === 'month') {
    const g = monthGrid(cursor);
    return [dayKey(g[0]), dayKey(g[g.length - 1])];
  }
  // year
  const months = yearMonths(cursor);
  const first = monthGrid(months[0])[0];
  const lastGrid = monthGrid(months[11]);
  return [dayKey(first), dayKey(lastGrid[lastGrid.length - 1])];
}

function title(view: View, cursor: Date): string {
  switch (view) {
    case 'day':
      return fmt.fullDay(cursor);
    case 'week':
      return fmt.weekRange(cursor);
    case 'month':
      return fmt.monthYear(cursor);
    case 'year':
      return fmt.year(cursor);
  }
}

export function CalendarPage() {
  const { session } = useAuth();
  const { choose } = useConfirm();
  const { showToast } = useToast();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<Date>(new Date());
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [foods, setFoods] = useState<FoodTried[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [copyWeekTo, setCopyWeekTo] = useState('');
  const [copyWeekMsg, setCopyWeekMsg] = useState('');

  const [from, to] = rangeFor(view, cursor);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, foodRows] = await Promise.all([
        fetchMealsInRange(from, to),
        fetchFoodsTried().catch(() => [] as FoodTried[]),
      ]);
      setMeals(data);
      setFoods(foodRows);
    } catch (e) {
      console.error('Error cargando comidas:', e);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, MealItem[]>();
    for (const m of meals) {
      const arr = map.get(m.day);
      if (arr) arr.push(m);
      else map.set(m.day, [m]);
    }
    return map;
  }, [meals]);

  const getDay = useCallback((d: Date) => byDay.get(dayKey(d)) ?? [], [byDay]);

  function step(dir: -1 | 1) {
    setCursor((c) => {
      switch (view) {
        case 'day':
          return addDays(c, dir);
        case 'week':
          return addWeeks(c, dir);
        case 'month':
          return addMonths(c, dir);
        case 'year':
          return addYears(c, dir);
      }
    });
  }

  async function handleCopyWeek() {
    if (!session || !copyWeekTo) return;
    const src = dayKey(weekDays(cursor)[0]);
    const dst = dayKey(weekDays(fromKey(copyWeekTo))[0]);
    const preview = await previewCopyWeek(src, dst);
    if (preview.sourceCount === 0) {
      setCopyWeekMsg(t.meals.nothingToCopy);
      return;
    }
    const choice = await choose({
      title: t.confirm.copyWeek,
      body:
        `Se copiarán ${preview.sourceCount} alimentos de ${preview.sourceFrom} a ${preview.sourceTo} ` +
        `hacia ${preview.destinationFrom} a ${preview.destinationTo}. ` +
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
    const n = await copyWeek(src, dst, session.user.id, choice as CopyMode);
    setCopyWeekMsg(n > 0 ? `✓ ${t.meals.copied} (${n})` : t.meals.nothingToCopy);
    showToast({ title: `${t.meals.copied} (${n})`, tone: 'ok' });
    setTimeout(() => setCopyWeekMsg(''), 2500);
    if (n > 0) void load();
  }

  const views: View[] = ['day', 'week', 'month', 'year'];

  return (
    <div className="calendar-page">
      <div className="cal-toolbar">
        <div className="view-switch" role="tablist" aria-label="Vistas">
          {views.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
            >
              {t.calendar.views[v]}
            </button>
          ))}
        </div>

        <div className="cal-nav">
          <button className="ghost" onClick={() => step(-1)} aria-label={t.calendar.prev}>
            ‹
          </button>
          <button className="ghost" onClick={() => setCursor(new Date())}>
            {t.calendar.today}
          </button>
          <button className="ghost" onClick={() => step(1)} aria-label={t.calendar.next}>
            ›
          </button>
        </div>
      </div>

      <h1 className="cal-title">{title(view, cursor)}</h1>

      {view === 'week' && (
        <div className="copy-week">
          <label className="copy-label">{t.meals.copyWeekTo}</label>
          <input
            type="date"
            value={copyWeekTo}
            onChange={(e) => setCopyWeekTo(e.target.value)}
            aria-label={t.meals.copyWeekTo}
          />
          <button className="ghost" onClick={handleCopyWeek} disabled={!copyWeekTo}>
            {t.meals.copyWeek}
          </button>
          {copyWeekMsg && <span className="ok-text small">{copyWeekMsg}</span>}
        </div>
      )}

      <Legend />

      <div className={`cal-body ${loading ? 'is-loading' : ''}`}>
        {view === 'month' && (
          <MonthView cursor={cursor} getDay={getDay} onSelectDay={setSelectedDay} />
        )}
        {view === 'week' && (
          <WeekView cursor={cursor} getDay={getDay} onSelectDay={setSelectedDay} />
        )}
        {view === 'day' && (
          <DayView cursor={cursor} getDay={getDay} onSelectDay={setSelectedDay} />
        )}
        {view === 'year' && (
          <YearView
            cursor={cursor}
            getDay={getDay}
            onSelectDay={(d) => {
              setCursor(d);
              setView('day');
            }}
            onSelectMonth={(m) => {
              setCursor(m);
              setView('month');
            }}
          />
        )}
      </div>

      {selectedDay && (
        <DayModal
          day={selectedDay}
          meals={meals}
          foodSuggestions={foods}
          onClose={() => setSelectedDay(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
