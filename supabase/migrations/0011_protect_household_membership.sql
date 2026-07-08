-- ============================================================================
-- Corrige una escalada de privilegios dentro de la familia.
--
-- PROBLEMA
--   La política `profiles_update` (0007) permite a cada usuario actualizar su
--   propia fila (`id = auth.uid()`), y el trigger `protect_profile_fields`
--   (0008) solo revertía `role` y `disabled`. Los campos de pertenencia
--   `household_id` y `household_role` quedaban desprotegidos, de modo que un
--   miembro cualquiera podía:
--     * `update profiles set household_role = 'owner' where id = auth.uid()`
--       -> pasar `is_owner()` y controlar el portal de administración de la
--          familia (renombrarla, regenerar el código, deshabilitar/ELIMINAR al
--          dueño legítimo y al resto de miembros).
--     * `update profiles set household_id = '<uuid>'` -> saltar a otra familia
--       sin pasar por `join_household` ni su código de invitación.
--
-- SOLUCIÓN
--   El trigger ahora también fija `household_id`/`household_role` para las
--   llamadas NO privilegiadas. Los únicos caminos legítimos que cambian la
--   pertenencia (`create_household`, `join_household`) marcan una variable de
--   sesión local (`app.allow_membership_change`) que el trigger reconoce, de
--   modo que el onboarding sigue funcionando pero las escrituras directas del
--   cliente quedan congeladas. La `service_role` (backend admin) y el
--   super-admin siguen pudiendo gestionar la pertenencia.
-- ============================================================================

-- 1) Trigger endurecido: congela role/disabled/household_id/household_role
--    salvo para super-admin, service_role o los RPC de confianza.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trusted boolean :=
    public.is_admin()
    or auth.role() = 'service_role'
    or coalesce(current_setting('app.allow_membership_change', true), '') = 'on';
begin
  if not v_trusted then
    new.role := old.role;
    new.disabled := old.disabled;
    new.household_id := old.household_id;
    new.household_role := old.household_role;
  end if;
  return new;
end;
$$;

-- 2) create_household: marca el cambio de pertenencia como legítimo antes de
--    asignar la familia recién creada al usuario. Idéntico a 0009 salvo la
--    línea `perform set_config(...)`.
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

  perform set_config('app.allow_membership_change', 'on', true);
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

-- 3) join_household: mismo marcado antes de asociar al usuario a la familia.
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

  perform set_config('app.allow_membership_change', 'on', true);
  update public.profiles set household_id = v_hh, household_role = 'member' where id = v_uid;
  return v_hh;
end;
$$;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;
