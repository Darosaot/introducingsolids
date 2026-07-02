import { useCallback, useEffect, useMemo, useState } from 'react';
import { Legend } from '../components/Legend';
import { DayModal } from '../components/DayModal';
import {
  DayView,
  MonthView,
  WeekView,
  YearView,
} from '../components/CalendarViews';
import { fetchMealsInRange } from '../lib/data';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  dayKey,
  fmt,
  monthGrid,
  weekDays,
  yearMonths,
} from '../lib/date';
import { t } from '../lib/i18n';
import type { MealItem } from '../lib/types';

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
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<Date>(new Date());
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [from, to] = rangeFor(view, cursor);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMealsInRange(from, to);
      setMeals(data);
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
          onClose={() => setSelectedDay(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
