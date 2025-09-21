import * as React from 'react';

import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';

export type AddressInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: React.ReactNode;
    errorMessage?: string;
};

export default function AddressInput({
    label,
    errorMessage,
    id,
    ...props
}: AddressInputProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} {...props} />
            <InputError message={errorMessage} />
        </div>
    );
}
