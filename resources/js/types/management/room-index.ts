import type { PaginatorMeta } from '@/components/ui/data-table-server';

import type { Building, Floor, RoomItem, RoomType } from './room';

export type RoomsPaginator = { data: RoomItem[] } & PaginatorMeta;

export interface RoomsPageProps {
    rooms?: RoomsPaginator;
    query?: {
        q?: string;
        building_id?: string | number | null;
        floor_id?: string | number | null;
        type_id?: string | number | null;
        status?: string | null;
        gender_policy?: string | null;
    };
    options?: {
        buildings?: Building[];
        floors?: Floor[];
        types?: RoomType[];
        statuses?: { value: string; label: string }[];
    };
}

export type Filters = {
    building_id: string;
    floor_id: string;
    type_id: string;
    status: string;
    gender_policy: string;
    q: string;
};

export type QueryInit = Partial<{
    search: string;
    page: number;
    per_page: number;
    perPage: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    q: string;
    building_id: string | number | null;
    floor_id: string | number | null;
    type_id: string | number | null;
    status: string | null;
    gender_policy: string | null;
    price_period: 'daily' | 'weekly' | 'monthly' | null;
}>;

export type SafePayload = Partial<{
    page?: number;
    search?: string | null;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
    per_page?: number;
    perPage?: number;
    q?: string | null;
    building_id?: string | number | null;
    floor_id?: string | number | null;
    type_id?: string | number | null;
    status?: string | null;
    gender_policy?: string | null;
    price_period?: 'daily' | 'weekly' | 'monthly' | null;
}>;
