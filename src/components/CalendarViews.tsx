import {
  dayKey,
  fmt,
  isSameMonth,
  isToday,
  monthGrid,
  weekDays,
  weekdayHeaders,
  yearMonths,
} from '../lib/date';
import { MEAL_SLOTS, t } from '../lib/i18n';
import type { MealItem } from '../lib/types';
import { useCategories } from '../context/CategoriesContext';

interface ViewProps {
  cursor: Date;
  getDay: (d: Date) => MealItem[];
  onSelectDay: (d: Date) => void;
}

/** Puntos de color de los alimentos de un día (con tope). */
function DayDots({ items }: { items: MealItem[] }) {
  const { byId } = useCategories();
  if (items.length === 0) return null;
  const shown = items.slice(0, 8);
  return (
    <div className="day-dots">
      {shown.map((it) => (
        <span
          key={it.id}
          className="cat-dot"
          style={{ backgroundColor: (it.category_id && byId[it.category_id]?.color) || '#CBD5E1' }}
          title={it.name}
        />
      ))}
      {items.length > shown.length && (
        <span className="dots-more">+{items.length - shown.length}</span>
      )}
    </div>
  );
}

// --- Mes --------------------------------------------------------------------

export function MonthView({ cursor, getDay, onSelectDay }: ViewProps) {
  const days = monthGrid(cursor);
  const headers = weekdayHeaders();
  return (
    <div className="month">
      <div className="month-grid month-headers">
        {headers.map((h) => (
          <div className="month-head" key={h}>
            {h}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {days.map((d) => {
          const items = getDay(d);
          return (
            <button
              key={dayKey(d)}
              className={[
                'month-cell',
                isSameMonth(d, cursor) ? '' : 'outside',
                isToday(d) ? 'today' : '',
              ].join(' ')}
              onClick={() => onSelectDay(d)}
            >
              <span className="month-daynum">
                {fmt.dayNum(d)}
                {items.some((it) => it.is_new) && <span className="new-badge">✨</span>}
              </span>
              <DayDots items={items} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Semana -----------------------------------------------------------------

export function WeekView({ cursor, getDay, onSelectDay }: ViewProps) {
  const days = weekDays(cursor);
  const { byId } = useCategories();
  return (
    <div className="week">
      {days.map((d) => {
        const items = getDay(d);
        return (
          <button
            key={dayKey(d)}
            className={['week-col', isToday(d) ? 'today' : ''].join(' ')}
            onClick={() => onSelectDay(d)}
          >
            <div className="week-col-head">{fmt.weekdayDay(d)}</div>
            <div className="week-col-body">
              {MEAL_SLOTS.map((slot) => {
                const slotItems = items.filter((m) => m.slot === slot);
                return (
                  <div className="week-slot" key={slot}>
                    <div className="week-slot-label">{t.slots[slot]}</div>
                    {slotItems.length === 0 ? (
                      <div className="muted small">·</div>
                    ) : (
                      slotItems.map((it) => (
                        <div className="week-item" key={it.id}>
                          <span
                            className="cat-dot"
                            style={{
                              backgroundColor:
                                (it.category_id && byId[it.category_id]?.color) || '#CBD5E1',
                            }}
                          />
                          <span className="week-item-name">{it.name}</span>
                          {it.texture && <span className="texture-icon">{t.textures[it.texture].icon}</span>}
                          {it.is_new && <span className="new-badge">✨</span>}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- Día --------------------------------------------------------------------

export function DayView({ cursor, getDay, onSelectDay }: ViewProps) {
  const items = getDay(cursor);
  const { byId } = useCategories();
  return (
    <div className="day-view">
      {MEAL_SLOTS.map((slot) => {
        const slotItems = items.filter((m) => m.slot === slot);
        return (
          <button className="day-slot" key={slot} onClick={() => onSelectDay(cursor)}>
            <h3 className="slot-title">{t.slots[slot]}</h3>
            <div className="day-slot-items">
              {slotItems.length === 0 ? (
                <span className="muted small">{t.meals.empty}</span>
              ) : (
                slotItems.map((it) => (
                  <span className="chip static" key={it.id}>
                    <span
                      className="cat-dot"
                      style={{
                        backgroundColor:
                          (it.category_id && byId[it.category_id]?.color) || '#CBD5E1',
                      }}
                    />
                    <span className="chip-name">{it.name}</span>
                    {it.texture && <span className="texture-icon">{t.textures[it.texture].icon}</span>}
                    {it.is_new && <span className="new-badge">✨</span>}
                  </span>
                ))
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- Año --------------------------------------------------------------------

export function YearView({
  cursor,
  getDay,
  onSelectMonth,
  onSelectDay,
}: ViewProps & { onSelectMonth: (d: Date) => void }) {
  const months = yearMonths(cursor);
  const headers = weekdayHeaders();
  return (
    <div className="year">
      {months.map((m) => {
        const days = monthGrid(m);
        return (
          <div className="mini-month" key={fmt.monthShort(m)}>
            <button className="mini-month-title" onClick={() => onSelectMonth(m)}>
              {fmt.monthShort(m)}
            </button>
            <div className="mini-grid mini-headers">
              {headers.map((h) => (
                <span className="mini-head" key={h}>
                  {h.charAt(0)}
                </span>
              ))}
            </div>
            <div className="mini-grid">
              {days.map((d) => {
                const has = getDay(d).length > 0;
                return (
                  <button
                    key={dayKey(d)}
                    className={[
                      'mini-cell',
                      isSameMonth(d, m) ? '' : 'outside',
                      isToday(d) ? 'today' : '',
                      has ? 'has-meals' : '',
                    ].join(' ')}
                    onClick={() => onSelectDay(d)}
                  >
                    {fmt.dayNum(d)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
