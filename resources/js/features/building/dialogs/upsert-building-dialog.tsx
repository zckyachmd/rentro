import { router, useForm } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { BuildingItem } from '@/types/management';

export type UpsertBuildingDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item?: BuildingItem | null;
};

export default function UpsertBuildingDialog({
    open,
    onOpenChange,
    item = null,
}: UpsertBuildingDialogProps) {
    const { t } = useTranslation();
    const { t: tB } = useTranslation('management/buildings');

    const { data, setData, post, put, processing, clearErrors } = useForm({
        name: item?.name ?? '',
        code: item?.code ?? '',
        address: item?.address ?? '',
        is_active: item?.is_active ?? true,
    });

    React.useEffect(() => {
        setData({
            name: item?.name ?? '',
            code: item?.code ?? '',
            address: item?.address ?? '',
            is_active: item?.is_active ?? true,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const submit = React.useCallback(() => {
        clearErrors();
        if (item?.id) {
            put(route('management.buildings.update', item.id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.buildings.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [post, put, item?.id, close, clearErrors]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {item?.id ? tB('edit_title') : tB('create_title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>
                            {t('common.name')}
                            <span className="ml-1 text-red-500">*</span>
                        </Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError name="name" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('common.code', 'Code')}</Label>
                        <Input
                            value={data.code ?? ''}
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        <InputError name="code" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('common.address', 'Address')}</Label>
                        <Textarea
                            value={data.address ?? ''}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                        <InputError name="address" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            checked={Boolean(data.is_active)}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label>{t('common.active', 'Active')}</Label>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={submit}
                        >
                            {tB('form.save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
