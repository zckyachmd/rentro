export type PageLocale = {
    id: number;
    locale: string;
    status: 'draft' | 'scheduled' | 'published' | 'archived' | string;
    version: number;
    updated_at: string;
};

export type PageItem = {
    id: number;
    slug: string;
    locales: PageLocale[];
    updated_at: string;
};
