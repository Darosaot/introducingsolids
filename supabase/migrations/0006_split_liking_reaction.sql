-- ============================================================================
-- V4 — Separar "le gustó" de "reacción/alergia"
--   * `meal_items` y `food_status` ganan una columna `liking`
--     (liked | disliked), independiente de `reaction`.
--   * `reaction` pasa a usarse solo para el aviso de alergia/reacción
--     (reaction | ok); los valores liked/disliked existentes se migran.
-- ============================================================================

alter table public.meal_items
  add column if not exists liking text check (liking in ('liked', 'disliked'));

alter table public.food_status
  add column if not exists liking text check (liking in ('liked', 'disliked'));

update public.meal_items
set liking = reaction, reaction = null
where reaction in ('liked', 'disliked');

update public.food_status
set liking = reaction, reaction = null
where reaction in ('liked', 'disliked');

alter table public.meal_items
  drop constraint if exists meal_items_reaction_check;
alter table public.meal_items
  add constraint meal_items_reaction_check check (reaction in ('reaction', 'ok'));

alter table public.food_status
  drop constraint if exists food_status_reaction_check;
alter table public.food_status
  add constraint food_status_reaction_check check (reaction in ('reaction', 'ok'));

create index if not exists meal_items_liking_idx on public.meal_items (liking);
create index if not exists food_status_liking_idx on public.food_status (liking);

-- Actualiza el RPC de resúmenes para exponer también `liking`. Postgres no
-- permite cambiar las columnas de un RETURNS TABLE con CREATE OR REPLACE, así
-- que hay que borrar la función anterior primero.
drop function if exists public.get_food_summaries();

create function public.get_food_summaries()
returns table (
  name_key text,
  display_name text,
  category_id uuid,
  offer_count bigint,
  first_tried_day date,
  last_offered_day date,
  is_new boolean,
  textures text[],
  liking text,
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
    coalesce(fs.liking, (array_agg(mi.liking) filter (where mi.liking is not null))[1]) as liking,
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
    fs.liking,
    fs.reaction,
    fs.notes,
    fs.is_allergen,
    fs.allergen_keys,
    fs.favorite
  order by display_name collate "C";
$$;

revoke all on function public.get_food_summaries() from public, anon;
grant execute on function public.get_food_summaries() to authenticated;
