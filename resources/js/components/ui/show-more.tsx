import React from 'react';

export interface ShowMoreProps {
    text: string;
    limit?: number;
}

export default function ShowMore({ text, limit = 120 }: ShowMoreProps) {
    const [expanded, setExpanded] = React.useState(false);
    if (!text) return <span>-</span>;
    if (text.length <= limit) return <span>{text}</span>;
    return (
        <span>
            {expanded ? text : text.slice(0, limit) + '…'}{' '}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-medium text-primary hover:underline"
            >
                {expanded ? 'Sembunyikan' : 'Selengkapnya'}
            </button>
        </span>
    );
}
