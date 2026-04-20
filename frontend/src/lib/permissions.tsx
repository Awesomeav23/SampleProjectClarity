import { useAuth } from './auth';
import type { ReactNode } from 'react';

/**
 * Hook to check if current user has a specific permission.
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return user?.permissions.includes(permission) ?? false;
}

/**
 * Hook to check multiple permissions (all must be present).
 */
export function usePermissions(...permissions: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Component that conditionally renders children based on permission.
 * Usage: <Can permission="sow:create"><CreateButton /></Can>
 */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  const has = usePermission(permission);
  return has ? <>{children}</> : null;
}
