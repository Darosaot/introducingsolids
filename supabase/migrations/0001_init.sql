-- ============================================================================
-- Comidas del Bebé — esquema inicial (V1)
-- Tablas: profiles, categories, meal_items
-- Seguridad: Row Level Security (RLS) para que cada usuario acceda solo a
-- sus propios datos; los administradores pueden gestionar usuarios.
-- ============================================================================

-- Extensiones necesarias -----------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enumeraciones
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'user');
  end if;
  if not exists (select 1 from pg_type where typname = 'meal_slot') then
    create type public.meal_slot as enum (
      'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'
    );
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Tabla: profiles (una fila por usuario de auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       public.user_role not null default 'user',
  disabled   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabla: categories (categorías de alimentos por usuario, con color)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,          -- identificador estable: protein, fruit, ...
  name       text not null,          -- etiqueta visible (español)
  color      text not null,          -- color hex, p.ej. #E11D48
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ----------------------------------------------------------------------------
-- Tabla: meal_items (alimentos registrados en una franja de comida de un día)
-- ----------------------------------------------------------------------------
create table if not exists public.meal_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  slot        public.meal_slot not null,
  name        text not null,
  category_id uuid references public.categories (id) on delete set null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists meal_items_user_day_idx on public.meal_items (user_id, day);
create index if not exists categories_user_idx on public.categories (user_id);

-- ----------------------------------------------------------------------------
-- Función auxiliar: ¿el usuario actual es administrador?
-- SECURITY DEFINER evita la recursión de RLS al leer la tabla profiles.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
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

-- ----------------------------------------------------------------------------
-- Alta de usuario: crea el perfil y siembra las categorías por defecto
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

  insert into public.categories (user_id, key, name, color, sort_order) values
    (new.id, 'protein',    'Proteína',  '#E11D48', 1),
    (new.id, 'legumes',    'Legumbres', '#92400E', 2),
    (new.id, 'vegetables', 'Verduras',  '#16A34A', 3),
    (new.id, 'fruit',      'Fruta',     '#F97316', 4),
    (new.id, 'dairy',      'Lácteos',   '#3B82F6', 5),
    (new.id, 'grains',     'Cereales',  '#CA8A04', 6),
    (new.id, 'other',      'Otros',     '#6B7280', 7)
  on conflict (user_id, key) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Protección: un usuario normal no puede cambiar su propio role/disabled
-- ----------------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.disabled := old.disabled;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.meal_items enable row level security;

-- profiles: cada quien ve/edita su fila; los admin ven/editan todas
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());

-- categories: solo el dueño
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- meal_items: solo el dueño
drop policy if exists meal_items_all on public.meal_items;
create policy meal_items_all on public.meal_items
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
