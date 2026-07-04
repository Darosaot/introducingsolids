import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/i18n';

export function LoginPage() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!configured) {
      setError(t.auth.missingConfig);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setInfo(t.auth.signUpSuccess);
        setMode('in');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap login-page">
      <div className="login-layout">
        <section className="login-hero">
          <div className="brand">
            <span className="brand-mark" aria-hidden>🍼</span>
            <div>
              <h1>{t.appName}</h1>
              <p className="muted">{t.tagline}</p>
            </div>
          </div>

          <h2 className="login-headline">{t.landing.headline}</h2>
          <p className="login-lead">{t.landing.sub}</p>

          <ul className="feature-list">
            {t.landing.features.map((f) => (
              <li className="feature-item" key={f.title}>
                <span className="feature-icon" aria-hidden>{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <span className="muted">{f.text}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className="login-disclaimer">{t.landing.disclaimer}</p>
        </section>

        <div className="auth-card login-auth">
          <h2>{mode === 'in' ? t.auth.signInTitle : t.landing.ctaTitle}</h2>
          <p className="muted">{mode === 'in' ? t.tagline : t.landing.ctaSub}</p>

          {!configured && <div className="banner warn">{t.auth.missingConfig}</div>}
          {error && <div className="banner error">{error}</div>}
          {info && <div className="banner ok">{info}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              {t.auth.email}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {t.auth.password}
              <input
                type="password"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="primary" disabled={busy}>
              {busy
                ? mode === 'in'
                  ? t.auth.signingIn
                  : t.auth.signingUp
                : mode === 'in'
                  ? t.auth.signInButton
                  : t.auth.signUpButton}
            </button>
          </form>

          <button
            className="link-btn"
            onClick={() => {
              setMode((m) => (m === 'in' ? 'up' : 'in'));
              setError(null);
              setInfo(null);
            }}
          >
            {mode === 'in' ? t.auth.toggleToSignUp : t.auth.toggleToSignIn}
          </button>
        </div>
      </div>
    </div>
  );
}
