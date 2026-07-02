export type UserRole = 'admin' | 'user';

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
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
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
  sort_order: number;
  created_at: string;
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
