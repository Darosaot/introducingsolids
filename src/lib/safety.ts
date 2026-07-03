// Avisos de seguridad por edad basados en la guía de AC/BLW (§7–8).
//
// Reutiliza el patrón de detección por palabras clave de `inferAllergenKeys`
// (`src/lib/data.ts`), pero con coincidencia por *palabra completa* en lugar de
// subcadena: así "sal" no se dispara con "ensalada" o "salmón".

export type SafetySeverity = 'avoid' | 'caution';

export interface SafetyRule {
  id: string;
  keywords: string[];
  /** Meses hasta los que aplica el aviso. `null` = evitar siempre. */
  untilMonths: number | null;
  severity: SafetySeverity;
  label: string;
  message: string;
}

export interface SafetyWarning {
  id: string;
  severity: SafetySeverity;
  label: string;
  message: string;
}

/** Normaliza texto para comparar: minúsculas, sin acentos, espacios colapsados. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const M = { year: 12, twoYears: 24, threeYears: 36, fiveYears: 60, sixYears: 72, tenYears: 120 };

/** Reglas derivadas de la tabla "Alimentos a evitar según la edad" de la guía. */
export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'honey',
    keywords: ['miel'],
    untilMonths: M.year,
    severity: 'avoid',
    label: 'Miel',
    message: 'Riesgo de botulismo: evitar la miel hasta los 12 meses.',
  },
  {
    id: 'cow_milk',
    keywords: ['leche de vaca', 'leche entera', 'leche de cabra'],
    untilMonths: M.year,
    severity: 'avoid',
    label: 'Leche de vaca',
    message: 'La leche de vaca como bebida no se recomienda hasta los 12 meses (en cocina, en pequeñas cantidades, sí).',
  },
  {
    id: 'salt',
    keywords: ['sal'],
    untilMonths: M.twoYears,
    severity: 'avoid',
    label: 'Sal',
    message: 'No añadir sal hasta los 2 años. Muchos alimentos ya contienen sal de forma natural.',
  },
  {
    id: 'sugar',
    keywords: ['azucar'],
    untilMonths: M.twoYears,
    severity: 'avoid',
    label: 'Azúcar',
    message: 'No añadir azúcar hasta los 2 años.',
  },
  {
    id: 'rice_cakes',
    keywords: ['tortita de arroz', 'tortitas de arroz', 'leche de arroz'],
    untilMonths: M.sixYears,
    severity: 'avoid',
    label: 'Arroz (tortitas/leche)',
    message: 'Las tortitas y la leche de arroz no se recomiendan hasta los 6 años (arsénico).',
  },
  {
    id: 'big_fish',
    keywords: ['atun rojo', 'emperador', 'pez espada', 'tiburon', 'lucio', 'cazon'],
    untilMonths: M.tenYears,
    severity: 'avoid',
    label: 'Pez grande',
    message: 'Pescados grandes con alto metilmercurio: evitar hasta los 10 años.',
  },
  {
    id: 'escolar',
    keywords: ['escolar', 'pez mantequilla'],
    untilMonths: null,
    severity: 'avoid',
    label: 'Escolar',
    message: 'Pez mantequilla/escolar: evitar (puede causar problemas digestivos).',
  },
  {
    id: 'processed_meat',
    keywords: ['salchicha', 'embutido', 'chorizo', 'mortadela', 'salami', 'fuet', 'jamon', 'bacon', 'beicon'],
    untilMonths: null,
    severity: 'avoid',
    label: 'Embutido / procesado',
    message: 'Embutidos y carnes procesadas: evitar (exceso de sal y aditivos).',
  },
  {
    id: 'borage',
    keywords: ['borraja'],
    untilMonths: M.threeYears,
    severity: 'avoid',
    label: 'Borraja',
    message: 'Borraja: evitar hasta los 3 años (nitratos).',
  },
  {
    id: 'leafy_greens',
    keywords: ['espinaca', 'espinacas', 'acelga', 'acelgas'],
    untilMonths: M.threeYears,
    severity: 'caution',
    label: 'Espinacas / acelgas',
    message: 'Limitar la cantidad (nitratos): 6–12 m no más de 35 g/día. No dar con infección gastrointestinal.',
  },
  {
    id: 'grapes',
    keywords: ['uva', 'uvas'],
    untilMonths: M.fiveYears,
    severity: 'caution',
    label: 'Uvas',
    message: 'Corta las uvas a lo largo en cuartos; enteras son riesgo de atragantamiento hasta los 5 años.',
  },
  {
    id: 'whole_nuts',
    keywords: ['frutos secos', 'fruto seco'],
    untilMonths: M.fiveYears,
    severity: 'caution',
    label: 'Frutos secos',
    message: 'Ofrece los frutos secos molidos o en crema, nunca enteros (atragantamiento) hasta los 5 años.',
  },
  {
    id: 'raw_hard',
    keywords: ['zanahoria cruda', 'manzana cruda'],
    untilMonths: M.fiveYears,
    severity: 'caution',
    label: 'Crudo duro',
    message: 'Alimentos crudos y duros: adaptar el corte o cocinar para ablandar (atragantamiento) hasta los 5 años.',
  },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Coincidencia por palabra completa sobre el nombre ya normalizado. */
function matchesKeyword(normalizedName: string, keyword: string): boolean {
  const normalizedKeyword = normalizeForMatch(keyword);
  if (!normalizedKeyword) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?:[^a-z0-9]|$)`).test(normalizedName);
}

/**
 * Avisos de seguridad para un alimento según la edad del bebé.
 *
 * - Reglas "evitar siempre" (`untilMonths === null`) se muestran siempre.
 * - El resto solo cuando la edad es conocida y aún está por debajo del umbral.
 *   Si la edad es desconocida, solo se muestran las de "evitar siempre" para no
 *   alarmar de más.
 */
export function foodSafetyWarnings(name: string, ageMonths: number | null): SafetyWarning[] {
  const normalized = normalizeForMatch(name);
  if (!normalized) return [];

  const warnings: SafetyWarning[] = [];
  for (const rule of SAFETY_RULES) {
    const active = rule.untilMonths === null || (ageMonths !== null && ageMonths < rule.untilMonths);
    if (!active) continue;
    if (rule.keywords.some((keyword) => matchesKeyword(normalized, keyword))) {
      warnings.push({ id: rule.id, severity: rule.severity, label: rule.label, message: rule.message });
    }
  }

  // "Evitar" antes que "precaución".
  return warnings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'avoid' ? -1 : 1));
}
