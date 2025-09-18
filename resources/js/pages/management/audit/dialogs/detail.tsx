'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AuditDetailDialogProps as Props } from '@/types/management';

import { subjectLabel } from '../columns';

const isEmptyish = (v: unknown): boolean => {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object')
        return Object.keys(v as Record<string, unknown>).length === 0;
    return false;
};

function PrettyJson({ value }: { value: unknown }) {
    try {
        if (isEmptyish(value)) {
            return (
                <div className="rounded border p-3 text-xs text-muted-foreground">
                    -
                </div>
            );
        }

        const text = JSON.stringify(value, null, 2);
        return (
            <div className="relative w-full space-y-2">
                <ScrollArea className="max-h-[55vh] w-full rounded border sm:max-h-[60vh] md:max-h-[65vh]">
                    <div className="min-w-0">
                        <pre
                            className="w-full whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed"
                            role="region"
                            aria-label="JSON properties"
                        >
                            {text}
                        </pre>
                    </div>
                </ScrollArea>
            </div>
        );
    } catch {
        return (
            <div className="text-xs text-muted-foreground">(invalid JSON)</div>
        );
    }
}

// Props type moved to pages/types

export default function DetailDialog({ open, item, onOpenChange }: Props) {
    const createdAt = React.useMemo(() => {
        if (!item?.created_at) return '-';
        try {
            return new Date(item.created_at).toLocaleString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return item?.created_at ?? '-';
        }
    }, [item?.created_at]);

    const handleCopy = React.useCallback(async () => {
        try {
            const text = isEmptyish(item?.properties)
                ? '-'
                : JSON.stringify(item?.properties, null, 2);
            await navigator.clipboard.writeText(text);
            toast.success('Properties tersalin', {
                description: 'Berhasil disalin ke clipboard.',
            });
        } catch {
            toast.error('Gagal menyalin', {
                description:
                    'Browser menolak akses clipboard atau tidak mendukung Clipboard API.',
            });
        }
    }, [item?.properties]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="px-6 pb-2 pt-6">
                    <DialogTitle className="text-base sm:text-lg">
                        Detail Audit Log
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Ringkasan aktivitas dan properti perubahan.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <ScrollArea className="max-h-[70vh]">
                    {item ? (
                        <div className="space-y-4 px-6 py-4">
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-xs text-muted-foreground">
                                        Waktu
                                    </dt>
                                    <dd className="text-sm font-medium">
                                        {createdAt}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs text-muted-foreground">
                                        Event
                                    </dt>
                                    <dd>
                                        <Badge variant="secondary">
                                            {item.event || '-'}
                                        </Badge>
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs text-muted-foreground">
                                        Pengguna
                                    </dt>
                                    <dd className="text-sm">
                                        {item.causer?.name ? (
                                            <>
                                                <div className="font-medium">
                                                    {item.causer.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.causer.email}
                                                </div>
                                            </>
                                        ) : (
                                            '-'
                                        )}
                                    </dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs text-muted-foreground">
                                        Subject
                                    </dt>
                                    <dd className="text-sm">
                                        {subjectLabel(
                                            item.subject_type,
                                            item.subject_id,
                                        )}
                                    </dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                        Log Name
                                    </dt>
                                    <dd className="text-sm">
                                        {item.log_name ?? '-'}
                                    </dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                        Deskripsi
                                    </dt>
                                    <dd className="text-sm">
                                        {item.description ?? '-'}
                                    </dd>
                                </div>
                            </dl>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Properties
                                </div>
                                <PrettyJson value={item.properties} />
                            </div>
                        </div>
                    ) : null}
                </ScrollArea>

                <Separator />

                <DialogFooter className="px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        disabled={!item}
                    >
                        Copy Properties
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
