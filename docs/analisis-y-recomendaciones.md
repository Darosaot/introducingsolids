# Análisis integral y recomendaciones de mejora

> Revisión completa de la aplicación **Comidas del Bebé** (React + Vite + TypeScript,
> Supabase, Netlify Functions, PWA). Fecha: 2026-07-08.
> Cada hallazgo incluye **evidencia** (`archivo:línea`), **corrección propuesta** y
> **esfuerzo** estimado (S = horas, M = 1-2 días, L = semana+).

## Resumen ejecutivo

La aplicación está **bien construida para su tamaño**: RLS multi-tenant real, PWA
instalable con service worker prudente, TypeScript en modo `strict`, i18n
centralizado y una capa de lógica pura con buenos tests unitarios. Sin embargo hay
**una vulnerabilidad crítica de escalada de privilegios** (ya corregida en esta
entrega, ver §1.1) y varias oportunidades importantes en rendimiento, ausencia de
CI, accesibilidad y deuda de arquitectura.

| Área | Estado | Prioridad de mejora |
|---|---|---|
| Seguridad (RLS/auth) | 🔴 1 crítica (corregida) + endurecimientos | **P0** |
| Base de datos (índices/consultas) | 🟠 Índices FK ausentes, consultas sin límite | **P1** |
| Rendimiento frontend | 🟠 Doble fetch, sin caché, sin code-splitting | **P1** |
| CI/CD y calidad | 🔴 Sin CI, sin ESLint, sin tests de UI | **P1** |
| Arquitectura y código | 🟡 Ficheros «dios», duplicación, 3 `any` | **P2** |
| UX y accesibilidad | 🟡 Sin foco atrapado, sin modo oscuro, zoom bloqueado | **P2** |
| Producto / offline | 🟡 Sin datos offline, ruta iOS pendiente | **P3** |

---

## 1. Seguridad

### 1.1 🔴 CRÍTICO — Escalada de privilegios dentro de la familia *(CORREGIDO en esta entrega)*

**Problema.** La política `profiles_update` (`0007_multi_tenant_households.sql:171`)
permite a cada usuario actualizar su propia fila, y el trigger
`protect_profile_fields` (`0008_allow_service_role_profile_updates.sql:18-21`) solo
revertía `role` y `disabled`. Los campos de pertenencia `household_id` y
`household_role` quedaban **desprotegidos**. Cualquier miembro podía ejecutar:

```sql
update profiles set household_role = 'owner' where id = auth.uid();
```

y con ello pasar `is_owner()` (`0007:74`) y controlar el portal de administración de
la familia: renombrarla, regenerar el código de invitación y **deshabilitar o
ELIMINAR al dueño legítimo y al resto de miembros** vía la Netlify Function
(`admin-users.ts:53`). También podía cambiar `household_id` y saltar a otra familia
sin pasar por `join_household`.

**Corrección aplicada** (`supabase/migrations/0011_protect_household_membership.sql`,
ya aplicada al proyecto `scmwaisbvonczucbbwrx`). El trigger ahora también congela
`household_id`/`household_role` salvo para super-admin, `service_role` o los RPC de
confianza, que marcan una variable de sesión local `app.allow_membership_change`
antes de tocar la pertenencia. Verificado end-to-end: los dos intentos de exploit se
revierten, mientras que las ediciones normales (tema, nombre) y el onboarding
(`create_household`/`join_household`) siguen funcionando. **Esfuerzo: hecho.**

### 1.2 🟠 Códigos de invitación débiles y sin caducidad

`gen_join_code()` (`0009:12-30`) usa `random()` (PRNG no criptográfico) y los códigos
**nunca caducan ni se invalidan tras usarse**; `join_household` (`0009:84`) **no
tiene límite de intentos**. Recomendación: generar con `gen_random_bytes()`
(pgcrypto), añadir `join_code_expires_at` y rotación tras N usos, y un contador de
intentos por usuario/IP. **Esfuerzo: M.**

### 1.3 🟠 La función admin filtra mensajes de error crudos

El `catch` de `admin-users.ts:78-80` devuelve `e?.message` al cliente, exponiendo
texto interno de Postgres/Supabase. Registrar el error en el servidor y devolver un
mensaje genérico. **Esfuerzo: S.**

### 1.4 🟠 `createUser` puede dejar usuarios huérfanos

En `admin-users.ts:143-146` el `update` que asigna `household_id` al nuevo perfil
**no comprueba error**: si falla, el usuario de auth queda creado pero sin familia.
Envolver en verificación y revertir (borrar el auth user) si la asignación falla.
**Esfuerzo: S.**

### 1.5 🟡 Endurecimientos señalados por el linter de Supabase

- **`rls_auto_enable()` y `ping()` ejecutables por `anon`** como `SECURITY DEFINER`
  ([lint 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)).
  Revocar `execute` de `anon` donde no sea intencionado; `ping()` además **no fija
  `search_path`** (`0010:7`) — añadir `set search_path = public`.
- **Protección de contraseñas filtradas desactivada** (HaveIBeenPwned): activar en
  Authentication → Providers.
- Los helpers `SECURITY DEFINER` restantes son intencionadamente ejecutables por
  `authenticated`; documentarlo para silenciar el aviso.

**Esfuerzo: S.**

### 1.6 🟡 Deshabilitación a mitad de sesión no se refleja en cliente

`onAuthStateChange` (`AuthContext.tsx:78-87`) no revuelve a comprobar `disabled`, así
que un usuario deshabilitado mantiene la UI hasta recargar (aunque RLS ya le corta
todos los datos). Revalidar el perfil en cada evento de auth. **Esfuerzo: S.**

---

## 2. Base de datos

### 2.1 🟠 Claves foráneas sin índice (confirmado por el linter de rendimiento)

El linter de Supabase reporta FKs sin índice de cobertura:
`profiles.household_id` (la más impactante — se filtra en RLS y en la lista de
admin), `households.owner_id`, `meal_items.planned_item_id`,
`planned_meals.category_id/completed_meal_item_id/created_by`,
`day_notes.created_by`, `food_status.updated_by`
([lint 0001](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)).
Añadir índices en una migración. **Esfuerzo: S.**

### 2.2 🟠 Consultas RLS reevaluadas por fila

Las políticas `profiles_select/_update/_insert` (`0007:163-178`) usan `auth.uid()`
directamente, que se reevalúa por fila
([lint 0003](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)).
Sustituir por `(select auth.uid())` para que el planificador lo cachee.
**Esfuerzo: S.**

### 2.3 🟡 Índice compuesto para las lecturas del calendario

Las lecturas por rango de días de `meal_items` corren bajo el filtro de `household_id`
de RLS (`data.ts:257-266`). Un índice `(household_id, day)` sirve mejor que los
índices separados `(household_id)` + `(day)` actuales. Varios índices actuales figuran
como **no usados** (`meal_items_liking_idx`, `food_status_*_idx`…): revisarlos y
podarlos. **Esfuerzo: S.**

### 2.4 🟡 Higiene de migraciones

Algunos `ADD CONSTRAINT` de `0007` (`:133,141`) y `0009` (`:37`) no son idempotentes
(fallan si se reejecutan). Guardarlos con comprobación en `pg_constraint`. No hay
`supabase/config.toml` versionado. **Esfuerzo: S.**

---

## 3. Rendimiento frontend

### 3.1 🟠 Doble carga de toda la tabla en la pantalla de inicio

`TodayPage.load` (`TodayPage.tsx:54-61`) llama a `fetchAllMeals()` **y**
`fetchFoodsTried()`; cuando el RPC `get_food_summaries` no está, `fetchFoodsTried`
vuelve a llamar a `fetchAllMeals()` (`data.ts:627`). Resultado: `meal_items` se
descarga **dos veces** por carga. Pasar los `meals` ya cargados al agregador.
**Esfuerzo: M.**

### 3.2 🟠 Escaneo de tabla completo en cliente

`updateFoodCategory` (`data.ts:501-520`) trae **todas** las filas de `meal_items`
(`select('id, name, name_key')` sin filtro) y filtra por `name_key` en JS. Sustituir
por `.eq('name_key', nameKey)` en el servidor. **Esfuerzo: S.**

### 3.3 🟠 Sin capa de caché — refetch en cada navegación

`fetchFoodsTried` se recarga de forma independiente en Today, Foods, Planner y
FoodDetail (`TodayPage.tsx:57`, `FoodsPage.tsx:38`, `PlannerPage.tsx:37`). Introducir
**React Query/SWR** (o un contexto con caché) elimina refetches y da revalidación,
reintentos y estados de carga/error uniformes. **Esfuerzo: M.**

### 3.4 🟡 Sin code-splitting ni memoización

- No hay `React.lazy`/`Suspense`: `AdminPage` (444 líneas) y todas las vistas se
  cargan de inicio (`App.tsx:8-16`). Dividir por ruta. **Esfuerzo: M.**
- El `value` de `AuthContext` (`AuthContext.tsx:131-145`) y `ThemeContext`
  (`ThemeContext.tsx:66`) se recrea en cada render → todos los consumidores
  re-renderizan. Envolver en `useMemo`. **Esfuerzo: S.**
- Sin `React.memo` en celdas de calendario (35-365 botones) ni en `FoodCard`.
  `CalendarPage` pasa el array completo de `meals` a un modal de un solo día
  (`CalendarPage.tsx:231` → `DayModal.tsx:44`). **Esfuerzo: M.**

### 3.5 🟡 Consultas sin paginación

`fetchAllMeals` (`data.ts:269`) y `fetchFoodStatuses` (`data.ts:461`) hacen
`select('*')` sin límite; degradarán linealmente con el historial. Paginar o acotar
por rango. **Esfuerzo: M.**

---

## 4. CI/CD, testing y tooling

### 4.1 🔴 No hay CI que proteja las fusiones

El único workflow es `.github/workflows/keepalive.yml` (cron de mantenimiento).
**Nada** ejecuta `tsc`, tests ni build en PRs. Añadir un workflow
`npm ci && npm run lint && npm test && npm run build` en push/PR. **Esfuerzo: S.**

### 4.2 🟠 Sin ESLint ni Prettier

El script `lint` es solo `tsc --noEmit`. Falta `eslint-plugin-react-hooks` (crítico
en una app tan basada en hooks — nada detecta dependencias faltantes) y formateo.
Añadir ESLint + Prettier. **Esfuerzo: M.**

### 4.3 🟠 Cobertura de tests desigual

Buenos tests **unitarios de lógica pura** (`data.test.ts`, `date.test.ts`…), pero
**cero** tests de componentes/páginas (Testing Library está instalado y sin usar), y
sin tests de la capa de red de `data.ts` (39 llamadas a Supabase) ni de
`admin-users.ts` (el código más sensible). Priorizar: (1) autorización de la función
admin, (2) `copyDay`/`copyWeek`/`completePlannedMeal`/`upsertFoodStatus`,
(3) render de `DayModal`/`TodayPage`. **Esfuerzo: L.**

### 4.4 🟡 Dependencias y DX

Toolchain 1-2 majors por detrás: Vite 5→7, Vitest 2→3, react-router 6→7, evaluar
React 18→19. Sin `.nvmrc`/`.node-version` (README dice «Node 20+»). Sin validación de
variables de entorno al arrancar (`supabase.ts` solo avisa por consola). El
`VERSION='v1'` del service worker (`public/sw.js`) es fijo → riesgo de shell obsoleto
tras desplegar; derivarlo del build y avisar de actualización. **Esfuerzo: M.**

### 4.5 🟡 README desactualizado

La sección «Verificación» lista 2 ficheros de test (hay 7) y el modelo de datos
describe RLS por `user_id` (previo al modelo multi-familia de `0007`). Actualizar.
**Esfuerzo: S.**

---

## 5. Arquitectura y calidad de código

- **Ficheros «dios».** `data.ts` (952 líneas, mezcla IO y lógica pura),
  `TodayPage.tsx` (603, 9 componentes en un fichero), `index.css` (2000),
  `DayModal.tsx` (505), `AdminPage.tsx` (444). Separar lógica pura de IO en `data.ts`;
  extraer `QuickAddMeal`/`AllergenGuide`/`PlateCheck` de `TodayPage`. **Esfuerzo: L.**
- **Tipos `any`** en `withMealDefaults`/`withPlannedMealDefaults` (`data.ts:876,905`)
  y `admin.ts:18` — tipar las filas de la BD. **Esfuerzo: S.**
- **Duplicación:** color de respaldo `'#CBD5E1'` en 5 sitios
  (`CategoryDot.tsx:6`, `CalendarViews.tsx:32/128/171`, `FoodsPage.tsx:139`); la
  lógica de `upsertFoodStatus` reconstruida en 3 sitios
  (`FoodDetailPage.tsx:43`, `FoodsPage.tsx:57`, `DayModal.tsx:358`). Unificar en
  constantes/helpers. **Esfuerzo: M.**
- **Manejo de errores inconsistente:** `CalendarPage.load` solo hace `console.error`
  (`CalendarPage.tsx:81`) y `PlannerPage` no tiene `try/catch`
  (`PlannerPage.tsx:35-80`). Conectar al `useToast` existente. **Esfuerzo: S.**

---

## 6. UX y accesibilidad

- **Zoom bloqueado:** `user-scalable=no, maximum-scale=1.0` (`index.html:7`) — quitar,
  es una regresión de accesibilidad. **Esfuerzo: S.**
- **Modales sin foco atrapado ni restauración:** `DayModal` tiene Escape pero no
  atrapa el foco (`DayModal.tsx:57-63`); el diálogo de `ConfirmContext` no tiene ni
  Escape ni trampa de foco (`ConfirmContext.tsx:72`). Añadir focus-trap +
  restauración. **Esfuerzo: M.**
- **Sin modo oscuro ni `prefers-reduced-motion`:** 0 referencias en las 2000 líneas de
  `index.css`. Añadir tema oscuro y respetar movimiento reducido. **Esfuerzo: M.**
- **Estados de error/reintento:** `t.common.retry` existe pero no se renderiza en
  ninguna página; varias vistas no muestran error. **Esfuerzo: S.**
- **i18n con fugas:** ~15 literales en español fuera del diccionario `t`
  (`AllergenBadge.tsx:9`, `TodayPage.tsx:138/195/362`, `DayModal.tsx:109/190/249`…).
  Centralizarlos para permitir una futura traducción real. **Esfuerzo: M.**

---

## 7. Producto y offline

- **Sin datos offline:** el SW cachea solo el *shell* (`public/sw.js:30-33`); toda
  vista con datos queda en blanco sin red pese a ser instalable. Cachear las últimas
  consultas o mostrar un estado explícito «sin conexión». **Esfuerzo: M.**
- **Ruta iOS:** `docs/app-movil-ios.md` ya la documenta bien (PWA → Capacitor →
  nativo). El siguiente paso natural es la PWA actual; para App Store, el único cambio
  real de código es el *deep-linking* del magic-link de Supabase
  (`comidasbebe://`). **Esfuerzo: L (cuando se decida).**
- **Datos personales en el repo:** `seed_july2026.sql:14,100` incrusta el correo
  personal del dueño; parametrizarlo. **Esfuerzo: S.**

---

## 8. Hoja de ruta sugerida

| Fase | Contenido | Objetivo |
|---|---|---|
| **P0 — Seguridad** | ✅ Vuln. crítica (§1.1, hecho) · error leakage (§1.3) · `createUser` huérfano (§1.4) · endurecimientos linter (§1.5) | Cerrar riesgos explotables |
| **P1 — Fundamentos** | CI (§4.1) · índices FK + RLS `(select auth.uid())` (§2.1-2.2) · doble fetch y escaneo (§3.1-3.2) · caché de datos (§3.3) | Evitar regresiones y acelerar |
| **P2 — Calidad** | ESLint (§4.2) · tests de UI/red (§4.3) · dividir ficheros «dios» (§5) · accesibilidad de modales y zoom (§6) | Mantenibilidad |
| **P3 — Producto** | Modo oscuro · datos offline (§7) · upgrades de toolchain (§4.4) · ruta iOS | Crecimiento |

> Referencias de linter: los enlaces `database-linter?lint=NNNN` remiten a la guía de
> remediación de Supabase para cada aviso.
