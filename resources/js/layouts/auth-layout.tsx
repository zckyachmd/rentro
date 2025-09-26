import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

import FlashToaster from '@/components/flash-toaster';
import { LocaleProvider } from '@/components/locale-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { ThemeProvider } from '@/components/theme-provider';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/layouts/app/footer';
import { getAppName } from '@/lib/env';

type AuthLayoutProps = {
    title?: string;
    description?: string;
    content: ReactNode;
    contentFooter?: ReactNode;
    rightSlot?: ReactNode;
    extraFooter?: ReactNode;
    fullWidthFooter?: boolean;
};

export default function AuthLayout({
    title = 'Auth',
    description,
    content,
    contentFooter,
    rightSlot,
    extraFooter,
    fullWidthFooter = true,
}: AuthLayoutProps) {
    const brandLabel = getAppName();

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Head title={title ?? 'Auth'} />

            <ThemeProvider>
                <LocaleProvider>
                    <div
                        className={[
                            'container mx-auto flex min-h-screen flex-col items-center px-4',
                            fullWidthFooter ? 'pb-14 md:pb-0' : '',
                        ].join(' ')}
                    >
                        <header className="mb-4 flex w-full max-w-md items-center justify-between pt-6">
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 font-semibold"
                            >
                                <span className="text-xl">{brandLabel}</span>
                            </a>
                            <div className="flex items-center gap-2">
                                {rightSlot}
                            </div>
                        </header>

                        <main
                            role="main"
                            className="flex w-full flex-1 items-start justify-center py-4"
                        >
                            <div className="mx-auto w-full max-w-md">
                                <Card className="border shadow-sm">
                                    {(title || description) && (
                                        <CardHeader>
                                            {title && (
                                                <CardTitle>{title}</CardTitle>
                                            )}
                                            {description && (
                                                <CardDescription>
                                                    {description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                    )}
                                    <CardContent>{content}</CardContent>
                                    {contentFooter && (
                                        <CardFooter>{contentFooter}</CardFooter>
                                    )}
                                </Card>
                            </div>
                        </main>

                        <Footer
                            brandLabel={brandLabel}
                            extraLeft={extraFooter}
                            rightSlot={
                                fullWidthFooter ? <ModeToggle /> : undefined
                            }
                            fullWidth={fullWidthFooter}
                            variant="between"
                            heightClass="h-14"
                            withContainer
                        />
                    </div>
                </LocaleProvider>
            </ThemeProvider>

            <Toaster />
            <FlashToaster />
        </div>
    );
}
