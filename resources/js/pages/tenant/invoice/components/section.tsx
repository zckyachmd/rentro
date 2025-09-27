import React from 'react';

export default function Section({
    title,
    subtitle,
    children,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-2">
                <div className="text-sm font-medium">{title}</div>
                {subtitle ? (
                    <div className="text-muted-foreground text-xs">
                        {subtitle}
                    </div>
                ) : null}
            </div>
            {children}
        </div>
    );
}
