import { describe, expect, it } from 'vitest';
import { formatBabyAge, formatSolidsTime, needsBabyProfileSetup } from './baby';
import type { BabyProfile } from './types';

const TODAY = new Date('2026-07-03T12:00:00');

function profile(partial: Partial<BabyProfile>): BabyProfile {
  return {
    id: 'baby-1',
    name: 'Bebé',
    birth_date: '2026-02-03',
    solids_start_date: '2026-06-12',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('baby profile helpers', () => {
  it('formats baby age in Spanish month/day terms', () => {
    expect(formatBabyAge('2026-02-03', TODAY)).toBe('5 meses');
    expect(formatBabyAge('2026-02-01', TODAY)).toBe('5 meses y 2 días');
  });

  it('formats weeks since solids start', () => {
    expect(formatSolidsTime('2026-06-12', TODAY)).toBe('3 semanas con sólidos');
    expect(formatSolidsTime('2026-07-01', TODAY)).toBe('2 días con sólidos');
  });

  it('detects missing first-run profile dates', () => {
    expect(needsBabyProfileSetup(null)).toBe(true);
    expect(needsBabyProfileSetup(profile({ birth_date: null }))).toBe(true);
    expect(needsBabyProfileSetup(profile({}))).toBe(false);
  });
});
