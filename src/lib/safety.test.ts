import { describe, expect, it } from 'vitest';
import { foodSafetyWarnings, normalizeForMatch } from './safety';

function ids(name: string, ageMonths: number | null): string[] {
  return foodSafetyWarnings(name, ageMonths).map((w) => w.id);
}

describe('normalizeForMatch', () => {
  it('lowercases, strips accents and collapses whitespace', () => {
    expect(normalizeForMatch('  Plátano   Maduro ')).toBe('platano maduro');
    expect(normalizeForMatch('Azúcar')).toBe('azucar');
  });
});

describe('foodSafetyWarnings', () => {
  it('flags honey below 12 months but not after', () => {
    expect(ids('Miel', 7)).toContain('honey');
    expect(ids('Miel', 13)).not.toContain('honey');
  });

  it('flags salt and sugar until 2 years', () => {
    expect(ids('Sal yodada', 10)).toContain('salt');
    expect(ids('Azúcar moreno', 10)).toContain('sugar');
    expect(ids('Sal', 30)).not.toContain('salt');
  });

  it('matches whole words only, so "sal" does not trigger on ensalada/salmón/salsa', () => {
    expect(ids('Ensalada', 8)).not.toContain('salt');
    expect(ids('Salmón', 8)).not.toContain('salt');
    expect(ids('Salsa de tomate', 8)).not.toContain('salt');
  });

  it('does not confuse cow milk keyword with breast/oat milk', () => {
    expect(ids('Leche de vaca', 8)).toContain('cow_milk');
    expect(ids('Leche de avena', 8)).not.toContain('cow_milk');
    expect(ids('Leche materna', 8)).not.toContain('cow_milk');
  });

  it('always flags processed meat and escolar regardless of age', () => {
    expect(ids('Salchicha', 8)).toContain('processed_meat');
    expect(ids('Salchicha', 240)).toContain('processed_meat');
    expect(ids('Pez escolar', 240)).toContain('escolar');
  });

  it('when age is unknown, shows only "always avoid" rules', () => {
    // honey is age-gated -> hidden when age unknown
    expect(ids('Miel', null)).not.toContain('honey');
    // processed meat is always-avoid -> shown
    expect(ids('Chorizo', null)).toContain('processed_meat');
  });

  it('returns nothing for a safe food and for empty input', () => {
    expect(foodSafetyWarnings('Aguacate', 7)).toHaveLength(0);
    expect(foodSafetyWarnings('', 7)).toHaveLength(0);
  });

  it('orders avoid warnings before caution warnings', () => {
    // "uva" (caution) + "sal" (avoid) in one string
    const severities = foodSafetyWarnings('Uva con sal', 8).map((w) => w.severity);
    expect(severities[0]).toBe('avoid');
  });
});
