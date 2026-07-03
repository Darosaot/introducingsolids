-- ============================================================================
-- V2 — Diario compartido del hogar + funciones nuevas
--   * Categorías globales (compartidas por todo el hogar)
--   * RLS compartida: cualquier usuario activo accede a comidas/categorías/notas
--   * meal_items: textura + "alimento nuevo"
--   * profiles.theme (tema de color por usuario)
--   * day_notes (nota por día, compartida)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Categorías globales: deduplicar (conservar la más antigua por 'key')
-- ----------------------------------------------------------------------------
-- Repunta cualquier comida a la categoría canónica (la más antigua por key).
update public.meal_items m
set category_id = canon.id
from (
  select distinct on (key) id, key
  from public.categories
  order by key, created_at, id
) canon
join public.categories cur on cur.key = canon.key
where m.category_id = cur.id and m.category_id <> canon.id;

-- Elimina duplicados, dejando una fila por key.
delete from public.categories c
where c.id not in (
  select distinct on (key) id
  from public.categories
  order by key, created_at, id
);

-- Quita la unicidad por usuario y hace user_id opcional (queda como "creador").
do $$
declare cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.categories'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 2;
  if cname is not null then
    execute format('alter table public.categories drop constraint %I', cname);
  end if;
end$$;

alter table public.categories alter column user_id drop not null;
alter table public.categories drop constraint if exists categories_key_unique;
alter table public.categories add constraint categories_key_unique unique (key);

-- Asegura el juego por defecto (para instalaciones nuevas). No pisa colores existentes.
insert into public.categories (user_id, key, name, color, sort_order) values
  (null, 'protein',    'Proteína',  '#E11D48', 1),
  (null, 'legumes',    'Legumbres', '#92400E', 2),
  (null, 'vegetables', 'Verduras',  '#16A34A', 3),
  (null, 'fruit',      'Fruta',     '#F97316', 4),
  (null, 'dairy',      'Lácteos',   '#3B82F6', 5),
  (null, 'grains',     'Cereales',  '#CA8A04', 6),
  (null, 'other',      'Otros',     '#6B7280', 7)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 2) Columnas nuevas
-- ----------------------------------------------------------------------------
alter table public.meal_items
  add column if not exists texture text
    check (texture in ('puree', 'mashed', 'chunks'));
alter table public.meal_items
  add column if not exists is_new boolean not null default false;

alter table public.profiles
  add column if not exists theme text not null default 'verde';

-- ----------------------------------------------------------------------------
-- 3) Notas por día (una por día, compartida por el hogar)
-- ----------------------------------------------------------------------------
create table if not exists public.day_notes (
  day        date primary key,
  note       text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4) El trigger de alta ya no siembra categorías (ahora son globales)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5) RLS compartida: cualquier usuario activo (perfil no deshabilitado)
-- ----------------------------------------------------------------------------
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and disabled = false
  );
$$;
revoke all on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

-- categorías: lectura/escritura para todo el hogar
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all using (public.is_active()) with check (public.is_active());

-- comidas: lectura/escritura para todo el hogar
drop policy if exists meal_items_all on public.meal_items;
create policy meal_items_all on public.meal_items
  for all using (public.is_active()) with check (public.is_active());

-- notas de día: lectura/escritura para todo el hogar
alter table public.day_notes enable row level security;
drop policy if exists day_notes_all on public.day_notes;
create policy day_notes_all on public.day_notes
  for all using (public.is_active()) with check (public.is_active());
