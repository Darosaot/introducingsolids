# 🍼 Comidas del Bebé — Seguimiento de la alimentación

Aplicación web (V1, en **español**) para registrar las comidas de un bebé en un
calendario con vistas por **día, semana, mes y año**. Cada día tiene cinco
franjas (Desayuno, Media mañana, Comida, Merienda, Cena) y cada alimento se
clasifica por categoría con un color personalizable.

- **Frontend:** React + Vite + TypeScript
- **Backend:** Supabase (autenticación, base de datos PostgreSQL, RLS)
- **Funciones serverless:** Netlify Functions (gestión de usuarios por administradores)
- **Despliegue:** Netlify

---

## ✨ Funcionalidades

- 📅 **Calendario** con vistas Día / Semana / Mes / Año. La vista principal es el
  **mes**; las semanas van de **lunes a domingo**; fechas reales de 2026 y 2027.
- 🍽️ **5 franjas de comida** por día. Añadir, editar y eliminar alimentos de forma rápida.
- 🎨 **Categorías con color** (Proteína, Legumbres, Verduras, Fruta, Lácteos,
  Cereales, Otros) — los colores y nombres se pueden **personalizar**.
- 🔐 **Autenticación** con Supabase (iniciar y cerrar sesión).
- 👤 **Portal de administración**: ver, crear, editar rol, deshabilitar y eliminar usuarios.
- 🛡️ **Seguridad**: Row Level Security — cada usuario solo accede a sus propios
  datos. La clave de servicio nunca se expone en el navegador.
- 📱 Diseño limpio y **responsive** (móvil y escritorio).

---

## 🧱 Estructura del proyecto

```
├── index.html
├── netlify.toml                     # build + redirección SPA + funciones
├── netlify/functions/
│   └── admin-users.ts               # gestión de usuarios (usa la clave de servicio)
├── supabase/migrations/
│   ├── 0001_init.sql                # tablas, RLS, triggers, categorías por defecto
│   └── 0002_harden_functions.sql    # endurecimiento de funciones SECURITY DEFINER
└── src/
    ├── context/                     # AuthContext, CategoriesContext
    ├── components/                   # Calendario, DayModal, Layout, Legend…
    ├── pages/                        # Login, Calendario, Categorías, Admin
    └── lib/                          # supabase, data, admin, date, i18n, types
```

---

## 🚀 Puesta en marcha local

### 1. Requisitos
- Node.js 20+ y npm

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
Copia el ejemplo y rellena tus credenciales de Supabase (ver siguiente sección):
```bash
cp .env.example .env
```
```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```
> `VITE_SUPABASE_ANON_KEY` es una clave **pública** (segura para el navegador);
> la protección real la dan las políticas RLS. **Nunca** pongas la clave de
> servicio en variables `VITE_`.

### 4. Arrancar
```bash
npm run dev          # http://localhost:5173
```

Otros comandos:
```bash
npm run build        # comprueba tipos y compila a dist/
npm run test         # tests unitarios (Vitest)
npm run preview      # sirve el build de producción
```

> ⚠️ El portal de administración usa una **Netlify Function**. Bajo `npm run dev`
> esa función no existe, así que la lista de usuarios mostrará un aviso. Para
> probarla en local usa `netlify dev` (ver más abajo).

---

## 🗄️ Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los ficheros de `supabase/migrations/`:
   - `0001_init.sql`
   - `0002_harden_functions.sql`

   (O con la CLI de Supabase: `supabase db push`.)

   Esto crea las tablas `profiles`, `categories` y `meal_items`, activa RLS,
   y añade un trigger que, al registrarse un usuario, crea su perfil y siembra
   las 7 categorías por defecto.

3. En **Project Settings → API** copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (solo para Netlify, **secreta**)

4. **Confirmación de correo (opcional):** en **Authentication → Providers → Email**
   puedes desactivar "Confirm email" para pruebas, o dejarla activa en producción.

5. **Crear el primer administrador:** regístrate desde la app y luego, en el
   SQL Editor, ejecuta:
   ```sql
   update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
   ```
   A partir de ahí ese usuario podrá crear y gestionar el resto desde el portal.

### Modelo de datos y seguridad
- `profiles` — un registro por usuario (`role`: `admin` | `user`, `disabled`).
- `categories` — categorías de alimentos por usuario, con color.
- `meal_items` — cada alimento en una franja de un día.
- **RLS:** `categories` y `meal_items` son accesibles solo por su dueño
  (`user_id = auth.uid()`). En `profiles`, cada usuario ve/edita su fila y los
  administradores pueden ver/gestionar todas. Un trigger impide que un usuario
  normal se cambie a sí mismo el rol o el estado.

---

## ☁️ Despliegue en Netlify

1. Conecta el repositorio en Netlify. La configuración de build ya está en
   `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
   - Redirección SPA (`/* → /index.html`) incluida.

2. En **Site settings → Environment variables** añade:

   | Variable | Valor | Ámbito |
   |---|---|---|
   | `VITE_SUPABASE_URL` | URL del proyecto Supabase | build (navegador) |
   | `VITE_SUPABASE_ANON_KEY` | anon/public key | build (navegador) |
   | `SUPABASE_URL` | misma URL del proyecto | funciones |
   | `SUPABASE_SERVICE_ROLE_KEY` | **service_role key** (secreta) | funciones |

   > `SUPABASE_SERVICE_ROLE_KEY` **no** lleva prefijo `VITE_`: se usa únicamente
   > en el runtime de las funciones serverless y nunca llega al navegador.

3. Despliega. La función de administración queda en
   `/.netlify/functions/admin-users`.

### Probar las funciones en local
```bash
npm i -g netlify-cli
netlify dev          # sirve la app + las funciones con las variables de entorno
```

---

## ✅ Verificación

Los flujos principales se han verificado de extremo a extremo contra un proyecto
Supabase real (inicio/cierre de sesión, vista mensual lunes→domingo, añadir /
editar / eliminar alimentos, cambiar colores de categoría y acceso al portal de
administración). Además hay tests unitarios:

```bash
npm run test
```
- `src/lib/date.test.ts` — semanas lunes→domingo, rejilla mensual, fechas de 2026/2027.
- `src/lib/i18n.test.ts` — franjas de comida y textos en español.

---

## 🔒 Notas de seguridad
- No se exponen secretos en el frontend; solo la `anon key` pública.
- La clave `service_role` vive exclusivamente en las Netlify Functions.
- RLS activa en todas las tablas de datos.
- Las funciones `SECURITY DEFINER` no son invocables por la API pública
  (ver `0002_harden_functions.sql`).
