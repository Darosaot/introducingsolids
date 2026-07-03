-- ============================================================================
-- Carga del menú de Julio 2026 (Desayuno + Comida) — hogar compartido.
-- Transcrito del plan en papel. Los "+" se cargan como alimentos separados.
-- La primera aparición de cada alimento se marca como "nuevo" (is_new).
-- Reejecutable: primero borra las comidas de julio 2026.
--
-- El propietario (user_id) se resuelve por email; ajústalo si hace falta.
-- ============================================================================

delete from public.meal_items where day >= '2026-07-01' and day <= '2026-07-31';

with u as (
  select id as uid from auth.users
  where email = 'danielarosaotero@gmail.com'
  limit 1
),
cat as (select key, id from public.categories),
data(d, slot, name, cat_key, is_new) as (
  values
    -- Semana 1
    ('2026-07-01'::date, 'breakfast', 'Plátano',   'fruit',      true),
    ('2026-07-01'::date, 'lunch',     'Aguacate',  'fruit',      true),
    ('2026-07-02'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-02'::date, 'lunch',     'Calabacín', 'vegetables', true),
    ('2026-07-02'::date, 'lunch',     'Patata',    'vegetables', true),
    ('2026-07-03'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-03'::date, 'lunch',     'Calabacín', 'vegetables', false),
    ('2026-07-03'::date, 'lunch',     'Patata',    'vegetables', false),
    ('2026-07-04'::date, 'breakfast', 'Fresas',    'fruit',      true),
    ('2026-07-04'::date, 'lunch',     'Huevo',     'protein',    true),
    ('2026-07-05'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-05'::date, 'lunch',     'Huevo',     'protein',    false),
    -- Semana 2
    ('2026-07-06'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-06'::date, 'lunch',     'Huevo',     'protein',    false),
    ('2026-07-07'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-07'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-07'::date, 'lunch',     'Huevo',     'protein',    false),
    ('2026-07-08'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-08'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-08'::date, 'lunch',     'Brócoli',   'vegetables', true),
    ('2026-07-08'::date, 'lunch',     'Guisantes', 'legumes',    true),
    ('2026-07-09'::date, 'breakfast', 'Fresas',    'fruit',      false),
    ('2026-07-09'::date, 'lunch',     'Brócoli',   'vegetables', false),
    ('2026-07-09'::date, 'lunch',     'Guisantes', 'legumes',    false),
    ('2026-07-10'::date, 'breakfast', 'Pepino',    'vegetables', true),
    ('2026-07-10'::date, 'lunch',     'Pollo',     'protein',    true),
    ('2026-07-11'::date, 'breakfast', 'Pepino',    'vegetables', false),
    ('2026-07-11'::date, 'lunch',     'Pollo',     'protein',    false),
    ('2026-07-12'::date, 'breakfast', 'Fresas',    'fruit',      false),
    ('2026-07-12'::date, 'lunch',     'Cacahuete', 'legumes',    true),
    -- Semana 3
    ('2026-07-13'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-13'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-13'::date, 'lunch',     'Cacahuete', 'legumes',    false),
    ('2026-07-14'::date, 'breakfast', 'Fresas',    'fruit',      false),
    ('2026-07-14'::date, 'lunch',     'Cacahuete', 'legumes',    false),
    ('2026-07-15'::date, 'breakfast', 'Pepino',    'vegetables', false),
    ('2026-07-15'::date, 'lunch',     'Cacahuete', 'legumes',    false),
    ('2026-07-16'::date, 'breakfast', 'Manzana',   'fruit',      true),
    ('2026-07-16'::date, 'breakfast', 'Pera',      'fruit',      true),
    ('2026-07-16'::date, 'lunch',     'Pollo',     'protein',    false),
    ('2026-07-16'::date, 'lunch',     'Patata',    'vegetables', false),
    ('2026-07-16'::date, 'lunch',     'Fresas',    'fruit',      false),
    -- Semana 4
    ('2026-07-20'::date, 'breakfast', 'Manzana',   'fruit',      false),
    ('2026-07-20'::date, 'breakfast', 'Pera',      'fruit',      false),
    ('2026-07-20'::date, 'lunch',     'Huevo',     'protein',    false),
    ('2026-07-21'::date, 'breakfast', 'Manzana',   'fruit',      false),
    ('2026-07-21'::date, 'breakfast', 'Pera',      'fruit',      false),
    ('2026-07-21'::date, 'lunch',     'Pollo',     'protein',    false),
    ('2026-07-22'::date, 'breakfast', 'Plátano',   'fruit',      false),
    ('2026-07-22'::date, 'breakfast', 'Aguacate',  'fruit',      false),
    ('2026-07-22'::date, 'lunch',     'Garbanzos', 'legumes',    true),
    ('2026-07-22'::date, 'lunch',     'Berenjena', 'vegetables', true),
    ('2026-07-23'::date, 'breakfast', 'Fresas',    'fruit',      false),
    ('2026-07-23'::date, 'lunch',     'Garbanzos', 'legumes',    false),
    ('2026-07-23'::date, 'lunch',     'Berenjena', 'vegetables', false),
    ('2026-07-24'::date, 'breakfast', 'Pan',       'grains',     true),
    ('2026-07-24'::date, 'lunch',     'Pollo',     'protein',    false),
    ('2026-07-24'::date, 'lunch',     'Patata',    'vegetables', false),
    ('2026-07-24'::date, 'lunch',     'Pepino',    'vegetables', false),
    ('2026-07-25'::date, 'breakfast', 'Pan',       'grains',     false),
    ('2026-07-25'::date, 'lunch',     'Garbanzos', 'legumes',    false),
    ('2026-07-25'::date, 'lunch',     'Plátano',   'fruit',      false),
    ('2026-07-26'::date, 'breakfast', 'Pan',       'grains',     false),
    ('2026-07-26'::date, 'lunch',     'Huevo',     'protein',    false),
    ('2026-07-26'::date, 'lunch',     'Patata',    'vegetables', false),
    ('2026-07-26'::date, 'lunch',     'Zanahoria', 'vegetables', true)
)
insert into public.meal_items (user_id, day, slot, name, category_id, is_new)
select u.uid, data.d, data.slot::public.meal_slot, data.name, cat.id, data.is_new
from data
cross join u
left join cat on cat.key = data.cat_key;

-- Notas: dos comidas estaban marcadas como tentativas ("?") en el papel.
insert into public.day_notes (day, note, created_by)
select d, 'Tentativo (marcado con "?" en el plan original).',
       (select id from auth.users where email = 'danielarosaotero@gmail.com' limit 1)
from (values ('2026-07-20'::date), ('2026-07-21'::date)) as x(d)
on conflict (day) do nothing;
