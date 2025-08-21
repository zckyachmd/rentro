import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Head, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import Footer from './partials/footer';
import Navbar from './partials/navbar';
import Sidebar from './partials/sidebar';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAppName } from '@/lib/env';
import type { LucideIcon } from 'lucide-react';
import {
    Archive,
    Bed,
    Bell,
    BookText,
    CalendarCheck,
    ClipboardCheck,
    CreditCard,
    FileBarChart2,
    HelpCircle,
    Home,
    KeySquare,
    LifeBuoy,
    MessageSquareWarning,
    Package,
    ReceiptText,
    Settings,
    ShieldCheck,
    User as UserIcon,
    Users,
    Wallet,
    Wrench,
} from 'lucide-react';
import React from 'react';

const LS_SIDEBAR = 'rentro:sidebar:collapsed';

export function isRouteActive(name?: string): boolean {
    try {
        return !!(
            name &&
            typeof route === 'function' &&
            route().current?.(name as string)
        );
    } catch {
        return false;
    }
}

type MenuChild = {
    label: string;
    href?: string;
    name?: string;
    icon?: LucideIcon;
};
type MenuItem = {
    label: string;
    href?: string;
    name?: string;
    icon?: LucideIcon;
    children?: MenuChild[];
};
type MenuGroup = { id: string; label: string; items: MenuItem[] };

function hasChildren(
    item: MenuItem,
): item is MenuItem & { children: MenuChild[] } {
    return Array.isArray(item.children) && item.children.length > 0;
}

type Crumb = { label: string; href?: string };

function Breadcrumbs({ items }: { items: Crumb[] }) {
    if (!items || items.length === 0) return null;
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((c, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <React.Fragment key={`${c.label}-${idx}`}>
                            <BreadcrumbItem>
                                {isLast || !c.href ? (
                                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <a href={c.href}>{c.label}</a>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

type AuthLayoutProps = PropsWithChildren<{
    header?: ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    breadcrumbs?: Crumb[];
}>;

type InertiaProps = { auth?: { user?: { name: string; email: string } } };
export default function AuthLayout({
    header,
    children,
    pageTitle = 'Dashboard',
    pageDescription,
    breadcrumbs,
}: AuthLayoutProps) {
    const brandLabel = getAppName();

    const { auth } = usePage().props as InertiaProps;
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
        // TODO: arahkan ke halaman pencarian ketika sudah ada rutenya
        // eslint-disable-next-line no-console
        console.log('search:', q);
    };

    const menuGroups: MenuGroup[] = React.useMemo(
        () => [
            {
                id: 'general',
                label: 'Umum',
                items: [
                    {
                        label: 'Dashboard',
                        href: route('dashboard'),
                        name: 'dashboard',
                        icon: Home,
                    },
                    { label: 'Kamar', href: '#', icon: Bed },
                    { label: 'Penyewa', href: '#', icon: UserIcon },
                    { label: 'Booking', href: '#', icon: CalendarCheck },
                ],
            },
            {
                id: 'keuangan',
                label: 'Keuangan',
                items: [
                    {
                        label: 'Keuangan',
                        icon: Wallet,
                        children: [
                            { label: 'Tagihan', href: '#', icon: ReceiptText },
                            {
                                label: 'Pembayaran',
                                href: '#',
                                icon: CreditCard,
                            },
                            {
                                label: 'Laporan',
                                href: '#',
                                icon: FileBarChart2,
                            },
                            {
                                label: 'Rekonsiliasi',
                                href: '#',
                                icon: FileBarChart2,
                            },
                            { label: 'Aset', href: '#', icon: Package },
                        ],
                    },
                ],
            },
            {
                id: 'operasional',
                label: 'Operasional',
                items: [
                    {
                        label: 'Tugas & Maintenance',
                        icon: Wrench,
                        children: [
                            { label: 'Tugas', href: '#', icon: ClipboardCheck },
                            { label: 'Maintenance', href: '#', icon: Wrench },
                            {
                                label: 'Task Template',
                                href: '#',
                                icon: ClipboardCheck,
                            },
                            { label: 'SLA', href: '#', icon: Wrench },
                        ],
                    },
                    {
                        label: 'Inventaris',
                        icon: Package,
                        children: [
                            { label: 'Barang', href: '#', icon: Package },
                            { label: 'Riwayat', href: '#', icon: Archive },
                            { label: 'Mutasi', href: '#', icon: Package },
                            { label: 'Disposal', href: '#', icon: Archive },
                        ],
                    },
                    { label: 'Keluhan', href: '#', icon: MessageSquareWarning },
                    { label: 'Paket', href: '#', icon: Package },
                ],
            },
            {
                id: 'akun',
                label: 'Akun',
                items: [
                    {
                        label: 'Profil',
                        href: route('profile.show'),
                        name: 'profile.show',
                        icon: UserIcon,
                    },
                    {
                        label: 'Pengaturan',
                        icon: Settings,
                        children: [
                            { label: 'Preferensi', href: '#', icon: Settings },
                            { label: 'Notifikasi', href: '#', icon: Bell },
                            { label: 'Integrasi', href: '#', icon: Settings },
                        ],
                    },
                ],
            },
            {
                id: 'admin',
                label: 'Administrasi',
                items: [
                    {
                        label: 'Akses & Peran',
                        icon: ShieldCheck,
                        children: [
                            { label: 'Pengguna', href: '#', icon: Users },
                            { label: 'Roles', href: '#', icon: KeySquare },
                            {
                                label: 'Audit Log',
                                href: '#',
                                icon: ShieldCheck,
                            },
                        ],
                    },
                ],
            },
            {
                id: 'bantuan',
                label: 'Bantuan',
                items: [
                    { label: 'Dokumentasi', href: '#', icon: BookText },
                    { label: 'FAQ', href: '#', icon: HelpCircle },
                    { label: 'Support', href: '#', icon: LifeBuoy },
                    { label: 'Changelog', href: '#', icon: BookText },
                ],
            },
        ],
        [],
    );

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
                        const byName = child.name
                            ? isRouteActive(child.name)
                            : false;
                        const byHref = child.href
                            ? new URL(child.href, window.location.origin)
                                  .pathname === currentPath
                            : false;
                        if (byName || byHref) {
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
                                        <Breadcrumbs items={effectiveBreadcrumbs} />
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
