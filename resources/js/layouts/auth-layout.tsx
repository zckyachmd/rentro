import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Head, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import Footer from './partials/footer';
import { hasChildren, MenuGroup } from './partials/menu';
import Navbar from './partials/navbar';
import Sidebar from './partials/sidebar';

import Breadcrumbs, { Crumb } from '@/components/breadcrumbs';
import { getAppName } from '@/lib/env';
import type { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import React from 'react';

const LS_SIDEBAR = 'rentro:sidebar:collapsed';

function getIconByName(name?: string) {
    if (!name) return undefined;
    const icons = Icons as unknown as Record<string, LucideIcon>;
    return icons[name];
}

type ServerMenuChild = { label: string; href?: string; icon?: string };

type ServerMenuItem = {
    label: string;
    href?: string;
    icon?: string;
    children?: ServerMenuChild[] | null;
};

type ServerMenuGroup = { id: string; label: string; items: ServerMenuItem[] };

type AuthLayoutProps = PropsWithChildren<{
    header?: ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    breadcrumbs?: Crumb[];
}>;

interface AppPageProps {
    [key: string]: unknown;
    auth?: { user?: { name: string; email: string } };
    menuGroups?: ServerMenuGroup[];
}

export default function AuthLayout({
    header,
    children,
    pageTitle = 'Dashboard',
    pageDescription,
    breadcrumbs,
}: AuthLayoutProps) {
    const brandLabel = getAppName();

    const { auth, menuGroups: serverMenuGroups } =
        usePage<AppPageProps>().props;
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
        // eslint-disable-next-line no-console
        console.log('search:', q);
    };

    const menuGroups: MenuGroup[] = React.useMemo(() => {
        const groups = serverMenuGroups ?? [];
        return groups.map((g) => ({
            id: g.id,
            label: g.label,
            items: (g.items ?? []).map((m) => ({
                label: m.label,
                href: m.href,
                icon: getIconByName(m.icon),
                children: (m.children ?? undefined)?.map((c) => ({
                    label: c.label,
                    href: c.href,
                    icon: getIconByName(c.icon),
                })),
            })),
        }));
    }, [serverMenuGroups]);

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
        <div className="min-h-screen bg-background text-foreground">
            <Head title={pageTitle} />

            <ThemeProvider>
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
                            effectiveBreadcrumbs.length > 0 ||
                            pageTitle ||
                            pageDescription) && (
                            <div className="border-b bg-background">
                                <div className="container mx-auto space-y-2 px-4 py-3 md:py-4">
                                    {(pageTitle ||
                                        pageDescription ||
                                        header) && (
                                        <div className="space-y-1">
                                            {pageTitle && (
                                                <h1 className="text-xl font-semibold leading-tight tracking-tight">
                                                    {pageTitle}
                                                </h1>
                                            )}
                                            {pageDescription && (
                                                <p className="text-sm text-muted-foreground">
                                                    {pageDescription}
                                                </p>
                                            )}
                                            {header}
                                        </div>
                                    )}
                                    {effectiveBreadcrumbs.length > 0 && (
                                        <Breadcrumbs
                                            items={effectiveBreadcrumbs}
                                        />
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
            </ThemeProvider>
        </div>
    );
}
