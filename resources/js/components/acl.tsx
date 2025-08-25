import { usePage } from '@inertiajs/react';
import React from 'react';

function hasRole(role: string, userRoles: string[] = []) {
    return userRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase());
}

export type CanProps = {
    all?: string[];
    any?: string[];
    not?: boolean;
    rolesAll?: string[];
    rolesAny?: string[];
    children: React.ReactNode;
};

/**
 * Permission control wrapper.
 * Usage examples:
 *  <Can all={["user.update"]}>...</Can>
 *  <Can any={["user.update","user.manage"]}>...</Can>
 *  <Can not any={["user.delete"]}>...</Can>
 *  <Can rolesAny={["super admin"]}>...</Can>
 */
export function Can({ all, any, not, rolesAll, rolesAny, children }: CanProps) {
    const { props } = usePage<{
        auth?: { user?: { permissions?: string[]; roles?: string[] } };
    }>();

    const perms = props.auth?.user?.permissions ?? [];
    const roles = props.auth?.user?.roles ?? [];

    let ok = true;
    if (all?.length) ok = ok && all.every((p) => perms.includes(p));
    if (any?.length) ok = ok && any.some((p) => perms.includes(p));
    if (rolesAll?.length) ok = ok && rolesAll.every((r) => hasRole(r, roles));
    if (rolesAny?.length) ok = ok && rolesAny.some((r) => hasRole(r, roles));
    if (not) ok = !ok;

    return ok ? <>{children}</> : null;
}
