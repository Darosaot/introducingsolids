import { foodNameKey } from './data';
import type { Category, FoodTried } from './types';

/** Claves de las categorías por defecto de la app (ver 0001_init.sql). */
export type CatalogCategoryKey =
  | 'protein'
  | 'legumes'
  | 'vegetables'
  | 'fruit'
  | 'dairy'
  | 'grains'
  | 'other';

export interface CatalogFood {
  name: string;
  categoryKey: CatalogCategoryKey;
}

/**
 * Catálogo base de alimentos, organizado según las categorías de la app.
 * Reduce la entrada manual: al registrar una comida se puede buscar y elegir
 * de aquí. Los alimentos escritos a mano siguen siendo válidos y quedan
 * guardados en el historial de la familia para reutilizarlos.
 */
export const FOOD_CATALOG: CatalogFood[] = [
  // --- Fruta ---------------------------------------------------------------
  { name: 'Plátano', categoryKey: 'fruit' },
  { name: 'Manzana', categoryKey: 'fruit' },
  { name: 'Pera', categoryKey: 'fruit' },
  { name: 'Naranja', categoryKey: 'fruit' },
  { name: 'Mandarina', categoryKey: 'fruit' },
  { name: 'Fresa', categoryKey: 'fruit' },
  { name: 'Arándanos', categoryKey: 'fruit' },
  { name: 'Frambuesa', categoryKey: 'fruit' },
  { name: 'Mora', categoryKey: 'fruit' },
  { name: 'Sandía', categoryKey: 'fruit' },
  { name: 'Melón', categoryKey: 'fruit' },
  { name: 'Melocotón', categoryKey: 'fruit' },
  { name: 'Nectarina', categoryKey: 'fruit' },
  { name: 'Albaricoque', categoryKey: 'fruit' },
  { name: 'Ciruela', categoryKey: 'fruit' },
  { name: 'Cereza', categoryKey: 'fruit' },
  { name: 'Uva', categoryKey: 'fruit' },
  { name: 'Kiwi', categoryKey: 'fruit' },
  { name: 'Mango', categoryKey: 'fruit' },
  { name: 'Papaya', categoryKey: 'fruit' },
  { name: 'Piña', categoryKey: 'fruit' },
  { name: 'Aguacate', categoryKey: 'fruit' },
  { name: 'Granada', categoryKey: 'fruit' },
  { name: 'Higo', categoryKey: 'fruit' },
  { name: 'Caqui', categoryKey: 'fruit' },
  { name: 'Chirimoya', categoryKey: 'fruit' },
  { name: 'Níspero', categoryKey: 'fruit' },
  { name: 'Coco', categoryKey: 'fruit' },

  // --- Verduras ------------------------------------------------------------
  { name: 'Zanahoria', categoryKey: 'vegetables' },
  { name: 'Calabaza', categoryKey: 'vegetables' },
  { name: 'Calabacín', categoryKey: 'vegetables' },
  { name: 'Brócoli', categoryKey: 'vegetables' },
  { name: 'Coliflor', categoryKey: 'vegetables' },
  { name: 'Judía verde', categoryKey: 'vegetables' },
  { name: 'Espinacas', categoryKey: 'vegetables' },
  { name: 'Acelga', categoryKey: 'vegetables' },
  { name: 'Patata', categoryKey: 'vegetables' },
  { name: 'Boniato', categoryKey: 'vegetables' },
  { name: 'Tomate', categoryKey: 'vegetables' },
  { name: 'Pimiento rojo', categoryKey: 'vegetables' },
  { name: 'Pimiento verde', categoryKey: 'vegetables' },
  { name: 'Pepino', categoryKey: 'vegetables' },
  { name: 'Berenjena', categoryKey: 'vegetables' },
  { name: 'Champiñón', categoryKey: 'vegetables' },
  { name: 'Cebolla', categoryKey: 'vegetables' },
  { name: 'Puerro', categoryKey: 'vegetables' },
  { name: 'Apio', categoryKey: 'vegetables' },
  { name: 'Remolacha', categoryKey: 'vegetables' },
  { name: 'Alcachofa', categoryKey: 'vegetables' },
  { name: 'Espárrago', categoryKey: 'vegetables' },
  { name: 'Lechuga', categoryKey: 'vegetables' },
  { name: 'Col', categoryKey: 'vegetables' },
  { name: 'Coles de Bruselas', categoryKey: 'vegetables' },
  { name: 'Maíz dulce', categoryKey: 'vegetables' },
  { name: 'Nabo', categoryKey: 'vegetables' },
  { name: 'Hinojo', categoryKey: 'vegetables' },
  { name: 'Seta', categoryKey: 'vegetables' },

  // --- Cereales ------------------------------------------------------------
  { name: 'Arroz', categoryKey: 'grains' },
  { name: 'Arroz integral', categoryKey: 'grains' },
  { name: 'Avena', categoryKey: 'grains' },
  { name: 'Pan', categoryKey: 'grains' },
  { name: 'Pan integral', categoryKey: 'grains' },
  { name: 'Pasta', categoryKey: 'grains' },
  { name: 'Cuscús', categoryKey: 'grains' },
  { name: 'Quinoa', categoryKey: 'grains' },
  { name: 'Mijo', categoryKey: 'grains' },
  { name: 'Polenta', categoryKey: 'grains' },
  { name: 'Trigo sarraceno', categoryKey: 'grains' },
  { name: 'Cebada', categoryKey: 'grains' },
  { name: 'Bulgur', categoryKey: 'grains' },
  { name: 'Sémola de trigo', categoryKey: 'grains' },
  { name: 'Tortita de arroz', categoryKey: 'grains' },
  { name: 'Cereales sin azúcar', categoryKey: 'grains' },

  // --- Proteína (carnes, huevo, pescados y marisco) -------------------------
  { name: 'Pollo', categoryKey: 'protein' },
  { name: 'Pavo', categoryKey: 'protein' },
  { name: 'Ternera', categoryKey: 'protein' },
  { name: 'Cerdo (lomo)', categoryKey: 'protein' },
  { name: 'Conejo', categoryKey: 'protein' },
  { name: 'Cordero', categoryKey: 'protein' },
  { name: 'Huevo', categoryKey: 'protein' },
  { name: 'Tortilla francesa', categoryKey: 'protein' },
  { name: 'Merluza', categoryKey: 'protein' },
  { name: 'Lubina', categoryKey: 'protein' },
  { name: 'Dorada', categoryKey: 'protein' },
  { name: 'Lenguado', categoryKey: 'protein' },
  { name: 'Gallo', categoryKey: 'protein' },
  { name: 'Salmón', categoryKey: 'protein' },
  { name: 'Bacalao', categoryKey: 'protein' },
  { name: 'Rape', categoryKey: 'protein' },
  { name: 'Sardina', categoryKey: 'protein' },
  { name: 'Boquerón', categoryKey: 'protein' },
  { name: 'Trucha', categoryKey: 'protein' },
  { name: 'Caballa', categoryKey: 'protein' },
  { name: 'Gamba', categoryKey: 'protein' },
  { name: 'Langostino', categoryKey: 'protein' },
  { name: 'Mejillón', categoryKey: 'protein' },
  { name: 'Almeja', categoryKey: 'protein' },
  { name: 'Calamar', categoryKey: 'protein' },
  { name: 'Sepia', categoryKey: 'protein' },
  { name: 'Pulpo', categoryKey: 'protein' },

  // --- Legumbres -----------------------------------------------------------
  { name: 'Lentejas', categoryKey: 'legumes' },
  { name: 'Garbanzos', categoryKey: 'legumes' },
  { name: 'Alubias blancas', categoryKey: 'legumes' },
  { name: 'Alubias rojas', categoryKey: 'legumes' },
  { name: 'Judías pintas', categoryKey: 'legumes' },
  { name: 'Guisantes', categoryKey: 'legumes' },
  { name: 'Habas', categoryKey: 'legumes' },
  { name: 'Soja', categoryKey: 'legumes' },
  { name: 'Tofu', categoryKey: 'legumes' },
  { name: 'Edamame', categoryKey: 'legumes' },
  { name: 'Hummus', categoryKey: 'legumes' },

  // --- Lácteos -------------------------------------------------------------
  { name: 'Yogur natural', categoryKey: 'dairy' },
  { name: 'Yogur griego natural', categoryKey: 'dairy' },
  { name: 'Queso fresco', categoryKey: 'dairy' },
  { name: 'Queso semicurado', categoryKey: 'dairy' },
  { name: 'Requesón', categoryKey: 'dairy' },
  { name: 'Kéfir', categoryKey: 'dairy' },
  { name: 'Cuajada', categoryKey: 'dairy' },
  { name: 'Mozzarella', categoryKey: 'dairy' },
  { name: 'Ricotta', categoryKey: 'dairy' },
  { name: 'Queso crema', categoryKey: 'dairy' },
  { name: 'Mantequilla', categoryKey: 'dairy' },
  { name: 'Leche entera', categoryKey: 'dairy' },

  // --- Otros (aceites, frutos secos molidos, semillas, especias) ------------
  { name: 'Aceite de oliva', categoryKey: 'other' },
  { name: 'Almendra molida', categoryKey: 'other' },
  { name: 'Nuez molida', categoryKey: 'other' },
  { name: 'Avellana molida', categoryKey: 'other' },
  { name: 'Anacardo molido', categoryKey: 'other' },
  { name: 'Pistacho molido', categoryKey: 'other' },
  { name: 'Crema de cacahuete', categoryKey: 'other' },
  { name: 'Tahini', categoryKey: 'other' },
  { name: 'Sésamo molido', categoryKey: 'other' },
  { name: 'Semillas de chía', categoryKey: 'other' },
  { name: 'Semillas de lino molidas', categoryKey: 'other' },
  { name: 'Canela', categoryKey: 'other' },
  { name: 'Ajo', categoryKey: 'other' },
  { name: 'Perejil', categoryKey: 'other' },
  { name: 'Levadura nutricional', categoryKey: 'other' },
];

/** Opción unificada del selector: historial de la familia o catálogo base. */
export interface FoodOption {
  name: string;
  nameKey: string;
  categoryId: string | null;
  tried: boolean;
  count: number;
  favorite: boolean;
  lastDay: string | null;
  source: 'history' | 'catalog';
}

/** Texto normalizado para buscar: minúsculas, sin acentos ni espacios extra. */
export function normalizeSearch(text: string): string {
  return foodNameKey(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Une el historial de la familia con el catálogo base. Si un alimento del
 * catálogo ya se ha probado, gana la fila del historial (conserva su
 * categoría, recuento y favorito).
 */
export function buildFoodOptions(foods: FoodTried[], categories: Category[]): FoodOption[] {
  const categoryIdByKey = new Map(categories.map((category) => [category.key, category.id]));
  const byKey = new Map<string, FoodOption>();

  for (const food of foods) {
    if (!food.nameKey || !food.name.trim()) continue;
    byKey.set(food.nameKey, {
      name: food.name.trim(),
      nameKey: food.nameKey,
      categoryId: food.categoryId,
      tried: true,
      count: food.count,
      favorite: food.favorite,
      lastDay: food.lastDay,
      source: 'history',
    });
  }

  for (const item of FOOD_CATALOG) {
    const key = foodNameKey(item.name);
    if (byKey.has(key)) continue;
    byKey.set(key, {
      name: item.name,
      nameKey: key,
      categoryId: categoryIdByKey.get(item.categoryKey) ?? null,
      tried: false,
      count: 0,
      favorite: false,
      lastDay: null,
      source: 'catalog',
    });
  }

  return Array.from(byKey.values());
}

/** Opción cuyo nombre normalizado coincide exactamente con el texto. */
export function exactFoodOption(options: FoodOption[], name: string): FoodOption | null {
  const key = foodNameKey(name);
  if (!key) return null;
  return options.find((option) => option.nameKey === key) ?? null;
}

/** ¿El alimento (por nombre normalizado) ya se ha registrado alguna vez? */
export function hasTriedFood(foods: FoodTried[], name: string): boolean {
  const key = foodNameKey(name);
  return key !== '' && foods.some((food) => food.nameKey === key);
}

/**
 * Busca en historial + catálogo ignorando acentos. Prioriza coincidencia
 * exacta, luego prefijo, luego contenido; a igual coincidencia van antes los
 * ya probados (favoritos y ofrecidos más recientemente primero).
 */
export function searchFoodOptions(options: FoodOption[], query: string, limit = 12): FoodOption[] {
  const q = normalizeSearch(query);
  const rankOf = (option: FoodOption): number => {
    if (!q) return 0;
    const name = normalizeSearch(option.name);
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    return 3;
  };

  return options
    .map((option) => ({ option, rank: rankOf(option) }))
    .filter((row) => row.rank < 3)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.option.tried !== b.option.tried) return a.option.tried ? -1 : 1;
      if (a.option.favorite !== b.option.favorite) return a.option.favorite ? -1 : 1;
      if (a.option.tried && b.option.tried && a.option.lastDay !== b.option.lastDay) {
        return (b.option.lastDay ?? '').localeCompare(a.option.lastDay ?? '');
      }
      return a.option.name.localeCompare(b.option.name, 'es');
    })
    .slice(0, limit)
    .map((row) => row.option);
}
