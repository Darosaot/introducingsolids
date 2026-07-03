import { describe, expect, it } from 'vitest';
import { aggregateFoods, foodNameKey, slugKey, weekTargetKeys } from './data';
import type { FoodStatus, MealItem } from './types';

function meal(partial: Partial<MealItem>): MealItem {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    day: '2026-07-01',
    slot: 'breakfast',
    name: 'Plátano',
    category_id: 'cat-fruit',
    texture: null,
    is_new: false,
    sort_order: 0,
    created_at: '2026-07-01T00:00:00Z',
    ...partial,
  };
}

describe('weekTargetKeys', () => {
  it('devuelve 7 pares con el mismo desplazamiento', () => {
    const pairs = weekTargetKeys('2026-07-06', '2026-07-13');
    expect(pairs).toHaveLength(7);
    expect(pairs[0]).toEqual(['2026-07-06', '2026-07-13']);
    expect(pairs[6]).toEqual(['2026-07-12', '2026-07-19']);
  });
});

describe('foodNameKey / slugKey', () => {
  it('normaliza el nombre a una clave estable', () => {
    expect(foodNameKey('  Plátano ')).toBe('plátano');
    expect(foodNameKey('AGUACATE')).toBe('aguacate');
  });
  it('slugKey quita acentos y añade sufijo', () => {
    const k = slugKey('Puré de Plátano');
    expect(k.startsWith('pure_de_platano')).toBe(true);
    expect(k).toMatch(/_[a-z0-9]{4}$/);
  });
});

describe('aggregateFoods', () => {
  it('agrupa por nombre normalizado y agrega recuento y fechas', () => {
    const meals: MealItem[] = [
      meal({ name: 'Plátano', day: '2026-07-01' }),
      meal({ name: 'plátano', day: '2026-07-05', is_new: true }),
      meal({ name: 'Aguacate', day: '2026-07-02', category_id: 'cat-fruit' }),
    ];
    const statuses: FoodStatus[] = [
      { name_key: 'aguacate', display_name: 'Aguacate', reaction: 'liked', notes: 'rico' },
    ];
    const out = aggregateFoods(meals, statuses);
    // Ordenado alfabéticamente: Aguacate, Plátano
    expect(out.map((f) => f.name)).toEqual(['Aguacate', 'Plátano']);

    const platano = out.find((f) => f.nameKey === 'plátano')!;
    expect(platano.count).toBe(2);
    expect(platano.firstDay).toBe('2026-07-01');
    expect(platano.lastDay).toBe('2026-07-05');
    expect(platano.isNew).toBe(true); // alguna aparición marcada como nueva

    const aguacate = out.find((f) => f.nameKey === 'aguacate')!;
    expect(aguacate.status?.reaction).toBe('liked');
  });

  it('ignora nombres vacíos', () => {
    expect(aggregateFoods([meal({ name: '   ' })], [])).toHaveLength(0);
  });
});
