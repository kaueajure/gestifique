export type Perfil = 'desenvolvedor' | 'administrador' | 'gestor' | 'atendente' | 'cliente';

import { User } from '../types';

function isGlobalOnlyPermission(permission: string): boolean {
  return (
    permission.startsWith('sistema.') ||
    permission.startsWith('telas.') ||
    ['empresas.criar', 'empresas.excluir', 'empresas.desativar', 'configuracoes.sistema'].includes(permission)
  );
}

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.permissions?.includes('*')) return !isGlobalOnlyPermission(permission);
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.permissions?.includes('*')) return permissions.some(permission => !isGlobalOnlyPermission(permission));
  return permissions.some(p => user.permissions?.includes(p));
}

export function hasAllPermissions(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false;
  if (user.desenvolvedor) return true;
  if (user.permissions?.includes('*')) return permissions.every(permission => !isGlobalOnlyPermission(permission));
  return permissions.every(p => user.permissions?.includes(p));
}

