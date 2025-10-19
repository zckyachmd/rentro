import React from 'react';

import { getIconComponentSync, loadIcon } from '@/lib/lucide';

// Progressive icon loader with registry to minimize flicker and avoid Suspense during hydration.

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

export default function LazyIcon({
    name,
    fallback,
    ...svgProps
}: LazyIconProps) {
    const [Comp, setComp] = React.useState(() => getIconComponentSync(name));

    React.useEffect(() => {
        let cancelled = false;
        if (!Comp && typeof window !== 'undefined') {
            loadIcon(name).then((c) => {
                if (!cancelled && c) setComp(() => c);
            });
        }
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    if (Comp) return <Comp {...svgProps} />;

    return (
        <>{fallback ?? <DefaultFallback className={svgProps.className} />}</>
    );
}
