# Llevar «Comidas del Bebé» a iOS

Notas sobre qué implica convertir esta web en una app de iPhone/iPad. La app
hoy es una web (React + Vite + Supabase). Con los cambios recientes ya es una
**PWA instalable**: se puede añadir a la pantalla de inicio con icono propio y
abrirse a pantalla completa, sin barra del navegador.

Hay tres caminos, de menos a más esfuerzo.

## Opción A — PWA (lo que ya tienes) · coste 0

Desde el móvil: **Compartir → «Añadir a pantalla de inicio»**. Aparece el icono
de plato y la app abre en modo standalone.

- **A favor:** gratis, sin App Store, sin revisión, se actualiza solo al
  desplegar en Netlify. Un único código para web + móvil.
- **En contra:** no está en la App Store (hay que instalarla «a mano»),
  las notificaciones push en iOS requieren iOS 16.4+ y que el usuario la
  instale, y Safari puede borrar el almacenamiento local si no se usa en
  semanas (no es problema aquí porque los datos viven en Supabase, no en el
  dispositivo).

Para la mayoría de familias esta opción **ya cubre el 90 %** de la sensación de
«app». Recomendado como punto de partida.

## Opción B — App nativa envolviendo la web (Capacitor) · esfuerzo medio ⭐ recomendada

[Capacitor](https://capacitorjs.com/) empaqueta la web actual dentro de un
contenedor nativo. Se reutiliza **todo el código React tal cual**; solo se
añade una carpeta `ios/`. Resultado: una app publicable en la App Store.

**Qué hace falta:**
- Un **Mac con Xcode** (obligatorio para compilar y firmar apps de iOS).
- **Apple Developer Program**: 99 USD/año.
- Icono y *splash screen* (ya tenemos el arte del icono; Capacitor genera los
  tamaños con `@capacitor/assets`).
- Política de privacidad publicada (obligatoria por ser cuentas + datos de
  alimentación de un bebé) y rellenar el «Nutrition Label» de privacidad.

**Pasos, a grandes rasgos:**
1. `npm i @capacitor/core @capacitor/ios && npx cap init`
2. `npm run build && npx cap add ios && npx cap sync`
3. Generar iconos/splash con `@capacitor/assets` a partir de `public/icon.svg`.
4. Ajustar el login de Supabase para móvil: los enlaces mágicos / OAuth deben
   volver a la app mediante un *deep link* (`comidasbebe://`) en vez de una URL
   web. Es el único punto que toca revisar del código actual.
5. Abrir en Xcode (`npx cap open ios`), firmar con la cuenta de desarrollador y
   subir a App Store Connect para revisión.

- **A favor:** en la App Store, aspecto de app nativa, acceso a push nativas,
  cámara, biometría, etc. **Se sigue manteniendo un único código.**
- **En contra:** necesitas Mac, cuota anual y pasar la revisión de Apple
  (suele tardar 1–3 días; puede pedir cambios).

**Esfuerzo realista:** 1–3 días de trabajo la primera vez (sobre todo cuenta,
certificados, deep link de Supabase y materiales de la ficha de la App Store).

## Opción C — Reescritura nativa (SwiftUI) o React Native · esfuerzo alto

Rehacer la interfaz con Swift/SwiftUI o React Native.

- **A favor:** máximo rendimiento y sensación 100 % nativa.
- **En contra:** es prácticamente **rehacer la app**; se duplica el
  mantenimiento (web + iOS por separado). No se justifica salvo que se busque
  algo muy específico de iOS. **No recomendado** para este proyecto.

## Recomendación

1. **Ahora:** quedarnos con la **PWA** (Opción A) — ya está lista.
2. **Si se quiere estar en la App Store:** ir a **Capacitor** (Opción B), que
   aprovecha el código actual. El principal trabajo técnico es el *deep link*
   del login de Supabase; el resto es cuenta de Apple y materiales de la ficha.
3. La reescritura nativa (Opción C) no compensa aquí.

> Nota: Android es equivalente. La PWA ya funciona, y Capacitor también genera
> el proyecto Android (`npx cap add android`) sin Mac y con una cuota única de
> 25 USD en Google Play.
