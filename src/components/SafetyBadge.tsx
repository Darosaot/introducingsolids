import type { SafetyWarning } from '../lib/safety';

export function SafetyBadge({ warnings }: { warnings: SafetyWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="safety-badges">
      {warnings.map((warning) => (
        <span
          key={warning.id}
          className={`safety-badge ${warning.severity === 'avoid' ? 'is-avoid' : 'is-caution'}`}
          title={warning.message}
        >
          {warning.severity === 'avoid' ? '⛔' : '⚠️'} {warning.label}
        </span>
      ))}
    </div>
  );
}
