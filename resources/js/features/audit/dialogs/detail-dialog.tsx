import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PrettyJson from '@/components/ui/pretty-json';
import { subjectLabel } from '@/features/audit/tables/columns';
import type { ActivityItem } from '@/types/management';

function isEmptyish(obj?: Record<string, unknown> | null) {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
}

export default function DetailDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: ActivityItem | null;
}) {
    const { t, i18n } = useTranslation();
    const { t: tAudit } = useTranslation('management/audit');
    const createdAt = React.useMemo(() => {
        try {
            return new Date(item?.created_at || '').toLocaleString(i18n.language, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return item?.created_at ?? '-';
        }
    }, [item?.created_at, i18n.language]);

    const textToCopy = React.useMemo(
        () =>
            isEmptyish(item?.properties)
                ? '-'
                : JSON.stringify(item?.properties, null, 2),
        [item?.properties],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] p-0 sm:max-w-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-base sm:text-lg">{tAudit('detail_title')}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">{tAudit('detail_desc')}</DialogDescription>
                </DialogHeader>

                {item ? (
                    <div className="min-w-0 space-y-4 px-6 py-4">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-muted-foreground text-xs">
                                    {t('common.time')}
                                </dt>
                                <dd className="text-sm font-medium">
                                    {createdAt}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-muted-foreground text-xs">
                                    {tAudit('event')}
                                </dt>
                                <dd>
                                    <Badge variant="secondary">
                                        {item.event || '-'}
                                    </Badge>
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-muted-foreground text-xs">
                                    {t('common.user')}
                                </dt>
                                <dd className="text-sm">
                                    {item.causer?.name ? (
                                        <>
                                            <div className="font-medium">
                                                {item.causer.name}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {item.causer.email ? (
                                                    <CopyInline
                                                        value={
                                                            item.causer.email
                                                        }
                                                        variant="link"
                                                        successMessage={t('email_copied', { ns: 'profile' })}
                                                    >
                                                        {item.causer.email}
                                                    </CopyInline>
                                                ) : (
                                                    '-'
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-muted-foreground text-xs">
                                    {tAudit('subject')}
                                </dt>
                                <dd className="text-sm">
                                    {subjectLabel(
                                        item.subject_type,
                                        item.subject_id,
                                    )}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-muted-foreground text-xs">
                                    {tAudit('log_name')}
                                </dt>
                                <dd className="text-sm">
                                    {item.log_name ?? '-'}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-muted-foreground text-xs">
                                    {t('common.description')}
                                </dt>
                                <dd className="text-sm">
                                    {item.description ?? '-'}
                                </dd>
                            </div>
                        </dl>

                        <div className="min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                    {tAudit('properties')}
                                </div>
                                <CopyInline
                                    as="button"
                                    value={textToCopy}
                                    className="bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-md border p-1"
                                    successMessage={tAudit('properties_copied')}
                                >
                                    <span className="sr-only">
                                        {tAudit('copy_properties')}
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-2 12h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </CopyInline>
                            </div>
                            <PrettyJson value={item.properties} />
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="px-6 py-4">
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
