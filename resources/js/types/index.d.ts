import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    preferences?: {
        theme: 'light' | 'dark' | 'system';
        locale?: 'en' | 'id';
    };
    ziggy: Config & { location: string };
};
