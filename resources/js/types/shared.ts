import type { SharedPublicMenusProps } from '@/types/navigation';

export type InertiaSharedProps = SharedPublicMenusProps & {
    auth?: {
        user?: unknown;
    };
};
