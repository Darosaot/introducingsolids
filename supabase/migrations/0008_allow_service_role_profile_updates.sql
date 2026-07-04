-- ============================================================================
-- Corrige protect_profile_fields para el backend de administración.
--
-- El trigger impide que un usuario normal cambie su propio `role`/`disabled`.
-- Pero se evaluaba `is_admin()` incluso cuando la Netlify function actúa con la
-- `service_role` (donde `auth.uid()` es null → `is_admin()` falso), revirtiendo
-- los cambios legítimos del backend (p. ej. deshabilitar un miembro o promover
-- a admin de plataforma). Se permite el cambio también cuando la petición usa
-- la `service_role`.
-- ============================================================================
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    new.role := old.role;
    new.disabled := old.disabled;
  end if;
  return new;
end;
$$;
