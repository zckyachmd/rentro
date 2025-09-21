export type RoleItem = {
    id: number;
    name: string;
    guard_name: string;
    users_count?: number;
    permissions_count?: number;
    permission_ids?: number[];
    created_at?: string;
    updated_at?: string;
};

type RoleDialogSlice = { open: boolean; role: RoleItem | null };

export type RoleDialogs = {
    edit: RoleDialogSlice;
    perm: RoleDialogSlice;
    del: RoleDialogSlice;
};

import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';
export type RolePaginator = { data: RoleItem[] } & PaginatorMeta;

export type RolePageProps = {
    [key: string]: unknown;
    roles: RolePaginator;
    permissions?: { id: number; name: string; guard_name: string }[];
    guards?: string[];
    query?: { guard?: string | null } & QueryBag;
};

export type DialogKey = keyof RoleDialogs;

export type ColumnFactoryOptions = {
    onEdit?: (role: RoleItem) => void;
    onPermissions?: (role: RoleItem) => void;
    onDelete?: (role: RoleItem) => void;
};

export type Permission = { id: number; name: string; guard_name: string };

export type PermissionsDialogProps = {
    open: boolean;
    role: RoleItem | null;
    permissions: Permission[];
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    preselected?: number[];
};

export type RoleUpsertDialogProps = {
    open: boolean;
    role: RoleItem | null;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    guards?: string[];
};
