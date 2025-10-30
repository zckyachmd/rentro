import { router, useForm } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FloorItem } from '@/types/management';

export type UpsertFloorDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item?: FloorItem | null;
    buildings: { id: number; name: string }[];
};

export default function UpsertFloorDialog({
    open,
    onOpenChange,
    item = null,
    buildings,
}: UpsertFloorDialogProps) {
    const { t } = useTranslation();
    const { t: tF } = useTranslation('management/floors');

    const { data, setData, post, put, processing, clearErrors } = useForm({
        building_id: item?.building_id ? String(item.building_id) : '',
        level: item?.level ? String(item.level) : '',
        name: item?.name ?? '',
    });

    React.useEffect(() => {
        setData({
            building_id: item?.building_id ? String(item.building_id) : '',
            level: item?.level ? String(item.level) : '',
            name: item?.name ?? '',
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
            put(route('management.floors.update', item.id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.floors.store'), {
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
                        {item?.id ? tF('edit_title') : tF('create_title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>
                            {t('management/room.building')}
                            <span className="ml-1 text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.building_id}
                            onValueChange={(v) => setData('building_id', v)}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t(
                                        'common.choose',
                                        'Choose...',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {buildings.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError name="building_id" />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                {t('common.level', 'Level')}
                                <span className="ml-1 text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                value={data.level}
                                onChange={(e) =>
                                    setData('level', e.target.value)
                                }
                            />
                            <InputError name="level" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('common.name')}</Label>
                            <Input
                                value={data.name ?? ''}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            <InputError name="name" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Can all={[item?.id ? 'floor.update' : 'floor.create']}>
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={submit}
                            >
                                {tF('form.save')}
                            </Button>
                        </Can>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
