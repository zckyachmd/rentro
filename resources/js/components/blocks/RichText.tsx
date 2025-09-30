import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

export type RichTextProps = {
    body?: string | null;
};

// Minimal markdown-ish renderer: pre-wrap text. No heavy libs.
export function RichText({ body }: RichTextProps) {
    const text = body ?? '';
    return (
        <Card>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap p-6">
                {text}
            </CardContent>
        </Card>
    );
}

export default RichText;

