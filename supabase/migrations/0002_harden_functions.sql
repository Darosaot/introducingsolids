-- ============================================================================
-- Endurecimiento: evitar que las funciones SECURITY DEFINER se puedan invocar
-- directamente vía la API REST (rpc). Los triggers siguen funcionando porque
-- no comprueban el privilegio EXECUTE del usuario que dispara la consulta.
-- ============================================================================

-- Funciones de trigger: nunca se llaman directamente -> revocar a todos.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_fields() from public, anon, authenticated;

-- is_admin() se usa dentro de las políticas RLS para usuarios autenticados,
-- así que se mantiene ejecutable por 'authenticated' pero no por 'anon'.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
