export interface UserLite {
    id?: number;
    name?: string;
    email?: string;
}

export interface ActivityItem {
    id: number;
    log_name?: string | null;
    description?: string | null;
    event?: string | null;
    subject_id?: number | string | null;
    subject_type?: string | null;
    causer_id?: number | null;
    properties?: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
    causer?: UserLite | null;
    subject?: { id?: number | string | null } | null;
}

export type AuditDetailDialogProps = {
    open: boolean;
    item: ActivityItem | null;
    onOpenChange: (open: boolean) => void;
};

import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';
export type LogPaginator = { data: ActivityItem[] } & PaginatorMeta;

export type PageQuery = QueryBag & {
    user_id: number | string | null;
    subject_type: string | null;
    event: string | null;
    per_page?: number;
    perPage?: number;
    page?: number;
};

export type PageProps = {
    [key: string]: unknown;
    logs: LogPaginator;
    query?: PageQuery;
};

export type SafePayload = Partial<
    Omit<Record<string, unknown>, 'search' | 'sort' | 'dir'> & {
        search?: string | null;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
    }
> & { q?: string };

export type NextShape = {
    [key: string]: unknown;
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
    q?: string;
};
