import { router, useForm } from '@inertiajs/react';
import React from 'react';

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
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';

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
    const { data, setData, post, put, processing, clearErrors } = useForm({
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

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const submit = React.useCallback(() => {
        clearErrors();
        const payload: any = {
            ...data,
            building_id: data.building_id || null,
            floor_id: data.floor_id || null,
            room_type_id: data.room_type_id || null,
            room_id: data.room_id || null,
        };
        if (item?.id) {
            put(route('management.promotions.scopes.update', item.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.promotions.scopes.store', promotionId), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [data, post, put, item?.id, close, clearErrors, promotionId]);

    // Dependent filtering
    const floors = React.useMemo(() => options?.floors ?? [], [options?.floors])
    const rooms = React.useMemo(() => options?.rooms ?? [], [options?.rooms])
    const filteredFloors = React.useMemo(() => {
        if (!data.building_id) return floors
        return floors.filter((f: any) => (f.payload?.building_id ?? null) === Number(data.building_id))
    }, [floors, data.building_id])
    const filteredRooms = React.useMemo(() => {
        let list: any[] = rooms
        if (data.building_id) list = list.filter((r: any) => (r.payload?.building_id ?? null) === Number(data.building_id))
        if (data.floor_id) list = list.filter((r: any) => (r.payload?.floor_id ?? null) === Number(data.floor_id))
        if (data.room_type_filter) list = list.filter((r: any) => (r.payload?.room_type_id ?? null) === Number(data.room_type_filter))
        return list
    }, [rooms, data.building_id, data.floor_id])

    // Bulk add helpers
    const addAllFilteredRooms = React.useCallback(() => {
        const ids = filteredRooms.map((r: any) => r.value)
        if (!ids.length) return
        post(route('management.promotions.scopes.bulk', promotionId), {
            data: { scope_type: 'room', ids },
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ preserveUrl: true })
                close()
            },
        })
    }, [filteredRooms, post, promotionId, close])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item?.id ? 'Edit Scope' : 'Add Scope'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <Label>Scope Type</Label>
                        <select
                            className="border bg-background px-2 py-2 rounded-md"
                            value={data.scope_type}
                            onChange={(e) => setData('scope_type', e.target.value)}
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
                                <Label>Building</Label>
                                <SearchSelect
                                    options={options?.buildings ?? []}
                                    value={data.building_id || ''}
                                    onChange={(v) => setData('building_id', v)}
                                />
                                <InputError name="building_id" />
                            </div>
                        )}
                        {data.scope_type === 'floor' && (
                            <div className="grid gap-2">
                                <Label>Floor</Label>
                                <SearchSelect
                                    options={filteredFloors}
                                    value={data.floor_id || ''}
                                    onChange={(v) => setData('floor_id', v)}
                                />
                                <InputError name="floor_id" />
                            </div>
                        )}
                        {data.scope_type === 'room_type' && (
                            <div className="grid gap-2">
                                <Label>Room Type</Label>
                                <SearchSelect
                                    options={options?.room_types ?? []}
                                    value={data.room_type_id || ''}
                                    onChange={(v) => setData('room_type_id', v)}
                                />
                                <InputError name="room_type_id" />
                            </div>
                        )}
                        {data.scope_type === 'room' && (
                            <div className="grid gap-2">
                                <div className="grid gap-2 md:grid-cols-3">
                                    <div className="grid gap-1">
                                        <Label>Building</Label>
                                        <SearchSelect
                                            options={options?.buildings ?? []}
                                            value={data.building_id || ''}
                                            onChange={(v) => {
                                                setData('building_id', v)
                                                setData('floor_id', '')
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Floor (optional)</Label>
                                        <SearchSelect
                                            options={filteredFloors}
                                            value={data.floor_id || ''}
                                            onChange={(v) => setData('floor_id', v)}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Room Type (optional)</Label>
                                        <SearchSelect
                                            options={options?.room_types ?? []}
                                            value={data.room_type_filter || ''}
                                            onChange={(v) => setData('room_type_filter', v)}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Room</Label>
                                        <SearchSelect
                                            options={filteredRooms}
                                            value={data.room_id || ''}
                                            onChange={(v) => setData('room_id', v)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={addAllFilteredRooms}>Add all filtered rooms</Button>
                                </div>
                                <InputError name="room_id" />
                            </div>
                        )}
                        {data.scope_type === 'floor' && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const ids = filteredFloors.map((f: any) => f.value)
                                        if (!ids.length) return
                                        post(route('management.promotions.scopes.bulk', promotionId), {
                                            data: { scope_type: 'floor', ids },
                                            preserveScroll: true,
                                            onSuccess: () => { router.reload({ preserveUrl: true }); close(); },
                                        })
                                    }}
                                >
                                    Add all filtered floors
                                </Button>
                            </div>
                        )}
                        {data.scope_type === 'room_type' && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const ids = (options?.room_types ?? []).map((rt: any) => rt.value)
                                        if (!ids.length) return
                                        post(route('management.promotions.scopes.bulk', promotionId), {
                                            data: { scope_type: 'room_type', ids },
                                            preserveScroll: true,
                                            onSuccess: () => { router.reload({ preserveUrl: true }); close(); },
                                        })
                                    }}
                                >
                                    Add all room types
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="button" disabled={processing} onClick={submit}>
                            Save
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
