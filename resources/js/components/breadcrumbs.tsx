import { Link } from '@inertiajs/react';
import React from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
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
                                        <Link href={c.href} preserveScroll>
                                            {c.label}
                                        </Link>
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
