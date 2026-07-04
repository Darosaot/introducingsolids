export type UserRole = 'admin' | 'user';

export type Theme = 'verde' | 'rosa' | 'azul' | 'neutro';

export type Texture = 'puree' | 'mashed' | 'chunks';

export type Liking = 'liked' | 'disliked';

export type ReactionStatus = 'reaction' | 'ok';

export type AllergenKey =
  | 'egg'
  | 'peanut'
  | 'tree_nuts'
  | 'dairy'
  | 'gluten'
  | 'fish'
  | 'shellfish'
  | 'soy'
  | 'sesame';

export type MealSlot =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner';

export type HouseholdRole = 'owner' | 'member';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled: boolean;
  theme: Theme;
  household_id: string | null;
  household_role: HouseholdRole;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  owner_id: string | null;
  join_code: string;
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
  name_key: string | null;
  category_id: string | null;
  texture: Texture | null;
  is_new: boolean;
  liking: Liking | null;
  reaction: ReactionStatus | null;
  notes: string | null;
  planned_item_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface DayNote {
  day: string;
  note: string;
}

export interface FoodStatus {
  name_key: string;
  display_name: string;
  liking: Liking | null;
  reaction: ReactionStatus | null;
  notes: string;
  category_id: string | null;
  is_allergen: boolean;
  allergen_keys: AllergenKey[];
  favorite: boolean;
  first_tried_day: string | null;
  last_offered_day: string | null;
  offer_count: number | null;
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
  textures: Texture[];
  liking: Liking | null;
  reaction: ReactionStatus | null;
  notes: string;
  isAllergen: boolean;
  allergenKeys: AllergenKey[];
  favorite: boolean;
  status: FoodStatus | null;
}

export interface BabyProfile {
  id: string;
  name: string;
  birth_date: string | null;
  solids_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlannedMeal {
  id: string;
  day: string;
  slot: MealSlot;
  name: string;
  name_key: string;
  category_id: string | null;
  texture: Texture | null;
  is_new: boolean;
  notes: string;
  completed_meal_item_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodDetail extends FoodTried {
  meals: MealItem[];
}

export interface FoodFilters {
  query: string;
  categoryId: string;
  liking: Liking | 'unrated' | '';
  reaction: ReactionStatus | 'unrated' | '';
  onlyNew: boolean;
  onlyAllergens: boolean;
  sort: 'first' | 'last' | 'count' | 'name';
}

export interface DashboardSummary {
  totalFoodsToday: number;
  newFoodsToday: number;
  reactionCountToday: number;
  hasDayNote: boolean;
  recentNewFoods: FoodTried[];
  reactionsToWatch: FoodTried[];
  foodsToRetry: FoodTried[];
  plannedToday: PlannedMeal[];
  allergenTotal: number;
  allergensIntroduced: number;
}

/** Shape returned by the admin serverless function. */
export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled: boolean;
  household_id: string | null;
  household_role: HouseholdRole;
  created_at: string;
  last_sign_in_at: string | null;
}
