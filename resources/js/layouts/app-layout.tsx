import { Head, usePage } from '@inertiajs/react';
import React, {
    PropsWithChildren,
    ReactNode,
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import Breadcrumbs, { Crumb } from '@/components/breadcrumbs';
import FlashToaster from '@/components/flash-toaster';
import LazyIcon from '@/components/lazy-icon';
import { LocaleProvider } from '@/components/locale-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import Footer from '@/layouts/app/footer';
import { hasChildren } from '@/layouts/app/menu';
import Navbar from '@/layouts/app/navbar';
import Sidebar from '@/layouts/app/sidebar';
import { getAppName } from '@/lib/env';
import { ensureWebNotificationPermission } from '@/lib/web-notify';
import {
    useNotificationsStore,
    type NotificationItem,
} from '@/stores/notifications';
import type { PageProps as InertiaPageProps } from '@/types';
import type { MenuGroup } from '@/types/navigation';

const LS_SIDEBAR = 'rentro:sidebar:collapsed';

type ServerMenuChild = { label: string; href?: string; icon?: string };

type ServerMenuItem = {
    label: string;
    href?: string;
    icon?: string;
    children?: ServerMenuChild[] | null;
};

type ServerMenuGroup = { id: string; label: string; items: ServerMenuItem[] };

type AppLayoutProps = PropsWithChildren<{
    header?: ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    breadcrumbs?: Crumb[];
    actions?: ReactNode;
    titleIcon?: ReactNode | string;
}>;

type AppPageProps = InertiaPageProps<{
    menus?: ServerMenuGroup[];
    notifications?: {
        unread: number;
        latest: Array<{
            id: string;
            data: {
                title?: unknown;
                message?: unknown;
                action_url?: string | null;
                meta?: unknown;
                created_at?: string | null;
            };
            read_at?: string | null;
            created_at?: string | null;
        }>;
    };
}>;

export default function AppLayout({
    header,
    children,
    pageTitle = 'Dashboard',
    pageDescription,
    breadcrumbs,
    actions,
    titleIcon,
}: AppLayoutProps) {
    const { t } = useTranslation();
    const brandLabel = getAppName();

    const {
        auth,
        menus: serverMenus,
        notifications: notifSummary,
    } = usePage<AppPageProps>().props;
    const user = auth?.user || { name: 'User', email: 'user@example.com' };

    // Realtime notifications via WebSocket (Echo), polling removed
    useRealtimeNotifications({
        enabled: true,
        userId: auth?.user?.id ?? undefined,
        roleIds:
            (auth?.user as unknown as { role_ids?: Array<number | string> })
                ?.role_ids ?? [],
        globalChannel:
            (import.meta.env as Record<string, string | undefined>)
                .VITE_NOTIFICATIONS_GLOBAL_CHANNEL || 'global',
        globalPrivate:
            String(
                (import.meta.env as Record<string, string | undefined>)
                    .VITE_NOTIFICATIONS_GLOBAL_PRIVATE || '',
            ) === 'true',
        enableSound: true,
        minToastPriority: 'normal',
        includeAnnouncementsInBell: true,
        resyncIntervalMs: 90_000,
    });

    React.useEffect(() => {
        try {
            ensureWebNotificationPermission();
        } catch {
            // ignore
        }
    }, []);

    // Hydrate notifications store once from shared props so Navbar has data on refresh
    const { setInitial, items: notifItems } = useNotificationsStore();
    React.useEffect(() => {
        try {
            if (!notifSummary) return;
            // Only hydrate if store is empty to avoid clobbering live updates
            if (notifItems && notifItems.length > 0) return;
            const parseMaybeJson = (v: unknown) => {
                if (typeof v === 'string') {
                    const s = v.trim();
                    if (s.startsWith('{') && s.endsWith('}')) {
                        try {
                            const obj = JSON.parse(s) as Record<
                                string,
                                unknown
                            >;
                            if (obj && typeof obj === 'object') return obj;
                        } catch {
                            /* noop */
                        }
                    }
                }
                return v;
            };
            const mapped: NotificationItem[] = (notifSummary.latest || []).map(
                (n) => {
                    const d = n.data as Record<string, unknown>;
                    const tRaw = parseMaybeJson(d.title);
                    const mRaw = parseMaybeJson(d.message);
                    const titleVal =
                        (typeof tRaw === 'string' && tRaw) ||
                        (tRaw && typeof tRaw === 'object'
                            ? (tRaw as Record<string, unknown>)
                            : 'Notification');
                    const messageVal =
                        (typeof mRaw === 'string' && mRaw) ||
                        (mRaw && typeof mRaw === 'object'
                            ? (mRaw as Record<string, unknown>)
                            : '');
                    return {
                        id: n.id,
                        title: titleVal,
                        message: messageVal,
                        action_url:
                            (typeof d.action_url === 'string' &&
                                d.action_url) ||
                            (typeof (d as { url?: unknown }).url === 'string' &&
                                (d as { url?: string }).url) ||
                            undefined,
                        meta: (d.meta as Record<string, unknown>) || undefined,
                        created_at:
                            (typeof d.created_at === 'string' &&
                                d.created_at) ||
                            n.created_at ||
                            undefined,
                        read_at: n.read_at || null,
                    };
                },
            );
            setInitial(mapped, Number(notifSummary.unread || 0));
        } catch {
            // ignore hydration errors
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifSummary]);

    // Read from localStorage on client after mount to avoid SSR mismatch
    const [collapsed, setCollapsed] = useState<boolean>(false);
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_SIDEBAR);
            setCollapsed(raw === '1');
        } catch {
            // ignore
        }
    }, []);
    const toggleCollapsed = useCallback(() => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem(LS_SIDEBAR, next ? '1' : '0');
            return next;
        });
    }, []);

    const [q, setQ] = useState('');

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('search:', q);
    };

    const menuGroups: MenuGroup[] = React.useMemo(() => {
        const groups = serverMenus ?? [];
        return groups.map((g) => ({
            id: g.id,
            label: g.label,
            items: (g.items ?? []).map((m) => ({
                label: m.label,
                href: m.href,
                icon: m.icon,
                children: (m.children ?? undefined)?.map((c) => ({
                    label: c.label,
                    href: c.href,
                    icon: c.icon,
                })),
            })),
        }));
    }, [serverMenus]);

    const derivedTitleIcon: ReactNode | string | undefined =
        React.useMemo(() => {
            if (titleIcon) return titleIcon;
            try {
                const currentPath = window.location?.pathname || '';
                const normalize = (p: string) =>
                    p.endsWith('/') && p.length > 1 ? p.slice(0, -1) : p;
                const matchHref = (href?: string) => {
                    if (!href) return false;
                    try {
                        const u = new URL(href, window.location.origin);
                        const menuPath = normalize(u.pathname);
                        const curr = normalize(currentPath);
                        return (
                            curr === menuPath || curr.startsWith(menuPath + '/')
                        );
                    } catch {
                        const menuPath = normalize(href);
                        const curr = normalize(currentPath);
                        return (
                            curr === menuPath || curr.startsWith(menuPath + '/')
                        );
                    }
                };
                for (const group of menuGroups) {
                    for (const item of group.items || []) {
                        if (
                            Array.isArray(item.children) &&
                            item.children.length
                        ) {
                            for (const child of item.children) {
                                if (matchHref(child.href) && child.icon) {
                                    return child.icon as string;
                                }
                            }
                        }
                        if (matchHref(item.href) && item.icon) {
                            return item.icon as string;
                        }
                    }
                }
            } catch {
                /* noop */
            }
            return undefined;
        }, [titleIcon, menuGroups]);

    const effectiveBreadcrumbs: Crumb[] = React.useMemo(() => {
        if (breadcrumbs && breadcrumbs.length) return breadcrumbs;
        return [];
    }, [breadcrumbs]);

    const [activeParentId, setActiveParentId] = React.useState<
        string | undefined
    >(undefined);
    React.useEffect(() => {
        try {
            const currentPath = window.location?.pathname || '';
            for (const group of menuGroups) {
                for (const parent of group.items || []) {
                    if (!hasChildren(parent)) continue;
                    for (const child of parent.children) {
                        const byHref = child.href
                            ? new URL(child.href, window.location.origin)
                                  .pathname === currentPath
                            : false;
                        if (byHref) {
                            setActiveParentId(`${group.id}:${parent.label}`);
                            return;
                        }
                    }
                }
            }
            setActiveParentId(undefined);
        } catch {
            setActiveParentId(undefined);
        }
    }, [menuGroups]);

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Head title={pageTitle} />

            <ThemeProvider>
                <LocaleProvider>
                    <div className="flex min-h-screen">
                        <Sidebar
                            collapsed={collapsed}
                            brandLabel={brandLabel}
                            user={user}
                            menuGroups={menuGroups}
                            activeParentId={activeParentId}
                        />

                        <div className="flex min-w-0 flex-1 flex-col">
                            <Navbar
                                collapsed={collapsed}
                                onToggleCollapsed={toggleCollapsed}
                                brandLabel={brandLabel}
                                q={q}
                                setQ={setQ}
                                onSearchSubmit={onSearchSubmit}
                                user={user}
                                menuGroups={menuGroups}
                                activeParentId={activeParentId}
                            />

                            {(header ||
                                actions ||
                                derivedTitleIcon ||
                                effectiveBreadcrumbs.length > 0 ||
                                pageTitle ||
                                pageDescription) && (
                                <div className="bg-background border-b">
                                    <div className="container mx-auto space-y-2 px-4 py-3 md:py-4">
                                        {(pageTitle ||
                                            pageDescription ||
                                            header ||
                                            actions ||
                                            derivedTitleIcon) && (
                                            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                                <div className="min-w-0">
                                                    <div
                                                        className={
                                                            derivedTitleIcon
                                                                ? 'grid grid-cols-[auto_1fr] items-center gap-3'
                                                                : ''
                                                        }
                                                    >
                                                        {derivedTitleIcon && (
                                                            <div className="h-6 w-6 place-self-center">
                                                                {typeof derivedTitleIcon !==
                                                                'string' ? (
                                                                    derivedTitleIcon
                                                                ) : (
                                                                    <LazyIcon
                                                                        name={
                                                                            derivedTitleIcon
                                                                        }
                                                                        className="h-6 w-6"
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 space-y-1">
                                                            {pageTitle && (
                                                                <h1 className="truncate text-xl leading-tight font-semibold tracking-tight">
                                                                    {pageTitle ===
                                                                    'Dashboard'
                                                                        ? t(
                                                                              'dashboard.title',
                                                                          )
                                                                        : pageTitle}
                                                                </h1>
                                                            )}
                                                            {pageDescription && (
                                                                <p className="text-muted-foreground text-sm">
                                                                    {
                                                                        pageDescription
                                                                    }
                                                                </p>
                                                            )}
                                                            {header}
                                                        </div>
                                                    </div>
                                                    {effectiveBreadcrumbs.length >
                                                        0 && (
                                                        <div className="mt-1">
                                                            <Breadcrumbs
                                                                items={
                                                                    effectiveBreadcrumbs
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {actions && (
                                                    <div className="shrink-0 self-center">
                                                        {actions}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <main className="container mx-auto flex-1 px-4 py-6">
                                {children}
                            </main>

                            <Footer
                                brandLabel={brandLabel}
                                fullWidth={false}
                                variant="between"
                                heightClass="h-16"
                                withContainer
                            />
                        </div>
                    </div>

                    <Toaster />
                    <FlashToaster />
                </LocaleProvider>
            </ThemeProvider>
        </div>
    );
}
