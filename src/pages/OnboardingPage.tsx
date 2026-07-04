import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createHousehold, joinHousehold } from '../lib/data';
import { t } from '../lib/i18n';

/** Código de invitación pasado por enlace: <origin>/?codigo=XXXX */
function initialCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('codigo') ?? params.get('join') ?? '').trim();
}

export function OnboardingPage() {
  const { refreshProfile, signOut } = useAuth();
  const urlCode = initialCodeFromUrl();
  const [mode, setMode] = useState<'create' | 'join'>(urlCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [code, setCode] = useState(urlCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'create') {
        await createHousehold(name.trim());
      } else {
        await joinHousehold(code.trim());
      }
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

        <div className="segmented" role="tablist" aria-label={t.onboarding.title}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'active' : ''}
            onClick={() => { setMode('create'); setError(null); }}
          >
            {t.onboarding.createTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'join'}
            className={mode === 'join' ? 'active' : ''}
            onClick={() => { setMode('join'); setError(null); }}
          >
            {t.onboarding.joinTab}
          </button>
        </div>

        <p className="muted">{mode === 'create' ? t.onboarding.subtitle : t.onboarding.joinSubtitle}</p>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'create' ? (
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
          ) : (
            <label>
              {t.onboarding.codeLabel}
              <input
                type="text"
                required
                autoCapitalize="characters"
                placeholder={t.onboarding.codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
          )}
          <button
            type="submit"
            className="primary"
            disabled={busy || (mode === 'create' ? !name.trim() : !code.trim())}
          >
            {busy
              ? t.onboarding.working
              : mode === 'create'
                ? t.onboarding.create
                : t.onboarding.join}
          </button>
        </form>

        <button className="link-btn" onClick={() => void signOut()}>
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );
}
