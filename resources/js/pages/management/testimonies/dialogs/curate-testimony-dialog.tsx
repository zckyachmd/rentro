import { router } from '@inertiajs/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TestimonyItem } from '@/types/management';

export default function CurateTestimonyDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item: TestimonyItem | null;
}) {
    const { t: tMng } = useTranslation('management/testimony');
    const { t: tEnum } = useTranslation('enum');

    const [content, setContent] = React.useState('');
    const [status, setStatus] = React.useState<
        'pending' | 'approved' | 'rejected' | 'published'
    >('pending');
    const [processing, setProcessing] = React.useState(false);

    React.useEffect(() => {
        if (!item) return;
        setContent(item.content_curated ?? '');
        setStatus(item.status);
    }, [item]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;
        setProcessing(true);
        router.put(
            route('management.testimonies.update', item.id),
            { content_curated: content, status },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>{tMng('curate.title')}</DialogTitle>
                    <DialogDescription>{tMng('curate.desc')}</DialogDescription>
                </DialogHeader>
                {item && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <Label className="mb-1 block">
                                {tMng('curate.original')}
                            </Label>
                            <p className="text-muted-foreground bg-muted/30 rounded-md border p-3 text-sm">
                                {item.content_original}
                            </p>
                        </div>
                        <div>
                            <Label
                                htmlFor="content_curated"
                                className="mb-1 block"
                            >
                                {tMng('curate.curated')}
                            </Label>
                            <Textarea
                                id="content_curated"
                                rows={5}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={tMng('curate.placeholder')}
                            />
                        </div>
                        <div>
                            <Label className="mb-1 block">
                                {tMng('curate.status')}
                            </Label>
                            <Select
                                value={status}
                                onValueChange={(v) =>
                                    setStatus(
                                        v as
                                            | 'pending'
                                            | 'approved'
                                            | 'rejected'
                                            | 'published',
                                    )
                                }
                            >
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">
                                        {tEnum('testimony_status.pending')}
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        {tEnum('testimony_status.approved')}
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        {tEnum('testimony_status.rejected')}
                                    </SelectItem>
                                    <SelectItem value="published">
                                        {tEnum('testimony_status.published')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                {tMng('curate.cancel')}
                            </Button>
                            <Can all={["testimony.update"]}>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? tMng('curate.saving')
                                        : tMng('curate.save')}
                                </Button>
                            </Can>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
