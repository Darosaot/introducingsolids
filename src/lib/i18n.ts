import type { MealSlot } from './types';

/** Todos los textos visibles de la aplicación (español). */
export const t = {
  appName: 'Comidas del Bebé',
  tagline: 'Seguimiento de la alimentación',

  // Navegación
  nav: {
    calendar: 'Calendario',
    categories: 'Categorías',
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
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    empty: 'Nada aún',
    confirmDelete: '¿Eliminar este alimento?',
    add: 'Añadir',
    close: 'Cerrar',
  },

  // Categorías
  categories: {
    title: 'Categorías de alimentos',
    subtitle: 'Personaliza el nombre y el color de cada categoría.',
    name: 'Nombre',
    color: 'Color',
    save: 'Guardar cambios',
    saved: 'Cambios guardados',
    legend: 'Leyenda',
    reset: 'Restaurar colores por defecto',
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
