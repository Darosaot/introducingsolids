import { describe, expect, it } from 'vitest';
import {
  buildFoodOptions,
  exactFoodOption,
  FOOD_CATALOG,
  hasTriedFood,
  normalizeSearch,
  searchFoodOptions,
  type CatalogCategoryKey,
} from './catalog';
import { foodNameKey } from './data';
import type { Category, FoodTried } from './types';

const DEFAULT_KEYS: CatalogCategoryKey[] = [
  'protein',
  'legumes',
  'vegetables',
  'fruit',
  'dairy',
  'grains',
  'other',
];

function category(key: string, id: string): Category {
  return {
    id,
    user_id: null,
    key,
    name: key,
    color: '#000000',
    sort_order: 0,
    created_at: '2026-07-01T00:00:00Z',
  };
}

function tried(partial: Partial<FoodTried> & { name: string }): FoodTried {
  return {
    nameKey: foodNameKey(partial.name),
    categoryId: null,
    count: 1,
    firstDay: '2026-07-01',
    lastDay: '2026-07-01',
    isNew: false,
    textures: [],
    liking: null,
    reaction: null,
    notes: '',
    isAllergen: false,
    allergenKeys: [],
    favorite: false,
    status: null,
    ...partial,
  };
}

describe('FOOD_CATALOG', () => {
  it('es amplio y usa solo categorías conocidas de la app', () => {
    expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(100);
    for (const item of FOOD_CATALOG) {
      expect(DEFAULT_KEYS).toContain(item.categoryKey);
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('cubre las clasificaciones principales (frutas, verduras, cereales, proteína, legumbres, lácteos)', () => {
    const byCategory = new Map<string, number>();
    for (const item of FOOD_CATALOG) {
      byCategory.set(item.categoryKey, (byCategory.get(item.categoryKey) ?? 0) + 1);
    }
    for (const key of ['fruit', 'vegetables', 'grains', 'protein', 'legumes', 'dairy']) {
      expect(byCategory.get(key) ?? 0).toBeGreaterThanOrEqual(8);
    }
  });

  it('no tiene alimentos duplicados (por nombre normalizado)', () => {
    const keys = FOOD_CATALOG.map((item) => foodNameKey(item.name));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildFoodOptions', () => {
  const categories = [category('fruit', 'cat-fruit'), category('protein', 'cat-protein')];

  it('el historial tiene prioridad sobre el catálogo y conserva su categoría', () => {
    const options = buildFoodOptions(
      [tried({ name: 'Plátano', categoryId: 'cat-otra', count: 4, favorite: true })],
      categories,
    );
    const platano = options.filter((option) => option.nameKey === 'plátano');
    expect(platano).toHaveLength(1);
    expect(platano[0].tried).toBe(true);
    expect(platano[0].source).toBe('history');
    expect(platano[0].categoryId).toBe('cat-otra');
    expect(platano[0].count).toBe(4);
  });

  it('mapea la categoría del catálogo a la categoría real de la familia', () => {
    const options = buildFoodOptions([], categories);
    const manzana = options.find((option) => option.nameKey === 'manzana')!;
    expect(manzana.tried).toBe(false);
    expect(manzana.source).toBe('catalog');
    expect(manzana.categoryId).toBe('cat-fruit');

    const lentejas = options.find((option) => option.nameKey === 'lentejas')!;
    expect(lentejas.categoryId).toBeNull(); // la familia no tiene categoría "legumes"
  });
});

describe('searchFoodOptions', () => {
  const categories = [category('fruit', 'cat-fruit')];
  const options = buildFoodOptions([tried({ name: 'Plátano', count: 3 })], categories);

  it('ignora acentos y mayúsculas', () => {
    expect(normalizeSearch('  PLÁTANO ')).toBe('platano');
    const results = searchFoodOptions(options, 'platano');
    expect(results[0]?.name).toBe('Plátano');
  });

  it('pone lo ya probado por delante del catálogo a igual coincidencia', () => {
    const withMango = buildFoodOptions([tried({ name: 'Mango', count: 3 })], categories);
    const names = searchFoodOptions(withMango, 'man').map((option) => option.name);
    expect(names[0]).toBe('Mango'); // probado primero
    expect(names).toContain('Manzana');
    expect(names).toContain('Mandarina');
  });

  it('prioriza el prefijo sobre la coincidencia interna', () => {
    const names = searchFoodOptions(options, 'pi').map((option) => option.name);
    expect(names.indexOf('Piña')).toBeGreaterThanOrEqual(0);
    expect(names.indexOf('Apio')).toBeGreaterThan(names.indexOf('Piña')); // "pi" interno va después
  });

  it('respeta el límite de resultados', () => {
    expect(searchFoodOptions(options, '', 5)).toHaveLength(5);
  });

  it('sin texto pone primero el historial', () => {
    const results = searchFoodOptions(options, '');
    expect(results[0]?.tried).toBe(true);
  });
});

describe('exactFoodOption / hasTriedFood', () => {
  const categories = [category('fruit', 'cat-fruit')];
  const foods = [tried({ name: 'Plátano' })];
  const options = buildFoodOptions(foods, categories);

  it('encuentra la opción exacta por nombre normalizado', () => {
    expect(exactFoodOption(options, '  plátano ')?.nameKey).toBe('plátano');
    expect(exactFoodOption(options, 'plá')).toBeNull();
    expect(exactFoodOption(options, '')).toBeNull();
  });

  it('detecta si un alimento ya se ha probado (sin importar mayúsculas/espacios)', () => {
    expect(hasTriedFood(foods, 'PLÁTANO ')).toBe(true);
    expect(hasTriedFood(foods, 'Manzana')).toBe(false);
    expect(hasTriedFood(foods, '   ')).toBe(false);
  });
});
