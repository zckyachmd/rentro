import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';

import type { ContractItem } from './contract';

export type ContractsPaginator = { data: ContractItem[] } & PaginatorMeta;

export interface HandoverOptions {
    min_photos_checkin: number;
    min_photos_checkout: number;
    require_tenant_ack_for_complete?: boolean;
    require_checkin_for_activate?: boolean;
}

export interface ContractsPageProps {
    contracts?: ContractsPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: { statuses?: { value: string; label: string }[] };
    handover?: HandoverOptions;
    summary?: {
        count: number;
        count_active: number;
        count_booked: number;
        count_pending: number;
        count_overdue: number;
    };
}

export type QueryInit = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

export type SafePayload = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

export type ServerQuery = {
    [key: string]: unknown;
    page?: number;
    per_page?: number;
    search?: string | undefined;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
};
