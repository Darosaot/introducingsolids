import { describe, expect, it } from 'vitest';
import { foodRole, plateStatusForMeals } from './nutrition';

describe('foodRole', () => {
  it('classifies iron sources by keyword', () => {
    expect(foodRole('Lentejas estofadas').iron).toBe(true);
    expect(foodRole('Pollo desmechado').iron).toBe(true);
    expect(foodRole('Huevo cocido').iron).toBe(true);
  });

  it('classifies energy sources, including avocado and banana', () => {
    expect(foodRole('Pasta').energy).toBe(true);
    expect(foodRole('Aguacate').energy).toBe(true);
    expect(foodRole('Plátano maduro').energy).toBe(true);
    // avocado/banana are energy, not counted as fruit/veg
    expect(foodRole('Aguacate').fruitVeg).toBe(false);
  });

  it('classifies fruit/veg by keyword', () => {
    expect(foodRole('Brócoli al vapor').fruitVeg).toBe(true);
    expect(foodRole('Pera').fruitVeg).toBe(true);
  });

  it('marks spinach as both iron and vegetable', () => {
    const role = foodRole('Espinacas');
    expect(role.iron).toBe(true);
    expect(role.fruitVeg).toBe(true);
  });

  it('falls back to the food category when the name is unknown', () => {
    expect(foodRole('Merluza', 'protein').iron).toBe(true);
    expect(foodRole('Cosa rara', 'grains').energy).toBe(true);
    expect(foodRole('Cosa rara', 'fruit').fruitVeg).toBe(true);
  });

  it('does not count energy-category tuber as fruit/veg even if categorized as vegetable', () => {
    // boniato matches ENERGY keyword; a vegetable category shouldn't override that
    expect(foodRole('Boniato', 'vegetables').energy).toBe(true);
    expect(foodRole('Boniato', 'vegetables').fruitVeg).toBe(false);
  });

  it('returns all false for an unknown, uncategorized food', () => {
    expect(foodRole('Gelatina')).toEqual({ iron: false, energy: false, fruitVeg: false });
  });
});

describe('plateStatusForMeals', () => {
  const keys = new Map<string, string>([
    ['cat-protein', 'protein'],
    ['cat-fruit', 'fruit'],
  ]);

  it('combines roles across the day (complete BLISS plate)', () => {
    const status = plateStatusForMeals(
      [
        { name: 'Lentejas', category_id: null },
        { name: 'Pan integral', category_id: null },
        { name: 'Pera', category_id: null },
      ],
      keys,
    );
    expect(status).toEqual({ iron: true, energy: true, fruitVeg: true });
  });

  it('flags a day with no iron source', () => {
    const status = plateStatusForMeals(
      [
        { name: 'Pan', category_id: null },
        { name: 'Manzana', category_id: null },
      ],
      keys,
    );
    expect(status.iron).toBe(false);
    expect(status.energy).toBe(true);
    expect(status.fruitVeg).toBe(true);
  });

  it('uses the category map for uncategorized-by-name foods', () => {
    const status = plateStatusForMeals([{ name: 'Merluza', category_id: 'cat-protein' }], keys);
    expect(status.iron).toBe(true);
  });

  it('returns all false for an empty day', () => {
    expect(plateStatusForMeals([], keys)).toEqual({ iron: false, energy: false, fruitVeg: false });
  });
});
