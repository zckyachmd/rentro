import { Link } from '@inertiajs/react';
import {
    Bell,
    LogOut,
    PanelLeft,
    PanelRight,
    Search,
    User,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/components/locale-provider';
import { ModeToggle } from '@/components/mode-toggle';
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
import { postJson } from '@/lib/api';

import type { MenuGroup } from './menu';
import { MenuGroups } from './menu';

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
    const { t, i18n } = useTranslation();
    const { setLocale } = useLocale();
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
                                aria-label={t('nav.open_menu')}
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
                                    <SheetTitle>{t('nav.nav_menu')}</SheetTitle>
                                    <SheetDescription>
                                        {t('nav.nav_menu_desc')}
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
                                                placeholder={t(
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
                                            {t('nav.go')}
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
                        aria-label={t('nav.sidebar')}
                        className="hidden size-9 md:inline-flex"
                        title={
                            collapsed
                                ? t('nav.sidebar.expand')
                                : t('nav.sidebar.collapse')
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
                            placeholder={t('nav.search.placeholder')}
                            className="h-9 pl-8"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-9">
                        {t('nav.search')}
                    </Button>
                </form>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t('nav.notifications')}
                            >
                                <Bell className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                            <DropdownMenuLabel>
                                {t('nav.notifications')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-muted-foreground">
                                {t('nav.notifications.empty')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Language switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={t('nav.language')}
                            >
                                {i18n.language?.toUpperCase() || 'EN'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>
                                {t('nav.language')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => {
                                    setLocale('en');
                                    void postJson(route('preferences.locale'), {
                                        locale: 'en',
                                    }).catch(() => {});
                                }}
                            >
                                {t('nav.lang.en')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => {
                                    setLocale('id');
                                    void postJson(route('preferences.locale'), {
                                        locale: 'id',
                                    }).catch(() => {});
                                }}
                            >
                                {t('nav.lang.id')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t('nav.user_menu', 'User Menu')}
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
                                    {t('nav.overview', 'Overview')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{t('nav.settings')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{t('nav.billing')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('profile.index')}>
                                    {t('nav.profile')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">{t('nav.help')}</Link>
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
                                    {t('nav.logout')}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
