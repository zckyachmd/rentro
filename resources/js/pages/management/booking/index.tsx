import { router, usePage } from '@inertiajs/react';
import { Check, Filter } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';

type BookingItem = {
    id: string;
    number: string;
    status: string;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    tenant?: string | null;
    room?: string | null;
    building?: string | null;
    type?: string | null;
    estimate?: { total: number } | null;
};

type Paginator<T> = { data: T[] };

export default function ManagementBookingsIndex() {
    const { bookings, options, query } = usePage<PageProps<any>>().props as unknown as {
        bookings: Paginator<BookingItem>;
        options: { statuses: { value: string; label: string }[] };
        query: { status?: string; q?: string };
    };
    const [status, setStatus] = React.useState<string>(query?.status || 'requested');
    const [q, setQ] = React.useState<string>(query?.q || '');

    const apply = () => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (q) params.set('q', q);
        router.visit(`${route('management.bookings.index')}${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const approve = (id: string) => {
        router.post(route('management.bookings.approve', { booking: id }), {}, { preserveScroll: true });
    };

    return (
        <AppLayout pageTitle="Bookings" pageDescription="Kelola booking tenant.">
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.statuses?.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Cari</Label>
                                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="No booking/tenant/kamar" />
                            </div>
                            <div className="flex items-end">
                                <Button type="button" onClick={apply}><Filter className="mr-2 h-4 w-4" />Apply</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(bookings?.data || []).map((b) => (
                        <Card key={b.id}>
                            <CardHeader>
                                <CardTitle className="text-base font-medium">{b.number}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">Tenant: {b.tenant || '-'}</div>
                                <div className="text-sm">Room: {b.room || '-'}</div>
                                <div className="text-sm">Start: {b.start_date}</div>
                                <div className="text-sm">Durasi: {b.duration} bulan</div>
                                <div className="text-sm">Estimasi: Rp {new Intl.NumberFormat('id-ID').format(b.estimate?.total || 0)}</div>
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" onClick={() => router.visit(route('management.bookings.show', { booking: b.id }))}>Detail</Button>
                                    {b.status === 'requested' && (
                                        <Button size="sm" variant="outline" onClick={() => approve(b.id)}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

