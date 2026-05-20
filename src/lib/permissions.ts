export type Perfil = 'desenvolvedor' | 'administrador' | 'gestor' | 'atendente' | 'cliente';

import { User } from '../types';

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.administrador) return true;
  if (user.permissions?.includes('*')) return true;
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.administrador) return true;
  if (user.permissions?.includes('*')) return true;
  return permissions.some(p => user.permissions?.includes(p));
}

export function hasAllPermissions(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.administrador) return true;
  if (user.permissions?.includes('*')) return true;
  return permissions.every(p => user.permissions?.includes(p));
}

