import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export default function NotificationsPagination({
    current,
    last,
    total,
    prev,
    next,
}: {
    current: number;
    last: number;
    total: number;
    prev?: string | null;
    next?: string | null;
}) {
    const { t } = useTranslation('notifications');
    return (
        <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
                {t('page_info', 'Page')} {current} {t('of', 'of')} {last} (
                {total} {t('total', 'total')})
            </div>
            <div className="flex gap-2">
                {prev && (
                    <Button
                        variant="outline"
                        onClick={() => router.visit(prev)}
                    >
                        {t('prev', 'Prev')}
                    </Button>
                )}
                {next && (
                    <Button
                        variant="outline"
                        onClick={() => router.visit(next)}
                    >
                        {t('next', 'Next')}
                    </Button>
                )}
            </div>
        </div>
    );
}
