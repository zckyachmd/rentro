import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Link } from '@inertiajs/react';
import * as React from 'react';

import type { LucideIcon } from 'lucide-react';
import { isRouteActive } from '../auth-layout';

type MenuChild = { label: string; href?: string; name?: string };
export type MenuItem = {
    label: string;
    href?: string;
    name?: string;
    icon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
    children?: MenuChild[];
};

function hasChildren(
    item: MenuItem,
): item is MenuItem & { children: MenuChild[] } {
    return Array.isArray(item.children) && item.children.length > 0;
}

export type SidebarProps = {
    collapsed: boolean;
    brandLabel: string;
    user: { name: string; email?: string; avatar_url?: string };
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
        if (activeParentId !== openSection) {
            setOpenSection(activeParentId);
        }
    }, [activeParentId, openSection]);

    const handleSectionChange = React.useCallback(
        (value: string | undefined) => {
            setOpenSection(value || undefined);
        },
        [],
    );

    const [flyoutOpen, setFlyoutOpen] = React.useState<string | null>(null);

    React.useEffect(() => {
        setFlyoutOpen(null);
    }, [activeParentId, collapsed]);

    return (
        <aside
            className={[
                'sticky top-0 hidden h-screen shrink-0 border-r bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block',
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
                            className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                            aria-hidden
                        >
                            {(brandLabel?.charAt(0) || 'R').toUpperCase()}
                        </div>
                        <span
                            className={[
                                'overflow-hidden whitespace-nowrap font-semibold',
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
                    <nav
                        className="space-y-2"
                        role="navigation"
                        aria-label="Sidebar"
                    >
                        {menuGroups.map((group) => (
                            <div key={group.id}>
                                {group.id !== 'general' && !collapsed && (
                                    <p className="px-3 pb-1 text-[10px] font-medium uppercase text-muted-foreground">
                                        {group.label}
                                    </p>
                                )}

                                <div className="space-y-1">
                                    {group.items
                                        .filter((i) => !hasChildren(i))
                                        .map((item) => {
                                            const Icon = item.icon as
                                                | React.ComponentType<
                                                      React.SVGProps<SVGSVGElement>
                                                  >
                                                | undefined;
                                            let isActive = false;
                                            if (
                                                item.name &&
                                                isRouteActive(item.name)
                                            ) {
                                                isActive = true;
                                            } else if (item.href) {
                                                try {
                                                    const currentPath =
                                                        window.location
                                                            ?.pathname || '';
                                                    const itemPath = new URL(
                                                        item.href,
                                                        window.location.origin,
                                                    ).pathname;
                                                    isActive =
                                                        itemPath ===
                                                        currentPath;
                                                } catch {
                                                    // ignore URL parsing error
                                                }
                                            }
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href={item.href || '#'}
                                                    aria-current={
                                                        isActive
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={`group flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                                                        isActive
                                                            ? 'bg-accent text-accent-foreground'
                                                            : 'hover:bg-accent hover:text-accent-foreground'
                                                    } ${collapsed ? 'justify-center' : 'gap-3'}`}
                                                    title={
                                                        collapsed
                                                            ? item.label
                                                            : undefined
                                                    }
                                                >
                                                    {Icon && (
                                                        <Icon className="h-5 w-5 shrink-0" />
                                                    )}
                                                    <span
                                                        className={[
                                                            'overflow-hidden whitespace-nowrap',
                                                            hydrated
                                                                ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                                                : 'transition-none',
                                                        ].join(' ')}
                                                        style={{
                                                            maxWidth: collapsed
                                                                ? '0px'
                                                                : '12rem',
                                                            opacity: collapsed
                                                                ? 0
                                                                : 1,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                </div>

                                {group.items.some((i) => hasChildren(i)) &&
                                    (collapsed ? (
                                        <div className="mt-1 space-y-1">
                                            {group.items
                                                .filter(hasChildren)
                                                .map((parent) => {
                                                    const Icon = parent.icon as
                                                        | React.ComponentType<
                                                              React.SVGProps<SVGSVGElement>
                                                          >
                                                        | undefined;
                                                    const pid = `${group.id}:${parent.label}`;
                                                    return (
                                                        <Popover
                                                            key={parent.label}
                                                            open={
                                                                flyoutOpen ===
                                                                pid
                                                            }
                                                            onOpenChange={(
                                                                open,
                                                            ) =>
                                                                setFlyoutOpen(
                                                                    open
                                                                        ? pid
                                                                        : null,
                                                                )
                                                            }
                                                        >
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <button
                                                                    type="button"
                                                                    aria-haspopup="menu"
                                                                    aria-expanded={
                                                                        flyoutOpen ===
                                                                        pid
                                                                    }
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setFlyoutOpen(
                                                                            flyoutOpen ===
                                                                                pid
                                                                                ? null
                                                                                : pid,
                                                                        );
                                                                    }}
                                                                    className="flex w-full justify-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                                                    title={
                                                                        parent.label
                                                                    }
                                                                >
                                                                    {Icon && (
                                                                        <Icon className="h-5 w-5" />
                                                                    )}
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                side="right"
                                                                align="start"
                                                                sideOffset={8}
                                                                className="w-64 p-2"
                                                            >
                                                                <div className="mb-2 flex items-center gap-2 px-1 text-sm font-medium">
                                                                    {Icon && (
                                                                        <Icon className="h-4 w-4" />
                                                                    )}
                                                                    <span className="truncate">
                                                                        {
                                                                            parent.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {parent.children.map(
                                                                        (
                                                                            child,
                                                                        ) => (
                                                                            <Link
                                                                                key={
                                                                                    child.label
                                                                                }
                                                                                href={
                                                                                    child.href ||
                                                                                    '#'
                                                                                }
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    const pid = `${group.id}:${parent.label}`;
                                                                                    setOpenSection(
                                                                                        pid,
                                                                                    );
                                                                                    setFlyoutOpen(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                                            >
                                                                                {
                                                                                    child.label
                                                                                }
                                                                            </Link>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <Accordion
                                            type="single"
                                            collapsible
                                            value={openSection}
                                            onValueChange={handleSectionChange}
                                            className="mt-1"
                                        >
                                            {group.items
                                                .filter(hasChildren)
                                                .map((parent) => (
                                                    <AccordionItem
                                                        key={parent.label}
                                                        value={`${group.id}:${parent.label}`}
                                                        className="border-b-0"
                                                    >
                                                        {(() => {
                                                            const pid = `${group.id}:${parent.label}`;
                                                            const parentActive =
                                                                openSection ===
                                                                    pid ||
                                                                activeParentId ===
                                                                    pid;
                                                            const Icon =
                                                                parent.icon as
                                                                    | React.ComponentType<
                                                                          React.SVGProps<SVGSVGElement>
                                                                      >
                                                                    | undefined;
                                                            return (
                                                                <AccordionTrigger
                                                                    className={`rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${parentActive ? 'bg-accent text-accent-foreground' : ''}`}
                                                                >
                                                                    <span className="flex items-center gap-3">
                                                                        {Icon && (
                                                                            <Icon className="h-4 w-4" />
                                                                        )}
                                                                        <span
                                                                            className={[
                                                                                'overflow-hidden whitespace-nowrap',
                                                                                hydrated
                                                                                    ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                                                                    : 'transition-none',
                                                                            ].join(
                                                                                ' ',
                                                                            )}
                                                                            style={{
                                                                                maxWidth:
                                                                                    collapsed
                                                                                        ? '0px'
                                                                                        : '12rem',
                                                                                opacity:
                                                                                    collapsed
                                                                                        ? 0
                                                                                        : 1,
                                                                            }}
                                                                        >
                                                                            {
                                                                                parent.label
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </AccordionTrigger>
                                                            );
                                                        })()}
                                                        <AccordionContent>
                                                            <div className="mt-1 space-y-1 pl-10 pr-2">
                                                                {parent.children.map(
                                                                    (child) => (
                                                                        <Link
                                                                            key={
                                                                                child.label
                                                                            }
                                                                            href={
                                                                                child.href ||
                                                                                '#'
                                                                            }
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                const pid = `${group.id}:${parent.label}`;
                                                                                setOpenSection(
                                                                                    pid,
                                                                                );
                                                                            }}
                                                                            aria-current={
                                                                                isRouteActive(
                                                                                    child.name,
                                                                                )
                                                                                    ? 'page'
                                                                                    : undefined
                                                                            }
                                                                            className={`block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                                                                                isRouteActive(
                                                                                    child.name,
                                                                                )
                                                                                    ? 'bg-accent/60 text-accent-foreground'
                                                                                    : 'text-muted-foreground'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                child.label
                                                                            }
                                                                        </Link>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                        </Accordion>
                                    ))}
                            </div>
                        ))}
                    </nav>
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
                            <p className="truncate text-sm font-medium leading-4">
                                {user.name}
                            </p>
                            {user.email && (
                                <p className="truncate text-xs text-muted-foreground">
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
