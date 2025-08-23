export function can(perm: string, userPerms: string[] = []) {
    return userPerms.includes(perm);
}

export function hasRole(role: string, roles: string[] = []) {
    return roles.includes(role);
}
