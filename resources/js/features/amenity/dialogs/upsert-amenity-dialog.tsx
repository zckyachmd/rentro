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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AmenityItem } from '@/types/management';

export type UpsertAmenityDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    supportedLocales: string[];
    item?: AmenityItem | null;
};

export default function UpsertAmenityDialog({
    open,
    onOpenChange,
    supportedLocales,
    item = null,
}: UpsertAmenityDialogProps) {
    const { t } = useTranslation();
    const { t: tAmen } = useTranslation('management/amenities');
    const { t: tEnum } = useTranslation('enum');

    const { data, setData, post, put, processing, clearErrors } =
        useForm({
            names: Object.assign({}, item?.names ?? {}),
            icon: item?.icon ?? '',
            category:
                item?.category && ['room', 'communal'].includes(item.category)
                    ? item.category
                    : 'room',
        });

    React.useEffect(() => {
        setData({
            names: Object.assign({}, item?.names ?? {}),
            icon: item?.icon ?? '',
            category:
                item?.category && ['room', 'communal'].includes(item.category)
                    ? item.category
                    : 'room',
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
            put(route('management.amenities.update', item.id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.amenities.store'), {
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
                        {item?.id ? tAmen('edit_title') : tAmen('create_title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {supportedLocales.map((loc) => (
                        <div key={loc} className="space-y-2">
                            <Label>
                                {tAmen('form.name_locale', {
                                    locale: loc.toUpperCase(),
                                })}
                            </Label>
                            <Input
                                value={
                                    (data.names as Record<string, string>)?.[
                                        loc
                                    ] ?? ''
                                }
                                onChange={(e) =>
                                    setData('names', {
                                        ...(data.names as Record<
                                            string,
                                            string
                                        >),
                                        [loc]: e.target.value,
                                    })
                                }
                            />
                            <InputError name={`names.${loc}`} />
                        </div>
                    ))}

                    <div className="space-y-2">
                        <Label>{tAmen('form.category')}</Label>
                        <Select
                            value={String(data.category)}
                            onValueChange={(v) => setData('category', v as 'room' | 'communal')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="room">
                                    {tEnum('amenity_category.room')}
                                </SelectItem>
                                <SelectItem value="communal">
                                    {tEnum('amenity_category.communal')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError name="category" />
                    </div>

                    <div className="space-y-2">
                        <Label>{tAmen('form.icon')}</Label>
                        <Input
                            placeholder="e.g., AirVent"
                            value={data.icon ?? ''}
                            onChange={(e) => setData('icon', e.target.value)}
                        />
                        <p className="text-muted-foreground text-xs">
                            {tAmen('form.icon_hint')}
                        </p>
                        <InputError name="icon" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={submit}
                        >
                            {tAmen('form.save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
