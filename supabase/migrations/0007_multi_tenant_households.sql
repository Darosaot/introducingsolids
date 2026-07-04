-- ============================================================================
-- V5 — Multi-familia (multi-tenant)
--   * Nueva entidad `households` (familia); cada usuario pertenece a una.
--   * Todas las tablas de datos cuelgan de un `household_id`
--     (DEFAULT public.current_household_id()), y la RLS pasa de "ve todo"
--     a "ve lo de su familia".
--   * `profiles.role` (admin|user) se reinterpreta como super-admin de plataforma.
--   * RPC self-serve `create_household` para que un registro nuevo cree su familia.
--   Retrocompatible: se crea una familia por defecto y se le asignan todos los
--   datos existentes, de modo que la app actual sigue funcionando igual.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Familia (household) y columnas de pertenencia en profiles
-- ----------------------------------------------------------------------------
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Mi familia',
  owner_id   uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists household_id uuid references public.households (id) on delete set null,
  add column if not exists household_role text not null default 'member'
    check (household_role in ('owner', 'member'));

-- ----------------------------------------------------------------------------
-- 2) Familia por defecto + backfill (el perfil más antiguo queda como dueño)
-- ----------------------------------------------------------------------------
insert into public.households (name, owner_id)
select 'Mi familia', (select id from public.profiles order by created_at asc, id asc limit 1)
where not exists (select 1 from public.households);

update public.profiles
set household_id = (select id from public.households order by created_at asc limit 1)
where household_id is null;

update public.profiles
set household_role = 'owner'
where id = (select owner_id from public.households order by created_at asc limit 1);

-- ----------------------------------------------------------------------------
-- 3) Helpers RLS (SECURITY DEFINER para no recursar sobre profiles)
-- ----------------------------------------------------------------------------
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles
  where id = auth.uid() and disabled = false;
$$;
revoke all on function public.current_household_id() from public, anon;
grant execute on function public.current_household_id() to authenticated;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and disabled = false
  );
$$;
revoke all on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and household_role = 'owner' and disabled = false
  );
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- RLS de households: cada quien ve su familia; el dueño la renombra; el super-admin, todas.
alter table public.households enable row level security;
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select using (id = public.current_household_id() or public.is_superadmin());
drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update using ((id = public.current_household_id() and public.is_owner()) or public.is_superadmin())
  with check ((id = public.current_household_id() and public.is_owner()) or public.is_superadmin());
drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert with check (public.is_superadmin());
drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete using (public.is_superadmin());

-- ----------------------------------------------------------------------------
-- 4) household_id en cada tabla de datos (add → backfill → not null/default/fk)
-- ----------------------------------------------------------------------------
do $$
declare
  tbl text;
  hh  uuid := (select id from public.households order by created_at asc limit 1);
begin
  foreach tbl in array array[
    'baby_profile', 'categories', 'meal_items', 'day_notes', 'food_status', 'planned_meals'
  ]
  loop
    execute format('alter table public.%I add column if not exists household_id uuid', tbl);
    execute format('update public.%I set household_id = %L where household_id is null', tbl, hh);
    execute format('alter table public.%I alter column household_id set not null', tbl);
    execute format(
      'alter table public.%I alter column household_id set default public.current_household_id()', tbl);
    execute format(
      'alter table public.%I add constraint %I foreign key (household_id) '
      'references public.households (id) on delete cascade', tbl, tbl || '_household_fk');
    execute format('create index if not exists %I on public.%I (household_id)', tbl || '_household_idx', tbl);
  end loop;
end$$;

-- ----------------------------------------------------------------------------
-- 5) Unicidad por familia (antes global)
-- ----------------------------------------------------------------------------
alter table public.categories drop constraint if exists categories_key_unique;
alter table public.categories add constraint categories_household_key_unique unique (household_id, key);

alter table public.day_notes drop constraint if exists day_notes_pkey;
alter table public.day_notes add primary key (household_id, day);

alter table public.food_status drop constraint if exists food_status_pkey;
alter table public.food_status add primary key (household_id, name_key);

alter table public.baby_profile add constraint baby_profile_household_unique unique (household_id);

-- ----------------------------------------------------------------------------
-- 6) RLS por familia (o super-admin) en las 6 tablas de datos
-- ----------------------------------------------------------------------------
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'baby_profile', 'categories', 'meal_items', 'day_notes', 'food_status', 'planned_meals'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', tbl || '_all', tbl);
    execute format(
      'create policy %I on public.%I for all '
      'using (household_id = public.current_household_id() or public.is_superadmin()) '
      'with check (household_id = public.current_household_id() or public.is_superadmin())',
      tbl || '_all', tbl);
  end loop;
end$$;

-- profiles: ves tu fila y las de tu familia; el super-admin, todas.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or household_id = public.current_household_id()
    or public.is_superadmin()
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_superadmin())
  with check (id = auth.uid() or public.is_superadmin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid() or public.is_superadmin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_superadmin());

-- ----------------------------------------------------------------------------
-- 7) Alta de familia self-serve (el registro nuevo crea su familia y la siembra)
-- ----------------------------------------------------------------------------
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and disabled = false) then
    raise exception 'Perfil no válido';
  end if;
  if (select household_id from public.profiles where id = v_uid) is not null then
    raise exception 'Ya perteneces a una familia';
  end if;

  insert into public.households (name, owner_id)
  values (coalesce(nullif(trim(p_name), ''), 'Mi familia'), v_uid)
  returning id into v_hh;

  update public.profiles set household_id = v_hh, household_role = 'owner' where id = v_uid;

  insert into public.categories (user_id, household_id, key, name, color, sort_order) values
    (v_uid, v_hh, 'protein',    'Proteína',  '#E11D48', 1),
    (v_uid, v_hh, 'legumes',    'Legumbres', '#92400E', 2),
    (v_uid, v_hh, 'vegetables', 'Verduras',  '#16A34A', 3),
    (v_uid, v_hh, 'fruit',      'Fruta',     '#F97316', 4),
    (v_uid, v_hh, 'dairy',      'Lácteos',   '#3B82F6', 5),
    (v_uid, v_hh, 'grains',     'Cereales',  '#CA8A04', 6),
    (v_uid, v_hh, 'other',      'Otros',     '#6B7280', 7)
  on conflict (household_id, key) do nothing;

  insert into public.baby_profile (household_id, name) values (v_hh, 'Bebé')
  on conflict (household_id) do nothing;

  return v_hh;
end;
$$;
revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
