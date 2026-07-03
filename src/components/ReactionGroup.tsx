import type { Liking, ReactionStatus } from '../lib/types';
import { t } from '../lib/i18n';

/** Grupo de botones tipo "pill" para una de las dos categorías independientes: gustos o reacciones. */
export function ReactionGroup<T extends Liking | ReactionStatus>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: T[];
  value: T | null;
  onSelect: (next: T | null) => void;
}) {
  return (
    <div className="food-reactions" role="group" aria-label={label}>
      <span className="reaction-group-label">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`reaction-btn ${value === option ? 'active' : ''}`}
          onClick={() => onSelect(value === option ? null : option)}
          title={t.reactions[option].label}
          aria-pressed={value === option}
        >
          <span aria-hidden>{t.reactions[option].icon}</span>
          <span className="reaction-label">{t.reactions[option].label}</span>
        </button>
      ))}
    </div>
  );
}
