import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { formatDate, formatTimeAgo } from '@/lib/format';
import type { NotificationItem } from '@/stores/notifications';

const TITLE_MAX = 60;
const MESSAGE_MAX = 120;

export default function NotificationItemRow({
    item,
    onOpen,
}: {
    item: NotificationItem;
    onOpen: (n: NotificationItem) => void;
}) {
    const { t } = useTranslation(['notifications']);
    const { t: tEnum } = useTranslation('enum');
    const n = item;
    const renderText = (
        val: string | Record<string, unknown>,
        fallback = '',
    ): string => {
        if (typeof val === 'string') {
            if (val.startsWith('notifications.')) {
                const tr = t(val);
                return (tr && tr !== val ? tr : val) || fallback;
            }
            return val || fallback;
        }
        const key =
            typeof (val as { key?: unknown }).key === 'string'
                ? (val as { key: string }).key
                : undefined;
        const params = (val as { params?: unknown }).params;
        const p = (
            params && typeof params === 'object'
                ? (params as Record<string, unknown>)
                : {}
        ) as Record<string, unknown>;
        // Special: derive status_label if status token provided
        if (
            typeof p.status === 'string' &&
            typeof (p as { status_label?: unknown }).status_label !== 'string'
        ) {
            const lbl = tEnum(`testimony_status.${p.status}`);
            if (lbl) p.status_label = lbl;
        }
        return key ? t(key, p as Record<string, string>) : fallback;
    };
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(n)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(n);
                }
            }}
            className="hover:bg-accent/50 focus:bg-accent/50 flex cursor-pointer items-start justify-between gap-3 p-4 focus:outline-none"
        >
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                    {(() => {
                        const tstr = renderText(
                            n.title,
                            t('notifications.title', 'Notifications'),
                        );
                        return tstr.length > TITLE_MAX
                            ? `${tstr.slice(0, TITLE_MAX).trimEnd()}...`
                            : tstr;
                    })()}
                    {!n.read_at && (
                        <Badge className="ml-2">
                            {t('notifications.new', 'New')}
                        </Badge>
                    )}
                </div>
                <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {(() => {
                        const mstr = renderText(n.message, '');
                        return mstr.length > MESSAGE_MAX
                            ? `${mstr.slice(0, MESSAGE_MAX).trimEnd()}...`
                            : mstr;
                    })()}
                </div>
            </div>
            <div className="ml-2 shrink-0 text-right">
                <time
                    dateTime={n.created_at || undefined}
                    title={formatDate(n.created_at, true)}
                    className="text-muted-foreground text-xs whitespace-nowrap"
                >
                    {formatTimeAgo(n.created_at)}
                </time>
            </div>
        </div>
    );
}
