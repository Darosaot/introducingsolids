export type UserRole = 'admin' | 'user';

export type Theme = 'verde' | 'rosa' | 'azul' | 'neutro';

export type Texture = 'puree' | 'mashed' | 'chunks';

export type Reaction = 'liked' | 'disliked' | 'reaction' | 'ok';

export type MealSlot =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled: boolean;
  theme: Theme;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  key: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface MealItem {
  id: string;
  user_id: string;
  day: string; // ISO date, yyyy-MM-dd
  slot: MealSlot;
  name: string;
  category_id: string | null;
  texture: Texture | null;
  is_new: boolean;
  sort_order: number;
  created_at: string;
}

export interface DayNote {
  day: string;
  note: string;
}

export interface FoodStatus {
  name_key: string;
  display_name: string;
  reaction: Reaction | null;
  notes: string;
}

/** Aggregated row for the "foods tried" page. */
export interface FoodTried {
  nameKey: string;
  name: string;
  categoryId: string | null;
  count: number;
  firstDay: string;
  lastDay: string;
  isNew: boolean;
  status: FoodStatus | null;
}

/** Shape returned by the admin serverless function. */
export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}
