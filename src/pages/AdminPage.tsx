import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { createUser, deleteUser, listUsers, updateUser } from '../lib/admin';
import { t } from '../lib/i18n';
import type { AdminUser, UserRole } from '../lib/types';

export function AdminPage() {
  const { session, isSuperadmin } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
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
      await createUser({ email: email.trim(), password, role: isSuperadmin ? role : undefined });
      setEmail('');
      setPassword('');
      setRole('user');
      setCreateMsg(t.admin.createSuccess);
      showToast({ title: t.admin.createSuccess, tone: 'ok' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setCreating(false);
    }
  }

  async function mutate(user: AdminUser, patch: { role?: UserRole; disabled?: boolean }) {
    const action = patch.role
      ? `${t.confirm.roleUser} ${user.email ?? ''}`
      : `${t.confirm.disableUser} ${user.email ?? ''}`;
    const ok = await confirm({
      title: patch.role ? t.confirm.roleUser : t.confirm.disableUser,
      body: action,
      choices: [
        { value: 'confirm', label: 'Aplicar cambio', variant: 'primary' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (!ok) return;
    const id = user.id;
    setBusyId(id);
    setError(null);
    try {
      await updateUser(id, patch);
      showToast({ title: 'Usuario actualizado', tone: 'ok' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    const user = users.find((u) => u.id === id);
    const ok = await confirm({
      title: t.confirm.deleteUser,
      body: `${user?.email ?? 'Este usuario'} se eliminará de forma permanente.`,
      choices: [
        { value: 'confirm', label: t.confirm.delete, variant: 'danger' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteUser(id);
      showToast({ title: 'Usuario eliminado', tone: 'ok' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
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
          {isSuperadmin && (
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="user">{t.admin.roleUser}</option>
              <option value="admin">{t.admin.roleAdmin}</option>
            </select>
          )}
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
                        {isSuperadmin && (
                          <button
                            className="ghost small-btn"
                            disabled={disabled}
                            onClick={() =>
                              mutate(u, { role: u.role === 'admin' ? 'user' : 'admin' })
                            }
                          >
                            {u.role === 'admin' ? t.admin.makeUser : t.admin.makeAdmin}
                          </button>
                        )}
                        <button
                          className="ghost small-btn"
                          disabled={disabled || isSelf}
                          onClick={() => mutate(u, { disabled: !u.disabled })}
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
