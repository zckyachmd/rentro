import * as React from 'react';

import { Input } from '@/components/ui/input';

export type OtpInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type'
> & {
    value: string;
    onChange: (value: string) => void;
    digits?: number;
    allowRecovery?: boolean;
    recoveryMaxLength?: number;
};

/**
 * Single input that smart-detects numeric OTP vs recovery code.
 * Fixes issue where pasting recovery code was truncated because the input's
 * maxLength was still set for OTP mode. We now:
 *  - Always allow up to `recoveryMaxLength` characters at the DOM level
 *  - Determine the mode from the *incoming* text (raw value / paste)
 *  - Enforce length per-mode in JS (slice) instead of via a small maxLength
 */
export default function OtpInput({
    value,
    onChange,
    digits = 6,
    allowRecovery = true,
    recoveryMaxLength = 18,
    ...props
}: OtpInputProps) {
    const [isRecovery, setIsRecovery] = React.useState<boolean>(
        allowRecovery && /[a-zA-Z-]/.test(value),
    );

    React.useEffect(() => {
        // keep mode in sync if parent clears/changes value externally
        setIsRecovery(allowRecovery && /[a-zA-Z-]/.test(value));
    }, [allowRecovery, value]);

    const formatFromRaw = (raw: string) => {
        const nextIsRecovery = allowRecovery && /[A-Za-z-]/.test(raw);
        setIsRecovery(nextIsRecovery);

        if (nextIsRecovery) {
            return raw
                .replace(/[^A-Za-z0-9-]+/g, '')
                .toUpperCase()
                .slice(0, recoveryMaxLength);
        }

        return raw.replace(/\D+/g, '').slice(0, digits);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(formatFromRaw(e.target.value));
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        if (text) {
            e.preventDefault();
            onChange(formatFromRaw(text));
        }
    };

    const inputMode = isRecovery ? 'text' : 'numeric';
    const pattern = isRecovery ? '[A-Za-z0-9-]*' : '\\d*';
    const autoComplete = 'one-time-code';
    const name = props.name ?? (isRecovery ? 'recovery_code' : 'otp');

    return (
        <Input
            {...props}
            name={name}
            inputMode={
                inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']
            }
            pattern={pattern}
            autoComplete={autoComplete}
            type="text"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            maxLength={recoveryMaxLength}
            placeholder={
                props.placeholder ??
                (isRecovery
                    ? 'Masukkan recovery code'
                    : `Masukkan OTP ${digits} digit`)
            }
            aria-label={isRecovery ? 'Recovery code' : 'Kode OTP'}
        />
    );
}
