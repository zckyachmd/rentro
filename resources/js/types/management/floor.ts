export type FloorItem = {
    id: number;
    level: number;
    name?: string | null;
    building_id: number;
    building?: { id: number; name: string } | null;
};

export type FloorPaginator = {
    data: FloorItem[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};

export type FloorsPageProps = {
    floors: FloorPaginator;
    query: {
        page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        search: string;
        building?: number | string | null;
    };
    options: {
        buildings: { id: number; name: string }[];
    };
};
