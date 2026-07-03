import { describe, expect, it } from 'vitest';
import {
  aggregateFoods,
  allergenIntroductionStatuses,
  allergenProgress,
  buildDashboardSummary,
  DEFAULT_FOOD_FILTERS,
  filterFoods,
  foodNameKey,
  inferAllergenKeys,
  slugKey,
  weekTargetKeys,
} from './data';
import type { FoodStatus, MealItem } from './types';

function meal(partial: Partial<MealItem>): MealItem {
  const name = partial.name ?? 'Plátano';
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    day: '2026-07-01',
    slot: 'breakfast',
    name,
    name_key: partial.name_key ?? foodNameKey(name),
    category_id: 'cat-fruit',
    texture: null,
    is_new: false,
    liking: null,
    reaction: null,
    notes: null,
    planned_item_id: null,
    sort_order: 0,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: null,
    ...partial,
  };
}

function status(partial: Partial<FoodStatus>): FoodStatus {
  return {
    name_key: 'aguacate',
    display_name: 'Aguacate',
    liking: null,
    reaction: null,
    notes: '',
    category_id: null,
    is_allergen: false,
    allergen_keys: [],
    favorite: false,
    first_tried_day: null,
    last_offered_day: null,
    offer_count: null,
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
      status({ name_key: 'aguacate', display_name: 'Aguacate', liking: 'liked', notes: 'rico' }),
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
    expect(aguacate.status?.liking).toBe('liked');
  });

  it('ignora nombres vacíos', () => {
    expect(aggregateFoods([meal({ name: '   ' })], [])).toHaveLength(0);
  });

  it('gusto y reacción son independientes: se pueden marcar ambos a la vez', () => {
    const statuses: FoodStatus[] = [
      status({ name_key: 'huevo', display_name: 'Huevo', liking: 'liked', reaction: 'reaction' }),
    ];
    const out = aggregateFoods([meal({ name: 'Huevo', name_key: 'huevo' })], statuses);
    const huevo = out.find((f) => f.nameKey === 'huevo')!;
    expect(huevo.liking).toBe('liked');
    expect(huevo.reaction).toBe('reaction');
  });
});

describe('filterFoods', () => {
  it('filtra por búsqueda, categoría, reacción, nuevo y alérgeno', () => {
    const foods = aggregateFoods(
      [
        meal({ name: 'Huevo', name_key: 'huevo', day: '2026-07-01', is_new: true, reaction: 'ok' }),
        meal({ name: 'Aguacate', name_key: 'aguacate', day: '2026-07-04', category_id: 'cat-fruit' }),
      ],
      [status({ name_key: 'huevo', display_name: 'Huevo', is_allergen: true, allergen_keys: ['egg'], reaction: 'ok' })],
    );

    const out = filterFoods(foods, {
      ...DEFAULT_FOOD_FILTERS,
      query: 'hue',
      reaction: 'ok',
      onlyNew: true,
      onlyAllergens: true,
    });

    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Huevo');
  });

  it('ordena por fecha más reciente y por recuento', () => {
    const foods = aggregateFoods(
      [
        meal({ name: 'Plátano', name_key: 'plátano', day: '2026-07-01' }),
        meal({ name: 'Plátano', name_key: 'plátano', day: '2026-07-05' }),
        meal({ name: 'Aguacate', name_key: 'aguacate', day: '2026-07-04' }),
      ],
      [],
    );

    expect(filterFoods(foods, { ...DEFAULT_FOOD_FILTERS, sort: 'last' })[0].name).toBe('Plátano');
    expect(filterFoods(foods, { ...DEFAULT_FOOD_FILTERS, sort: 'count' })[0].count).toBe(2);
  });
});

describe('allergenProgress / buildDashboardSummary', () => {
  it('calcula progreso de alérgenos introducidos', () => {
    const foods = aggregateFoods(
      [
        meal({ name: 'Huevo', name_key: 'huevo' }),
        meal({ name: 'Sésamo', name_key: 'sésamo' }),
      ],
      [],
    );
    expect(allergenProgress(foods)).toEqual({ introduced: 2, total: 9 });
  });

  it('infiere legumbres y devuelve estado por alérgeno', () => {
    expect(inferAllergenKeys('Hummus de garbanzo')).toContain('soy');
    const foods = aggregateFoods([meal({ name: 'Hummus de garbanzo', name_key: 'hummus de garbanzo' })], []);
    const statuses = allergenIntroductionStatuses(foods);
    const legumes = statuses.find((row) => row.key === 'soy')!;
    expect(legumes.introduced).toBe(true);
    expect(legumes.foods).toEqual(['Hummus de garbanzo']);
  });

  it('resume el día y destaca reacciones, nuevos y planes pendientes', () => {
    const todayMeals = [
      meal({ name: 'Huevo', name_key: 'huevo', day: '2026-07-08', is_new: true, reaction: 'reaction' }),
      meal({ name: 'Pera', name_key: 'pera', day: '2026-07-08' }),
    ];
    const foods = aggregateFoods(todayMeals, []);
    const summary = buildDashboardSummary({
      todayMeals,
      dayNote: { day: '2026-07-08', note: 'Un poco de rojez' },
      foods,
      plannedToday: [
        {
          id: 'p1',
          day: '2026-07-08',
          slot: 'lunch',
          name: 'Pera',
          name_key: 'pera',
          category_id: null,
          texture: null,
          is_new: false,
          notes: '',
          completed_meal_item_id: null,
          created_by: 'u1',
          created_at: '2026-07-08T00:00:00Z',
          updated_at: '2026-07-08T00:00:00Z',
        },
      ],
      todayKey: '2026-07-08',
    });

    expect(summary.totalFoodsToday).toBe(2);
    expect(summary.newFoodsToday).toBe(1);
    expect(summary.reactionCountToday).toBe(1);
    expect(summary.hasDayNote).toBe(true);
    expect(summary.plannedToday).toHaveLength(1);
  });
});
