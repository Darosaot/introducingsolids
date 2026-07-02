import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUser, deleteUser, listUsers, updateUser } from '../lib/admin';
import { t } from '../lib/i18n';
import type { AdminUser, UserRole } from '../lib/types';

export function AdminPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Formulario de alta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    setError(null);
    try {
      await createUser({ email: email.trim(), password, role });
      setEmail('');
      setPassword('');
      setRole('user');
      setCreateMsg(t.admin.createSuccess);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setCreating(false);
    }
  }

  async function mutate(id: string, patch: { role?: UserRole; disabled?: boolean }) {
    setBusyId(id);
    setError(null);
    try {
      await updateUser(id, patch);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.admin.confirmDelete)) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteUser(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.admin.title}</h1>
        <p className="muted">{t.admin.subtitle}</p>
      </header>

      {error && <div className="banner error">{error}</div>}

      <section className="admin-create">
        <h2>{t.admin.createUser}</h2>
        <form className="admin-create-form" onSubmit={handleCreate}>
          <input
            type="email"
            placeholder={t.admin.email}
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder={t.admin.password}
            value={password}
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="user">{t.admin.roleUser}</option>
            <option value="admin">{t.admin.roleAdmin}</option>
          </select>
          <button className="primary" type="submit" disabled={creating}>
            {t.admin.create}
          </button>
        </form>
        {createMsg && <div className="banner ok">{createMsg}</div>}
      </section>

      <section>
        {loading ? (
          <p className="muted">{t.common.loading}</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.admin.email}</th>
                  <th>{t.admin.role}</th>
                  <th>{t.admin.status}</th>
                  <th>{t.admin.lastSignIn}</th>
                  <th>{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === session?.user.id;
                  const disabled = busyId === u.id;
                  return (
                    <tr key={u.id} className={u.disabled ? 'row-disabled' : ''}>
                      <td>
                        {u.email} {isSelf && <span className="muted small">{t.admin.you}</span>}
                      </td>
                      <td>
                        <span className={`badge role-${u.role}`}>
                          {u.role === 'admin' ? t.admin.roleAdmin : t.admin.roleUser}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.disabled ? 'st-off' : 'st-on'}`}>
                          {u.disabled ? t.admin.disabled : t.admin.active}
                        </span>
                      </td>
                      <td className="muted small">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString('es-ES')
                          : t.admin.never}
                      </td>
                      <td className="admin-actions">
                        <button
                          className="ghost small-btn"
                          disabled={disabled}
                          onClick={() =>
                            mutate(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })
                          }
                        >
                          {u.role === 'admin' ? t.admin.makeUser : t.admin.makeAdmin}
                        </button>
                        <button
                          className="ghost small-btn"
                          disabled={disabled || isSelf}
                          onClick={() => mutate(u.id, { disabled: !u.disabled })}
                        >
                          {u.disabled ? t.admin.enable : t.admin.disable}
                        </button>
                        <button
                          className="danger small-btn"
                          disabled={disabled || isSelf}
                          onClick={() => remove(u.id)}
                        >
                          {t.admin.delete}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
