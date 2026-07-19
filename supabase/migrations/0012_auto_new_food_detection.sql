-- ============================================================================
-- V12 — Detección automática de "alimento nuevo"
--   * is_new deja de ser manual: al insertar una comida, el servidor comprueba
--     si ese alimento (name_key) ya se registró antes en la familia. La
--     primera aparición cronológica se marca como nueva; las siguientes, no.
--   * Se recalcula también al renombrar un alimento en una fila existente.
--   * Funciona igual venga de donde venga el alta (catálogo, entrada manual,
--     registro rápido, planificador o copia de día/semana).
--   * Backfill: en el histórico, los registros que no son la primera aparición
--     de su alimento dejan de estar marcados como nuevos. No se marcan como
--     nuevas primeras apariciones que el usuario dejó sin marcar.
-- ============================================================================

-- Índice para la comprobación de primera aparición (por familia y alimento).
create index if not exists meal_items_household_food_idx
  on public.meal_items (household_id, name_key, day);

create or replace function public.set_meal_item_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name_key := public.normalize_food_name(new.name);
  new.updated_at := now();

  -- Detección automática de alimento nuevo: la fila es "nueva" si no existe
  -- otra aparición anterior (día previo, o mismo día creada antes) del mismo
  -- alimento en la familia. Solo se calcula al crear o al cambiar de nombre.
  if tg_op = 'INSERT' or new.name_key is distinct from old.name_key then
    new.is_new := new.name_key <> '' and not exists (
      select 1
      from public.meal_items m
      where m.household_id = new.household_id
        and m.name_key = new.name_key
        and m.id <> new.id
        and (m.day < new.day or (m.day = new.day and m.created_at <= new.created_at))
    );
  end if;

  return new;
end;
$$;

-- Backfill: desmarca como "nuevo" todo registro que no sea la primera
-- aparición cronológica de su alimento dentro de la familia.
with ranked as (
  select
    id,
    row_number() over (
      partition by household_id, name_key
      order by day asc, created_at asc, id asc
    ) as rn
  from public.meal_items
  where coalesce(name_key, '') <> ''
)
update public.meal_items mi
set is_new = false
from ranked r
where r.id = mi.id
  and r.rn > 1
  and mi.is_new;
