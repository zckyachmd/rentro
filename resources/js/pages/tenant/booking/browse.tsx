import { router, usePage } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';

type RoomItem = {
    id: string;
    number: string;
    name?: string | null;
    building?: string | null;
    type?: string | null;
    status: string;
    price_month: number;
    deposit: number;
};

type Paginator<T> = {
    data: T[];
};

export default function TenantRoomBrowse() {
    const { rooms, query } = usePage<PageProps<any>>().props as unknown as {
        rooms: Paginator<RoomItem>;
        query: { building?: string; type?: string };
    };

    const [building, setBuilding] = React.useState<string>(query?.building || '');
    const [type, setType] = React.useState<string>(query?.type || '');

    const [startDate, setStartDate] = React.useState<string>('');
    const [duration, setDuration] = React.useState<string>('6');
    const [promo, setPromo] = React.useState<string>('');

    const applyFilter = () => {
        const params = new URLSearchParams();
        if (building) params.set('building', building);
        if (type) params.set('type', type);
        router.visit(`${route('tenant.rooms.index')}${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const book = (roomId: string) => {
        if (!startDate) return;
        router.post(route('tenant.bookings.store'), {
            room_id: Number(roomId),
            start_date: startDate,
            duration_count: Number(duration),
            billing_period: 'monthly',
            promo_code: promo || null,
        });
    };

    return (
        <AppLayout pageTitle="Browse Kamar" pageDescription="Pilih kamar yang tersedia dan lakukan booking.">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div>
                                <Label className="text-xs text-muted-foreground">Gedung</Label>
                                <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Mis. Gedung A" />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Tipe</Label>
                                <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Mis. Standard" />
                            </div>
                            <div className="flex items-end">
                                <Button type="button" onClick={applyFilter}>Terapkan</Button>
                            </div>
                            <div className="md:col-span-2" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Form Booking Cepat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Start Date</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Durasi (bulan)</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Durasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['3', '6', '12'].map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Kode Promo (opsional)</Label>
                                <Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="PROMO10" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(rooms?.data || []).map((r) => (
                        <Card key={r.id}>
                            <CardHeader>
                                <CardTitle>{r.number} {r.name ? `• ${r.name}` : ''}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">{r.building || '-'} • {r.type || '-'}</div>
                                <div className="mt-2 text-sm">Status: <span className="capitalize">{r.status}</span></div>
                                <div className="mt-1 text-sm">Harga/bulan: Rp {new Intl.NumberFormat('id-ID').format(r.price_month)}</div>
                                <div className="mt-1 text-sm">Deposit: Rp {new Intl.NumberFormat('id-ID').format(r.deposit)}</div>
                                <div className="mt-3">
                                    <Button type="button" onClick={() => book(r.id)} disabled={!startDate}>Book</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

