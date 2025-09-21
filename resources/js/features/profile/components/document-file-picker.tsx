import * as React from 'react';

import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';

export default function DocumentFilePicker({
    onPick,
    fileName,
    accept = 'image/*,application/pdf',
    errorMessage,
}: {
    onPick: (file: File | null) => void;
    fileName?: string | null;
    accept?: string;
    errorMessage?: string;
}) {
    const ref = React.useRef<HTMLInputElement | null>(null);
    const onClick = () => ref.current?.click();
    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const f = e.target.files?.[0] ?? null;
        onPick(f);
    };
    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
                    onClick={onClick}
                >
                    Pilih File
                </button>
                {fileName ? (
                    <span
                        className="truncate text-sm text-muted-foreground"
                        title={fileName}
                    >
                        {fileName}
                    </span>
                ) : null}
            </div>
            <Input
                ref={ref}
                type="file"
                accept={accept}
                className="hidden"
                onChange={onChange}
            />
            <InputError className="mt-1" message={errorMessage} />
        </div>
    );
}
