import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type AvatarPickerProps = {
    src?: string | null;
    alt?: string;
    fallback?: string;
    onPick: (file: File | null) => void;
    className?: string;
};

export default function AvatarPicker({
    src,
    alt,
    fallback,
    onPick,
    className = '',
}: AvatarPickerProps) {
    const fileRef = React.useRef<HTMLInputElement | null>(null);
    const onClick = () => fileRef.current?.click();
    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] ?? null;
        onPick(file);
    };

    return (
        <div
            className={['group relative cursor-pointer', className]
                .filter(Boolean)
                .join(' ')}
            onClick={onClick}
        >
            <Avatar className="group-hover:ring-primary size-28 ring-2 ring-transparent transition md:size-32 lg:size-36">
                <AvatarImage src={src ?? undefined} alt={alt} />
                <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                <span className="text-xs text-white">Klik untuk ganti</span>
            </div>
            <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/*"
                className="hidden"
                onChange={onChange}
            />
        </div>
    );
}
