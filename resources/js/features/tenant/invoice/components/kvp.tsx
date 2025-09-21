import React from 'react';

export default function KVP({
    label,
    value,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="text-muted-foreground">{label}</div>
            <div className="text-right">{value}</div>
        </div>
    );
}
