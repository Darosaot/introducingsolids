import type { Liking, MealSlot, ReactionStatus, Texture } from './types';

/** Todos los textos visibles de la aplicación (español). */
export const t = {
  appName: 'Comidas del Bebé',
  tagline: 'Seguimiento de la alimentación',

  // Landing / presentación en la pantalla de inicio de sesión
  landing: {
    headline: 'La introducción de sólidos de tu bebé, sin agobios',
    sub: 'Registra cada comida y deja que la app te guíe con lo que de verdad importa —hierro, alérgenos y seguridad— siguiendo el enfoque BLW/BLISS.',
    features: [
      { icon: '📅', title: 'Diario del día a día', text: 'Registra las comidas por franjas y revísalas por día, semana, mes o año.' },
      { icon: '🍽️', title: 'Plato completo', text: 'Comprueba de un vistazo si el día lleva hierro + energía + fruta/verdura, y te avisa si falta el hierro.' },
      { icon: '⚠️', title: 'Seguridad por edad', text: 'Te avisa al registrar miel, sal, pescados grandes o alimentos con riesgo de atragantamiento según la edad del bebé.' },
      { icon: '🧬', title: 'Alérgenos con cabeza', text: 'Sigue el protocolo de 3 días seguidos y controla qué alérgenos ya has introducido.' },
      { icon: '🥗', title: 'Alimentos probados', text: 'Guarda si le gustó y si hubo reacción, con notas por cada alimento.' },
      { icon: '👨‍👩‍👧', title: 'En familia', text: 'Varios cuidadores comparten el mismo diario. Invita con un código o un enlace.' },
    ],
    ctaTitle: 'Empieza gratis',
    ctaSub: 'Crea tu cuenta y la familia de tu bebé en un minuto.',
    disclaimer: 'Guía orientativa basada en materiales de pediatría (alimentación complementaria y BLW). No sustituye el consejo de tu pediatra.',
  },

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

  // Onboarding (crear o unirse a una familia)
  onboarding: {
    title: 'Empieza',
    subtitle: 'Crea la familia de tu bebé. Es un espacio privado; podrás invitar a otros cuidadores después.',
    createTab: 'Crear familia',
    joinTab: 'Unirme con código',
    joinSubtitle: 'Introduce el código que te ha compartido el administrador de la familia.',
    nameLabel: 'Nombre de la familia',
    namePlaceholder: 'Ej. Familia Pérez',
    codeLabel: 'Código de la familia',
    codePlaceholder: 'Ej. Q2DGWR5D',
    create: 'Crear familia',
    join: 'Unirme a la familia',
    working: 'Un momento…',
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

  // Catálogo de alimentos / selector
  catalog: {
    label: 'Catálogo',
    searchPlaceholder: 'Busca en el catálogo o escribe un alimento…',
    alreadyTried: 'Ya probado',
    willBeNew: 'Primera vez: se marcará como «Nuevo» automáticamente',
    manualNotFound: 'no está en el catálogo: se registrará manualmente y quedará guardado para reutilizarlo.',
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

  baby: {
    title: 'Perfil del bebé',
    subtitle: 'Usa la edad y el inicio de sólidos como referencia para el seguimiento diario.',
    name: 'Nombre',
    birthDate: 'Fecha de nacimiento',
    solidsStartDate: 'Inicio de alimentación complementaria',
    save: 'Guardar perfil',
    saved: 'Perfil guardado',
    age: 'Edad',
    solidsAge: 'Tiempo con sólidos',
    ageUnavailable: 'Edad no disponible',
    setupTitle: 'Completa el perfil del bebé',
    setupBody: 'Añade fecha de nacimiento e inicio de sólidos para ver edad, semanas con AC y mejores recordatorios.',
    setupAction: 'Completar en Administración',
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
    onlyNew: 'Nuevos (últimos 7 días)',
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
    quickAdd: 'Registro rápido',
    quickAddHint: 'Añade un alimento sin abrir el editor completo del día.',
    quickAddPlaceholder: 'Ej. lentejas, huevo, aguacate…',
    quickAdded: 'Alimento añadido',
    guideHint: 'Guía AC/BLW',
    guideRule: 'Un alimento nuevo cada 2-4 días. Si es alérgeno, repetir 3 días seguidos y no introducir otros nuevos.',
    allergenDetected: 'Posible alérgeno',
    pendingAllergens: 'Pendientes',
    introducedAllergens: 'Introducidos',
    allergenDays: 'días',
    allergenDinnerWarn: 'No introduzcas un alérgeno nuevo antes de dormir (evítalo en la cena).',
    allergenTwoNewWarn: 'Ya hay otro alérgeno nuevo hoy; ofrece solo uno nuevo a la vez',
    summary: 'Resumen de hoy',
    recentNew: 'Nuevos alimentos recientes',
    watch: 'Reacciones a vigilar',
    suggestions: 'Sugerencias',
    planned: 'Planificado para hoy',
    allergens: 'Alérgenos introducidos',
    plateTitle: 'Plato completo hoy',
    plateIron: 'Hierro',
    plateEnergy: 'Energía',
    plateFruitVeg: 'Fruta/verdura',
    plateNoIron: 'Falta hierro',
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
    newThisWeek: 'Nuevos esta semana',
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

  // Familia (gestión desde Administración)
  family: {
    sectionTitle: 'Familia',
    nameLabel: 'Nombre de la familia',
    save: 'Guardar nombre',
    saved: 'Nombre de la familia actualizado',
    ownerOnly: 'Solo el dueño de la familia puede cambiar el nombre.',
    membersTitle: 'Miembros de la familia',
    addTitle: 'Añadir miembro',
    addHint: 'Crea la cuenta de otro cuidador; entrará directamente a este mismo diario. También puedes compartir el código o el enlace de abajo para que se una al registrarse.',
    ownerBadge: 'Dueño',
    memberBadge: 'Miembro',
    inviteTitle: 'Invitar con código',
    inviteHint: 'Comparte este código o el enlace; al registrarse, la persona podrá unirse a esta familia.',
    copyCode: 'Copiar código',
    copyLink: 'Copiar enlace',
    regenerate: 'Regenerar',
    regenerateConfirm: 'El código actual dejará de funcionar y se generará uno nuevo. ¿Continuar?',
    codeCopied: 'Código copiado',
    linkCopied: 'Enlace copiado',
    codeRegenerated: 'Código regenerado',
  },

  // Administración
  admin: {
    title: 'Gestión de la familia',
    subtitle: 'Renombra tu familia y gestiona quién puede ver y editar el diario.',
    createUser: 'Añadir miembro',
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
