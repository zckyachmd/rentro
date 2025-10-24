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
import { useNotificationsStore } from '@/stores/notifications';
import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';

/**
 * NotificationBell: Bell icon with unread badge and recent items dropdown.
 * Integrate into your header/navbar and ensure useRealtimeNotifications hook
 * is mounted in a top-level layout to receive events.
 */
export function NotificationBell() {
    const { items, unreadCount } = useNotificationsStore();
    const recent = items.slice(0, 8);

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
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <Button variant="link" size="sm" onClick={goToIndex}>
                        View all
                    </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {recent.length === 0 ? (
                    <div className="text-muted-foreground p-3 text-sm">
                        No notifications
                    </div>
                ) : (
                    recent.map((n, idx) => (
                        <DropdownMenuItem
                            key={(n.id || 'idx') + ':' + idx}
                            className="break-words whitespace-normal"
                            onClick={() => {
                                if (n.action_url)
                                    window.location.assign(n.action_url);
                                else goToIndex();
                            }}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="text-sm font-medium">
                                    {typeof n.title === 'string'
                                        ? n.title
                                        : 'Notification'}
                                </div>
                                <div className="text-muted-foreground line-clamp-2 text-xs">
                                    {typeof n.message === 'string'
                                        ? n.message
                                        : ''}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
