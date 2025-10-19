import { Link } from '@inertiajs/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import LazyIcon from '@/components/lazy-icon';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { IconComponent, MenuChild, MenuGroup } from '@/types/navigation';

function isRouteActive(name?: string): boolean {
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

function getIsActive(href?: string, name?: string): boolean {
    if (name && isRouteActive(name)) return true;
    if (!href) return false;
    try {
        const currentPath = window.location?.pathname || '';
        const itemPath = new URL(href, window.location.origin).pathname;
        return itemPath === currentPath;
    } catch {
        return false;
    }
}

function FallbackGlyph({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <circle cx="12" cy="12" r="4" />
        </svg>
    );
}

function IconOrFallback({
    icon,
    className,
}: {
    icon?: string | IconComponent;
    className?: string;
}) {
    if (typeof icon === 'string') {
        return <LazyIcon name={icon} className={className} />;
    }
    const Comp = icon as
        | React.ComponentType<React.SVGProps<SVGSVGElement>>
        | undefined;
    if (!Comp) return <FallbackGlyph className={className} />;
    return <Comp className={className} />;
}

export function hasChildren<T extends { children?: unknown }>(
    item: T,
): item is T & { children: unknown[] } {
    const children = (item as { children?: unknown }).children;
    return Array.isArray(children) && children.length > 0;
}

// ========== GENERIC RENDERER ==========

type CommonProps = { menuGroups: MenuGroup[] };

type MobileProps = CommonProps & {
    variant: 'mobile';
    sectionValue: string;
    onSectionChange: (v: string | undefined) => void;
    onNavigate: () => void;
};

type SidebarProps = CommonProps & {
    variant: 'sidebar';
    collapsed: boolean;
    openSection?: string;
    onSectionChange: (v: string | undefined) => void;
    activeParentId?: string;
    hydrated: boolean;
};

type MenuGroupsProps = MobileProps | SidebarProps;

export function MenuGroups(props: MenuGroupsProps) {
    const { t: tMenu, i18n } = useTranslation('menu');
    const { t: tNav } = useTranslation('nav');
    const isMobile = props.variant === 'mobile';
    const [flyoutOpen, setFlyoutOpen] = React.useState<string | null>(null);

    const sidebarProps = props as SidebarProps;
    const initialSection =
        props.variant === 'sidebar'
            ? (sidebarProps.openSection ?? sidebarProps.activeParentId ?? '')
            : '';
    const [sectionValue, setSectionValue] =
        React.useState<string>(initialSection);
    const userOverrodeRef = React.useRef(false);

    const { variant } = props;
    const { openSection } = sidebarProps;

    React.useEffect(() => {
        if (variant !== 'sidebar') return;
        if (openSection !== undefined && !userOverrodeRef.current) {
            setSectionValue(openSection ?? '');
        }
    }, [variant, openSection]);

    const { activeParentId, collapsed } = props as SidebarProps;
    const hasActiveParentId = 'activeParentId' in props;

    React.useEffect(() => {
        if (!isMobile && hasActiveParentId) {
            setFlyoutOpen(null);
        }
    }, [isMobile, hasActiveParentId, activeParentId, collapsed]);

    React.useEffect(() => {
        if (hasActiveParentId) {
            userOverrodeRef.current = false;
        }
    }, [hasActiveParentId, activeParentId]);

    const ensureMenuKey = React.useCallback(
        (key: string) => (key.startsWith('menu.') ? key : `menu.${key}`),
        [],
    );

    const getParentText = React.useCallback(
        (key: string) => {
            const baseKey = ensureMenuKey(key);
            const labelKey = `${baseKey}.label`;
            return i18n.exists(`menu:${labelKey}`)
                ? tMenu(labelKey)
                : tMenu(baseKey);
        },
        [i18n, tMenu, ensureMenuKey],
    );

    return (
        <nav
            className={isMobile ? 'mt-2 space-y-3' : 'space-y-2'}
            role="navigation"
            aria-label={
                isMobile ? tNav('nav.mobile_menu') : tNav('nav.sidebar.label')
            }
        >
            {props.menuGroups.map((group) => (
                <div key={group.id}>
                    {/* Group label */}
                    {(isMobile ||
                        (!isMobile && !(props as SidebarProps).collapsed)) && (
                        <p
                            className={
                                isMobile
                                    ? 'text-muted-foreground px-1 pb-1 text-[10px] font-medium uppercase'
                                    : group.id !== 'general'
                                      ? 'text-muted-foreground px-3 pb-1 text-[10px] font-medium uppercase'
                                      : 'sr-only'
                            }
                        >
                            {tMenu(ensureMenuKey(group.label))}
                        </p>
                    )}

                    {/* Flat items */}
                    <div className="space-y-1">
                        {group.items
                            .filter((i) => !hasChildren(i))
                            .map((item) => {
                                const isActive = getIsActive(
                                    item.href,
                                    item.name,
                                );
                                const LinkInner = (
                                    <>
                                        <IconOrFallback
                                            icon={item.icon}
                                            className={
                                                isMobile
                                                    ? 'mr-2 inline-block h-4 w-4 align-middle'
                                                    : 'h-5 w-5 shrink-0'
                                            }
                                        />
                                        <span
                                            className={
                                                isMobile
                                                    ? 'align-middle'
                                                    : [
                                                          'overflow-hidden whitespace-nowrap',
                                                          (
                                                              props as SidebarProps
                                                          ).hydrated
                                                              ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                                              : 'transition-none',
                                                      ].join(' ')
                                            }
                                            style={
                                                !isMobile
                                                    ? {
                                                          maxWidth: (
                                                              props as SidebarProps
                                                          ).collapsed
                                                              ? '0px'
                                                              : '12rem',
                                                          opacity: (
                                                              props as SidebarProps
                                                          ).collapsed
                                                              ? 0
                                                              : 1,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {tMenu(ensureMenuKey(item.label))}
                                        </span>
                                    </>
                                );

                                const className = isMobile
                                    ? `block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isActive ? 'bg-accent/60 text-accent-foreground' : ''}`
                                    : `group flex items-center rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'} ${(props as SidebarProps).collapsed ? 'justify-center' : 'gap-3'}`;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href || '#'}
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                        className={className}
                                        title={
                                            !isMobile &&
                                            (props as SidebarProps).collapsed
                                                ? tMenu(
                                                      ensureMenuKey(item.label),
                                                  )
                                                : undefined
                                        }
                                        onClick={(e) => {
                                            if (isMobile) {
                                                e.stopPropagation();
                                                (
                                                    props as MobileProps
                                                ).onNavigate();
                                            }
                                        }}
                                    >
                                        {LinkInner}
                                    </Link>
                                );
                            })}
                    </div>

                    {/* Parents with children */}
                    {group.items.some(hasChildren) &&
                        (isMobile ? (
                            <Accordion
                                type="single"
                                collapsible
                                value={(props as MobileProps).sectionValue}
                                onValueChange={
                                    (props as MobileProps).onSectionChange
                                }
                                className="mt-2"
                            >
                                {group.items
                                    .filter(hasChildren)
                                    .map((parent) => (
                                        <AccordionItem
                                            key={parent.label}
                                            value={`${group.id}:${parent.label}`}
                                            className="border-b-0"
                                        >
                                            <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm">
                                                <span className="flex items-center gap-2">
                                                    <IconOrFallback
                                                        icon={parent.icon}
                                                        className="h-4 w-4"
                                                    />
                                                    <span>
                                                        {getParentText(
                                                            parent.label,
                                                        )}
                                                    </span>
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="mt-1 space-y-1 pr-2 pl-6">
                                                    {(
                                                        parent.children as MenuChild[]
                                                    ).map((child) => {
                                                        const isActive =
                                                            getIsActive(
                                                                child.href,
                                                                child.name,
                                                            );
                                                        return (
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
                                                                    (
                                                                        props as MobileProps
                                                                    ).onSectionChange(
                                                                        `${group.id}:${parent.label}`,
                                                                    );
                                                                    (
                                                                        props as MobileProps
                                                                    ).onNavigate();
                                                                }}
                                                                aria-current={
                                                                    isActive
                                                                        ? 'page'
                                                                        : undefined
                                                                }
                                                                className={`hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-accent/60 text-accent-foreground' : 'text-muted-foreground'}`}
                                                            >
                                                                <IconOrFallback
                                                                    icon={
                                                                        child.icon
                                                                    }
                                                                    className="mr-2 inline-block h-4 w-4 align-middle"
                                                                />
                                                                <span className="align-middle">
                                                                    {tMenu(
                                                                        child.label,
                                                                    )}
                                                                </span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                            </Accordion>
                        ) : (
                            <>
                                {group.items.some(hasChildren) &&
                                (props as SidebarProps).collapsed ? (
                                    <div className="mt-1 space-y-1">
                                        {group.items
                                            .filter(hasChildren)
                                            .map((parent) => {
                                                const pid = `${group.id}:${parent.label}`;
                                                return (
                                                    <Popover
                                                        key={parent.label}
                                                        open={
                                                            flyoutOpen === pid
                                                        }
                                                        onOpenChange={(open) =>
                                                            setFlyoutOpen(
                                                                open
                                                                    ? pid
                                                                    : null,
                                                            )
                                                        }
                                                    >
                                                        <PopoverTrigger asChild>
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
                                                                className="hover:bg-accent hover:text-accent-foreground flex w-full justify-center rounded-md px-3 py-2 text-sm"
                                                                title={getParentText(
                                                                    parent.label,
                                                                )}
                                                            >
                                                                <IconOrFallback
                                                                    icon={
                                                                        parent.icon
                                                                    }
                                                                    className="h-5 w-5"
                                                                />
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            side="right"
                                                            align="start"
                                                            sideOffset={8}
                                                            className="w-64 p-2"
                                                        >
                                                            <div className="mb-2 flex items-center gap-2 px-1 text-sm font-medium">
                                                                <IconOrFallback
                                                                    icon={
                                                                        parent.icon
                                                                    }
                                                                    className="h-4 w-4"
                                                                />
                                                                <span className="truncate">
                                                                    {getParentText(
                                                                        parent.label,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {(
                                                                    parent.children as MenuChild[]
                                                                ).map(
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
                                                                                (
                                                                                    props as SidebarProps
                                                                                ).onSectionChange(
                                                                                    pid,
                                                                                );
                                                                                setFlyoutOpen(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-sm"
                                                                        >
                                                                            <IconOrFallback
                                                                                icon={
                                                                                    child.icon
                                                                                }
                                                                                className="mr-2 inline-block h-4 w-4 align-middle"
                                                                            />
                                                                            <span className="align-middle">
                                                                                {tMenu(
                                                                                    ensureMenuKey(
                                                                                        child.label,
                                                                                    ),
                                                                                )}
                                                                            </span>
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
                                        value={sectionValue}
                                        onValueChange={(v) => {
                                            userOverrodeRef.current = true;
                                            setSectionValue(v ?? '');
                                            (
                                                props as SidebarProps
                                            ).onSectionChange(v);
                                        }}
                                        className="mt-1"
                                    >
                                        {group.items
                                            .filter(hasChildren)
                                            .map((parent) => {
                                                const pid = `${group.id}:${parent.label}`;
                                                return (
                                                    <AccordionItem
                                                        key={parent.label}
                                                        value={pid}
                                                        className="border-b-0"
                                                    >
                                                        <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm">
                                                            <span className="flex items-center gap-3">
                                                                <IconOrFallback
                                                                    icon={
                                                                        parent.icon
                                                                    }
                                                                    className="h-4 w-4"
                                                                />
                                                                <span
                                                                    className={[
                                                                        'overflow-hidden whitespace-nowrap',
                                                                        (
                                                                            props as SidebarProps
                                                                        )
                                                                            .hydrated
                                                                            ? 'transition-[max-width,opacity] duration-300 ease-in-out'
                                                                            : 'transition-none',
                                                                    ].join(' ')}
                                                                    style={{
                                                                        maxWidth:
                                                                            '12rem',
                                                                        opacity: 1,
                                                                    }}
                                                                >
                                                                    {getParentText(
                                                                        parent.label,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="mt-1 space-y-1 pr-2 pl-10">
                                                                {(
                                                                    parent.children as MenuChild[]
                                                                ).map(
                                                                    (child) => {
                                                                        const isActive =
                                                                            getIsActive(
                                                                                child.href,
                                                                                child.name,
                                                                            );
                                                                        return (
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
                                                                                    (
                                                                                        props as SidebarProps
                                                                                    ).onSectionChange(
                                                                                        pid,
                                                                                    );
                                                                                }}
                                                                                aria-current={
                                                                                    isActive
                                                                                        ? 'page'
                                                                                        : undefined
                                                                                }
                                                                                className={`hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-accent/60 text-accent-foreground' : 'text-muted-foreground'}`}
                                                                            >
                                                                                <IconOrFallback
                                                                                    icon={
                                                                                        child.icon
                                                                                    }
                                                                                    className="h-4 w-4"
                                                                                />
                                                                                <span>
                                                                                    {tMenu(
                                                                                        ensureMenuKey(
                                                                                            child.label,
                                                                                        ),
                                                                                    )}
                                                                                </span>
                                                                            </Link>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                    </Accordion>
                                )}
                            </>
                        ))}
                </div>
            ))}
        </nav>
    );
}
