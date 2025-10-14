import { usePage } from '@inertiajs/react';
import { LayoutDashboard, LogIn, PanelRight } from 'lucide-react';
import * as React from 'react';

import LocaleToggle from '@/components/locale-toggle';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { PublicDesktopMenu, PublicMobileMenu } from '@/layouts/public/menu';
import type { PublicMenuItem } from '@/types/navigation';
import type { InertiaSharedProps } from '@/types/shared';

type PublicNavbarProps = {
    brandLabel?: string;
    items?: PublicMenuItem[];
    showAuth?: boolean;
    loginHref?: string;
};

export default function PublicNavbar({
    brandLabel = 'Rentro',
    items,
    showAuth = true,
    loginHref,
}: PublicNavbarProps) {
    const page = usePage<InertiaSharedProps & { auth?: { user?: unknown } }>();
    const serverItems = (page.props as unknown as InertiaSharedProps)
        ?.publicMenus as PublicMenuItem[] | undefined;
    const menuItems = React.useMemo(
        () => items ?? serverItems ?? [],
        [items, serverItems],
    );

    const [open, setOpen] = React.useState(false);

    const effectiveLogin = loginHref ?? route('login');

    return (
        <header className="bg-background/80 sticky top-0 z-40 h-14 w-full border-b backdrop-blur-md">
            <div className="container mx-auto flex h-14 items-center justify-between px-3 md:grid md:grid-cols-[1fr_auto_1fr] md:px-4">
                <div className="flex items-center gap-2 md:justify-self-start">
                    {menuItems.length > 0 ? (
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Open navigation"
                                >
                                    <PanelRight className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Navigation</SheetTitle>
                                </SheetHeader>
                                <div className="flex h-full min-h-0 flex-col">
                                    <div className="flex h-14 shrink-0 items-center border-b px-4">
                                        <span className="truncate font-semibold">
                                            {brandLabel}
                                        </span>
                                    </div>
                                    <nav className="flex-1 overflow-auto p-2">
                                        <PublicMobileMenu
                                            items={menuItems}
                                            onNavigate={() => setOpen(false)}
                                        />
                                    </nav>
                                </div>
                            </SheetContent>
                        </Sheet>
                    ) : null}

                    <a href="/" className="text-base font-semibold md:text-lg">
                        {brandLabel}
                    </a>
                </div>

                <nav className="hidden items-center gap-2 md:flex md:justify-center md:justify-self-center">
                    <PublicDesktopMenu items={menuItems} />
                </nav>

                <div className="-mr-1.5 flex shrink-0 items-center gap-1 sm:mr-0 sm:gap-2 md:justify-self-end">
                    {showAuth ? (
                        page.props.auth?.user ? (
                            <Button
                                asChild
                                size="sm"
                                variant="secondary"
                                className="h-9 px-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                            >
                                <a
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Dashboard
                                    </span>
                                    <span className="sm:hidden">Dash</span>
                                </a>
                            </Button>
                        ) : (
                            <Button
                                asChild
                                size="sm"
                                variant="secondary"
                                className="h-9 px-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                            >
                                <a
                                    href={effectiveLogin}
                                    className="inline-flex items-center gap-2"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Login
                                    </span>
                                </a>
                            </Button>
                        )
                    ) : null}

                    <div
                        aria-hidden
                        className="bg-border mx-1 hidden h-6 w-px sm:mx-2 sm:block"
                    />

                    <ModeToggle />
                    <LocaleToggle />
                </div>
            </div>
        </header>
    );
}
