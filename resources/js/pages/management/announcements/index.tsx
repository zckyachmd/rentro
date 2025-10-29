import { router, usePage } from '@inertiajs/react';
import type { Column, ColumnDef } from '@tanstack/react-table';
import {
    Eye,
    Filter,
    Megaphone,
    MoreHorizontal,
    Send,
    XIcon,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableServer } from '@/components/ui/data-table-server';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import ConfirmCancelDialog from '@/pages/management/announcements/dialogs/confirm-cancel-dialog';
import ConfirmResendDialog from '@/pages/management/announcements/dialogs/confirm-resend-dialog';
import AnnouncementViewDialog from '@/pages/management/announcements/dialogs/view-dialog';
import type { PageProps as InertiaPageProps } from '@/types';

type Role = { id: number; name: string };
type UserItem = { id: number; name: string; email?: string };
type HistoryItem = {
    id: number;
    scope: 'global' | 'role';
    role_id?: number | null;
    role_name?: string | null;
    title: string;
    message?: string;
    action_url?: string | null;
    persist: boolean;
    scheduled_at?: string | null;
    sent_at?: string | null;
    status: string;
    created_at: string;
};
type PaginatorMeta = {
    total: number;
    from: number | null;
    to: number | null;
    current_page: number;
    last_page: number;
    per_page: number;
};
type Filters = {
    q?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    scope?: string;
    role_id?: string | number;
    status?: string;
    ar?: string;
    page?: number;
    per_page?: number;
};

type Props = InertiaPageProps<{
    roles: Role[];
    users: UserItem[];
    rows: HistoryItem[];
    paginator: PaginatorMeta;
    filters: Filters;
}>;

export default function ManagementNotificationsPage() {
    const { t } = useTranslation();
    const { props } = usePage<Props>();
    const roles = props.roles || [];
    const users = props.users || [];

    // Compose dialog state
    const [openCompose, setOpenCompose] = React.useState(false);

    // Unified announcement form state
    const [target, setTarget] = React.useState<'global' | 'role' | 'user'>(
        'global',
    );
    const [roleId, setRoleId] = React.useState<string>(
        roles[0]?.id ? String(roles[0].id) : '',
    );
    const [userId, setUserId] = React.useState<string>(
        users[0]?.id ? String(users[0].id) : '',
    );
    const [title, setTitle] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [actionUrl, setActionUrl] = React.useState('');
    const [persist, setPersist] = React.useState(true);
    const [schedule, setSchedule] = React.useState(false);
    const [scheduledAt, setScheduledAt] = React.useState<string>('');
    const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(
        undefined,
    );
    const [scheduledTime, setScheduledTime] = React.useState<string>('');
    const [errors, setErrors] = React.useState<
        Record<string, string | undefined>
    >({});
    const [submitting, setSubmitting] = React.useState(false);

    const resetCompose = () => {
        setTarget('global');
        setRoleId(roles[0]?.id ? String(roles[0].id) : '');
        setUserId(users[0]?.id ? String(users[0].id) : '');
        setTitle('');
        setMessage('');
        setActionUrl('');
        setPersist(true);
        setSchedule(false);
        setScheduledAt('');
        setScheduledDate(undefined);
        setScheduledTime('');
        setErrors({});
    };

    const formatDateTime = (d?: Date, t?: string) => {
        if (!d) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const [hh = '00', mm = '00'] = (t || '').split(':');
        return `${year}-${month}-${day} ${pad(Number(hh))}:${pad(Number(mm))}`;
    };

    const submitUnified = (e?: React.FormEvent) => {
        e?.preventDefault();
        setSubmitting(true);
        setErrors({});
        router.visit(route('management.announcements.store'), {
            method: 'post',
            data: {
                target,
                role_id: target === 'role' ? Number(roleId) : undefined,
                user_id: target === 'user' ? Number(userId) : undefined,
                title,
                message,
                action_url: actionUrl || undefined,
                persist,
                scheduled_at: schedule && scheduledAt ? scheduledAt : undefined,
            },
            onError: (errs) => setErrors(errs as Record<string, string>),
            onSuccess: () => {
                setOpenCompose(false);
                resetCompose();
            },
            onFinish: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    const filters: Filters = props.filters || {};
    const [search, setSearch] = React.useState<string>(String(filters.q || ''));

    const handleQueryChange = (next: {
        [key: string]: unknown;
        page?: number;
        per_page?: number;
        search?: string;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
    }) => {
        const current = new URL(window.location.href);
        const q = new URLSearchParams(current.search);
        const apply = (k: string, v?: unknown) => {
            if (v === undefined || v === null || v === '' || v === 'null')
                q.delete(k);
            else q.set(k, String(v));
        };
        apply('page', next.page ?? q.get('page') ?? 1);
        apply(
            'per_page',
            next.per_page ??
                q.get('per_page') ??
                props.paginator?.per_page ??
                10,
        );
        apply('q', next.search ?? search);
        apply('sort', next.sort ?? filters.sort ?? 'created_at');
        apply('dir', next.dir ?? filters.dir ?? 'desc');
        // keep current filter selections
        apply('scope', next.scope ?? filters.scope ?? '');
        apply('status', next.status ?? filters.status ?? '');
        apply('role_id', next.role_id ?? filters.role_id ?? '');
        // carry auto-refresh param if present to avoid re-mount churn
        apply('ar', next.ar ?? q.get('ar') ?? 'off');
        const nextQuery = q.toString();
        if ('?' + nextQuery === current.search) return; // no-op if unchanged
        router.visit(
            route('management.announcements.index') + '?' + nextQuery,
            { preserveScroll: true, preserveState: true },
        );
    };

    const onSortChange = (next: {
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
    }) => {
        handleQueryChange({
            sort: next.sort ?? undefined,
            dir: next.dir ?? undefined,
            page: 1,
        });
    };

    const [view, setView] = React.useState<HistoryItem | null>(null);
    const [confirmResend, setConfirmResend] =
        React.useState<HistoryItem | null>(null);
    const [confirmCancel, setConfirmCancel] =
        React.useState<HistoryItem | null>(null);

    // Realtime updates via Reverb (Echo)
    React.useEffect(() => {
        const Echo = (
            globalThis as {
                Echo?: {
                    private: (name: string) => {
                        listen: (event: string, cb: () => void) => void;
                    };
                    leave: (name: string) => void;
                };
            }
        ).Echo;
        if (!Echo) return;
        try {
            const name = 'management.announcements';
            const ch = Echo.private(name);
            const refresh = () => {
                router.visit(window.location.href, {
                    preserveScroll: true,
                    preserveState: true,
                });
            };
            ch.listen('.management.announcement.created', refresh);
            ch.listen('.management.announcement.updated', refresh);
            return () => {
                try {
                    Echo.leave(name);
                } catch {
                    /* noop */
                }
            };
        } catch {
            /* noop */
        }
    }, []);

    // moved to dialogs/view-dialog.tsx where needed

    const columns = React.useMemo<ColumnDef<HistoryItem>[]>(
        () => [
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <div className="pr-2">
                        <DataTableColumnHeader
                            column={
                                column as unknown as Column<unknown, unknown>
                            }
                            title={t(
                                'management.notifications.th_time',
                                'Time',
                            )}
                        />
                    </div>
                ),
                enableSorting: true,
                cell: ({ row }) => {
                    const it = row.original;
                    return (
                        <div className="pr-2 whitespace-nowrap">
                            {it.scheduled_at ? (
                                <span title={it.created_at}>
                                    {it.scheduled_at}
                                </span>
                            ) : (
                                <span>{it.created_at}</span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'scope',
                header: ({ column }) => (
                    <div className="pr-2">
                        <DataTableColumnHeader
                            column={
                                column as unknown as Column<unknown, unknown>
                            }
                            title={t(
                                'management.notifications.th_target',
                                'Target',
                            )}
                        />
                    </div>
                ),
                enableSorting: true,
                cell: ({ row }) => {
                    const it = row.original;
                    return (
                        <div className="max-w-[220px] truncate pr-2">
                            {it.scope === 'global'
                                ? t(
                                      'management.notifications.target_global',
                                      'Global',
                                  )
                                : `${t(
                                      'management.notifications.target_role',
                                      'Role',
                                  )}${it.role_name ? ': ' + it.role_name : ''}`}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <div className="pr-2">
                        <DataTableColumnHeader
                            column={
                                column as unknown as Column<unknown, unknown>
                            }
                            title={t(
                                'management.notifications.th_title',
                                'Title',
                            )}
                        />
                    </div>
                ),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="max-w-[260px] truncate pr-2">
                        {row.original.title}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => (
                    <div className="pr-2">
                        <DataTableColumnHeader
                            column={
                                column as unknown as Column<unknown, unknown>
                            }
                            title={t(
                                'management.notifications.th_status',
                                'Status',
                            )}
                        />
                    </div>
                ),
                enableSorting: true,
                cell: ({ row }) => {
                    const it = row.original;
                    return (
                        <div className="pr-2 text-xs font-medium uppercase">
                            {t(
                                `management.notifications.status.${it.status}`,
                                String(it.status),
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: () => (
                    <div className="pr-2 text-right">
                        {t('common.actions', 'Actions')}
                    </div>
                ),
                cell: ({ row }) => {
                    const it = row.original;
                    const canSendNow =
                        it.status === 'scheduled' || it.status === 'pending';
                    const canResend =
                        it.status === 'sent' || it.status === 'failed';
                    const canCancelSchedule = it.status === 'scheduled';
                    return (
                        <div
                            className="flex justify-end pl-2"
                            data-row-action="true"
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    asChild
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={t(
                                            'common.actions',
                                            'Actions',
                                        )}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setView(it);
                                        }}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('common.view', 'View details')}
                                    </DropdownMenuItem>
                                    {canSendNow && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                router.visit(
                                                    route(
                                                        'management.announcements.send_now',
                                                        { announcement: it.id },
                                                    ),
                                                    {
                                                        method: 'post',
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {t(
                                                'management.notifications.send_now',
                                                'Send now',
                                            )}
                                        </DropdownMenuItem>
                                    )}
                                    {canResend && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setConfirmResend(it);
                                            }}
                                        >
                                            <Megaphone className="mr-2 h-4 w-4" />
                                            {t(
                                                'management.notifications.resend',
                                                'Resend',
                                            )}
                                        </DropdownMenuItem>
                                    )}
                                    {canCancelSchedule && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setConfirmCancel(it);
                                            }}
                                        >
                                            <XIcon className="mr-2 h-4 w-4" />
                                            {t(
                                                'management.notifications.cancel_schedule',
                                                'Cancel schedule',
                                            )}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [t],
    );

    return (
        <AppLayout
            pageTitle={t('management.notifications.title', 'Announcements')}
            pageDescription={t(
                'management.notifications.desc',
                'Send announcements in real time or schedule them',
            )}
            actions={
                <Button size="sm" onClick={() => setOpenCompose(true)}>
                    <Megaphone className="mr-2 h-4 w-4" />
                    {t(
                        'management.notifications.compose',
                        'Compose Announcement',
                    )}
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Filters + Compose */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> {t('common.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 flex-wrap items-end gap-3">
                                {/* Target filter */}
                                <div className="w-full max-w-[160px]">
                                    <Label className="text-muted-foreground mb-1 block text-xs">
                                        {t(
                                            'management.notifications.target',
                                            'Target',
                                        )}
                                    </Label>
                                    <Select
                                        value={String(filters.scope || 'all')}
                                        onValueChange={(v) => {
                                            const nextScope =
                                                v === 'all' ? undefined : v;
                                            router.visit(
                                                route(
                                                    'management.announcements.index',
                                                    {
                                                        scope: nextScope,
                                                        status:
                                                            filters.status ||
                                                            undefined,
                                                        role_id:
                                                            filters.role_id ||
                                                            undefined,
                                                        q: search || undefined,
                                                    },
                                                ),
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('common.all', 'All')}
                                            </SelectItem>
                                            <SelectItem value="global">
                                                {t(
                                                    'management.notifications.target_global',
                                                    'Global',
                                                )}
                                            </SelectItem>
                                            <SelectItem value="role">
                                                {t(
                                                    'management.notifications.target_role',
                                                    'Role',
                                                )}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status filter */}
                                <div className="w-full max-w-[180px]">
                                    <Label className="text-muted-foreground mb-1 block text-xs">
                                        {t(
                                            'management.notifications.th_status',
                                            'Status',
                                        )}
                                    </Label>
                                    <Select
                                        value={String(filters.status || 'all')}
                                        onValueChange={(v) => {
                                            const next =
                                                v === 'all' ? undefined : v;
                                            router.visit(
                                                route(
                                                    'management.announcements.index',
                                                    {
                                                        status: next,
                                                        scope:
                                                            filters.scope ||
                                                            undefined,
                                                        role_id:
                                                            filters.role_id ||
                                                            undefined,
                                                        q: search || undefined,
                                                    },
                                                ),
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('common.all', 'All')}
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                {t(
                                                    'management.notifications.status.pending',
                                                    'Pending',
                                                )}
                                            </SelectItem>
                                            <SelectItem value="scheduled">
                                                {t(
                                                    'management.notifications.status.scheduled',
                                                    'Scheduled',
                                                )}
                                            </SelectItem>
                                            <SelectItem value="queued">
                                                {t(
                                                    'management.notifications.status.queued',
                                                    'Queued',
                                                )}
                                            </SelectItem>
                                            <SelectItem value="sent">
                                                {t(
                                                    'management.notifications.status.sent',
                                                    'Sent',
                                                )}
                                            </SelectItem>
                                            <SelectItem value="failed">
                                                {t(
                                                    'management.notifications.status.failed',
                                                    'Failed',
                                                )}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Role filter (when scope=role) */}
                                {String(filters.scope || '') === 'role' && (
                                    <div className="w-full max-w-[200px]">
                                        <Label className="text-muted-foreground mb-1 block text-xs">
                                            {t(
                                                'management.notifications.role_select',
                                                'Role',
                                            )}
                                        </Label>
                                        <Select
                                            value={String(
                                                filters.role_id || 'all',
                                            )}
                                            onValueChange={(v) => {
                                                const next =
                                                    v === 'all' ? undefined : v;
                                                router.visit(
                                                    route(
                                                        'management.announcements.index',
                                                        {
                                                            role_id: next,
                                                            scope:
                                                                filters.scope ||
                                                                undefined,
                                                            status:
                                                                filters.status ||
                                                                undefined,
                                                            q:
                                                                search ||
                                                                undefined,
                                                        },
                                                    ),
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                    },
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {t('common.all', 'All')}
                                                </SelectItem>
                                                {roles.map((r) => (
                                                    <SelectItem
                                                        key={r.id}
                                                        value={String(r.id)}
                                                    >
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2" />
                        </div>
                    </CardContent>
                </Card>
                {/* Compose dialog */}
                <Dialog
                    open={openCompose}
                    onOpenChange={(o) => {
                        setOpenCompose(o);
                        if (!o) resetCompose();
                    }}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {t(
                                    'management.notifications.compose',
                                    'Compose Announcement',
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'management.notifications.desc',
                                    'Send announcements in real time or schedule them',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitUnified} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="target">
                                    {t(
                                        'management.notifications.target',
                                        'Target',
                                    )}
                                </Label>
                                <Select
                                    value={target}
                                    onValueChange={(v) =>
                                        setTarget(
                                            v as 'global' | 'role' | 'user',
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="target"
                                        className="h-9 w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">
                                            {t(
                                                'management.notifications.target_global',
                                                'Global',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="role">
                                            {t(
                                                'management.notifications.target_role',
                                                'Role',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="user">
                                            {t(
                                                'management.notifications.target_user',
                                                'User',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {target === 'role' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="role">
                                        {t(
                                            'management.notifications.role_select',
                                            'Role',
                                        )}
                                    </Label>
                                    <Select
                                        value={roleId}
                                        onValueChange={setRoleId}
                                    >
                                        <SelectTrigger
                                            id="role"
                                            className="h-9 w-full"
                                            aria-invalid={Boolean(
                                                errors.role_id,
                                            )}
                                        >
                                            <SelectValue
                                                placeholder={t(
                                                    'management.notifications.choose_role',
                                                    'Choose role',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem
                                                    key={r.id}
                                                    value={String(r.id)}
                                                >
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        name="role_id"
                                        message={errors.role_id}
                                    />
                                </div>
                            )}
                            {target === 'user' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="user">
                                        {t(
                                            'management.notifications.user_select',
                                            'User',
                                        )}
                                    </Label>
                                    <SearchSelect
                                        value={userId}
                                        onChange={(v) => setUserId(v)}
                                        options={
                                            users.map((u) => ({
                                                value: String(u.id),
                                                label: u.name || `#${u.id}`,
                                                description:
                                                    u.email || undefined,
                                            })) as SearchOption[]
                                        }
                                        placeholder={t(
                                            'management.notifications.choose_user',
                                            'Choose user',
                                        )}
                                    />
                                    <InputError
                                        name="user_id"
                                        message={errors.user_id}
                                    />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="title">
                                    {t(
                                        'management.notifications.title_label',
                                        'Title',
                                    )}
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    aria-invalid={Boolean(errors.title)}
                                    placeholder={t(
                                        'management.notifications.title_placeholder',
                                        'Enter announcement title...',
                                    )}
                                />
                                <InputError
                                    name="title"
                                    message={errors.title}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">
                                    {t(
                                        'management.notifications.message_label',
                                        'Message',
                                    )}
                                </Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    aria-invalid={Boolean(errors.message)}
                                    placeholder={t(
                                        'management.notifications.message_placeholder',
                                        'Write the announcement message...',
                                    )}
                                />
                                <InputError
                                    name="message"
                                    message={errors.message}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="action">
                                    {t(
                                        'management.notifications.action_url_label',
                                        'Action URL (optional)',
                                    )}
                                </Label>
                                <Input
                                    id="action"
                                    type="url"
                                    value={actionUrl}
                                    onChange={(e) =>
                                        setActionUrl(e.target.value)
                                    }
                                    aria-invalid={Boolean(errors.action_url)}
                                    placeholder={t(
                                        'management.notifications.action_url_placeholder',
                                        'https://example.com/path',
                                    )}
                                />
                                <InputError
                                    name="action_url"
                                    message={errors.action_url}
                                />
                            </div>
                            {target !== 'user' && (
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <Label htmlFor="persist">
                                            {t(
                                                'management.notifications.persist_label',
                                                'Persist per user',
                                            )}
                                        </Label>
                                        <p className="text-muted-foreground text-xs">
                                            {t(
                                                'management.notifications.persist_hint',
                                                'Create stored notifications for each user (queued).',
                                            )}
                                        </p>
                                    </div>
                                    <Switch
                                        id="persist"
                                        checked={persist}
                                        onCheckedChange={(v) =>
                                            setPersist(Boolean(v))
                                        }
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <Label htmlFor="schedule">
                                        {t(
                                            'management.notifications.schedule_label',
                                            'Schedule',
                                        )}
                                    </Label>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'management.notifications.schedule_hint',
                                            'Send later at a specified time.',
                                        )}
                                    </p>
                                </div>
                                <Switch
                                    id="schedule"
                                    checked={schedule}
                                    onCheckedChange={(v) =>
                                        setSchedule(Boolean(v))
                                    }
                                />
                            </div>
                            {schedule && (
                                <div className="grid gap-2">
                                    <Label>
                                        {t(
                                            'management.notifications.when',
                                            'When',
                                        )}
                                    </Label>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:w-auto"
                                                >
                                                    {scheduledDate
                                                        ? formatDateTime(
                                                              scheduledDate,
                                                              scheduledTime,
                                                          )
                                                        : t(
                                                              'common.pick_date',
                                                              'Pick date',
                                                          )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={scheduledDate}
                                                    onSelect={(d) => {
                                                        setScheduledDate(
                                                            d || undefined,
                                                        );
                                                        const next =
                                                            formatDateTime(
                                                                d || undefined,
                                                                scheduledTime,
                                                            );
                                                        setScheduledAt(next);
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor="scheduledTime"
                                                className="text-xs sm:text-sm"
                                            >
                                                {t('common.time', 'Time')}
                                            </Label>
                                            <Input
                                                id="scheduledTime"
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setScheduledTime(v);
                                                    const next = formatDateTime(
                                                        scheduledDate,
                                                        v,
                                                    );
                                                    setScheduledAt(next);
                                                }}
                                                className="h-9 w-full sm:w-[140px]"
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        name="scheduled_at"
                                        message={errors.scheduled_at}
                                    />
                                </div>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenCompose(false)}
                                    disabled={submitting}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !title ||
                                        !message ||
                                        (target === 'role' && !roleId)
                                    }
                                >
                                    {submitting
                                        ? t(
                                              'common.processing',
                                              'Processing...',
                                          )
                                        : t(
                                              'management.notifications.send',
                                              'Send',
                                          )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <AnnouncementViewDialog
                    item={view}
                    onClose={() => setView(null)}
                />

                <ConfirmResendDialog
                    item={confirmResend}
                    onClose={() => setConfirmResend(null)}
                />

                <ConfirmCancelDialog
                    item={confirmCancel}
                    onClose={() => setConfirmCancel(null)}
                />
                <Card>
                    <CardContent>
                        <DataTableServer<HistoryItem, unknown>
                            columns={columns}
                            rows={props.rows || []}
                            paginator={props.paginator}
                            search={search}
                            onSearchChange={setSearch}
                            onQueryChange={handleQueryChange}
                            sort={String(filters.sort || 'created_at')}
                            dir={(filters.dir as 'asc' | 'desc') || 'desc'}
                            onSortChange={onSortChange}
                            showRefresh={false}
                            searchKey="title"
                            searchPlaceholder={t(
                                'management.notifications.search_title',
                                'Search title...',
                            )}
                            showColumn={false}
                            onRowClick={(row) => setView(row)}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
