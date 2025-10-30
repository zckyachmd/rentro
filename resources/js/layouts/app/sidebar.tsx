import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MenuGroups } from '@/layouts/app/menu';
import type { MenuItem } from '@/types/navigation';

export type SidebarProps = {
    collapsed: boolean;
    brandLabel: string;
    user: { name: string; email?: string; avatar_url?: string | null };
    menuGroups: { id: string; label: string; items: MenuItem[] }[];
    activeParentId?: string;
};

function Sidebar({
    collapsed,
    brandLabel = 'Rentro',
    user,
    menuGroups,
    activeParentId,
}: SidebarProps) {
    const [hydrated, setHydrated] = React.useState(false);
    React.useEffect(() => {
        const t = requestAnimationFrame(() => setHydrated(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const [openSection, setOpenSection] = React.useState<string | undefined>(
        () => activeParentId,
    );

    React.useEffect(() => {
        if (collapsed) {
            setOpenSection(undefined);
            return;
        }
        if (openSection == null && activeParentId) {
            setOpenSection(activeParentId);
        }
    }, [collapsed, activeParentId, openSection]);

    const handleSectionChange = React.useCallback(
        (value: string | undefined) => {
            setOpenSection(value || undefined);
        },
        [],
    );

    return (
        <aside
            className={[
                'bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 hidden h-screen shrink-0 border-r backdrop-blur md:block',
                'overflow-hidden',
                hydrated
                    ? 'transition-[width] duration-300 ease-in-out'
                    : 'transition-none',
                collapsed ? 'md:w-16' : 'md:w-64',
            ].join(' ')}
            style={{ willChange: 'width' }}
        >
            <div className="flex h-full flex-col">
                <div className="flex h-14 items-center border-b px-2 sm:px-3 md:px-4">
                    <div
                        className={`flex items-center ${collapsed ? 'w-full justify-center' : 'gap-2 md:gap-3'}`}
                    >
                        <div
                            className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md text-sm font-semibold"
                            aria-hidden
                        >
                            {(brandLabel?.charAt(0) || 'R').toUpperCase()}
                        </div>
                        <span
                            className={[
                                'overflow-hidden font-semibold whitespace-nowrap',
                                hydrated
                                    ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                    : 'transition-none',
                            ].join(' ')}
                            style={{
                                maxWidth: collapsed ? '0px' : '12rem',
                                opacity: collapsed ? 0 : 1,
                            }}
                        >
                            {brandLabel}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 pb-4">
                    <MenuGroups
                        variant="sidebar"
                        menuGroups={menuGroups}
                        collapsed={collapsed}
                        openSection={openSection}
                        onSectionChange={handleSectionChange}
                        activeParentId={activeParentId}
                        hydrated={hydrated}
                    />
                </div>

                <div className="flex h-16 items-center border-t px-2 sm:px-3 md:px-4">
                    <div
                        className={`${collapsed ? 'justify-center' : 'gap-3'} flex w-full items-center`}
                        title={
                            collapsed
                                ? `${user.name}${user.email ? ` • ${user.email}` : ''}`
                                : undefined
                        }
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={user.avatar_url || undefined}
                                alt={user.name}
                            />
                            <AvatarFallback>
                                {(
                                    user.name
                                        ?.match(/\b\w/g)
                                        ?.join('')
                                        .slice(0, 2) || 'US'
                                ).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={[
                                'min-w-0 overflow-hidden whitespace-nowrap',
                                hydrated
                                    ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                    : 'transition-none',
                            ].join(' ')}
                            style={{
                                maxWidth: collapsed ? '0px' : '12rem',
                                opacity: collapsed ? 0 : 1,
                            }}
                        >
                            <p className="truncate text-sm leading-4 font-medium">
                                {user.name}
                            </p>
                            {user.email && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default React.memo(Sidebar);
