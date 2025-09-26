export type PromotionItem = {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    valid_from?: string | null;
    valid_until?: string | null;
    stack_mode: 'stack' | 'highest_only' | 'exclusive';
    priority: number;
    default_channel?: 'public' | 'referral' | 'manual' | 'coupon' | null;
    require_coupon: boolean;
    is_active: boolean;
    tags: string[];
};

export type PromotionPaginator = {
    data: PromotionItem[];
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};

export type PromotionsPageProps = {
    promotions: PromotionPaginator;
    query: {
        page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        search: string;
    };
};

