import { usePage } from '@inertiajs/react';
import React from 'react';

import type { PageProps } from '@/types';

function hasRole(role: string, userRoles: string[] = []) {
    return userRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase());
}

export type AclCheck = {
  all?: string[];
  any?: string[];
  not?: boolean;
  rolesAll?: string[];
  rolesAny?: string[];
};

export type CanProps = AclCheck & { children: React.ReactNode };

export function canFrom(
  subject: { permissions?: string[]; roles?: string[] },
  { all, any, not, rolesAll, rolesAny }: AclCheck = {},
): boolean {
  const perms = subject.permissions ?? [];
  const roles = subject.roles ?? [];

  let ok = true;
  if (all?.length) ok = ok && all.every((p) => perms.includes(p));
  if (any?.length) ok = ok && any.some((p) => perms.includes(p));
  if (rolesAll?.length) ok = ok && rolesAll.every((r) => hasRole(r, roles));
  if (rolesAny?.length) ok = ok && rolesAny.some((r) => hasRole(r, roles));
  if (not) ok = !ok;
  return ok;
}

export function useCan(check: AclCheck): boolean {
  const { props } = usePage<
    PageProps<{
      auth?: { user?: { permissions?: string[]; roles?: string[] } };
    }>
  >();
  const perms = props.auth?.user?.permissions ?? [];
  const roles = props.auth?.user?.roles ?? [];
  return canFrom({ permissions: perms, roles }, check);
}

/**
 * Permission control wrapper.
 * Usage examples:
 *  <Can all={["user.update"]}>...</Can>
 *  <Can any={["user.update","user.manage"]}>...</Can>
 *  <Can not any={["user.delete"]}>...</Can>
 *  <Can rolesAny={["super admin"]}>...</Can>
 */
export function Can(props: CanProps) {
  const ok = useCan(props);
  return ok ? <>{props.children}</> : null;
}
