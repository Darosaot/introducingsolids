import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfYear,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

/** Las semanas empiezan en lunes (weekStartsOn: 1). */
const WEEK_OPTS = { weekStartsOn: 1 as const, locale: es };

/** Clave ISO de un día: yyyy-MM-dd (sin zona horaria). */
export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromKey(key: string): Date {
  return parseISO(key);
}

/** Rejilla del mes: siempre semanas completas de lunes a domingo. */
export function monthGrid(cursor: Date): Date[] {
  const start = startOfWeek(startOfMonth(cursor), WEEK_OPTS);
  const end = endOfWeek(endOfMonth(cursor), WEEK_OPTS);
  return eachDayOfInterval({ start, end });
}

/** Los 7 días de la semana que contiene `cursor`, de lunes a domingo. */
export function weekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor, WEEK_OPTS);
  return eachDayOfInterval({ start, end: endOfWeek(cursor, WEEK_OPTS) });
}

/** Los 12 meses del año que contiene `cursor`. */
export function yearMonths(cursor: Date): Date[] {
  const start = startOfYear(cursor);
  return Array.from({ length: 12 }, (_, i) => addMonths(start, i));
}

/** Cabeceras de los días de la semana (Lun, Mar, …) empezando en lunes. */
export function weekdayHeaders(): string[] {
  const base = startOfWeek(new Date(), WEEK_OPTS);
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(base, i), 'EEEEEE', { locale: es }),
  );
}

export const fmt = {
  monthYear: (d: Date) => capitalize(format(d, 'LLLL yyyy', { locale: es })),
  monthShort: (d: Date) => capitalize(format(d, 'LLL', { locale: es })),
  dayNum: (d: Date) => format(d, 'd', { locale: es }),
  fullDay: (d: Date) => capitalize(format(d, "EEEE d 'de' LLLL 'de' yyyy", { locale: es })),
  weekdayDay: (d: Date) => capitalize(format(d, 'EEE d', { locale: es })),
  year: (d: Date) => format(d, 'yyyy'),
  weekRange: (d: Date) => {
    const days = weekDays(d);
    const a = days[0];
    const b = days[6];
    return `${format(a, 'd LLL', { locale: es })} – ${format(b, 'd LLL yyyy', { locale: es })}`;
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isSameMonth,
  isSameDay,
  isToday,
  startOfMonth,
};
