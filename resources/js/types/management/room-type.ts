export type RoomTypeItem = {
    id: string;
    name: string;
    slug?: string | null;
    capacity: number;
    price_daily_rupiah?: string | null;
    price_weekly_rupiah?: string | null;
    price_monthly_rupiah?: string | null;
    deposit_daily_rupiah?: string | null;
    deposit_weekly_rupiah?: string | null;
    deposit_monthly_rupiah?: string | null;
    is_active: boolean;
    description?: string | null;
};

export type RoomTypePaginator = {
    data: RoomTypeItem[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};

export type RoomTypesPageProps = {
    room_types: RoomTypePaginator;
    query: {
        page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        search: string;
    };
};
