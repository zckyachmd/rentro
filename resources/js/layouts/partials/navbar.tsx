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
        <header className="sticky top-0 z-50 h-14 w-full border-b bg-background/80 backdrop-blur-md">
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
                                aria-label="Open menu"
                                className="size-9 md:hidden"
                            >
                                <PanelRight className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menu Navigasi</SheetTitle>
                                <SheetDescription>
                                    Akses menu aplikasi
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex h-14 items-center border-b px-4">
                                <span className="font-semibold">
                                    {brandLabel}
                                </span>
                            </div>
                            <div className="space-y-3 p-4 pt-3">
                                {/* Mobile search */}
                                <form
                                    onSubmit={onSearchSubmit}
                                    role="search"
                                    className="flex items-center gap-2"
                                >
                                    <div className="relative w-full">
                                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={q}
                                            onChange={(e) =>
                                                setQ(e.target.value)
                                            }
                                            placeholder="Cari…"
                                            className="h-9 pl-8"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        className="h-9"
                                    >
                                        Go
                                    </Button>
                                </form>

                                {/* Mobile nav grouped with accordions */}
                                <MenuGroups
                                    variant="mobile"
                                    menuGroups={menuGroups}
                                    sectionValue={mobileSection}
                                    onSectionChange={handleMobileSectionChange}
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop: collapse/expand sidebar */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapsed}
                        aria-label="Toggle sidebar"
                        className="hidden size-9 md:inline-flex"
                        title={
                            collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'
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
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari penyewa, kamar, atau tagihan…"
                            className="h-9 pl-8"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-9">
                        Search
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
                                aria-label="Notifications"
                            >
                                <Bell className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-muted-foreground">
                                Belum ada notifikasi.
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="User menu"
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
                                <Link href="#">Overview</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">Billing</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('profile.show')}>
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="#">Help</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" /> Log Out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
