import { supabase } from './supabase';
import { addDays, dayKey, fromKey as dateFromKey } from './date';
import type {
  AllergenKey,
  BabyProfile,
  Category,
  DashboardSummary,
  DayNote,
  FoodDetail,
  FoodFilters,
  FoodStatus,
  FoodTried,
  Liking,
  MealItem,
  MealSlot,
  PlannedMeal,
  ReactionStatus,
  Texture,
  Theme,
} from './types';

export const ALLERGENS: Array<{ key: AllergenKey; label: string; keywords: string[] }> = [
  { key: 'egg', label: 'Huevo', keywords: ['huevo', 'tortilla'] },
  { key: 'peanut', label: 'Cacahuete', keywords: ['cacahuete', 'mani', 'maní'] },
  {
    key: 'tree_nuts',
    label: 'Frutos secos',
    keywords: ['almendra', 'nuez', 'avellana', 'pistacho', 'anacardo'],
  },
  { key: 'dairy', label: 'Lácteos', keywords: ['leche', 'yogur', 'queso', 'lácteo', 'lacteo'] },
  { key: 'gluten', label: 'Trigo / gluten', keywords: ['trigo', 'pan', 'pasta', 'gluten'] },
  { key: 'fish', label: 'Pescado', keywords: ['pescado', 'salmón', 'salmon', 'merluza'] },
  { key: 'shellfish', label: 'Marisco', keywords: ['marisco', 'gamba', 'langostino'] },
  { key: 'soy', label: 'Soja', keywords: ['soja', 'tofu'] },
  { key: 'sesame', label: 'Sésamo', keywords: ['sésamo', 'sesamo', 'tahini'] },
];

export const DEFAULT_FOOD_FILTERS: FoodFilters = {
  query: '',
  categoryId: '',
  liking: '',
  reaction: '',
  onlyNew: false,
  onlyAllergens: false,
  sort: 'name',
};

export type CopyMode = 'append' | 'replace';

export interface CopyPreview {
  sourceFrom: string;
  sourceTo: string;
  destinationFrom: string;
  destinationTo: string;
  sourceCount: number;
  destinationCount: number;
  hasConflicts: boolean;
}

interface FoodSummaryRow {
  name_key: string;
  display_name: string;
  category_id: string | null;
  offer_count: number | string;
  first_tried_day: string;
  last_offered_day: string;
  is_new: boolean;
  textures: unknown;
  liking: unknown;
  reaction: unknown;
  notes: string | null;
  is_allergen: boolean;
  allergen_keys: unknown;
  favorite: boolean;
  has_status: boolean;
}

// --- Perfil / tema ----------------------------------------------------------

export async function updateTheme(userId: string, theme: Theme): Promise<void> {
  const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId);
  if (error) throw error;
}

export async function fetchBabyProfile(): Promise<BabyProfile | null> {
  const { data, error } = await supabase
    .from('baby_profile')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as BabyProfile) ?? null;
}

// --- Categorías -------------------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'color'>>,
): Promise<void> {
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw error;
}

/** Convierte un nombre en una clave estable y única para categorías nuevas. */
export function slugKey(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'cat'}_${suffix}`;
}

export async function addCategory(input: {
  userId: string;
  name: string;
  color: string;
}): Promise<Category> {
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: input.userId,
      key: slugKey(input.name),
      name: input.name,
      color: input.color,
      sort_order,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// --- Comidas ----------------------------------------------------------------

export function foodNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function fetchMealsInRange(fromKey: string, toKey: string): Promise<MealItem[]> {
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .gte('day', fromKey)
    .lte('day', toKey)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(withMealDefaults);
}

export async function fetchAllMeals(): Promise<MealItem[]> {
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .order('day', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(withMealDefaults);
}

export async function addMeal(input: {
  userId: string;
  day: string;
  slot: MealSlot;
  name: string;
  categoryId: string | null;
  texture?: Texture | null;
  isNew?: boolean;
  liking?: Liking | null;
  reaction?: ReactionStatus | null;
  notes?: string | null;
  plannedItemId?: string | null;
}): Promise<MealItem> {
  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      user_id: input.userId,
      day: input.day,
      slot: input.slot,
      name: input.name,
      name_key: foodNameKey(input.name),
      category_id: input.categoryId,
      texture: input.texture ?? null,
      is_new: input.isNew ?? false,
      liking: input.liking ?? null,
      reaction: input.reaction ?? null,
      notes: input.notes ?? null,
      planned_item_id: input.plannedItemId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return withMealDefaults(data);
}

export async function updateMeal(
  id: string,
  patch: Partial<Pick<MealItem, 'name' | 'slot' | 'category_id' | 'texture' | 'is_new' | 'liking' | 'reaction' | 'notes'>>,
): Promise<void> {
  const dbPatch = {
    ...patch,
    ...(patch.name ? { name_key: foodNameKey(patch.name) } : {}),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('meal_items').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  if (error) throw error;
}

// --- Copiar día / semana ----------------------------------------------------

export async function previewCopyDay(fromDayKey: string, toDayKey: string): Promise<CopyPreview> {
  const [source, destination] = await Promise.all([
    fetchMealsInRange(fromDayKey, fromDayKey),
    fetchMealsInRange(toDayKey, toDayKey),
  ]);
  return {
    sourceFrom: fromDayKey,
    sourceTo: fromDayKey,
    destinationFrom: toDayKey,
    destinationTo: toDayKey,
    sourceCount: source.length,
    destinationCount: destination.length,
    hasConflicts: destination.length > 0,
  };
}

/** Copia todos los alimentos de un día a otro (resetea el distintivo "nuevo"). */
export async function copyDay(
  fromDayKey: string,
  toDayKey: string,
  userId: string,
  mode: CopyMode = 'append',
): Promise<number> {
  if (fromDayKey === toDayKey) return 0;
  const items = await fetchMealsInRange(fromDayKey, fromDayKey);
  if (items.length === 0) return 0;
  if (mode === 'replace') {
    const { error: delErr } = await supabase.from('meal_items').delete().eq('day', toDayKey);
    if (delErr) throw delErr;
  }
  const rows = items.map((m) => ({
    user_id: userId,
    day: toDayKey,
    slot: m.slot,
    name: m.name,
    name_key: m.name_key || foodNameKey(m.name),
    category_id: m.category_id,
    texture: m.texture,
    is_new: false,
    liking: m.liking,
    reaction: m.reaction,
    notes: m.notes,
    sort_order: m.sort_order,
  }));
  const { error } = await supabase.from('meal_items').insert(rows);
  if (error) throw error;
  return rows.length;
}

/** Devuelve los pares [origen, destino] de las 7 fechas de la semana. */
export function weekTargetKeys(
  fromMondayKey: string,
  toMondayKey: string,
): Array<[string, string]> {
  const from = dateFromKey(fromMondayKey);
  const to = dateFromKey(toMondayKey);
  return Array.from({ length: 7 }, (_, i) => [
    dayKey(addDays(from, i)),
    dayKey(addDays(to, i)),
  ]);
}

export async function previewCopyWeek(
  fromMondayKey: string,
  toMondayKey: string,
): Promise<CopyPreview> {
  const pairs = weekTargetKeys(fromMondayKey, toMondayKey);
  const [source, destination] = await Promise.all([
    fetchMealsInRange(pairs[0][0], pairs[6][0]),
    fetchMealsInRange(pairs[0][1], pairs[6][1]),
  ]);
  return {
    sourceFrom: pairs[0][0],
    sourceTo: pairs[6][0],
    destinationFrom: pairs[0][1],
    destinationTo: pairs[6][1],
    sourceCount: source.length,
    destinationCount: destination.length,
    hasConflicts: destination.length > 0,
  };
}

export async function copyWeek(
  fromMondayKey: string,
  toMondayKey: string,
  userId: string,
  mode: CopyMode = 'append',
): Promise<number> {
  if (mode === 'replace') {
    const pairs = weekTargetKeys(fromMondayKey, toMondayKey);
    const { error } = await supabase
      .from('meal_items')
      .delete()
      .gte('day', pairs[0][1])
      .lte('day', pairs[6][1]);
    if (error) throw error;
  }
  let total = 0;
  for (const [src, dst] of weekTargetKeys(fromMondayKey, toMondayKey)) {
    total += await copyDay(src, dst, userId, 'append');
  }
  return total;
}

// --- Notas por día ----------------------------------------------------------

export async function fetchDayNote(day: string): Promise<DayNote | null> {
  const { data, error } = await supabase
    .from('day_notes')
    .select('day, note')
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  return (data as DayNote) ?? null;
}

export async function upsertDayNote(day: string, note: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('day_notes')
    .upsert(
      { day, note, created_by: userId, updated_at: new Date().toISOString() },
      { onConflict: 'day' },
    );
  if (error) throw error;
}

// --- Estado por alimento (probados) -----------------------------------------

export async function fetchFoodStatuses(): Promise<FoodStatus[]> {
  const { data, error } = await supabase.from('food_status').select('*');
  if (error) throw error;
  return ((data as FoodStatus[]) ?? []).map(withFoodStatusDefaults);
}

export async function upsertFoodStatus(input: {
  name: string;
  liking: Liking | null;
  reaction: ReactionStatus | null;
  notes: string;
  userId: string;
  categoryId?: string | null;
  isAllergen?: boolean;
  allergenKeys?: AllergenKey[];
  favorite?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('food_status').upsert(
    {
      name_key: foodNameKey(input.name),
      display_name: input.name,
      liking: input.liking,
      reaction: input.reaction,
      notes: input.notes,
      ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
      ...(input.isAllergen !== undefined ? { is_allergen: input.isAllergen } : {}),
      ...(input.allergenKeys !== undefined ? { allergen_keys: input.allergenKeys } : {}),
      ...(input.favorite !== undefined ? { favorite: input.favorite } : {}),
      updated_by: input.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'name_key' },
  );
  if (error) throw error;
}

/**
 * Cambia la categoría de un alimento en TODAS sus apariciones del diario del
 * hogar (todos los `meal_items` cuyo nombre normalizado coincida).
 */
export async function updateFoodCategory(
  nameKey: string,
  categoryId: string | null,
): Promise<number> {
  const { data, error } = await supabase.from('meal_items').select('id, name, name_key');
  if (error) throw error;
  const ids = (data ?? [])
    .filter((m) => (m.name_key || foodNameKey(m.name)) === nameKey)
    .map((m) => m.id);
  if (ids.length === 0) return 0;
  const [{ error: updErr }, { error: statusErr }] = await Promise.all([
    supabase.from('meal_items').update({ category_id: categoryId }).in('id', ids),
    supabase
      .from('food_status')
      .upsert({ name_key: nameKey, display_name: nameKey, category_id: categoryId }, { onConflict: 'name_key' }),
  ]);
  if (updErr) throw updErr;
  if (statusErr) throw statusErr;
  return ids.length;
}

export function aggregateFoods(meals: MealItem[], statuses: FoodStatus[]): FoodTried[] {
  const byName = new Map<string, FoodTried>();
  const statusByKey = new Map(statuses.map((s) => [s.name_key, withFoodStatusDefaults(s)]));

  for (const m of meals) {
    const key = m.name_key || foodNameKey(m.name);
    if (!key) continue;
    const status = statusByKey.get(key) ?? null;
    const allergenKeys = mergeAllergenKeys(status?.allergen_keys ?? [], inferAllergenKeys(m.name));
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, {
        nameKey: key,
        name: m.name.trim(),
        categoryId: status?.category_id ?? m.category_id,
        count: 1,
        firstDay: m.day,
        lastDay: m.day,
        isNew: m.is_new,
        textures: m.texture ? [m.texture] : [],
        liking: status?.liking ?? m.liking ?? null,
        reaction: status?.reaction ?? m.reaction ?? null,
        notes: status?.notes ?? '',
        isAllergen: status?.is_allergen ?? allergenKeys.length > 0,
        allergenKeys,
        favorite: status?.favorite ?? false,
        status,
      });
    } else {
      existing.count += 1;
      if (m.day < existing.firstDay) existing.firstDay = m.day;
      if (m.day > existing.lastDay) existing.lastDay = m.day;
      if (!existing.categoryId && m.category_id) existing.categoryId = m.category_id;
      existing.isNew = existing.isNew || m.is_new;
      if (m.texture && !existing.textures.includes(m.texture)) existing.textures.push(m.texture);
      if (!existing.liking && m.liking) existing.liking = m.liking;
      if (!existing.reaction && m.reaction) existing.reaction = m.reaction;
      existing.allergenKeys = mergeAllergenKeys(existing.allergenKeys, allergenKeys);
      existing.isAllergen = existing.isAllergen || allergenKeys.length > 0;
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function fetchFoodSummaries(): Promise<FoodTried[] | null> {
  const { data, error } = await supabase.rpc('get_food_summaries');
  if (error) {
    const code = String((error as { code?: unknown }).code ?? '');
    const message = String((error as { message?: unknown }).message ?? '');
    if (code === 'PGRST202' || code === '42883' || message.includes('get_food_summaries')) {
      return null;
    }
    throw error;
  }
  return ((data ?? []) as FoodSummaryRow[])
    .map(foodFromSummaryRow)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function foodFromSummaryRow(row: FoodSummaryRow): FoodTried {
  const name = row.display_name?.trim() || row.name_key;
  const liking = normalizeLiking(row.liking);
  const reaction = normalizeReactionStatus(row.reaction);
  const allergenKeys = mergeAllergenKeys(normalizeAllergenKeys(row.allergen_keys), inferAllergenKeys(name));
  const status = row.has_status
    ? withFoodStatusDefaults({
        name_key: row.name_key,
        display_name: name,
        liking,
        reaction,
        notes: row.notes ?? '',
        category_id: row.category_id,
        is_allergen: row.is_allergen,
        allergen_keys: allergenKeys,
        favorite: row.favorite,
        first_tried_day: row.first_tried_day,
        last_offered_day: row.last_offered_day,
        offer_count: Number(row.offer_count) || 0,
      })
    : null;

  return {
    nameKey: row.name_key,
    name,
    categoryId: row.category_id,
    count: Number(row.offer_count) || 0,
    firstDay: row.first_tried_day,
    lastDay: row.last_offered_day,
    isNew: Boolean(row.is_new),
    textures: normalizeTextures(row.textures),
    liking,
    reaction,
    notes: row.notes ?? '',
    isAllergen: Boolean(row.is_allergen) || allergenKeys.length > 0,
    allergenKeys,
    favorite: Boolean(row.favorite),
    status,
  };
}

export async function fetchFoodsTried(): Promise<FoodTried[]> {
  const summaries = await fetchFoodSummaries();
  if (summaries) return summaries;
  const [meals, statuses] = await Promise.all([fetchAllMeals(), fetchFoodStatuses()]);
  return aggregateFoods(meals, statuses);
}

export async function fetchFoodDetail(nameKey: string): Promise<FoodDetail | null> {
  const [meals, foods] = await Promise.all([fetchAllMeals(), fetchFoodsTried()]);
  const food = foods.find((f) => f.nameKey === nameKey);
  if (!food) return null;
  const foodMeals = meals
    .filter((m) => (m.name_key || foodNameKey(m.name)) === nameKey)
    .sort((a, b) => `${b.day}-${b.created_at}`.localeCompare(`${a.day}-${a.created_at}`));
  return { ...food, meals: foodMeals };
}

function matchesOptionFilter<T extends string>(value: T | null, filter: T | 'unrated' | ''): boolean {
  if (filter === 'unrated') return !value;
  if (filter) return value === filter;
  return true;
}

export function filterFoods(foods: FoodTried[], filters: FoodFilters): FoodTried[] {
  const query = foodNameKey(filters.query);
  return foods
    .filter((food) => {
      if (query && !foodNameKey(food.name).includes(query)) return false;
      if (filters.categoryId && food.categoryId !== filters.categoryId) return false;
      if (!matchesOptionFilter(food.liking, filters.liking)) return false;
      if (!matchesOptionFilter(food.reaction, filters.reaction)) return false;
      if (filters.onlyNew && !food.isNew) return false;
      if (filters.onlyAllergens && !food.isAllergen) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'first') return a.firstDay.localeCompare(b.firstDay);
      if (filters.sort === 'last') return b.lastDay.localeCompare(a.lastDay);
      if (filters.sort === 'count') return b.count - a.count;
      return a.name.localeCompare(b.name, 'es');
    });
}

export function allergenProgress(foods: FoodTried[]): { introduced: number; total: number } {
  const introduced = new Set<AllergenKey>();
  for (const food of foods) {
    for (const key of food.allergenKeys) introduced.add(key);
  }
  return { introduced: introduced.size, total: ALLERGENS.length };
}

export function buildDashboardSummary(input: {
  todayMeals: MealItem[];
  dayNote: DayNote | null;
  foods: FoodTried[];
  plannedToday: PlannedMeal[];
  todayKey: string;
}): DashboardSummary {
  const recentThreshold = dayKey(addDays(dateFromKey(input.todayKey), -7));
  const progress = allergenProgress(input.foods);
  return {
    totalFoodsToday: input.todayMeals.length,
    newFoodsToday: input.todayMeals.filter((m) => m.is_new).length,
    reactionCountToday: input.todayMeals.filter((m) => m.reaction === 'reaction').length,
    hasDayNote: Boolean(input.dayNote?.note?.trim()),
    recentNewFoods: input.foods.filter((f) => f.isNew && f.firstDay >= recentThreshold).slice(0, 6),
    reactionsToWatch: input.foods.filter((f) => f.reaction === 'reaction').slice(0, 6),
    foodsToRetry: input.foods
      .filter((f) => f.liking === 'disliked' || (!f.liking && f.count <= 2))
      .slice(0, 5),
    plannedToday: input.plannedToday.filter((p) => !p.completed_meal_item_id),
    allergenTotal: progress.total,
    allergensIntroduced: progress.introduced,
  };
}

// --- Planificación -----------------------------------------------------------

export async function fetchPlannedMealsInRange(fromKey: string, toKey: string): Promise<PlannedMeal[]> {
  const { data, error } = await supabase
    .from('planned_meals')
    .select('*')
    .gte('day', fromKey)
    .lte('day', toKey)
    .order('day', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data as PlannedMeal[]) ?? []).map(withPlannedMealDefaults);
}

export async function addPlannedMeal(input: {
  userId: string;
  day: string;
  slot: MealSlot;
  name: string;
  categoryId: string | null;
  texture?: Texture | null;
  isNew?: boolean;
  notes?: string;
}): Promise<PlannedMeal> {
  const { data, error } = await supabase
    .from('planned_meals')
    .insert({
      day: input.day,
      slot: input.slot,
      name: input.name,
      name_key: foodNameKey(input.name),
      category_id: input.categoryId,
      texture: input.texture ?? null,
      is_new: input.isNew ?? false,
      notes: input.notes ?? '',
      created_by: input.userId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return withPlannedMealDefaults(data);
}

export async function deletePlannedMeal(id: string): Promise<void> {
  const { error } = await supabase.from('planned_meals').delete().eq('id', id);
  if (error) throw error;
}

export async function completePlannedMeal(plan: PlannedMeal, userId: string): Promise<MealItem> {
  const meal = await addMeal({
    userId,
    day: plan.day,
    slot: plan.slot,
    name: plan.name,
    categoryId: plan.category_id,
    texture: plan.texture,
    isNew: plan.is_new,
    notes: plan.notes,
    plannedItemId: plan.id,
  });
  const { error } = await supabase
    .from('planned_meals')
    .update({ completed_meal_item_id: meal.id, updated_at: new Date().toISOString() })
    .eq('id', plan.id);
  if (error) throw error;
  return meal;
}

function withMealDefaults(row: any): MealItem {
  return {
    ...row,
    name_key: row.name_key ?? foodNameKey(row.name ?? ''),
    liking: row.liking ?? null,
    reaction: row.reaction ?? null,
    notes: row.notes ?? null,
    planned_item_id: row.planned_item_id ?? null,
    updated_at: row.updated_at ?? null,
  } as MealItem;
}

function withFoodStatusDefaults(row: Partial<FoodStatus>): FoodStatus {
  return {
    name_key: row.name_key ?? '',
    display_name: row.display_name ?? row.name_key ?? '',
    liking: row.liking ?? null,
    reaction: row.reaction ?? null,
    notes: row.notes ?? '',
    category_id: row.category_id ?? null,
    is_allergen: row.is_allergen ?? false,
    allergen_keys: normalizeAllergenKeys(row.allergen_keys),
    favorite: row.favorite ?? false,
    first_tried_day: row.first_tried_day ?? null,
    last_offered_day: row.last_offered_day ?? null,
    offer_count: row.offer_count ?? null,
  };
}

function withPlannedMealDefaults(row: any): PlannedMeal {
  return {
    ...row,
    name_key: row.name_key ?? foodNameKey(row.name ?? ''),
    category_id: row.category_id ?? null,
    texture: row.texture ?? null,
    is_new: row.is_new ?? false,
    notes: row.notes ?? '',
    completed_meal_item_id: row.completed_meal_item_id ?? null,
    created_by: row.created_by ?? null,
  } as PlannedMeal;
}

function normalizeAllergenKeys(keys: unknown): AllergenKey[] {
  if (!Array.isArray(keys)) return [];
  const allowed = new Set(ALLERGENS.map((a) => a.key));
  return keys.filter((key): key is AllergenKey => typeof key === 'string' && allowed.has(key as AllergenKey));
}

function normalizeLiking(liking: unknown): Liking | null {
  return liking === 'liked' || liking === 'disliked' ? liking : null;
}

function normalizeReactionStatus(reaction: unknown): ReactionStatus | null {
  return reaction === 'reaction' || reaction === 'ok' ? reaction : null;
}

function normalizeTextures(textures: unknown): Texture[] {
  if (!Array.isArray(textures)) return [];
  return textures.filter((texture): texture is Texture =>
    texture === 'puree' || texture === 'mashed' || texture === 'chunks',
  );
}

function inferAllergenKeys(name: string): AllergenKey[] {
  const normalized = foodNameKey(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return ALLERGENS.filter((allergen) =>
    allergen.keywords.some((keyword) =>
      normalized.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
    ),
  ).map((allergen) => allergen.key);
}

function mergeAllergenKeys(a: AllergenKey[], b: AllergenKey[]): AllergenKey[] {
  return Array.from(new Set([...a, ...b]));
}
