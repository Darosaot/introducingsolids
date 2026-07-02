import { supabase } from './supabase';
import type { AdminUser, UserRole } from './types';

const FN_URL = '/.netlify/functions/admin-users';

/** Adjunta el token del usuario para que la función serverless verifique el rol. */
async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function handle(res: Response) {
  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // Respuesta no-JSON (p.ej. HTML de una función no desplegada).
    throw new Error(
      `El servicio de administración no está disponible (respuesta no válida, ${res.status}).`,
    );
  }
  if (!res.ok) {
    throw new Error(body?.error || `Error ${res.status}`);
  }
  return body;
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch(FN_URL, { headers: await authHeaders() });
  const body = await handle(res);
  return Array.isArray(body.users) ? (body.users as AdminUser[]) : [];
}

export async function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<void> {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  await handle(res);
}

export async function updateUser(
  id: string,
  patch: { role?: UserRole; disabled?: boolean },
): Promise<void> {
  const res = await fetch(FN_URL, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ id, ...patch }),
  });
  await handle(res);
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(FN_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  await handle(res);
}
