import { createClient } from '@supabase/supabase-js';

/**
 * Gestión de usuarios reservada a administradores.
 *
 * La clave de servicio (SUPABASE_SERVICE_ROLE_KEY) SOLO existe aquí, en el
 * backend de Netlify: nunca se envía al navegador. Cada petición se autentica
 * con el token del usuario que llama, y se comprueba que su perfil tenga
 * rol 'admin' antes de ejecutar cualquier acción.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BAN_FOREVER = '876000h'; // ~100 años

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event: any) => {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: 'El servidor no está configurado (faltan variables de Supabase).' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Autenticar al que llama a partir de su token.
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json(401, { error: 'No autenticado.' });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json(401, { error: 'Sesión no válida.' });
  }
  const callerId = userData.user.id;

  // 2) Comprobar que el que llama es administrador y no está deshabilitado.
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, disabled')
    .eq('id', callerId)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.disabled) {
    return json(403, { error: 'No tienes permisos de administrador.' });
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await listUsers(admin);
      case 'POST':
        return await createUser(admin, JSON.parse(event.body || '{}'));
      case 'PATCH':
        return await patchUser(admin, callerId, JSON.parse(event.body || '{}'));
      case 'DELETE':
        return await deleteUser(admin, callerId, JSON.parse(event.body || '{}'));
      default:
        return json(405, { error: 'Método no permitido.' });
    }
  } catch (e: any) {
    return json(400, { error: e?.message || 'Error inesperado.' });
  }
};

async function listUsers(admin: any) {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, full_name, role, disabled, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;

  // Enriquecer con el último acceso desde Auth.
  const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const lastById = new Map<string, string | null>();
  for (const u of authList?.users ?? []) {
    lastById.set(u.id, u.last_sign_in_at ?? null);
  }

  const users = (profiles ?? []).map((p: any) => ({
    ...p,
    last_sign_in_at: lastById.get(p.id) ?? null,
  }));
  return json(200, { users });
}

async function createUser(
  admin: any,
  body: { email?: string; password?: string; role?: 'admin' | 'user' },
) {
  if (!body.email || !body.password) {
    return json(400, { error: 'Correo y contraseña son obligatorios.' });
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });
  if (error) throw error;

  // El trigger crea el perfil con rol 'user'; ajusta si se pidió 'admin'.
  if (body.role === 'admin' && data?.user) {
    await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
  }
  return json(201, { id: data?.user?.id });
}

async function patchUser(
  admin: any,
  callerId: string,
  body: { id?: string; role?: 'admin' | 'user'; disabled?: boolean },
) {
  if (!body.id) return json(400, { error: 'Falta el identificador de usuario.' });

  const patch: Record<string, unknown> = {};
  if (body.role) patch.role = body.role;

  if (typeof body.disabled === 'boolean') {
    if (body.id === callerId) {
      return json(400, { error: 'No puedes deshabilitar tu propia cuenta.' });
    }
    patch.disabled = body.disabled;
    // Banear en Auth impide iniciar sesión mientras esté deshabilitado.
    await admin.auth.admin.updateUserById(body.id, {
      ban_duration: body.disabled ? BAN_FOREVER : 'none',
    });
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from('profiles').update(patch).eq('id', body.id);
    if (error) throw error;
  }
  return json(200, { ok: true });
}

async function deleteUser(admin: any, callerId: string, body: { id?: string }) {
  if (!body.id) return json(400, { error: 'Falta el identificador de usuario.' });
  if (body.id === callerId) {
    return json(400, { error: 'No puedes eliminar tu propia cuenta.' });
  }
  const { error } = await admin.auth.admin.deleteUser(body.id);
  if (error) throw error;
  // La fila de profiles se borra en cascada (on delete cascade).
  return json(200, { ok: true });
}
