export type BuildingItem = {
    id: number;
    name: string;
    code?: string | null;
    address?: string | null;
    is_active: boolean;
};

export type BuildingPaginator = {
    data: BuildingItem[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};

export type BuildingsPageProps = {
    buildings: BuildingPaginator;
    query: {
        page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        search: string;
    };
};
