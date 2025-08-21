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
import Footer from '@/layouts/partials/footer';
import { getAppName } from '@/lib/env';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

type GuestLayoutProps = {
    title?: string;
    description?: string;
    content: ReactNode;
    contentFooter?: ReactNode;
    rightSlot?: ReactNode;
    extraFooter?: ReactNode;
    fullWidthFooter?: boolean;
};

export default function GuestLayout({
    title = 'Auth',
    description,
    content,
    contentFooter,
    rightSlot,
    extraFooter,
    fullWidthFooter = true,
}: GuestLayoutProps) {
    const brandLabel = getAppName();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title={title ?? 'Auth'} />

            <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
                <ThemeProvider>
                    <div className="w-full max-w-md">
                        <div className="mb-6 flex items-center justify-between">
                            <a
                                href="/"
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
                </ThemeProvider>

                <Toaster />
            </div>
        </div>
    );
}
