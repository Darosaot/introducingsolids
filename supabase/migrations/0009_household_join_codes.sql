-- ============================================================================
-- Códigos de familia para adhesión self-serve.
--   * Cada household tiene un `join_code` corto y único.
--   * `create_household` lo genera; el dueño puede regenerarlo.
--   * `join_household(code)` permite a un usuario sin familia unirse a una
--     existente (SECURITY DEFINER: el usuario nunca lee la tabla households).
-- ============================================================================

alter table public.households add column if not exists join_code text;

-- Genera un código de 8 caracteres sin caracteres ambiguos (0/O, 1/I…), único.
create or replace function public.gen_join_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code  text;
  i     int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.households where join_code = code);
  end loop;
  return code;
end;
$$;
revoke all on function public.gen_join_code() from public, anon, authenticated;

-- Backfill de familias existentes + unicidad
update public.households set join_code = public.gen_join_code() where join_code is null;
alter table public.households alter column join_code set not null;
alter table public.households add constraint households_join_code_unique unique (join_code);

-- create_household ahora también asigna un código
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
  if v_uid is null then raise exception 'No autenticado'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and disabled = false) then
    raise exception 'Perfil no válido';
  end if;
  if (select household_id from public.profiles where id = v_uid) is not null then
    raise exception 'Ya perteneces a una familia';
  end if;

  insert into public.households (name, owner_id, join_code)
  values (coalesce(nullif(trim(p_name), ''), 'Mi familia'), v_uid, public.gen_join_code())
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

-- Unirse a una familia existente con su código (usuario sin familia todavía).
create or replace function public.join_household(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and disabled = false) then
    raise exception 'Perfil no válido';
  end if;
  if (select household_id from public.profiles where id = v_uid) is not null then
    raise exception 'Ya perteneces a una familia';
  end if;

  select id into v_hh from public.households
  where join_code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if v_hh is null then raise exception 'Código no válido'; end if;

  update public.profiles set household_id = v_hh, household_role = 'member' where id = v_uid;
  return v_hh;
end;
$$;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;

-- Regenerar el código (solo el dueño o super-admin), invalida el anterior.
create or replace function public.regenerate_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hh   uuid := public.current_household_id();
  v_code text;
begin
  if v_hh is null then raise exception 'Sin familia'; end if;
  if not (public.is_owner() or public.is_superadmin()) then
    raise exception 'Solo el dueño puede regenerar el código';
  end if;
  v_code := public.gen_join_code();
  update public.households set join_code = v_code where id = v_hh;
  return v_code;
end;
$$;
revoke all on function public.regenerate_join_code() from public, anon;
grant execute on function public.regenerate_join_code() to authenticated;
