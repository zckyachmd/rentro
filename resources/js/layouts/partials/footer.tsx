import * as React from 'react';

type FooterProps = {
    brandLabel?: string;
    extraLeft?: React.ReactNode;
    rightSlot?: React.ReactNode;
    fullWidth?: boolean;
    variant?: 'between' | 'center';
    heightClass?: string;
    withContainer?: boolean;
    className?: string;
};

export default function Footer({
    brandLabel = 'Rentro',
    extraLeft,
    rightSlot,
    fullWidth = true,
    variant = 'between',
    heightClass = 'h-16',
    withContainer = true,
    className = '',
}: FooterProps) {
    return (
        <footer
            className={[
                'z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                heightClass,
                fullWidth ? 'fixed inset-x-0 bottom-0' : 'sticky bottom-0',
                className,
            ].join(' ')}
        >
            <div
                className={[
                    withContainer ? 'container mx-auto' : '',
                    'flex h-full px-4',
                ].join(' ')}
            >
                <div
                    className={[
                        'flex w-full items-center text-xs text-muted-foreground',
                        variant === 'between'
                            ? 'justify-between'
                            : 'justify-center',
                    ].join(' ')}
                >
                    {variant === 'between' ? (
                        <div className="min-h-0 min-w-0">{extraLeft}</div>
                    ) : null}

                    <p className={variant === 'between' ? 'text-center' : ''}>
                        © {new Date().getFullYear()} {brandLabel}. All rights
                        reserved.
                    </p>

                    {variant === 'between' ? (
                        <div className="min-h-0 min-w-0">{rightSlot}</div>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}
