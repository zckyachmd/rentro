import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';

import type { TenantContractItem } from './contract';

export type ContractsPaginator = { data: TenantContractItem[] } & PaginatorMeta;

export interface ContractsPageProps {
    contracts?: ContractsPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: {
        statuses?: { value: string; label: string }[];
        forfeit_days?: number;
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
