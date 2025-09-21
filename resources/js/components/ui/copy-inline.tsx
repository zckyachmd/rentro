import * as React from 'react';
import { toast } from 'sonner';

export type CopyInlineProps = {
    value: string;
    children?: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    variant?: 'default' | 'link' | 'icon';
    size?: 'xs' | 'sm' | 'md';
    showToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
    onCopied?: (ok: boolean) => void;
    duration?: number;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick' | 'children' | 'className'>;

export function CopyInline({
    value,
    children,
    className,
    as = 'span',
    variant = 'default',
    size = 'sm',
    showToast = true,
    successMessage = 'Disalin ke clipboard',
    errorMessage = 'Gagal menyalin',
    onCopied,
    duration = 1200,
    ...rest
}: CopyInlineProps) {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const onClick = React.useCallback(async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => setCopied(false), duration);
            onCopied?.(true);
            if (showToast) toast.success(successMessage);
        } catch {
            onCopied?.(false);
            if (showToast) toast.error(errorMessage);
        }
    }, [value, duration, onCopied, showToast, successMessage, errorMessage]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    const Element: React.ElementType = as ?? 'span';
    const base =
        variant === 'link'
            ? 'cursor-pointer hover:underline'
            : variant === 'icon'
              ? 'inline-flex items-center justify-center select-none cursor-pointer rounded hover:bg-muted text-muted-foreground transition-colors'
              : 'cursor-pointer';

    const sizeClass =
        variant === 'icon'
            ? size === 'xs'
                ? 'h-6 w-6'
                : size === 'md'
                  ? 'h-8 w-8'
                  : 'h-7 w-7'
            : '';
    const iconSizeClass = size === 'xs' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
    const elementProps: React.HTMLAttributes<HTMLElement> = {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown,
        className: [base, sizeClass, className].filter(Boolean).join(' '),
        'aria-label': 'Copy to clipboard',
        'data-copied': copied ? '1' : undefined,
        ...rest,
    } as React.HTMLAttributes<HTMLElement>;

    const content =
        variant === 'icon' && !children ? (
            <span className={iconSizeClass}>
                {copied ? (
                    <svg
                        viewBox="0 0 24 24"
                        className={iconSizeClass}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        className={iconSizeClass}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                )}
            </span>
        ) : (
            children
        );

    return React.createElement(Element, elementProps, content);
}

export default CopyInline;
