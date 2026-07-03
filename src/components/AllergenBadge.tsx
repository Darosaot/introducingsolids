import { ALLERGENS } from '../lib/data';
import type { AllergenKey } from '../lib/types';

export function AllergenBadge({ keys }: { keys: AllergenKey[] }) {
  if (keys.length === 0) return null;
  const labels = keys
    .map((key) => ALLERGENS.find((allergen) => allergen.key === key)?.label)
    .filter(Boolean);
  return <span className="allergen-badge">Alérgeno: {labels.join(', ')}</span>;
}
