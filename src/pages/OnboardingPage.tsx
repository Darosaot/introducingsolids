import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createHousehold } from '../lib/data';
import { t } from '../lib/i18n';

export function OnboardingPage() {
  const { refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createHousehold(name.trim());
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden>🍼</span>
          <div>
            <h1>{t.appName}</h1>
            <p className="muted">{t.tagline}</p>
          </div>
        </div>

        <h2>{t.onboarding.title}</h2>
        <p className="muted">{t.onboarding.subtitle}</p>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            {t.onboarding.nameLabel}
            <input
              type="text"
              required
              maxLength={60}
              placeholder={t.onboarding.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={busy || !name.trim()}>
            {busy ? t.onboarding.creating : t.onboarding.create}
          </button>
        </form>

        <button className="link-btn" onClick={() => void signOut()}>
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );
}
