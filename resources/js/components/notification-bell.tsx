import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, formatTimeAgo } from '@/lib/format';
import { useNotificationsStore } from '@/stores/notifications';

/**
 * NotificationBell: Bell icon with unread badge and recent items dropdown.
 * Integrate into your header/navbar and ensure useRealtimeNotifications hook
 * is mounted in a top-level layout to receive events.
 */
export function NotificationBell() {
    const { items, unreadCount } = useNotificationsStore();

    const goToIndex = () => router.visit(route('notifications.index'));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                    <span>Notifications</span>
                    <Button variant="link" size="sm" onClick={goToIndex}>
                        View all
                    </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <div className="text-muted-foreground p-3 text-sm">
                        No notifications
                    </div>
                ) : (
                    <ScrollArea className="max-h-80">
                        <div className="py-1">
                            {items.map((n, idx) => (
                                <DropdownMenuItem
                                    key={(n.id || 'idx') + ':' + idx}
                                    className="gap-2 break-words whitespace-normal"
                                    onClick={() => {
                                        if (n.action_url)
                                            window.location.assign(
                                                n.action_url,
                                            );
                                        else goToIndex();
                                    }}
                                >
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <div className="text-sm font-medium">
                                            {typeof n.title === 'string'
                                                ? n.title
                                                : 'Notification'}
                                        </div>
                                        {n.message ? (
                                            <div className="text-muted-foreground line-clamp-2 text-xs">
                                                {typeof n.message === 'string'
                                                    ? n.message
                                                    : ''}
                                            </div>
                                        ) : null}
                                        <time
                                            dateTime={n.created_at || undefined}
                                            title={formatDate(
                                                n.created_at,
                                                true,
                                            )}
                                            className="text-muted-foreground text-[10px]"
                                        >
                                            {formatTimeAgo(n.created_at)}
                                        </time>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
