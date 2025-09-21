import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type PasswordInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type'
> & {
    rightButtonClassName?: string;
    leftAdornment?: React.ReactNode;
};

export default function PasswordInput({
    className = '',
    rightButtonClassName = '',
    leftAdornment,
    ...props
}: PasswordInputProps) {
    const [show, setShow] = React.useState(false);

    const withLeftPad = leftAdornment ? 'pl-10' : '';

    return (
        <div className="relative">
            {leftAdornment ? (
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {leftAdornment}
                </span>
            ) : null}

            <Input
                {...props}
                type={show ? 'text' : 'password'}
                className={[className, withLeftPad, 'pr-10']
                    .filter(Boolean)
                    .join(' ')}
            />

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShow((s) => !s)}
                className={[
                    'absolute right-0 top-0 h-full border-0 px-3 hover:border-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0',
                    rightButtonClassName,
                ]
                    .filter(Boolean)
                    .join(' ')}
                tabIndex={-1}
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? (
                    <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
