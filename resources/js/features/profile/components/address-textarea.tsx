import * as React from 'react';

import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type AddressTextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        label: React.ReactNode;
        errorMessage?: string;
    };

export default function AddressTextarea({
    label,
    errorMessage,
    id,
    ...props
}: AddressTextareaProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Textarea id={id} {...props} />
            <InputError message={errorMessage} />
        </div>
    );
}
