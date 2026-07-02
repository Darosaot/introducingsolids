import { describe, expect, it } from 'vitest';
import {
  dayKey,
  fromKey,
  monthGrid,
  weekDays,
  weekdayHeaders,
  yearMonths,
} from './date';

describe('date helpers (semanas lunes→domingo)', () => {
  it('la semana empieza en lunes y termina en domingo', () => {
    // 15 de julio de 2026 es miércoles.
    const days = weekDays(new Date(2026, 6, 15));
    expect(days).toHaveLength(7);
    expect(dayKey(days[0])).toBe('2026-07-13'); // lunes
    expect(dayKey(days[6])).toBe('2026-07-19'); // domingo
    expect(days[0].getDay()).toBe(1); // 1 = lunes
    expect(days[6].getDay()).toBe(0); // 0 = domingo
  });

  it('las cabeceras de días empiezan en lunes', () => {
    const headers = weekdayHeaders();
    expect(headers).toHaveLength(7);
    // En español la primera abreviatura corresponde a lunes ("lu").
    expect(headers[0].toLowerCase().startsWith('l')).toBe(true);
  });

  it('la rejilla del mes cubre semanas completas (múltiplo de 7)', () => {
    const grid = monthGrid(new Date(2026, 0, 1)); // enero 2026
    expect(grid.length % 7).toBe(0);
    // El primer día de la rejilla es lunes.
    expect(grid[0].getDay()).toBe(1);
    // Enero 2026 empieza en jueves, así que la rejilla arranca el 29 dic 2025.
    expect(dayKey(grid[0])).toBe('2025-12-29');
  });

  it('soporta fechas reales de 2026 y 2027', () => {
    // 1 de enero de 2027 es viernes.
    const jan2027 = fromKey('2027-01-01');
    expect(jan2027.getDay()).toBe(5);
    const grid = monthGrid(jan2027);
    expect(grid[0].getDay()).toBe(1); // lunes
    expect(dayKey(grid[0])).toBe('2026-12-28');
  });

  it('yearMonths devuelve los 12 meses del año', () => {
    const months = yearMonths(new Date(2027, 5, 10));
    expect(months).toHaveLength(12);
    expect(months[0].getMonth()).toBe(0);
    expect(months[11].getMonth()).toBe(11);
    expect(months.every((m) => m.getFullYear() === 2027)).toBe(true);
  });

  it('dayKey y fromKey son inversos', () => {
    const key = '2026-03-08';
    expect(dayKey(fromKey(key))).toBe(key);
  });
});
