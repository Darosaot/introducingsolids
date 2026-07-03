-- ============================================================================
-- V2 — Estado por alimento (para la pestaña "Alimentos probados")
-- Registra, por alimento (nombre normalizado), si al bebé le gustó, no le
-- gustó, tuvo una reacción, o todo fue bien; más una nota opcional.
-- Compartido por todo el hogar.
-- ============================================================================

create table if not exists public.food_status (
  name_key     text primary key,           -- lower(trim(nombre))
  display_name text not null,
  reaction     text check (reaction in ('liked', 'disliked', 'reaction', 'ok')),
  notes        text not null default '',
  updated_by   uuid references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table public.food_status enable row level security;

drop policy if exists food_status_all on public.food_status;
create policy food_status_all on public.food_status
  for all using (public.is_active()) with check (public.is_active());
