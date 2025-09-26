import { usePage } from '@inertiajs/react';
import * as React from 'react';

import FlashToaster from '@/components/flash-toaster';
import { LocaleProvider } from '@/components/locale-provider';
import Seo, { type SeoProps } from '@/components/seo';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import PublicFooter from '@/layouts/public/footer';
import PublicNavbar from '@/layouts/public/navbar';
import { getAppName } from '@/lib/env';
import type { PublicMenuItem } from '@/types/navigation';
import type { InertiaSharedProps } from '@/types/shared';

type PublicLayoutProps = React.PropsWithChildren<{
    title?: string;
    description?: string;
    seo?: SeoProps;
}>;

export default function PublicLayout({
    title,
    description,
    seo,
    children,
}: PublicLayoutProps) {
    const brandLabel = getAppName();

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Seo
                title={seo?.title ?? title}
                description={seo?.description ?? description}
                {...seo}
            />

            <ThemeProvider>
                <LocaleProvider>
                    <div className="flex min-h-screen flex-col">
                        <PublicNavbar
                            brandLabel={brandLabel}
                            items={
                                (
                                    usePage()
                                        .props as unknown as InertiaSharedProps
                                )?.publicMenus as PublicMenuItem[] | undefined
                            }
                        />

                        {(title || description) && (
                            <section className="border-b">
                                <div className="container mx-auto px-4 py-8 md:py-10">
                                    {title && (
                                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="text-muted-foreground mt-2 max-w-2xl">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}

                        <main className="container mx-auto flex-1 px-4 py-8 md:py-10">
                            {children}
                        </main>

                        <PublicFooter brandLabel={brandLabel} />
                    </div>
                </LocaleProvider>
            </ThemeProvider>

            <Toaster />
            <FlashToaster />
        </div>
    );
}
