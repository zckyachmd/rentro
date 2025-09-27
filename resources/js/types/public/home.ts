export type HomeRoom = {
    name: string;
    slug: string;
    price: string;
    amenities: string[];
    amenities_more?: number;
    originalPrice?: string | null;
    promoPrice?: string | null;
    type?: string | null;
    number?: string | null;
    building?: string | null;
    has_custom_name?: boolean;
};

export type HomeTestimony = {
    name: string;
    avatar_url?: string | null;
    content: string;
    rating?: number | null;
    is_anonymous?: boolean;
    occupation?: string | null;
    year?: string | null;
};
