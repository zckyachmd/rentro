import { Bell, BellDot, CheckCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export default function NotificationsActionsBar({
    filter,
    unreadCount,
    markingAll,
    onFilterChange,
    onMarkAll,
}: {
    filter: 'unread' | 'all';
    unreadCount: number;
    markingAll: boolean;
    onFilterChange: (next: 'unread' | 'all') => void;
    onMarkAll: () => void;
}) {
    const { t } = useTranslation(['notifications', 'common']);

    return (
        <div className="flex items-center gap-2">
            <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(v) =>
                    v && onFilterChange(v as 'unread' | 'all')
                }
                size="sm"
                variant="outline"
                aria-label={t('common.filter', 'Filter')}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem
                            value="all"
                            aria-label={t('notifications.all', 'All')}
                        >
                            <Bell className="h-4 w-4" />
                        </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('notifications.all', 'All')}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem
                            value="unread"
                            aria-label={t('notifications.unread', 'Unread')}
                        >
                            <BellDot className="h-4 w-4" />
                        </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('notifications.unread', 'Unread')}
                    </TooltipContent>
                </Tooltip>
            </ToggleGroup>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={onMarkAll}
                            disabled={!unreadCount || markingAll}
                            aria-label={t(
                                'notifications.mark_all',
                                'Mark all as read',
                            )}
                            className="h-8 w-8"
                        >
                            {markingAll ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCheck className="h-4 w-4" />
                            )}
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    {markingAll
                        ? t('notifications.marking_all', 'Marking...')
                        : t('notifications.mark_all', 'Mark all as read')}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
