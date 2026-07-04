import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { createUser, deleteUser, listUsers, updateUser } from '../lib/admin';
import { fetchBabyProfile, fetchHousehold, regenerateJoinCode, renameHousehold, saveBabyProfile } from '../lib/data';
import { formatBabyAge, formatSolidsTime } from '../lib/baby';
import { dayKey } from '../lib/date';
import { t } from '../lib/i18n';
import type { AdminUser, BabyProfile, UserRole } from '../lib/types';

export function AdminPage() {
  const { session, isSuperadmin, isOwner, householdId } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Nombre y código de la familia
  const [familyName, setFamilyName] = useState('');
  const [familyDraft, setFamilyDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const canEditFamily = isOwner || isSuperadmin;
  const inviteLink = joinCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?codigo=${joinCode}`
    : '';

  // Perfil del bebé
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [babyForm, setBabyForm] = useState({ name: 'Bebé', birthDate: '', solidsStartDate: '' });
  const [babyBusy, setBabyBusy] = useState(false);
  const todayKey = dayKey(new Date());

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
      const [userRows, household, babyRow] = await Promise.all([
        listUsers(),
        householdId ? fetchHousehold(householdId).catch(() => null) : Promise.resolve(null),
        fetchBabyProfile().catch(() => null),
      ]);
      setUsers(userRows);
      setFamilyName(household?.name ?? '');
      setFamilyDraft(household?.name ?? '');
      setJoinCode(household?.join_code ?? '');
      setBaby(babyRow);
      setBabyForm({
        name: babyRow?.name ?? 'Bebé',
        birthDate: babyRow?.birth_date ?? '',
        solidsStartDate: babyRow?.solids_start_date ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function saveBaby(e: React.FormEvent) {
    e.preventDefault();
    setBabyBusy(true);
    setError(null);
    try {
      const saved = await saveBabyProfile({
        id: baby?.id,
        name: babyForm.name,
        birthDate: babyForm.birthDate || null,
        solidsStartDate: babyForm.solidsStartDate || null,
      });
      setBaby(saved);
      setBabyForm({
        name: saved.name,
        birthDate: saved.birth_date ?? '',
        solidsStartDate: saved.solids_start_date ?? '',
      });
      showToast({ title: t.baby.saved, tone: 'ok' });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setBabyBusy(false);
    }
  }

  async function saveFamilyName(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !familyDraft.trim() || familyDraft.trim() === familyName) return;
    setSavingName(true);
    setError(null);
    try {
      const updated = await renameHousehold(householdId, familyDraft);
      setFamilyName(updated.name);
      setFamilyDraft(updated.name);
      showToast({ title: t.family.saved, tone: 'ok' });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setSavingName(false);
    }
  }

  async function copyText(text: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ title: okMsg, tone: 'ok' });
    } catch {
      showToast({ title: text, tone: 'ok' });
    }
  }

  async function regenerate() {
    const ok = await confirm({
      title: t.family.regenerate,
      body: t.family.regenerateConfirm,
      choices: [
        { value: 'confirm', label: t.family.regenerate, variant: 'primary' },
        { value: 'cancel', label: t.confirm.cancel, variant: 'ghost' },
      ],
    });
    if (!ok) return;
    setRegenerating(true);
    setError(null);
    try {
      setJoinCode(await regenerateJoinCode());
      showToast({ title: t.family.codeRegenerated, tone: 'ok' });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      showToast({ title: t.common.error, tone: 'error' });
    } finally {
      setRegenerating(false);
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

      <section className="settings-section">
        <h2>{t.family.sectionTitle}</h2>
        <form className="family-name-form" onSubmit={saveFamilyName}>
          <label className="grow">
            {t.family.nameLabel}
            <input
              type="text"
              value={familyDraft}
              maxLength={60}
              disabled={!canEditFamily}
              onChange={(e) => setFamilyDraft(e.target.value)}
            />
          </label>
          {canEditFamily ? (
            <button
              className="primary"
              type="submit"
              disabled={savingName || !familyDraft.trim() || familyDraft.trim() === familyName}
            >
              {t.family.save}
            </button>
          ) : (
            <p className="muted small">{t.family.ownerOnly}</p>
          )}
        </form>

        <div className="invite-box">
          <div>
            <strong>{t.family.inviteTitle}</strong>
            <p className="muted small">{t.family.inviteHint}</p>
          </div>
          <div className="invite-code-row">
            <code className="invite-code">{joinCode || '—'}</code>
            <button className="ghost small-btn" type="button" onClick={() => copyText(joinCode, t.family.codeCopied)}>
              {t.family.copyCode}
            </button>
            <button className="ghost small-btn" type="button" onClick={() => copyText(inviteLink, t.family.linkCopied)}>
              {t.family.copyLink}
            </button>
            {canEditFamily && (
              <button className="ghost small-btn" type="button" onClick={() => void regenerate()} disabled={regenerating}>
                {t.family.regenerate}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t.baby.title}</h2>
        <p className="muted">{t.baby.subtitle}</p>
        <form className="baby-profile-form" onSubmit={saveBaby}>
          <label>
            {t.baby.name}
            <input
              type="text"
              value={babyForm.name}
              maxLength={60}
              onChange={(e) => setBabyForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label>
            {t.baby.birthDate}
            <input
              type="date"
              value={babyForm.birthDate}
              max={todayKey}
              onChange={(e) => setBabyForm((prev) => ({ ...prev, birthDate: e.target.value }))}
            />
          </label>
          <label>
            {t.baby.solidsStartDate}
            <input
              type="date"
              value={babyForm.solidsStartDate}
              min={babyForm.birthDate || undefined}
              max={todayKey}
              onChange={(e) => setBabyForm((prev) => ({ ...prev, solidsStartDate: e.target.value }))}
            />
          </label>
          <button className="primary" type="submit" disabled={babyBusy || !babyForm.name.trim()}>
            {t.baby.save}
          </button>
        </form>
        {(babyForm.birthDate || babyForm.solidsStartDate) && (
          <div className="profile-preview">
            {babyForm.birthDate && <span>{formatBabyAge(babyForm.birthDate) ?? t.baby.ageUnavailable}</span>}
            {babyForm.solidsStartDate && <span>{formatSolidsTime(babyForm.solidsStartDate)}</span>}
          </div>
        )}
      </section>

      <section className="admin-create">
        <h2>{t.family.addTitle}</h2>
        <p className="muted">{t.family.addHint}</p>
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
        <h2>{t.family.membersTitle}</h2>
        {loading ? (
          <p className="muted">{t.common.loading}</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.admin.email}</th>
                  <th>{t.family.sectionTitle}</th>
                  {isSuperadmin && <th>{t.admin.role}</th>}
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
                        <span className={`badge role-${u.household_role === 'owner' ? 'admin' : 'user'}`}>
                          {u.household_role === 'owner' ? t.family.ownerBadge : t.family.memberBadge}
                        </span>
                      </td>
                      {isSuperadmin && (
                        <td>
                          <span className={`badge role-${u.role}`}>
                            {u.role === 'admin' ? t.admin.roleAdmin : t.admin.roleUser}
                          </span>
                        </td>
                      )}
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
