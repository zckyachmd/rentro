import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React from 'react';

export type HeroProps = {
    title?: string | null;
    subtitle?: string | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
};

export function Hero({ title, subtitle, ctaLabel, ctaHref }: HeroProps) {
    const safeTitle = title ?? 'Home';
    const safeSub = subtitle ?? undefined;
    const href = ctaHref ?? '/catalog';

    return (
        <section className="mx-auto flex min-h-[40svh] max-w-5xl flex-col items-center justify-center gap-4 px-4 py-10 text-center md:gap-6 md:py-16">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {safeTitle}
            </h1>
            {safeSub ? (
                <p className="text-muted-foreground text-balance max-w-2xl text-base md:text-lg">
                    {safeSub}
                </p>
            ) : null}
            <Separator className="my-1 w-24" />
            {ctaLabel ? (
                <Button asChild size="lg">
                    <a href={href}>{ctaLabel}</a>
                </Button>
            ) : null}
        </section>
    );
}

export default Hero;

