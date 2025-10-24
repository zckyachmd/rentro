import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ExternalLink,
    Eye,
    Filter,
    Megaphone,
    MoreHorizontal,
    Send,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import type { PageProps as InertiaPageProps } from '@/types';

type Role = { id: number; name: string };
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
    rows: HistoryItem[];
    paginator: PaginatorMeta;
    filters: Filters;
}>;

export default function ManagementNotificationsPage() {
    const { t } = useTranslation();
    const { props } = usePage<Props>();
    const roles = props.roles || [];

    // Compose dialog state
    const [openCompose, setOpenCompose] = React.useState(false);

    // Unified announcement form state
    const [target, setTarget] = React.useState<'global' | 'role'>('global');
    const [roleId, setRoleId] = React.useState<string>(
        roles[0]?.id ? String(roles[0].id) : '',
    );
    const [title, setTitle] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [actionUrl, setActionUrl] = React.useState('');
    const [persist, setPersist] = React.useState(false);
    const [schedule, setSchedule] = React.useState(false);
    const [scheduledAt, setScheduledAt] = React.useState<string>('');
    const [errors, setErrors] = React.useState<
        Record<string, string | undefined>
    >({});
    const [submitting, setSubmitting] = React.useState(false);

    const resetCompose = () => {
        setTarget('global');
        setRoleId(roles[0]?.id ? String(roles[0].id) : '');
        setTitle('');
        setMessage('');
        setActionUrl('');
        setPersist(false);
        setSchedule(false);
        setScheduledAt('');
        setErrors({});
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

    const handleQueryChange = (next: Partial<Filters> & { search?: string }) => {
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

    // Realtime updates via Reverb (Echo)
    React.useEffect(() => {
        const Echo = (globalThis as {
            Echo?: {
                private: (name: string) => {
                    listen: (event: string, cb: () => void) => void;
                };
                leave: (name: string) => void;
            };
        }).Echo;
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

    const columns = React.useMemo<ColumnDef<HistoryItem>[]>(
        () => [
            {
                accessorKey: 'created_at',
                header: () => (
                    <div className="pr-2">
                        {t('management.notifications.th_time', 'Time')}
                    </div>
                ),
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
                header: () => (
                    <div className="pr-2">
                        {t('management.notifications.th_target', 'Target')}
                    </div>
                ),
                cell: ({ row }) => {
                    const it = row.original;
                    return (
                        <div className="max-w-[220px] truncate pr-2">
                            {it.scope === 'global'
                                ? t('management.notifications.global', 'Global')
                                : `${t('management.notifications.role', 'Role')}${it.role_name ? ': ' + it.role_name : ''}`}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'title',
                header: () => (
                    <div className="pr-2">
                        {t('management.notifications.th_title', 'Title')}
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="max-w-[260px] truncate pr-2">
                        {row.original.title}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: () => (
                    <div className="pr-2">
                        {t('management.notifications.th_status', 'Status')}
                    </div>
                ),
                cell: ({ row }) => {
                    const it = row.original;
                    return (
                        <div className="pr-2 text-xs font-medium uppercase">
                            {String(it.status)}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: () => <div className="pr-1 text-right">&nbsp;</div>,
                cell: ({ row }) => {
                    const it = row.original;
                    const canSendNow =
                        it.status === 'scheduled' || it.status === 'pending';
                    const canResend =
                        it.status === 'sent' || it.status === 'failed';
                    return (
                        <div className="flex justify-end pl-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Actions"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => setView(it)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('common.view', 'View details')}
                                    </DropdownMenuItem>
                                    {canSendNow && (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                router.visit(
                                                    route(
                                                        'management.announcements.send_now',
                                                        { announcement: it.id },
                                                    ),
                                                    {
                                                        method: 'post',
                                                        preserveScroll: true,
                                                    },
                                                )
                                            }
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
                                            onClick={() =>
                                                router.visit(
                                                    route(
                                                        'management.announcements.resend',
                                                        { announcement: it.id },
                                                    ),
                                                    {
                                                        method: 'post',
                                                        preserveScroll: true,
                                                    },
                                                )
                                            }
                                        >
                                            <Megaphone className="mr-2 h-4 w-4" />
                                            {t(
                                                'management.notifications.resend',
                                                'Resend',
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
        [t, filters],
    );

    // filters rendered in the card above the table

    return (
        <AppLayout
            pageTitle={t(
                'management.notifications.title',
                'Notifications Management',
            )}
            pageDescription={t(
                'management.notifications.desc',
                'Send announcements in real time or schedule them',
            )}
        >
            <div className="space-y-6">
                {/* Filter + Compose (like Users management) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {t(
                                'management.notifications.title',
                                'Notifications Management',
                            )}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                            {t(
                                'management.notifications.desc',
                                'Send announcements in real time or schedule them',
                            )}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                {/* Target filter */}
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
                                    <SelectTrigger className="w-full md:w-[140px]">
                                        <SelectValue
                                            placeholder={t(
                                                'management.notifications.target',
                                                'Target',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all', 'All')}
                                        </SelectItem>
                                        <SelectItem value="global">
                                            {t(
                                                'management.notifications.global',
                                                'Global',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="role">
                                            {t(
                                                'management.notifications.role',
                                                'Role',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Status filter */}
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
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue
                                            placeholder={t(
                                                'management.notifications.th_status',
                                                'Status',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all', 'All')}
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            pending
                                        </SelectItem>
                                        <SelectItem value="scheduled">
                                            scheduled
                                        </SelectItem>
                                        <SelectItem value="queued">
                                            queued
                                        </SelectItem>
                                        <SelectItem value="sent">
                                            sent
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            failed
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Role filter (when scope=role) */}
                                {String(filters.scope || '') === 'role' && (
                                    <Select
                                        value={String(filters.role_id || 'all')}
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
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue
                                                placeholder={t(
                                                    'management.notifications.role_select',
                                                    'Role',
                                                )}
                                            />
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
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => setOpenCompose(true)}
                                >
                                    <Megaphone className="mr-2 h-4 w-4" />
                                    {t(
                                        'management.notifications.compose',
                                        'Compose Announcement',
                                    )}
                                </Button>
                            </div>
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
                                        setTarget(v as 'global' | 'role')
                                    }
                                >
                                    <SelectTrigger id="target">
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
                                    <Label htmlFor="scheduledAt">
                                        {t(
                                            'management.notifications.when',
                                            'When',
                                        )}
                                    </Label>
                                    <Input
                                        id="scheduledAt"
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) =>
                                            setScheduledAt(e.target.value)
                                        }
                                    />
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

                {/* View Detail dialog */}
                <Dialog
                    open={!!view}
                    onOpenChange={(o) => {
                        if (!o) setView(null);
                    }}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Megaphone className="h-4 w-4" />
                                {view?.title}
                            </DialogTitle>
                            <DialogDescription>
                                {view?.scope === 'global'
                                    ? t(
                                          'management.notifications.global',
                                          'Global',
                                      )
                                    : `${t('management.notifications.role', 'Role')}${view?.role_name ? ': ' + view.role_name : ''}`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                            {view?.message && (
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">
                                        {t(
                                            'management.notifications.message_label',
                                            'Message',
                                        )}
                                    </Label>
                                    <div className="mt-1 text-sm whitespace-pre-wrap">
                                        {view?.message}
                                    </div>
                                </div>
                            )}
                            {view?.action_url && (
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">
                                        {t(
                                            'management.notifications.action_url_label',
                                            'Action URL (optional)',
                                        )}
                                    </Label>
                                    <div className="mt-1">
                                        <a
                                            href={view?.action_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-sm underline hover:no-underline"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            {view?.action_url}
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-1 text-sm">
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">
                                        {t(
                                            'management.notifications.th_status',
                                            'Status',
                                        )}
                                    </Label>
                                    <div className="mt-0.5">
                                        {String(
                                            view?.status || '',
                                        ).toUpperCase()}
                                    </div>
                                </div>
                                {view?.scheduled_at ? (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase">
                                            {t(
                                                'management.notifications.when',
                                                'When',
                                            )}
                                        </Label>
                                        <div className="mt-0.5">
                                            {view?.scheduled_at}
                                        </div>
                                    </div>
                                ) : null}
                                {view?.sent_at ? (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase">
                                            {t(
                                                'management.notifications.sent_at',
                                                'sent at',
                                            )}
                                        </Label>
                                        <div className="mt-0.5">
                                            {view?.sent_at}
                                        </div>
                                    </div>
                                ) : null}
                                {view?.persist ? (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase">
                                            Persist
                                        </Label>
                                        <div className="mt-0.5">Yes</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-2">
                            {view &&
                                (view.status === 'scheduled' ||
                                    view.status === 'pending') && (
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            router.visit(
                                                route(
                                                    'management.announcements.send_now',
                                                    { announcement: view.id },
                                                ),
                                                {
                                                    method: 'post',
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setView(null),
                                                },
                                            )
                                        }
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {t(
                                            'management.notifications.send_now',
                                            'Send now',
                                        )}
                                    </Button>
                                )}
                            <Button
                                variant="outline"
                                onClick={() => setView(null)}
                            >
                                {t('common.close', 'Close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Card>
                    <CardContent className="pt-6">
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
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
