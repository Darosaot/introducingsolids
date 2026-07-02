import { describe, expect, it } from 'vitest';
import { MEAL_SLOTS, t } from './i18n';

describe('i18n / franjas de comida', () => {
  it('define las 5 franjas en el orden correcto', () => {
    expect(MEAL_SLOTS).toEqual([
      'breakfast',
      'morning_snack',
      'lunch',
      'afternoon_snack',
      'dinner',
    ]);
  });

  it('cada franja tiene etiqueta en español', () => {
    expect(t.slots.breakfast).toBe('Desayuno');
    expect(t.slots.morning_snack).toBe('Media mañana');
    expect(t.slots.lunch).toBe('Comida');
    expect(t.slots.afternoon_snack).toBe('Merienda');
    expect(t.slots.dinner).toBe('Cena');
  });

  it('los textos de navegación están en español', () => {
    expect(t.nav.calendar).toBe('Calendario');
    expect(t.nav.signOut).toBe('Cerrar sesión');
  });
});
