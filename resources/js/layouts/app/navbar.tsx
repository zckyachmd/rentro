import { Link } from '@inertiajs/react';
import { LogOut, PanelLeft, PanelRight, Search, User } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LocaleToggle from '@/components/locale-toggle';
import { ModeToggle } from '@/components/mode-toggle';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MenuGroups } from '@/layouts/app/menu';
import type { MenuGroup } from '@/types/navigation';

type NavbarProps = {
    collapsed: boolean;
    onToggleCollapsed: () => void;
    brandLabel: string;
    menuGroups: MenuGroup[];
    q: string;
    setQ: (q: string) => void;
    onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    user: { name: string };
    activeParentId?: string;
};

export default function Navbar({
    collapsed,
    onToggleCollapsed,
    brandLabel = 'Rentro',
    menuGroups,
    q,
    setQ,
    onSearchSubmit,
    user,
    activeParentId,
}: NavbarProps) {
    const { t: tNav } = useTranslation('nav');
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [mobileSection, setMobileSection] = React.useState<string>('');
    const handleMobileSectionChange = React.useCallback(
        (v: string | undefined) => setMobileSection(v ?? ''),
        [],
    );
    const handleMobileOpenChange = React.useCallback(
        (open: boolean) => setMobileOpen(open),
        [],
    );
    const handleNavigate = React.useCallback(() => {
        setMobileOpen(false);
        setMobileSection('');
    }, []);

    React.useEffect(() => {
        if (!mobileOpen) return;
        if (activeParentId) setMobileSection(activeParentId);
    }, [mobileOpen, activeParentId]);

    const [unread, setUnread] = useState<number>(0);

    React.useEffect(() => {
        const inc = (e: Event) => {
            const by = Number((e as CustomEvent)?.detail?.by ?? 1);
            setUnread((v) => Math.max(0, v + (Number.isFinite(by) ? by : 1)));
        };
        const sync = (e: Event) => {
            const count = Number((e as CustomEvent)?.detail?.count ?? 0);
            if (Number.isFinite(count)) setUnread(Math.max(0, count));
        };
        const reset = () => setUnread(0);
        window.addEventListener('notifications:inc-unread', inc);
        window.addEventListener('notifications:sync-unread', sync);
        window.addEventListener('notifications:reset-unread', reset);
        return () => {
            window.removeEventListener('notifications:inc-unread', inc);
            window.removeEventListener('notifications:sync-unread', sync);
            window.removeEventListener('notifications:reset-unread', reset);
        };
    }, []);

    return (
        <header className="bg-background/80 sticky top-0 z-50 h-14 w-full border-b backdrop-blur-md">
            <div className="flex h-14 w-full items-center justify-between px-2 sm:px-3 md:px-4">
                {/* Left controls: mobile menu trigger + desktop sidebar toggle */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Mobile: open navigation sheet */}
                    <Sheet
                        open={mobileOpen}
                        onOpenChange={handleMobileOpenChange}
                    >
                        <SheetTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={tNav('nav.open_menu')}
                                className="size-9 md:hidden"
                            >
                                <PanelRight className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-80 overflow-hidden p-0"
                        >
                            <div className="flex h-full min-h-0 flex-col">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>
                                        {tNav('nav.nav_menu')}
                                    </SheetTitle>
                                    <SheetDescription>
                                        {tNav('nav.nav_menu_desc')}
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="flex h-14 shrink-0 items-center border-b px-4">
                                    <span className="truncate font-semibold">
                                        {brandLabel}
                                    </span>
                                </div>
                                <div className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4 pt-3">
                                    {/* Mobile search */}
                                    <form
                                        onSubmit={onSearchSubmit}
                                        role="search"
                                        className="flex items-center gap-2"
                                    >
                                        <div className="relative w-full">
                                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                                            <Input
                                                value={q}
                                                onChange={(e) =>
                                                    setQ(e.target.value)
                                                }
                                                placeholder={tNav(
                                                    'nav.search.placeholder',
                                                )}
                                                className="h-9 pl-8"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="secondary"
                                            className="h-9"
                                        >
                                            {tNav('nav.go')}
                                        </Button>
                                    </form>

                                    {/* Mobile nav grouped with accordions */}
                                    <MenuGroups
                                        variant="mobile"
                                        menuGroups={menuGroups}
                                        sectionValue={mobileSection}
                                        onSectionChange={
                                            handleMobileSectionChange
                                        }
                                        onNavigate={handleNavigate}
                                    />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop: collapse/expand sidebar */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapsed}
                        aria-label={tNav('nav.sidebar.label')}
                        className="hidden size-9 md:inline-flex"
                        title={
                            collapsed
                                ? tNav('nav.sidebar.expand')
                                : tNav('nav.sidebar.collapse')
                        }
                    >
                        {collapsed ? (
                            <PanelRight className="h-5 w-5" />
                        ) : (
                            <PanelLeft className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Center: Search (desktop only) */}
                <form
                    onSubmit={onSearchSubmit}
                    role="search"
                    className="mx-auto hidden w-full max-w-xl items-center gap-2 md:flex"
                >
                    <div className="relative w-full">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={tNav('nav.search.placeholder')}
                            className="h-9 pl-8"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-9">
                        {tNav('nav.search.label')}
                    </Button>
                </form>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    <ModeToggle />
                    <div className="relative">
                        <NotificationBell />
                        {unread > 0 && (
                            <span
                                aria-label={tNav(
                                    'nav.unread_notifications',
                                    'Unread notifications',
                                )}
                                className="bg-destructive text-destructive-foreground ring-background absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold shadow ring-1"
                            >
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </div>

                    {/* Language toggle */}
                    <LocaleToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={tNav('nav.user_menu', 'User Menu')}
                            >
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="truncate">
                                {user.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="#">
                                    {tNav('nav.overview', 'Overview')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{tNav('nav.settings')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{tNav('nav.billing')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('profile.index')}>
                                    {tNav('nav.profile')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{tNav('nav.help')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />{' '}
                                    {tNav('nav.logout')}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
