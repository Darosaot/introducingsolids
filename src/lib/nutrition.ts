// Rol nutricional de cada alimento según la estructura del plato BLISS (guía §3–4):
// cada comida debería incluir 1 alimento con hierro + 1 con energía + fruta/verdura.
//
// Reutiliza la coincidencia por palabra completa de `safety.ts` (`matchesKeyword`)
// y encaja con las categorías por defecto del proyecto (protein, legumes,
// vegetables, fruit, dairy, grains, other).

import { matchesKeyword, normalizeForMatch } from './safety';

export interface PlateStatus {
  iron: boolean;
  energy: boolean;
  fruitVeg: boolean;
}

/** Alimentos ricos en hierro (tabla §3 de la guía). */
export const IRON_RICH_KEYWORDS: string[] = [
  'almeja', 'chirla', 'berberecho', 'mejillon', 'anchoa',
  'quinoa', 'mijo', 'avena', 'salvado', 'sesamo', 'tahini',
  'soja', 'tofu', 'lenteja', 'garbanzo', 'alubia', 'haba', 'hummus', 'falafel',
  'pistacho', 'cacahuete', 'nuez', 'nueces', 'almendra', 'frutos secos',
  'carne', 'ternera', 'res', 'buey', 'cerdo', 'pollo', 'pavo', 'higado',
  'huevo', 'yema', 'espinaca', 'espinacas',
];

/** Alimentos que aportan energía (§4): cereales, tubérculos, aguacate, plátano. */
export const ENERGY_KEYWORDS: string[] = [
  'pasta', 'arroz', 'pan', 'cous cous', 'cuscus', 'polenta', 'maiz',
  'patata', 'boniato', 'batata', 'calabaza', 'aguacate', 'platano',
];

/** Frutas/verduras comunes (además de la categoría fruit/vegetables). */
export const FRUIT_VEG_KEYWORDS: string[] = [
  'manzana', 'pera', 'melocoton', 'nectarina', 'ciruela', 'fresa', 'arandano',
  'melon', 'sandia', 'naranja', 'mandarina', 'kiwi', 'mango', 'cereza', 'uva',
  'brocoli', 'coliflor', 'zanahoria', 'calabacin', 'tomate', 'pepino',
  'pimiento', 'berenjena', 'judia verde', 'guisante', 'acelga', 'puerro',
  'espinaca',
];

const IRON_CATEGORY_KEYS = new Set(['protein', 'legumes']);
const ENERGY_CATEGORY_KEYS = new Set(['grains']);
const FRUIT_VEG_CATEGORY_KEYS = new Set(['fruit', 'vegetables']);

function matchesAny(normalizedName: string, keywords: string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(normalizedName, keyword));
}

/**
 * Clasifica un alimento en los tres componentes del plato BLISS. Un alimento
 * puede cubrir varios (p. ej. las espinacas aportan hierro y son verdura).
 * `aguacate`/`plátano` y los tubérculos cuentan como energía, no como fruta/verdura.
 */
export function foodRole(name: string, categoryKey?: string | null): PlateStatus {
  const normalized = normalizeForMatch(name);
  const iron = matchesAny(normalized, IRON_RICH_KEYWORDS) || (!!categoryKey && IRON_CATEGORY_KEYS.has(categoryKey));
  const energy = matchesAny(normalized, ENERGY_KEYWORDS) || (!!categoryKey && ENERGY_CATEGORY_KEYS.has(categoryKey));
  const fruitVeg =
    matchesAny(normalized, FRUIT_VEG_KEYWORDS) ||
    (!!categoryKey && FRUIT_VEG_CATEGORY_KEYS.has(categoryKey) && !energy);
  return { iron, energy, fruitVeg };
}

interface RoleMeal {
  name: string;
  category_id: string | null;
}

/** Combina (OR) los roles de todas las comidas de un día. */
export function plateStatusForMeals(
  meals: RoleMeal[],
  categoryKeyById: Map<string, string>,
): PlateStatus {
  const status: PlateStatus = { iron: false, energy: false, fruitVeg: false };
  for (const meal of meals) {
    const categoryKey = meal.category_id ? categoryKeyById.get(meal.category_id) : null;
    const role = foodRole(meal.name, categoryKey);
    status.iron = status.iron || role.iron;
    status.energy = status.energy || role.energy;
    status.fruitVeg = status.fruitVeg || role.fruitVeg;
  }
  return status;
}
