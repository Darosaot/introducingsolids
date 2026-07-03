import { addMonths, differenceInCalendarDays, differenceInMonths, parseISO } from 'date-fns';
import type { BabyProfile } from './types';

function parseDateKey(key: string | null | undefined): Date | null {
  if (!key) return null;
  const date = parseISO(key);
  return Number.isNaN(date.getTime()) ? null : date;
}

function plural(value: number, singular: string, pluralText: string): string {
  return value === 1 ? singular : pluralText;
}

export function formatBabyAge(birthDate: string | null | undefined, today = new Date()): string | null {
  const birth = parseDateKey(birthDate);
  if (!birth || birth > today) return null;

  const months = differenceInMonths(today, birth);
  const anchor = addMonths(birth, months);
  const days = differenceInCalendarDays(today, anchor);

  if (months >= 24) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const yearLabel = `${years} ${plural(years, 'año', 'años')}`;
    return remainingMonths > 0
      ? `${yearLabel} y ${remainingMonths} ${plural(remainingMonths, 'mes', 'meses')}`
      : yearLabel;
  }

  if (months > 0) {
    const monthLabel = `${months} ${plural(months, 'mes', 'meses')}`;
    return days > 0 ? `${monthLabel} y ${days} ${plural(days, 'día', 'días')}` : monthLabel;
  }

  const totalDays = differenceInCalendarDays(today, birth);
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  if (weeks > 0) {
    const weekLabel = `${weeks} ${plural(weeks, 'semana', 'semanas')}`;
    return remainingDays > 0
      ? `${weekLabel} y ${remainingDays} ${plural(remainingDays, 'día', 'días')}`
      : weekLabel;
  }
  return `${totalDays} ${plural(totalDays, 'día', 'días')}`;
}

export function formatSolidsTime(solidsStartDate: string | null | undefined, today = new Date()): string | null {
  const start = parseDateKey(solidsStartDate);
  if (!start) return null;

  const days = differenceInCalendarDays(today, start);
  if (days < 0) {
    const absDays = Math.abs(days);
    return `Sólidos en ${absDays} ${plural(absDays, 'día', 'días')}`;
  }
  if (days === 0) return 'Primer día de sólidos';
  if (days < 7) return `${days} ${plural(days, 'día', 'días')} con sólidos`;

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  const weekLabel = `${weeks} ${plural(weeks, 'semana', 'semanas')}`;
  return remainingDays > 0
    ? `${weekLabel} y ${remainingDays} ${plural(remainingDays, 'día', 'días')} con sólidos`
    : `${weekLabel} con sólidos`;
}

export function needsBabyProfileSetup(profile: BabyProfile | null): boolean {
  return !profile?.birth_date || !profile?.solids_start_date;
}

/** Edad del bebé en meses completos, o `null` si no hay fecha válida. */
export function ageInMonthsOn(birthDate: string | null | undefined, on: Date = new Date()): number | null {
  const birth = parseDateKey(birthDate);
  if (!birth || birth > on) return null;
  return differenceInMonths(on, birth);
}
