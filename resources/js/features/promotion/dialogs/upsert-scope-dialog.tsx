import { router, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import type { ScopeRow } from '../tables/scopes-columns';

export type UpsertScopeDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    item?: ScopeRow | null;
    options?: {
        buildings: SearchOption[];
        floors: SearchOption[];
        room_types: SearchOption[];
        rooms: SearchOption[];
    };
};

export default function UpsertScopeDialog({
    open,
    onOpenChange,
    promotionId,
    item = null,
    options,
}: UpsertScopeDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, processing, clearErrors } = useForm({
        scope_type: (item?.scope_type ?? 'global') as any,
        building_id: item?.building_id ? String(item.building_id) : '',
        floor_id: item?.floor_id ? String(item.floor_id) : '',
        room_type_id: item?.room_type_id ? String(item.room_type_id) : '',
        room_id: item?.room_id ? String(item.room_id) : '',
        bulk_ids: [] as string[],
        room_type_filter: '',
    });

    React.useEffect(() => {
        setData({
            scope_type: (item?.scope_type ?? 'global') as any,
            building_id: item?.building_id ? String(item.building_id) : '',
            floor_id: item?.floor_id ? String(item.floor_id) : '',
            room_type_id: item?.room_type_id ? String(item.room_type_id) : '',
            room_id: item?.room_id ? String(item.room_id) : '',
            room_type_filter: '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = () => {
        onOpenChange(false);
        (clearErrors as any)();
    };

    const submit = () => {
        (clearErrors as any)();
        const payload: any = {
            ...data,
            building_id: data.building_id || null,
            floor_id: data.floor_id || null,
            room_type_id: data.room_type_id || null,
            room_id: data.room_id || null,
        };
        if (item?.id) {
            router.put(
                route('management.promotions.scopes.update', item.id),
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ preserveUrl: true });
                        close();
                    },
                },
            );
        } else {
            router.post(
                route('management.promotions.scopes.store', promotionId),
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ preserveUrl: true });
                        close();
                    },
                },
            );
        }
    };

    // Dependent filtering
    const floors = React.useMemo(
        () => options?.floors ?? [],
        [options?.floors],
    );
    const rooms = React.useMemo(() => options?.rooms ?? [], [options?.rooms]);
    const filteredFloors = React.useMemo(() => {
        if (!data.building_id) return floors;
        return floors.filter(
            (f: any) =>
                (f.payload?.building_id ?? null) === Number(data.building_id),
        );
    }, [floors, data.building_id]);
    const filteredRooms = React.useMemo(() => {
        let list: any[] = rooms;
        if (data.building_id)
            list = list.filter(
                (r: any) =>
                    (r.payload?.building_id ?? null) ===
                    Number(data.building_id),
            );
        if (data.floor_id)
            list = list.filter(
                (r: any) =>
                    (r.payload?.floor_id ?? null) === Number(data.floor_id),
            );
        if (data.room_type_filter)
            list = list.filter(
                (r: any) =>
                    (r.payload?.room_type_id ?? null) ===
                    Number(data.room_type_filter),
            );
        return list;
    }, [rooms, data.building_id, data.floor_id, data.room_type_filter]);

    // Bulk add helpers
    const addAllFilteredRooms = React.useCallback(() => {
        const ids = filteredRooms.map((r: any) => r.value);
        if (!ids.length) return;
        router.post(
            route('management.promotions.scopes.bulk', promotionId),
            { scope_type: 'room', ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            },
        );
    }, [filteredRooms, promotionId, close]);

    const addAllFilteredFloors = React.useCallback(() => {
        const ids = filteredFloors.map((f: any) => f.value);
        if (!ids.length) return;
        router.post(
            route('management.promotions.scopes.bulk', promotionId),
            { scope_type: 'floor', ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            },
        );
    }, [filteredFloors, promotionId, close]);

    const addAllRoomTypes = React.useCallback(() => {
        const ids = (options?.room_types ?? []).map((rt: any) => rt.value);
        if (!ids.length) return;
        router.post(
            route('management.promotions.scopes.bulk', promotionId),
            { scope_type: 'room_type', ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            },
        );
    }, [options?.room_types, promotionId, close]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-3xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {item?.id
                            ? tProm('scope.edit_title', 'Edit Scope')
                            : tProm('scope.create_title', 'Add Scope')}
                    </DialogTitle>
                    <DialogDescription>
                        {tProm('scope.desc', 'Limit where the promotion applies (global/building/floor/room type/room).')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('scope.label.scope_type')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('scope.help.scope_type')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <select
                            className="bg-background rounded-md border px-2 py-2"
                            value={data.scope_type}
                            onChange={(e) =>
                                (setData as any)('scope_type', e.target.value)
                            }
                        >
                            <option value="global">Global</option>
                            <option value="building">Building</option>
                            <option value="floor">Floor</option>
                            <option value="room_type">Room Type</option>
                            <option value="room">Room</option>
                        </select>
                        <InputError name="scope_type" />
                    </div>

                    <div className="grid gap-3">
                        {data.scope_type === 'building' && (
                            <div className="grid gap-2">
                                <Label>{tProm('scope.label.building')}</Label>
                                <SearchSelect
                                    options={options?.buildings ?? []}
                                    value={data.building_id || ''}
                                    onChange={(v) =>
                                        (setData as any)('building_id', v)
                                    }
                                    placeholder={tProm(
                                        'scope.placeholder.building',
                                    )}
                                />
                                <InputError name="building_id" />
                            </div>
                        )}
                        {data.scope_type === 'floor' && (
                            <div className="grid gap-2">
                                <Label>{tProm('scope.label.floor')}</Label>
                                <SearchSelect
                                    options={filteredFloors}
                                    value={data.floor_id || ''}
                                    onChange={(v) =>
                                        (setData as any)('floor_id', v)
                                    }
                                    placeholder={tProm(
                                        'scope.placeholder.floor',
                                    )}
                                />
                                <InputError name="floor_id" />
                            </div>
                        )}
                        {data.scope_type === 'room_type' && (
                            <div className="grid gap-2">
                                <Label>{tProm('scope.label.room_type')}</Label>
                                <SearchSelect
                                    options={options?.room_types ?? []}
                                    value={data.room_type_id || ''}
                                    onChange={(v) =>
                                        (setData as any)('room_type_id', v)
                                    }
                                    placeholder={tProm(
                                        'scope.placeholder.room_type',
                                    )}
                                />
                                <InputError name="room_type_id" />
                            </div>
                        )}
                        {data.scope_type === 'room' && (
                            <div className="grid gap-3">
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <div className="grid min-w-0 gap-1">
                                        <Label>
                                            {tProm('scope.label.building')}
                                        </Label>
                                        <SearchSelect
                                            options={options?.buildings ?? []}
                                            value={data.building_id || ''}
                                            onChange={(v) => {
                                                (setData as any)(
                                                    'building_id',
                                                    v,
                                                );
                                                (setData as any)(
                                                    'floor_id',
                                                    '',
                                                );
                                            }}
                                            placeholder={tProm(
                                                'scope.placeholder.building',
                                            )}
                                        />
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <Label>
                                            {tProm(
                                                'scope.label.floor_optional',
                                            )}
                                        </Label>
                                        <SearchSelect
                                            options={filteredFloors}
                                            value={data.floor_id || ''}
                                            onChange={(v) =>
                                                (setData as any)('floor_id', v)
                                            }
                                            placeholder={tProm(
                                                'scope.placeholder.floor',
                                            )}
                                        />
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <Label>
                                            {tProm(
                                                'scope.label.room_type_optional',
                                            )}
                                        </Label>
                                        <SearchSelect
                                            options={options?.room_types ?? []}
                                            value={data.room_type_filter || ''}
                                            onChange={(v) =>
                                                (setData as any)(
                                                    'room_type_filter',
                                                    v,
                                                )
                                            }
                                            placeholder={tProm(
                                                'scope.placeholder.room_type',
                                            )}
                                        />
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <Label>
                                            {tProm('scope.label.room')}
                                        </Label>
                                        <SearchSelect
                                            options={filteredRooms}
                                            value={data.room_id || ''}
                                            onChange={(v) =>
                                                (setData as any)('room_id', v)
                                            }
                                            placeholder={tProm(
                                                'scope.placeholder.room',
                                            )}
                                        />
                                    </div>
                                </div>
                                <InputError name="room_id" />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between">
                        <div className="mr-auto flex flex-wrap gap-2">
                            {data.scope_type === 'room' && (
                                <Button type="button" variant="outline" onClick={addAllFilteredRooms}>
                                    {tProm('scope.bulk.add_filtered_rooms')}
                                </Button>
                            )}
                            {data.scope_type === 'floor' && (
                                <Button type="button" variant="outline" onClick={addAllFilteredFloors}>
                                    {tProm('scope.bulk.add_filtered_floors')}
                                </Button>
                            )}
                            {data.scope_type === 'room_type' && (
                                <Button type="button" variant="outline" onClick={addAllRoomTypes}>
                                    {tProm('scope.bulk.add_all_room_types')}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={close}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="button" disabled={processing} onClick={submit}>
                                {tProm('form.save', 'Save')}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
