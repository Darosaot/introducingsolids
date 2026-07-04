-- ============================================================================
-- Endpoint mínimo para el keep-alive (evitar la auto-pausa del plan free).
-- `ping()` solo devuelve la hora del servidor: no lee ni expone datos, pero
-- es una llamada real a la base de datos, suficiente para mantenerla activa.
-- Ejecutable por `anon` para poder llamarlo con la clave pública desde un cron.
-- ============================================================================
create or replace function public.ping()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
