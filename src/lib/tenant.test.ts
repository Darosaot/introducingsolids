import { describe, expect, it } from 'vitest';
import { canManageMembers, needsHouseholdSetup } from './tenant';
import type { Profile } from './types';

function profile(partial: Partial<Profile>): Profile {
  return {
    id: 'u1',
    email: 'a@b.c',
    full_name: null,
    role: 'user',
    disabled: false,
    theme: 'verde',
    household_id: 'h1',
    household_role: 'member',
    created_at: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('needsHouseholdSetup', () => {
  it('is false when there is no profile yet', () => {
    expect(needsHouseholdSetup(null)).toBe(false);
  });
  it('is true only when the profile has no household', () => {
    expect(needsHouseholdSetup(profile({ household_id: null }))).toBe(true);
    expect(needsHouseholdSetup(profile({ household_id: 'h1' }))).toBe(false);
  });
});

describe('canManageMembers', () => {
  it('allows household owners', () => {
    expect(canManageMembers(profile({ household_role: 'owner' }))).toBe(true);
  });
  it('allows platform super-admins even if they are members', () => {
    expect(canManageMembers(profile({ role: 'admin', household_role: 'member' }))).toBe(true);
  });
  it('denies plain members and null', () => {
    expect(canManageMembers(profile({ role: 'user', household_role: 'member' }))).toBe(false);
    expect(canManageMembers(null)).toBe(false);
  });
});
