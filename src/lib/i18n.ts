import type { Liking, MealSlot, ReactionStatus, Texture } from './types';

/** Todos los textos visibles de la aplicación (español). */
export const t = {
  appName: 'Comidas del Bebé',
  tagline: 'Seguimiento de la alimentación',

  // Navegación
  nav: {
    today: 'Hoy',
    calendar: 'Calendario',
    foods: 'Alimentos',
    planner: 'Planificar',
    settings: 'Ajustes',
    admin: 'Administración',
    signOut: 'Cerrar sesión',
  },

  // Autenticación
  auth: {
    signInTitle: 'Iniciar sesión',
    signUpTitle: 'Crear cuenta',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signInButton: 'Entrar',
    signUpButton: 'Registrarse',
    toggleToSignUp: '¿No tienes cuenta? Regístrate',
    toggleToSignIn: '¿Ya tienes cuenta? Inicia sesión',
    signingIn: 'Entrando…',
    signingUp: 'Creando cuenta…',
    signUpSuccess:
      'Cuenta creada. Revisa tu correo si se requiere confirmación, luego inicia sesión.',
    accountDisabled: 'Tu cuenta está deshabilitada. Contacta con un administrador.',
    missingConfig:
      'La aplicación no está configurada. Faltan las variables de entorno de Supabase.',
    genericError: 'No se pudo completar la operación. Revisa tus datos e inténtalo de nuevo.',
    invalidCredentials: 'Correo o contraseña incorrectos.',
  },

  // Calendario
  calendar: {
    views: {
      day: 'Día',
      week: 'Semana',
      month: 'Mes',
      year: 'Año',
    },
    today: 'Hoy',
    prev: 'Anterior',
    next: 'Siguiente',
    noMeals: 'Sin comidas registradas',
    weekOf: 'Semana del',
  },

  // Franjas de comida
  slots: {
    breakfast: 'Desayuno',
    morning_snack: 'Media mañana',
    lunch: 'Comida',
    afternoon_snack: 'Merienda',
    dinner: 'Cena',
  } as Record<MealSlot, string>,

  // Editor de día / comidas
  meals: {
    addFood: 'Añadir alimento',
    foodName: 'Nombre del alimento',
    category: 'Categoría',
    texture: 'Textura',
    isNew: 'Alimento nuevo',
    isNewShort: 'Nuevo',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    empty: 'Nada aún',
    confirmDelete: '¿Eliminar este alimento?',
    add: 'Añadir',
    close: 'Cerrar',
    dayNotes: 'Notas del día',
    dayNotesPlaceholder: 'Reacciones, cómo comió, observaciones…',
    copyDay: 'Copiar día',
    copyDayTo: 'Copiar este día a…',
    copyWeek: 'Copiar semana',
    copyWeekTo: 'Copiar esta semana a (lunes destino)…',
    copied: 'Copiado',
    nothingToCopy: 'No hay nada que copiar',
    append: 'Añadir sin borrar',
    replace: 'Reemplazar destino',
    planned: 'Planificado',
  },

  // Texturas de los alimentos
  textures: {
    puree: { label: 'Puré', icon: '🥣' },
    mashed: { label: 'Machacado', icon: '🥄' },
    chunks: { label: 'Trozos', icon: '🍽️' },
  },

  // Reacciones / cómo le sentó el alimento
  reactions: {
    liked: { label: 'Le gustó', icon: '😋' },
    disliked: { label: 'No le gustó', icon: '😖' },
    reaction: { label: 'Reacción', icon: '⚠️' },
    ok: { label: 'Todo bien', icon: '✅' },
  },

  // Temas de color
  themes: {
    title: 'Apariencia',
    subtitle: 'Elige la gama de color de la aplicación.',
    verde: 'Verde',
    rosa: 'Rosa',
    azul: 'Azul',
    neutro: 'Neutro',
  },

  // Ajustes / Categorías
  categories: {
    title: 'Categorías de alimentos',
    subtitle: 'Personaliza el nombre y el color de cada categoría, o crea nuevas.',
    name: 'Nombre',
    color: 'Color',
    save: 'Guardar cambios',
    saved: 'Cambios guardados',
    legend: 'Leyenda',
    reset: 'Restaurar colores por defecto',
    newTitle: 'Nueva categoría',
    newNamePlaceholder: 'Nombre de la categoría',
    add: 'Crear categoría',
    confirmDelete: '¿Eliminar esta categoría? Los alimentos que la usen quedarán sin categoría.',
    deleteAria: 'Eliminar categoría',
  },

  // Ajustes (página)
  settings: {
    title: 'Ajustes',
  },

  // Página "Alimentos probados"
  foods: {
    title: 'Alimentos probados',
    subtitle: 'Todos los alimentos que ha probado el bebé, por categoría.',
    empty: 'Aún no hay alimentos registrados.',
    times: 'veces',
    once: 'vez',
    firstTime: 'Primera vez',
    noCategory: 'Sin categoría',
    howLiked: '¿Le gustó?',
    howReacted: '¿Hubo reacción?',
    notesPlaceholder: 'Notas sobre este alimento…',
    saved: 'Guardado',
    newBadge: 'Nuevo',
    search: 'Buscar alimento',
    allCategories: 'Todas las categorías',
    allLiking: 'Todos (le gustó)',
    allReactions: 'Todas (reacciones)',
    unrated: 'Sin evaluar',
    onlyNew: 'Primeras veces',
    onlyAllergens: 'Alérgenos',
    sort: 'Ordenar',
    sortName: 'Nombre',
    sortFirst: 'Primera vez',
    sortLast: 'Última vez',
    sortCount: 'Más ofrecidos',
    firstTried: 'Primera vez',
    lastOffered: 'Última vez',
    timesOffered: 'Veces ofrecido',
    planAgain: 'Planificar de nuevo',
  },

  today: {
    title: 'Hoy',
    subtitle: 'Qué ha comido, cómo fue y qué conviene tener presente.',
    empty: 'Aún no hay comidas para hoy.',
    addFood: 'Añadir alimento',
    summary: 'Resumen de hoy',
    recentNew: 'Nuevos alimentos recientes',
    watch: 'Reacciones a vigilar',
    suggestions: 'Sugerencias',
    planned: 'Planificado para hoy',
    allergens: 'Alérgenos introducidos',
    foodsToday: 'alimentos hoy',
    newToday: 'nuevos',
    reactionsToday: 'reacciones',
    noteToday: 'nota del día',
    noSuggestions: 'Cuando haya más historial aparecerán alimentos para reintentar.',
  },

  planner: {
    title: 'Planificar',
    subtitle: 'Organiza la semana y convierte lo planificado en comidas reales.',
    add: 'Planificar alimento',
    complete: 'Marcar como comido',
    shopping: 'Lista de compra',
    retry: 'Alimentos para reintentar',
    newThisWeek: 'Ideas para nuevos alimentos',
    empty: 'No hay alimentos planificados esta semana.',
  },

  confirm: {
    deleteFood: '¿Eliminar este alimento?',
    deleteCategory: '¿Eliminar esta categoría?',
    deleteUser: '¿Eliminar este usuario?',
    disableUser: '¿Cambiar el estado de este usuario?',
    roleUser: '¿Cambiar el rol de este usuario?',
    copyDay: 'Copiar día',
    copyWeek: 'Copiar semana',
    cancel: 'Cancelar',
    delete: 'Eliminar',
  },

  // Administración
  admin: {
    title: 'Administración de usuarios',
    subtitle: 'Ver, crear, editar, deshabilitar o eliminar usuarios.',
    createUser: 'Crear usuario',
    email: 'Correo',
    password: 'Contraseña',
    role: 'Rol',
    status: 'Estado',
    lastSignIn: 'Último acceso',
    actions: 'Acciones',
    roleAdmin: 'Administrador',
    roleUser: 'Usuario',
    active: 'Activo',
    disabled: 'Deshabilitado',
    enable: 'Habilitar',
    disable: 'Deshabilitar',
    makeAdmin: 'Hacer admin',
    makeUser: 'Hacer usuario',
    delete: 'Eliminar',
    create: 'Crear',
    confirmDelete: '¿Eliminar este usuario de forma permanente? Esta acción no se puede deshacer.',
    never: 'Nunca',
    you: '(tú)',
    loadError: 'No se pudo cargar la lista de usuarios.',
    notAdmin: 'No tienes permisos de administrador.',
    createSuccess: 'Usuario creado correctamente.',
  },

  common: {
    loading: 'Cargando…',
    error: 'Ha ocurrido un error.',
    retry: 'Reintentar',
  },
};

/** Orden fijo de las franjas de comida a lo largo del día. */
export const MEAL_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
];

export const TEXTURES: Texture[] = ['puree', 'mashed', 'chunks'];

/** Columna 1: si le gustó o no. Independiente de si hubo reacción. */
export const LIKING_OPTIONS: Liking[] = ['liked', 'disliked'];

/** Columna 2: reacciones/alergias. Independiente de si le gustó. */
export const REACTION_OPTIONS: ReactionStatus[] = ['reaction', 'ok'];
