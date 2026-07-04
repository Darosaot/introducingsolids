import type { Profile } from './types';

/** Un usuario autenticado que todavía no pertenece a ninguna familia debe crearla. */
export function needsHouseholdSetup(profile: Profile | null): boolean {
  return !!profile && !profile.household_id;
}

/** Puede acceder al portal de gestión de miembros: dueño de familia o super-admin. */
export function canManageMembers(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.household_role === 'owner' || profile.role === 'admin';
}
