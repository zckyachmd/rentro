import { Head, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
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
import Footer from '@/layouts/app/footer';
import { hasChildren } from '@/layouts/app/menu';
import Navbar from '@/layouts/app/navbar';
import Sidebar from '@/layouts/app/sidebar';
import { getAppName } from '@/lib/env';
import type { PageProps as InertiaPageProps } from '@/types';
import type { MenuGroup } from '@/types/navigation';

const LS_SIDEBAR = 'rentro:sidebar:collapsed';

function makeLazyIcon(name?: string) {
    if (!name) return undefined;
    const C: React.ComponentType<React.SVGProps<SVGSVGElement>> = (props) => (
        <LazyIcon name={name} {...props} />
    );
    return C as unknown as LucideIcon;
}

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

    const { auth, menus: serverMenus } = usePage<AppPageProps>().props;
    const user = auth?.user || { name: 'User', email: 'user@example.com' };

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem(LS_SIDEBAR);
            return raw === '1';
        } catch {
            return false;
        }
    });
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
                icon: m.icon, // pass through name; Menu renders LazyIcon
                children: (m.children ?? undefined)?.map((c) => ({
                    label: c.label,
                    href: c.href,
                    icon: c.icon,
                })),
            })),
        }));
    }, [serverMenus]);

    const effectiveBreadcrumbs: Crumb[] = React.useMemo(() => {
        if (breadcrumbs && breadcrumbs.length) return breadcrumbs;
        return [];
    }, [breadcrumbs]);

    const activeParentId = React.useMemo(() => {
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
                            return `${group.id}:${parent.label}`;
                        }
                    }
                }
            }
        } catch {
            /* ignore active parent */
        }
        return undefined;
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
                                titleIcon ||
                                effectiveBreadcrumbs.length > 0 ||
                                pageTitle ||
                                pageDescription) && (
                                <div className="bg-background border-b">
                                    <div className="container mx-auto space-y-2 px-4 py-3 md:py-4">
                                        {(pageTitle ||
                                            pageDescription ||
                                            header ||
                                            actions ||
                                            titleIcon) && (
                                            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                                <div className="min-w-0">
                                                    <div
                                                        className={
                                                            titleIcon
                                                                ? 'grid grid-cols-[auto_1fr] items-center gap-3'
                                                                : ''
                                                        }
                                                    >
                                                        {titleIcon && (
                                                            <div className="h-6 w-6 place-self-center">
                                                                {typeof titleIcon !== 'string' ? (
                                                                    titleIcon
                                                                ) : (
                                                                    <LazyIcon
                                                                        name={titleIcon}
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
