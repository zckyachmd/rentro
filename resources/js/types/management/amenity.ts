export type AmenityItem = {
    id: number;
    name: string;
    icon?: string | null;
    category?: 'room' | 'communal' | null;
    names: Record<string, string>;
};

export type AmenityPaginator = {
    data: AmenityItem[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};

export type AmenitiesPageProps = {
    amenities: AmenityPaginator;
    query: {
        page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        search: string;
        category?: string | null;
    };
};
