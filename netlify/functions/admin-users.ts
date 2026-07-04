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

  // 2) Comprobar permisos: dueño de una familia o super-admin de plataforma.
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, disabled, household_id, household_role')
    .eq('id', callerId)
    .single();

  const isSuperadmin = callerProfile?.role === 'admin';
  const isOwner = callerProfile?.household_role === 'owner';
  if (!callerProfile || callerProfile.disabled || (!isSuperadmin && !isOwner)) {
    return json(403, { error: 'No tienes permisos para gestionar usuarios.' });
  }

  const ctx: Ctx = {
    admin,
    callerId,
    isSuperadmin,
    householdId: callerProfile.household_id ?? null,
  };

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await listUsers(ctx);
      case 'POST':
        return await createUser(ctx, JSON.parse(event.body || '{}'));
      case 'PATCH':
        return await patchUser(ctx, JSON.parse(event.body || '{}'));
      case 'DELETE':
        return await deleteUser(ctx, JSON.parse(event.body || '{}'));
      default:
        return json(405, { error: 'Método no permitido.' });
    }
  } catch (e: any) {
    return json(400, { error: e?.message || 'Error inesperado.' });
  }
};

interface Ctx {
  admin: any;
  callerId: string;
  isSuperadmin: boolean;
  householdId: string | null;
}

/** Comprueba que el usuario objetivo pertenece a la familia del que llama (o es super-admin). */
async function assertSameHousehold(ctx: Ctx, targetId: string): Promise<void> {
  if (ctx.isSuperadmin) return;
  const { data } = await ctx.admin.from('profiles').select('household_id').eq('id', targetId).single();
  if (!data || data.household_id !== ctx.householdId) {
    throw new Error('Ese usuario no pertenece a tu familia.');
  }
}

async function listUsers(ctx: Ctx) {
  let query = ctx.admin
    .from('profiles')
    .select('id, email, full_name, role, disabled, created_at, household_id, household_role')
    .order('created_at', { ascending: true });
  // El dueño solo ve su familia; el super-admin ve a todos.
  if (!ctx.isSuperadmin) query = query.eq('household_id', ctx.householdId);
  const { data: profiles, error } = await query;
  if (error) throw error;
  const admin = ctx.admin;

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
  ctx: Ctx,
  body: { email?: string; password?: string },
) {
  if (!body.email || !body.password) {
    return json(400, { error: 'Correo y contraseña son obligatorios.' });
  }
  if (!ctx.householdId) {
    return json(400, { error: 'No perteneces a ninguna familia.' });
  }
  const { data, error } = await ctx.admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });
  if (error) throw error;

  // El trigger crea el perfil sin familia; se le asigna la del que invita, como miembro.
  if (data?.user) {
    await ctx.admin
      .from('profiles')
      .update({ household_id: ctx.householdId, household_role: 'member' })
      .eq('id', data.user.id);
  }
  return json(201, { id: data?.user?.id });
}

async function patchUser(
  ctx: Ctx,
  body: { id?: string; role?: 'admin' | 'user'; disabled?: boolean },
) {
  if (!body.id) return json(400, { error: 'Falta el identificador de usuario.' });
  await assertSameHousehold(ctx, body.id);

  const patch: Record<string, unknown> = {};
  // Solo el super-admin cambia el rol de plataforma; el dueño gestiona el estado.
  if (body.role && ctx.isSuperadmin) patch.role = body.role;

  if (typeof body.disabled === 'boolean') {
    if (body.id === ctx.callerId) {
      return json(400, { error: 'No puedes deshabilitar tu propia cuenta.' });
    }
    patch.disabled = body.disabled;
    // Banear en Auth impide iniciar sesión mientras esté deshabilitado.
    await ctx.admin.auth.admin.updateUserById(body.id, {
      ban_duration: body.disabled ? BAN_FOREVER : 'none',
    });
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await ctx.admin.from('profiles').update(patch).eq('id', body.id);
    if (error) throw error;
  }
  return json(200, { ok: true });
}

async function deleteUser(ctx: Ctx, body: { id?: string }) {
  if (!body.id) return json(400, { error: 'Falta el identificador de usuario.' });
  if (body.id === ctx.callerId) {
    return json(400, { error: 'No puedes eliminar tu propia cuenta.' });
  }
  await assertSameHousehold(ctx, body.id);
  const { error } = await ctx.admin.auth.admin.deleteUser(body.id);
  if (error) throw error;
  // La fila de profiles se borra en cascada (on delete cascade).
  return json(200, { ok: true });
}
