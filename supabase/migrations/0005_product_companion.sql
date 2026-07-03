-- ============================================================================
-- V3 — Baby-feeding companion
--   * Default "Hoy" dashboard data model
--   * Food-library metadata, allergens and normalized food keys
--   * Planned meals that can be completed into real meal_items
--   * Safer indexed access patterns for calendar, foods and planning
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Shared baby profile
-- ----------------------------------------------------------------------------
create table if not exists public.baby_profile (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null default 'Bebé',
  birth_date         date,
  solids_start_date  date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

insert into public.baby_profile (name)
select 'Bebé'
where not exists (select 1 from public.baby_profile);

alter table public.baby_profile enable row level security;
drop policy if exists baby_profile_all on public.baby_profile;
create policy baby_profile_all on public.baby_profile
  for all using (public.is_active()) with check (public.is_active());

create or replace function public.normalize_food_name(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(regexp_replace(trim(coalesce(input, '')), '\s+', ' ', 'g'));
$$;

-- ----------------------------------------------------------------------------
-- 2) Richer meal rows
-- ----------------------------------------------------------------------------
alter table public.meal_items
  add column if not exists name_key text,
  add column if not exists reaction text check (reaction in ('liked', 'disliked', 'reaction', 'ok')),
  add column if not exists notes text,
  add column if not exists planned_item_id uuid,
  add column if not exists updated_at timestamptz;

update public.meal_items
set name_key = public.normalize_food_name(name)
where name_key is null;

create or replace function public.set_meal_item_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name_key := public.normalize_food_name(new.name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_meal_item_defaults on public.meal_items;
create trigger set_meal_item_defaults
  before insert or update on public.meal_items
  for each row execute function public.set_meal_item_defaults();

create index if not exists meal_items_day_idx on public.meal_items (day);
create index if not exists meal_items_name_key_idx on public.meal_items (name_key);
create index if not exists meal_items_category_idx on public.meal_items (category_id);

-- ----------------------------------------------------------------------------
-- 3) Food-library metadata
-- ----------------------------------------------------------------------------
alter table public.food_status
  add column if not exists category_id uuid references public.categories (id) on delete set null,
  add column if not exists is_allergen boolean not null default false,
  add column if not exists allergen_keys text[] not null default '{}',
  add column if not exists favorite boolean not null default false,
  add column if not exists first_tried_day date,
  add column if not exists last_offered_day date,
  add column if not exists offer_count int;

create index if not exists food_status_category_idx on public.food_status (category_id);
create index if not exists food_status_allergen_idx on public.food_status (is_allergen);

-- ----------------------------------------------------------------------------
-- 4) Planned meals
-- ----------------------------------------------------------------------------
create table if not exists public.planned_meals (
  id                     uuid primary key default gen_random_uuid(),
  day                    date not null,
  slot                   public.meal_slot not null,
  name                   text not null,
  name_key               text not null,
  category_id            uuid references public.categories (id) on delete set null,
  texture                text check (texture in ('puree', 'mashed', 'chunks')),
  is_new                 boolean not null default false,
  notes                  text not null default '',
  completed_meal_item_id uuid references public.meal_items (id) on delete set null,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create or replace function public.set_planned_meal_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name_key := public.normalize_food_name(new.name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_planned_meal_defaults on public.planned_meals;
create trigger set_planned_meal_defaults
  before insert or update on public.planned_meals
  for each row execute function public.set_planned_meal_defaults();

alter table public.planned_meals enable row level security;
drop policy if exists planned_meals_all on public.planned_meals;
create policy planned_meals_all on public.planned_meals
  for all using (public.is_active()) with check (public.is_active());

create index if not exists planned_meals_day_idx on public.planned_meals (day);
create index if not exists planned_meals_name_key_idx on public.planned_meals (name_key);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.meal_items'::regclass
      and conname = 'meal_items_planned_item_id_fkey'
  ) then
    alter table public.meal_items
      add constraint meal_items_planned_item_id_fkey
      foreign key (planned_item_id) references public.planned_meals (id) on delete set null;
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- 5) Food-library summaries without full-table client aggregation
-- ----------------------------------------------------------------------------
create or replace function public.get_food_summaries()
returns table (
  name_key text,
  display_name text,
  category_id uuid,
  offer_count bigint,
  first_tried_day date,
  last_offered_day date,
  is_new boolean,
  textures text[],
  reaction text,
  notes text,
  is_allergen boolean,
  allergen_keys text[],
  favorite boolean,
  has_status boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with meal_rows as (
    select
      public.normalize_food_name(name) as key,
      *
    from public.meal_items
  )
  select
    mi.key as name_key,
    coalesce(fs.display_name, (array_agg(mi.name order by mi.day asc, mi.created_at asc))[1]) as display_name,
    coalesce(fs.category_id, (array_agg(mi.category_id) filter (where mi.category_id is not null))[1]) as category_id,
    count(*) as offer_count,
    min(mi.day) as first_tried_day,
    max(mi.day) as last_offered_day,
    bool_or(mi.is_new) as is_new,
    coalesce(array_agg(distinct mi.texture) filter (where mi.texture is not null), '{}') as textures,
    coalesce(fs.reaction, (array_agg(mi.reaction) filter (where mi.reaction is not null))[1]) as reaction,
    coalesce(fs.notes, '') as notes,
    coalesce(fs.is_allergen, false) as is_allergen,
    coalesce(fs.allergen_keys, '{}') as allergen_keys,
    coalesce(fs.favorite, false) as favorite,
    fs.name_key is not null as has_status
  from meal_rows mi
  left join public.food_status fs on fs.name_key = mi.key
  where mi.key <> ''
  group by
    mi.key,
    fs.name_key,
    fs.display_name,
    fs.category_id,
    fs.reaction,
    fs.notes,
    fs.is_allergen,
    fs.allergen_keys,
    fs.favorite
  order by display_name collate "C";
$$;

revoke all on function public.get_food_summaries() from public, anon;
grant execute on function public.get_food_summaries() to authenticated;
