import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import LazyIcon from '@/components/lazy-icon';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
    PublicFooterSection,
    PublicLink,
    PublicMenuItem,
} from '@/types/navigation';

const Anchor: React.FC<{
    item: PublicLink;
    className?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}> = ({ item, className, onClick, children }) => {
    const href = item.href ?? '#';
    const target = item.target;
    const rel =
        item.rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);

    const isExternal = /^https?:\/\//i.test(href) || href.startsWith('#');

    if (isExternal || target === '_blank') {
        return (
            <a
                href={href}
                target={target}
                rel={rel}
                className={className}
                onClick={onClick}
            >
                {children}
            </a>
        );
    }

    return (
        <Link
            href={href}
            className={className}
            onClick={onClick}
            preserveScroll
        >
            {children}
        </Link>
    );
};

const renderDesktopDropdownItems = (items: PublicMenuItem[]) => {
    return items.map((it, i) => {
        const key = `${it.label}-${i}`;
        const hasChildren =
            Array.isArray(it.children) && it.children.length > 0;
        if (!hasChildren) {
            return (
                <DropdownMenuItem key={key} asChild>
                    <Anchor item={it} className="w-full">
                        <span className="inline-flex items-center gap-2">
                            {it.icon ? (
                                <LazyIcon name={it.icon} className="h-4 w-4" />
                            ) : null}
                            <span>{it.label}</span>
                        </span>
                    </Anchor>
                </DropdownMenuItem>
            );
        }
        return (
            <DropdownMenuSub key={key}>
                <DropdownMenuSubTrigger>
                    <span className="inline-flex items-center gap-2">
                        {it.icon ? (
                            <LazyIcon name={it.icon} className="h-4 w-4" />
                        ) : null}
                        <span>{it.label}</span>
                    </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {renderDesktopDropdownItems(it.children!)}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        );
    });
};

export function PublicDesktopMenu({ items }: { items: PublicMenuItem[] }) {
    return (
        <>
            {items.map((it, i) => {
                const key = `${it.label}-${i}`;
                const hasChildren =
                    Array.isArray(it.children) && it.children.length > 0;
                if (!hasChildren) {
                    return (
                        <Anchor
                            key={key}
                            item={it}
                            className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-2 rounded px-2 text-sm font-medium transition-colors"
                        >
                            {it.icon ? (
                                <LazyIcon name={it.icon} className="h-4 w-4" />
                            ) : null}
                            <span>{it.label}</span>
                        </Anchor>
                    );
                }
                return (
                    <DropdownMenu key={key}>
                        <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-2 rounded px-2 text-sm font-medium transition-colors">
                            {it.icon ? (
                                <LazyIcon name={it.icon} className="h-4 w-4" />
                            ) : null}
                            <span>{it.label}</span>
                            <ChevronDown className="ml-0.5 h-4 w-4 opacity-60" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {/* Do not duplicate parent link inside submenu */}
                            {renderDesktopDropdownItems(it.children!)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })}
        </>
    );
}

export function PublicMobileMenu({
    items,
    onNavigate,
}: {
    items: PublicMenuItem[];
    onNavigate: () => void;
}) {
    const MobileList: React.FC<{
        items: PublicMenuItem[];
        onNavigate: () => void;
    }> = ({ items, onNavigate }) => {
        return (
            <Accordion type="multiple" className="w-full">
                {items.map((it, i) => {
                    const key = `${it.label}-${i}`;
                    const hasChildren =
                        Array.isArray(it.children) && it.children.length > 0;
                    if (!hasChildren) {
                        return (
                            <Anchor
                                key={key}
                                item={it}
                                className="hover:bg-accent hover:text-accent-foreground block rounded px-3 py-2 text-sm font-medium"
                                onClick={onNavigate}
                            >
                                <span className="inline-flex items-center gap-2">
                                    {it.icon ? (
                                        <LazyIcon
                                            name={it.icon}
                                            className="h-4 w-4"
                                        />
                                    ) : null}
                                    <span>{it.label}</span>
                                </span>
                            </Anchor>
                        );
                    }
                    return (
                        <AccordionItem key={key} value={key}>
                            <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                                <span className="inline-flex items-center gap-2">
                                    {it.icon ? (
                                        <LazyIcon
                                            name={it.icon}
                                            className="h-4 w-4"
                                        />
                                    ) : null}
                                    <span>{it.label}</span>
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="pl-1.5">
                                <div className="space-y-1 pb-2">
                                    <MobileList
                                        items={it.children!}
                                        onNavigate={onNavigate}
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        );
    };

    return <MobileList items={items} onNavigate={onNavigate} />;
}

export function PublicFooterMenu({
    sections,
}: {
    sections: PublicFooterSection[];
}) {
    return (
        <>
            {sections.map((sec, i) => (
                <React.Fragment key={`footer-sec-${i}`}>
                    <nav
                        aria-label={sec.label}
                        className={`w-full space-y-2 text-left md:justify-self-start md:pl-0 lg:pl-3 ${(() => {
                            const count = sec.children?.length ?? 0;
                            if (count <= 4)
                                return 'md:max-w-[220px] lg:max-w-[260px]'; // 1 kolom (≤4)
                            if (count <= 8)
                                return 'md:max-w-[460px] lg:max-w-[520px]'; // 2 kolom (≤8)
                            if (count <= 12)
                                return 'md:max-w-[680px] lg:max-w-[780px]'; // 3 kolom (≤12)
                            return 'md:max-w-[900px] lg:max-w-[1040px]'; // 4 kolom (>12)
                        })()}`}
                    >
                        <h3 className="text-foreground/80 mb-1.5 text-xs font-semibold tracking-wider uppercase md:mb-2">
                            {sec.label}
                        </h3>
                        {(() => {
                            const items = sec.children ?? [];

                            // Mobile: 1 column, 1 item per row (no chunking)
                            const MobileList = (
                                <ul className="text-muted-foreground space-y-1.5 text-sm md:hidden">
                                    {items.map((child, j) => (
                                        <li key={`footer-link-${i}-m-${j}`}>
                                            {child.href ? (
                                                <Anchor
                                                    item={child}
                                                    className="hover:text-foreground inline-flex items-center gap-2"
                                                >
                                                    <span>{child.label}</span>
                                                </Anchor>
                                            ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    {child.label}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            );

                            // Desktop (md+): chunk into columns, max 4 items per column
                            const chunks = Array.from(
                                { length: Math.ceil(items.length / 4) },
                                (_, idx) => items.slice(idx * 4, idx * 4 + 4),
                            );
                            const cols = chunks.length;
                            const gridCols =
                                cols <= 1
                                    ? 'grid-cols-1'
                                    : cols === 2
                                      ? 'grid-cols-2'
                                      : cols === 3
                                        ? 'grid-cols-3'
                                        : 'grid-cols-4';

                            const DesktopGrid = (
                                <div
                                    className={`hidden md:grid ${gridCols} gap-2 lg:gap-3 xl:gap-4`}
                                >
                                    {chunks.map((chunk, cidx) => (
                                        <ul
                                            key={`footer-sec-${i}-col-${cidx}`}
                                            className="text-muted-foreground space-y-1 text-sm md:space-y-1.5"
                                        >
                                            {chunk.map((child, j) => (
                                                <li
                                                    key={`footer-link-${i}-${cidx}-${j}`}
                                                >
                                                    {child.href ? (
                                                        <Anchor
                                                            item={child}
                                                            className="hover:text-foreground inline-flex items-center gap-2"
                                                        >
                                                            <span>
                                                                {child.label}
                                                            </span>
                                                        </Anchor>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2">
                                                            {child.label}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ))}
                                </div>
                            );

                            return (
                                <>
                                    {MobileList}
                                    {DesktopGrid}
                                </>
                            );
                        })()}
                    </nav>
                </React.Fragment>
            ))}
            {sections.length > 0 ? (
                <div className="bg-border h-px w-full md:hidden" />
            ) : null}
        </>
    );
}
