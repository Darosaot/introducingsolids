import { supabase } from './supabase';
import type { Category, MealItem, MealSlot } from './types';

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

export async function addMeal(input: {
  userId: string;
  day: string;
  slot: MealSlot;
  name: string;
  categoryId: string | null;
}): Promise<MealItem> {
  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      user_id: input.userId,
      day: input.day,
      slot: input.slot,
      name: input.name,
      category_id: input.categoryId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as MealItem;
}

export async function updateMeal(
  id: string,
  patch: Partial<Pick<MealItem, 'name' | 'category_id'>>,
): Promise<void> {
  const { error } = await supabase.from('meal_items').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  if (error) throw error;
}
