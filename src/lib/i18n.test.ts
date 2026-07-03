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

  it('define texturas con etiqueta e icono', () => {
    expect(t.textures.puree.label).toBe('Puré');
    expect(t.textures.mashed.label).toBe('Machacado');
    expect(t.textures.chunks.label).toBe('Trozos');
    for (const k of ['puree', 'mashed', 'chunks'] as const) {
      expect(t.textures[k].icon.length).toBeGreaterThan(0);
    }
  });

  it('define las 4 reacciones en español', () => {
    expect(t.reactions.liked.label).toBe('Le gustó');
    expect(t.reactions.disliked.label).toBe('No le gustó');
    expect(t.reactions.reaction.label).toBe('Reacción');
    expect(t.reactions.ok.label).toBe('Todo bien');
  });

  it('define los 4 temas de color', () => {
    expect(t.themes.verde).toBe('Verde');
    expect(t.themes.rosa).toBe('Rosa');
    expect(t.themes.azul).toBe('Azul');
    expect(t.themes.neutro).toBe('Neutro');
  });
});
