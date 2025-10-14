import React from 'react';

// Lazy-load lucide icons by name to avoid bundling the whole set.
// We dynamically import the mapping only when an icon is rendered,
// so initial bundles don’t include the full map.

export type LazyIconProps = React.SVGProps<SVGSVGElement> & {
    name: string;
    fallback?: React.ReactNode;
};

function DefaultFallback({ className }: { className?: string }) {
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

export default function LazyIcon({ name, fallback, ...svgProps }: LazyIconProps) {
    const Icon = React.useMemo(
        () =>
            React.lazy(async () => {
                // During SSR, render a lightweight fallback to avoid dynamic imports
                if (typeof window === 'undefined') {
                    return {
                        default: (p: React.SVGProps<SVGSVGElement>) => (
                            <DefaultFallback className={p.className} />
                        ),
                    };
                }
                try {
                    const mod = await import('lucide-react/dynamicIconImports');
                    // default export in newer versions, named in some setups
                    const map = (mod as unknown as { default?: Record<string, () => Promise<{ default: React.ComponentType<React.SVGProps<SVGSVGElement>> }>>; dynamicIconImports?: Record<string, () => Promise<{ default: React.ComponentType<React.SVGProps<SVGSVGElement>> }>> }).default ??
                        (mod as unknown as { dynamicIconImports?: Record<string, () => Promise<{ default: React.ComponentType<React.SVGProps<SVGSVGElement>> }>> }).dynamicIconImports ??
                        {};
                    const m = map as Record<string, () => Promise<{ default: React.ComponentType<React.SVGProps<SVGSVGElement>> }>>;

                    const toKebab = (s: string) =>
                        s
                            .replace(/Icon$/i, '')
                            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
                            .replace(/[_\s]+/g, '-')
                            .replace(/([a-zA-Z])(\d)/g, '$1-$2')
                            .replace(/(\d)([a-zA-Z])/g, '$1-$2')
                            .toLowerCase();

                    const candidates = Array.from(
                        new Set([
                            name,
                            name.replace(/Icon$/i, ''),
                            name.toLowerCase(),
                            toKebab(name),
                            toKebab(name.replace(/Icon$/i, '')),
                        ]),
                    );

                    for (const key of candidates) {
                        const importer = m[key];
                        if (importer) return importer();
                    }
                } catch {
                    // ignore and fall through to fallback
                }
                return {
                    default: (p: React.SVGProps<SVGSVGElement>) => (
                        <DefaultFallback className={p.className} />
                    ),
                };
            }),
        [name],
    );

    return (
        <React.Suspense
            fallback={fallback ?? <DefaultFallback className={svgProps.className} />}
        >
            <Icon {...svgProps} />
        </React.Suspense>
    );
}
