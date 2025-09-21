// Core security types
import type { SessionItem, Summary } from './common';
export type { SessionItem, Summary } from './common';

export type PageProps = {
    status?: string | null;
    summary?: Summary;
    sessions?: SessionItem[];
};

export const TAB_KEYS = ['password', '2fa', 'sessions'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

// Submodules
export * from './2fa';
export * from './common';
export * from './sessions';
