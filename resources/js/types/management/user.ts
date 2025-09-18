export type UserItem = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    roles: Role[];
    two_factor_enabled: boolean;
    last_active_at?: string | null;
    initials?: string | null;
};

export type ForceLogoutDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserItem;
};

import type { PaginatorMeta } from '@/components/ui/data-table-server';
export type UsersPaginator = { data: UserItem[] } & PaginatorMeta;

export type UserIndexPageProps = {
    users?: UsersPaginator;
    roles?: Role[];
    query?: { roleId: number | null } & Record<string, unknown>;
};

export type DialogKind = 'create' | 'role' | 'reset' | 'twofa' | 'revoke';

export type DialogState = {
    kind: DialogKind | null;
    open: boolean;
    saving: boolean;
    user: UserItem | (UserItem & { two_factor_enabled?: boolean }) | null;
};

export type Role = { id: number; name: string };

export type TwoFADialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    user: UserItem;
    autoReload?: boolean;
};

export type RequestResponse = {
    message?: string;
    codes?: string[];
    error?: boolean | string;
};

export type ManageRolesHandler = (user: UserItem) => void;
export type ResetPasswordHandler = (user: UserItem) => void;

export type ColumnFactoryOptions = {
    onManageRoles?: ManageRolesHandler;
    onResetPassword?: ResetPasswordHandler;
    onTwoFARecovery?: (user: UserItem) => void;
    onRevokeSession?: (user: UserItem) => void;
};

export type CreateUserDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    roles: { id: number; name: string }[];
    autoReload?: boolean;
};

export type ResetDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserItem;
};

export type ResetState = {
    generatedUrl: string;
    copied: boolean;
    loading: 'send' | 'generate' | null;
};

export type RoleDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserItem;
    roles: Role[];
    autoReload?: boolean;
};
