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
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

type AuthLayoutProps = {
    title?: string;
    description?: string;
    content: ReactNode;
    contentFooter?: ReactNode;
    brandHref?: string;
    brandLabel?: string;
    rightSlot?: ReactNode;
    extraFooter?: ReactNode;
    fullWidthFooter?: boolean;
};

export default function AuthLayout({
    title = 'Auth',
    description,
    content,
    contentFooter,
    brandHref = '/',
    brandLabel = 'Rentro',
    rightSlot,
    extraFooter,
    fullWidthFooter = true,
}: AuthLayoutProps) {
    const pageTitle = title ?? 'Auth';

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title={pageTitle} />

            <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
                <ThemeProvider>
                    <div className="w-full max-w-md">
                        <div className="mb-6 flex items-center justify-between">
                            <a
                                href={brandHref}
                                className="inline-flex items-center gap-2 font-semibold"
                            >
                                <span className="text-xl">{brandLabel}</span>
                            </a>
                            <div className="flex items-center gap-2">
                                {rightSlot}
                            </div>
                        </div>

                        <Card className="border shadow-sm">
                            {(title || description) && (
                                <CardHeader>
                                    {title && <CardTitle>{title}</CardTitle>}
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

                        <footer
                            className={[
                                'z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                                fullWidthFooter
                                    ? 'fixed inset-x-0 bottom-0'
                                    : 'sticky bottom-0',
                            ].join(' ')}
                        >
                            <div className="container mx-auto px-4">
                                <div className="flex items-center justify-between py-3 text-xs text-muted-foreground">
                                    <div>{extraFooter}</div>
                                    <p className="text-center">
                                        © {new Date().getFullYear()}{' '}
                                        {brandLabel}. All rights reserved.
                                    </p>
                                    <div>
                                        {fullWidthFooter && <ModeToggle />}
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </ThemeProvider>

                <Toaster />
            </div>
        </div>
    );
}
