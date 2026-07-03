import { supabase } from './supabase';
import { addDays, dayKey, fromKey as dateFromKey } from './date';
import type {
  Category,
  DayNote,
  FoodStatus,
  FoodTried,
  MealItem,
  MealSlot,
  Reaction,
  Texture,
  Theme,
} from './types';

// --- Perfil / tema ----------------------------------------------------------

export async function updateTheme(userId: string, theme: Theme): Promise<void> {
  const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId);
  if (error) throw error;
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

/** Convierte un nombre en una clave estable y única. */
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
  // Coloca la nueva categoría al final.
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

export async function fetchMealsInRange(
  fromKey: string,
  toKey: string,
): Promise<MealItem[]> {
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .gte('day', fromKey)
    .lte('day', toKey)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllMeals(): Promise<MealItem[]> {
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .order('day', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMeal(input: {
  userId: string;
  day: string;
  slot: MealSlot;
  name: string;
  categoryId: string | null;
  texture?: Texture | null;
  isNew?: boolean;
}): Promise<MealItem> {
  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      user_id: input.userId,
      day: input.day,
      slot: input.slot,
      name: input.name,
      category_id: input.categoryId,
      texture: input.texture ?? null,
      is_new: input.isNew ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as MealItem;
}

export async function updateMeal(
  id: string,
  patch: Partial<Pick<MealItem, 'name' | 'category_id' | 'texture' | 'is_new'>>,
): Promise<void> {
  const { error } = await supabase.from('meal_items').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  if (error) throw error;
}

// --- Copiar día / semana ----------------------------------------------------

/** Copia todos los alimentos de un día a otro (resetea el distintivo "nuevo"). */
export async function copyDay(
  fromDayKey: string,
  toDayKey: string,
  userId: string,
): Promise<number> {
  if (fromDayKey === toDayKey) return 0;
  const items = await fetchMealsInRange(fromDayKey, fromDayKey);
  if (items.length === 0) return 0;
  const rows = items.map((m) => ({
    user_id: userId,
    day: toDayKey,
    slot: m.slot,
    name: m.name,
    category_id: m.category_id,
    texture: m.texture,
    is_new: false,
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

export async function copyWeek(
  fromMondayKey: string,
  toMondayKey: string,
  userId: string,
): Promise<number> {
  let total = 0;
  for (const [src, dst] of weekTargetKeys(fromMondayKey, toMondayKey)) {
    total += await copyDay(src, dst, userId);
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

export async function upsertDayNote(
  day: string,
  note: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('day_notes')
    .upsert(
      { day, note, created_by: userId, updated_at: new Date().toISOString() },
      { onConflict: 'day' },
    );
  if (error) throw error;
}

// --- Estado por alimento (probados) -----------------------------------------

export function foodNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export async function fetchFoodStatuses(): Promise<FoodStatus[]> {
  const { data, error } = await supabase.from('food_status').select('*');
  if (error) throw error;
  return (data as FoodStatus[]) ?? [];
}

export async function upsertFoodStatus(input: {
  name: string;
  reaction: Reaction | null;
  notes: string;
  userId: string;
}): Promise<void> {
  const { error } = await supabase.from('food_status').upsert(
    {
      name_key: foodNameKey(input.name),
      display_name: input.name,
      reaction: input.reaction,
      notes: input.notes,
      updated_by: input.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'name_key' },
  );
  if (error) throw error;
}

/**
 * Agrupa las comidas por alimento (nombre normalizado). Función pura, testeable.
 */
export function aggregateFoods(
  meals: MealItem[],
  statuses: FoodStatus[],
): FoodTried[] {
  const byName = new Map<string, FoodTried>();
  const statusByKey = new Map(statuses.map((s) => [s.name_key, s]));

  for (const m of meals) {
    const key = foodNameKey(m.name);
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        nameKey: key,
        name: m.name.trim(),
        categoryId: m.category_id,
        count: 1,
        firstDay: m.day,
        lastDay: m.day,
        isNew: m.is_new,
        status: statusByKey.get(key) ?? null,
      });
    } else {
      existing.count += 1;
      if (m.day < existing.firstDay) existing.firstDay = m.day;
      if (m.day > existing.lastDay) existing.lastDay = m.day;
      if (!existing.categoryId && m.category_id) existing.categoryId = m.category_id;
      existing.isNew = existing.isNew || m.is_new;
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function fetchFoodsTried(): Promise<FoodTried[]> {
  const [meals, statuses] = await Promise.all([fetchAllMeals(), fetchFoodStatuses()]);
  return aggregateFoods(meals, statuses);
}
