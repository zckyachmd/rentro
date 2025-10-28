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
    const n = item;
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
                        const tstr =
                            typeof n.title === 'string'
                                ? n.title
                                : t('notifications.title', 'Notifications');
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
                        const mstr =
                            typeof n.message === 'string' ? n.message : '';
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
