import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarClock, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Crumb } from '@/components/breadcrumbs';
import { DatePickerInput } from '@/components/date-picker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { LeaveGuardDialog, useLeaveGuard } from '@/hooks/use-leave-guard';
import AuthLayout from '@/layouts/auth-layout';

type PageOptions = {
    tenants?: TenantOption[];
    rooms?: RoomOption[];
    billing_periods?: PeriodOption[];
    today_date?: string;
    contract_settings?: {
        daily_max_days?: number;
        weekly_max_weeks?: number;
        monthly_allowed_terms?: number[];
        prorata?: boolean;
        release_day_of_month?: number;
        due_day_of_month?: number;
        auto_renew_default?: boolean;
    };
};

type TenantOption = { id: number | string; name: string; email?: string };
type PeriodOption = { value: string; label: string; days?: number | null };
type RoomOption = {
    id: string;
    number: string;
    name?: string | null;
    price_cents?: number | null;
    deposit_cents?: number | null;
    billing_period?: string | null;
    type_price_cents?: number | null;
    building_name?: string | null;
    floor_level?: number | null;
    building?: { id: number | string; name?: string | null } | null;
    floor?: { id: number | string; level?: number | null } | null;
    floor_label?: string;
    floor_label_text?: string;
    building_label?: string;
    building_short_name?: string;
    room_name?: string;
};

type FormData = {
    user_id: string;
    room_id: string;
    start_date: string;
    end_date?: string;
    rent_rupiah: string;
    deposit_rupiah: string;
    rent_cents?: number;
    deposit_cents?: number;
    billing_period: string;
    billing_day: string;
    auto_renew: boolean;
    notes?: string;
};

type FormLocal = {
    duration_count: string;
    monthly_payment_mode: 'per_month' | 'full';
};

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('management.contracts.index') },
    { label: 'Buat Kontrak', href: '#' },
];

const buildRoomLocation = (r: RoomOption) => {
    const floorLabel =
        r.floor_label ??
        r.floor_label_text ??
        (typeof r.floor?.level !== 'undefined'
            ? `Lantai ${r.floor.level}`
            : r.floor_level
              ? `Lantai ${r.floor_level}`
              : undefined);
    const buildingLabel =
        r.building_label ??
        r.building_name ??
        r.building?.name ??
        r.building_short_name;
    if (floorLabel && buildingLabel) return `${floorLabel} - ${buildingLabel}`;
    if (floorLabel) return String(floorLabel);
    if (buildingLabel) return String(buildingLabel);
    return '';
};

const buildRoomBaseLabel = (r: RoomOption) => {
    const num = r.number ?? '';
    const nm = r.name ?? r.room_name ?? '';
    return nm ? `${num} / ${nm}` : `${num}`;
};

const formatRupiah = (val: string) => {
    const n = Number(val || '');
    if (Number.isNaN(n)) return 'Rp -';
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n);
    } catch {
        return `Rp ${n.toLocaleString('id-ID')}`;
    }
};

export default function ContractCreate() {
    const { props } = usePage<{ options?: PageOptions }>();
    const opt = props.options;
    const todayDay = opt?.today_date
        ? String(Number(opt.today_date.slice(8, 10)))
        : '';

    const tenants: TenantOption[] = opt?.tenants ?? [];
    const rooms: RoomOption[] = opt?.rooms ?? [];
    const periods: PeriodOption[] = React.useMemo(
        () => opt?.billing_periods ?? [],
        [opt?.billing_periods],
    );

    const contractSettings = opt?.contract_settings ?? {};
    const prorata = Boolean(contractSettings.prorata ?? false);
    const autoRenewDefault = Boolean(
        contractSettings.auto_renew_default ?? false,
    );
    const dailyMax = Number(contractSettings.daily_max_days ?? 5);
    const weeklyMax = Number(contractSettings.weekly_max_weeks ?? 3);
    const monthlyTerms: number[] = Array.isArray(
        contractSettings.monthly_allowed_terms,
    )
        ? (contractSettings.monthly_allowed_terms as number[])
        : [3, 6, 12];

    const { data, setData, processing, errors, isDirty } = useForm<
        FormData & FormLocal
    >({
        user_id: '',
        room_id: '',
        start_date: opt?.today_date ?? '',
        end_date: '',
        rent_rupiah: '',
        deposit_rupiah: '',
        billing_period: 'monthly',
        billing_day: todayDay,
        auto_renew: autoRenewDefault,
        notes: '',
        duration_count: '',
        monthly_payment_mode: 'per_month',
    });

    const selectedPeriod = periods.find((p) => p.value === data.billing_period);

    const roomOptions: SearchOption[] = rooms.map((r) => ({
        value: String(r.id),
        label: buildRoomBaseLabel(r),
        description: buildRoomLocation(r),
        payload: r,
    }));

    const tenantOptions: SearchOption[] = tenants.map((t) => ({
        value: String(t.id),
        label: t.name,
        description: t.email ?? '',
        payload: t,
    }));

    const onRoomChange = (value: string, opt?: SearchOption) => {
        setData('room_id', value);
        const r =
            (opt?.payload as RoomOption) ||
            rooms.find((x) => String(x.id) === String(value));
        if (r) {
            const price = r.price_cents ?? r.type_price_cents ?? null;
            const deposit = r.deposit_cents ?? null;
            if (price != null)
                setData(
                    'rent_rupiah',
                    String(Math.round((price as number) / 100)),
                );
            if (deposit != null)
                setData(
                    'deposit_rupiah',
                    String(Math.round((deposit as number) / 100)),
                );
            if (r.billing_period) setData('billing_period', r.billing_period);
        }
    };

    const toISO = React.useCallback((d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, []);

    const addDaysISO = React.useCallback(
        (iso: string, days: number) => {
            if (!iso) return '';
            const dt = new Date(iso + 'T00:00:00');
            if (Number.isNaN(dt.getTime())) return '';
            dt.setDate(dt.getDate() + days);
            return toISO(dt);
        },
        [toISO],
    );

    React.useEffect(() => {
        const startISO = data.start_date;
        const period = periods.find((p) => p.value === data.billing_period);
        const hasDuration =
            data.duration_count !== '' &&
            !Number.isNaN(Number(data.duration_count));
        if (!hasDuration) {
            if (data.end_date) setData('end_date', '');
            if (data.billing_day) setData('billing_day', '');
            return;
        }
        const count = Math.max(1, Number(data.duration_count));
        let nextEnd = '';
        if (startISO) {
            if (data.billing_period === 'monthly') {
                const d = new Date(startISO + 'T00:00:00');
                const startDay = d.getDate();
                if (prorata && count >= 2 && startDay !== 1) {
                    const eomStart = new Date(
                        d.getFullYear(),
                        d.getMonth() + 1,
                        0,
                    );
                    const target = new Date(
                        eomStart.getFullYear(),
                        eomStart.getMonth() + count,
                        0,
                    );
                    nextEnd = toISO(target);
                } else {
                    d.setMonth(d.getMonth() + count);
                    nextEnd = toISO(d);
                }
            } else {
                const unitDays = Number(period?.days ?? 0) || 30;
                nextEnd = addDaysISO(startISO, unitDays * count);
            }
        }
        const currEnd = data.end_date ?? '';
        if (nextEnd !== currEnd) {
            setData('end_date', nextEnd);
        }

        let nextBilling = nextEnd
            ? String(new Date(nextEnd + 'T00:00:00').getDate())
            : '';
        if (
            data.billing_period === 'monthly' &&
            prorata &&
            count >= 2 &&
            startISO &&
            new Date(startISO + 'T00:00:00').getDate() !== 1
        ) {
            const releaseDom = Number(
                contractSettings.release_day_of_month ?? 1,
            );
            nextBilling = String(Math.max(1, Math.min(31, releaseDom || 1)));
        }
        const currBilling = data.billing_day ?? '';
        if (nextBilling !== currBilling) {
            setData('billing_day', nextBilling);
        }
    }, [
        data.start_date,
        data.billing_period,
        data.duration_count,
        data.end_date,
        data.billing_day,
        periods,
        addDaysISO,
        setData,
        prorata,
        contractSettings.release_day_of_month,
    ]);

    const [autoRenewAuto, setAutoRenewAuto] = React.useState(true);

    React.useEffect(() => {
        if (!autoRenewAuto) return;
        const isMonthly =
            (data.billing_period || '').toLowerCase() === 'monthly';
        if (data.auto_renew !== isMonthly) {
            setData('auto_renew', isMonthly);
        }
    }, [data.billing_period, data.auto_renew, setData, autoRenewAuto]);

    const guard = useLeaveGuard({ enabled: isDirty });
    const [previewOpen, setPreviewOpen] = React.useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const toNum = (v: string) => Number(v);
        const isValidDate = (iso: string) => {
            if (!iso) return false;
            const d = new Date(iso + 'T00:00:00');
            return !Number.isNaN(d.getTime());
        };

        if (!data.user_id) {
            toast.error('Penyewa wajib dipilih.');
            return;
        }
        if (!data.room_id) {
            toast.error('Kamar wajib dipilih.');
            return;
        }
        if (!data.billing_period) {
            toast.error('Periode tagihan wajib dipilih.');
            return;
        }

        if (data.duration_count === '') {
            toast.error('Durasi wajib diisi.');
            return;
        }
        const dur = toNum(data.duration_count);
        if (!Number.isFinite(dur) || !Number.isInteger(dur) || dur < 1) {
            toast.error('Durasi tidak valid (harus bilangan bulat ≥ 1).');
            return;
        }
        if (!isValidDate(data.start_date)) {
            toast.error('Tanggal mulai tidak valid.');
            return;
        }

        if (data.billing_period === 'weekly' && dur > weeklyMax) {
            toast.error(`Durasi melebihi batas minggu (maks ${weeklyMax}).`);
            return;
        }
        if (data.billing_period === 'daily' && dur > dailyMax) {
            toast.error(`Durasi melebihi batas hari (maks ${dailyMax}).`);
            return;
        }
        if (data.billing_period === 'monthly') {
            const allowed = new Set(monthlyTerms.map(Number));
            if (!allowed.has(dur)) {
                toast.error(
                    `Durasi bulanan harus salah satu dari: ${monthlyTerms.join(', ')}`,
                );
                return;
            }
            if (!data.monthly_payment_mode) {
                toast.error('Metode pembayaran bulanan wajib dipilih.');
                return;
            }
        }

        const rent = toNum(data.rent_rupiah);
        if (!Number.isFinite(rent) || rent <= 0) {
            toast.error('Biaya sewa harus > 0.');
            return;
        }
        if (data.deposit_rupiah !== '') {
            const dep = toNum(data.deposit_rupiah);
            if (!Number.isFinite(dep) || dep < 0) {
                toast.error('Deposit tidak valid (minimal 0).');
                return;
            }
        }

        setPreviewOpen(true);
    };

    const handleConfirmSubmit = () => {
        const rentCents = data.rent_rupiah
            ? Math.round(Number(data.rent_rupiah) * 100)
            : 0;
        const depositCents = data.deposit_rupiah
            ? Math.round(Number(data.deposit_rupiah) * 100)
            : 0;
        guard.skipWhile(() =>
            router.post(route('management.contracts.store'), {
                user_id: data.user_id || undefined,
                room_id: data.room_id || undefined,
                start_date: data.start_date,
                end_date: data.end_date || undefined,
                rent_cents: rentCents,
                deposit_cents: depositCents,
                billing_period: data.billing_period,
                billing_day: Number(data.billing_day || '1'),
                auto_renew: data.auto_renew,
                notes: data.notes || undefined,
                duration_count: Number(data.duration_count),
                monthly_payment_mode:
                    data.billing_period === 'monthly'
                        ? data.monthly_payment_mode
                        : undefined,
            }),
        );
        setPreviewOpen(false);
    };

    return (
        <AuthLayout
            pageTitle="Buat Kontrak"
            pageDescription="Daftarkan penyewa ke kamar kosong dan atur detail kontrak."
            breadcrumbs={BREADCRUMBS}
        >
            <Head title="Buat Kontrak" />
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Data Kontrak</CardTitle>
                        <ContractGuideDialog prorata={prorata} />
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        {/* Penyewa & Kamar */}
                        <div className="space-y-2">
                            <Label>
                                Penyewa{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <SearchSelect
                                value={data.user_id}
                                onChange={(v) => setData('user_id', v)}
                                options={tenantOptions}
                                placeholder="Cari penyewa…"
                            />
                            <InputError message={errors.user_id} />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Kamar{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <SearchSelect
                                value={data.room_id}
                                onChange={onRoomChange}
                                options={roomOptions}
                                placeholder="Cari kamar…"
                            />
                            <InputError message={errors.room_id} />
                        </div>

                        {/* Periode, Durasi, Tanggal Mulai (1 row) */}
                        <div className="grid gap-6 md:col-span-2 md:grid-cols-3">
                            {/* Periode Tagihan */}
                            <div className="space-y-2">
                                <Label>
                                    Periode Tagihan{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.billing_period}
                                    onValueChange={(v) => {
                                        setData('billing_period', v);
                                        setData('duration_count', '');
                                        setData(
                                            'monthly_payment_mode',
                                            'per_month',
                                        );
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Pilih periode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {periods.map((p) => (
                                                <SelectItem
                                                    key={p.value}
                                                    value={p.value}
                                                >
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.billing_period} />
                            </div>

                            {/* Durasi */}
                            {data.billing_period === 'monthly' ? (
                                <div className="space-y-2">
                                    <Label>
                                        Durasi (bulan){' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={String(
                                            data.duration_count || '',
                                        )}
                                        onValueChange={(v) =>
                                            setData('duration_count', v)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Pilih durasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {monthlyTerms.map((m) => (
                                                    <SelectItem
                                                        key={m}
                                                        value={String(m)}
                                                    >
                                                        {m} bulan
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.duration_count}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>
                                        Durasi (
                                        {data.billing_period === 'weekly'
                                            ? 'minggu'
                                            : 'hari'}
                                        )
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={
                                            data.billing_period === 'weekly'
                                                ? weeklyMax
                                                : dailyMax
                                        }
                                        value={data.duration_count || ''}
                                        onChange={(e) =>
                                            setData(
                                                'duration_count',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9"
                                        placeholder={
                                            data.billing_period === 'weekly'
                                                ? 'cth. 2'
                                                : 'cth. 3'
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maksimal{' '}
                                        {data.billing_period === 'weekly'
                                            ? weeklyMax + ' minggu'
                                            : dailyMax + ' hari'}
                                        .
                                    </p>
                                    <InputError
                                        message={errors.duration_count}
                                    />
                                </div>
                            )}

                            {/* Tanggal Mulai */}
                            <div className="space-y-2">
                                <Label>
                                    Tanggal Mulai{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <DatePickerInput
                                    value={data.start_date}
                                    onChange={(v) =>
                                        setData('start_date', v ?? '')
                                    }
                                    placeholder="Pilih tanggal mulai"
                                    required
                                />
                                <InputError message={errors.start_date} />
                            </div>
                        </div>

                        {/* Nominal (1 row) */}
                        <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    Biaya Sewa (Rp){' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    placeholder="cth. 1.200.000"
                                    value={data.rent_rupiah}
                                    onChange={(e) =>
                                        setData('rent_rupiah', e.target.value)
                                    }
                                    className="h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pratinjau: {formatRupiah(data.rent_rupiah)}
                                </p>
                                <InputError message={errors.rent_cents} />
                            </div>

                            <div className="space-y-2">
                                <Label>Deposit (Rp)</Label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    placeholder="cth. 500.000 (opsional)"
                                    value={data.deposit_rupiah}
                                    onChange={(e) =>
                                        setData(
                                            'deposit_rupiah',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pratinjau:{' '}
                                    {formatRupiah(data.deposit_rupiah)}
                                </p>
                                <InputError message={errors.deposit_cents} />
                            </div>
                        </div>


                        <div className="space-y-2 md:col-span-2">
                            <Label>Catatan Kontrak</Label>
                            <Textarea
                                value={data.notes ?? ''}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                placeholder="Opsional: tambahkan aturan khusus, kondisi kamar, kebijakan listrik/air, dsb."
                                className="min-h-[96px]"
                            />
                            <InputError message={errors.notes} />
                        </div>

                        {/* Pembayaran & Auto-renew (rapat tapi nyaman) */}
                        {data.billing_period === 'monthly' && (
                            <div className="space-y-3 md:col-span-2">
                                <div className="space-y-2">
                                    <Label>Pembayaran</Label>
                                    <RadioGroup
                                        value={data.monthly_payment_mode}
                                        onValueChange={(v) =>
                                            setData(
                                                'monthly_payment_mode',
                                                v as 'per_month' | 'full',
                                            )
                                        }
                                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                id="pay_per_month"
                                                value="per_month"
                                            />
                                            <Label
                                                htmlFor="pay_per_month"
                                                className="font-normal"
                                            >
                                                Per bulan
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                id="pay_full"
                                                value="full"
                                            />
                                            <Label
                                                htmlFor="pay_full"
                                                className="font-normal"
                                            >
                                                Lunas (bayar penuh)
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    <InputError
                                        message={errors.monthly_payment_mode}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="auto_renew"
                                        checked={data.auto_renew}
                                        onCheckedChange={(v) => {
                                            setAutoRenewAuto(false);
                                            setData('auto_renew', Boolean(v));
                                        }}
                                    />
                                    <Label htmlFor="auto_renew">
                                        Auto‑renew kontrak
                                    </Label>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-sm text-muted-foreground">
                    Tidak menemukan penyewa? Silakan daftarkan pengguna terlebih
                    dahulu di halaman{' '}
                    <Link
                        href={route('management.users.index')}
                        className="underline"
                    >
                        Manajemen Pengguna
                    </Link>
                    .
                </p>

                <div className="flex gap-2">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => history.back()}
                    >
                        Batal
                    </Button>
                </div>
            </form>

            <ContractPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                data={data}
                tenantOptions={tenantOptions}
                roomOptions={roomOptions}
                periodLabel={selectedPeriod?.label ?? data.billing_period}
                formatRupiah={formatRupiah}
                processing={processing}
                onConfirm={handleConfirmSubmit}
            />

            <LeaveGuardDialog
                open={guard.open}
                onOpenChange={guard.setOpen}
                onConfirm={guard.proceed}
                onCancel={guard.cancel}
            />
        </AuthLayout>
    );
}

function ContractGuideDialog({ prorata = false }: { prorata?: boolean }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    Panduan & Ketentuan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Panduan & Ketentuan Kontrak</DialogTitle>
                    <DialogDescription>
                        Ringkasan aturan penting dan tips pengisian agar kontrak
                        rapi dan minim salah input.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] px-3">
                    <div className="space-y-5 text-sm">
                        {/* Alur Singkat */}
                        <div className="rounded-md border bg-muted/30 p-4">
                            <div className="mb-2 flex items-center gap-2 font-medium">
                                <Info className="size-4" /> Alur Singkat
                            </div>
                            <ol className="ml-5 list-decimal space-y-1">
                                <li>
                                    Pilih <strong>penyewa</strong> dan{' '}
                                    <strong>kamar</strong>.
                                </li>
                                <li>
                                    Atur <strong>periode tagihan</strong>,{' '}
                                    <strong>durasi</strong>, &{' '}
                                    <strong>tanggal mulai</strong>.
                                </li>
                                <li>
                                    Sistem otomatis mengisi{' '}
                                    <em>tanggal berakhir</em> &{' '}
                                    <em>tanggal penagihan</em> (terkunci).
                                </li>
                                <li>
                                    Isi <strong>biaya sewa</strong> &{' '}
                                    <strong>deposit</strong> (cek pratinjau
                                    rupiah).
                                </li>
                                <li>
                                    Tentukan <strong>metode pembayaran</strong>:
                                    <span className="block">
                                        • <strong>Bulanan</strong>: pilih{' '}
                                        <em>Per bulan</em> atau <em>Lunas</em>.
                                    </span>
                                    <span className="block">
                                        • <strong>Mingguan/Harian</strong>:
                                        otomatis <em>Lunas</em>.
                                    </span>
                                </li>
                                <li>
                                    Opsional: aktifkan{' '}
                                    <strong>Auto‑renew</strong> untuk perpanjang
                                    otomatis.
                                </li>
                            </ol>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Deposit */}
                            <div className="rounded-md border p-4">
                                <div className="mb-1 flex items-center gap-2 font-medium">
                                    <ShieldCheck className="size-4" /> Deposit
                                </div>
                                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                    <li>
                                        Uang jaminan, <em>bukan</em> pembayaran
                                        sewa.
                                    </li>
                                    <li>
                                        Dikembalikan saat kontrak berakhir
                                        sesuai kondisi & aturan.
                                    </li>
                                    <li>
                                        Dapat dipakai menutup
                                        kerusakan/tunggakan bila kebijakan
                                        mengizinkan.
                                    </li>
                                </ul>
                            </div>

                            {/* Pembayaran */}
                            <div className="rounded-md border p-4">
                                <div className="mb-1 flex items-center gap-2 font-medium">
                                    <ShieldCheck className="size-4" />{' '}
                                    Pembayaran
                                </div>
                                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                    <li>
                                        Periode <strong>Bulanan</strong>: pilih{' '}
                                        <em>Per bulan</em> (ditagih tiap bulan)
                                        atau <em>Lunas</em> (bayar penuh di
                                        awal).
                                    </li>
                                    <li>
                                        Periode <strong>Mingguan</strong> &{' '}
                                        <strong>Harian</strong>: wajib{' '}
                                        <em>Lunas</em> (bayar penuh di awal).
                                    </li>
                                    <li>
                                        Pilihan pembayaran ini{' '}
                                        <strong>mempengaruhi invoice</strong>:
                                        <span className="block">
                                            • <em>Per bulan</em> ➜ invoice
                                            diterbitkan setiap bulan sesuai
                                            siklus.
                                        </span>
                                        <span className="block">
                                            • <em>Lunas</em> ➜ satu invoice di
                                            awal kontrak.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* Auto‑renew */}
                            <div className="rounded-md border p-4">
                                <div className="mb-1 flex items-center gap-2 font-medium">
                                    <RefreshCw className="size-4" /> Auto‑renew
                                    Kontrak
                                </div>
                                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                    <li>
                                        Perpanjang otomatis di akhir periode.
                                    </li>
                                    <li>
                                        Default aktif untuk{' '}
                                        <strong>Bulanan</strong>; non‑aktif
                                        untuk <strong>Mingguan/Harian</strong>.
                                    </li>
                                    <li>
                                        Bisa diubah kapan saja lewat checkbox.
                                    </li>
                                </ul>
                            </div>

                            {/* Tanggal */}
                            <div className="rounded-md border p-4">
                                <div className="mb-1 flex items-center gap-2 font-medium">
                                    <CalendarClock className="size-4" /> Tanggal
                                    Penagihan & Berakhir
                                </div>
                                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                    <li>
                                        Otomatis dari{' '}
                                        <em>tanggal mulai + periode</em>.
                                    </li>
                                    {prorata ? (
                                        <>
                                            <li>
                                                <strong>Prorata aktif</strong>:
                                                tanggal berakhir & tanggal
                                                penagihan dapat menyesuaikan
                                                secara proporsional pada periode
                                                pertama.
                                            </li>
                                            <li>
                                                Penagihan pertama mengikuti
                                                kebijakan prorata; periode
                                                berikutnya mengikuti siklus
                                                normal.
                                            </li>
                                        </>
                                    ) : (
                                        <li>
                                            Tidak ada <em>prorata</em>; tanggal
                                            penagihan mengikuti tanggal mulai
                                            berikutnya (≈ 30 hari untuk
                                            bulanan).
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <Separator />

                        {/* Tips ringkas */}
                        <div className="rounded-md border bg-muted/20 p-4">
                            <div className="mb-2 font-medium">Tips</div>
                            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                <li>
                                    Label kamar menampilkan nomor / nama, dan
                                    lokasi di deskripsi.
                                </li>
                                <li>
                                    Cek pratinjau rupiah untuk menghindari salah
                                    ketik nominal besar.
                                </li>
                                <li>
                                    Gunakan catatan kontrak untuk aturan khusus
                                    (listrik/air, kondisi kamar, dsb.).
                                </li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            (document.activeElement as HTMLElement)?.blur?.()
                        }
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ContractPreviewDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    data: FormData & FormLocal;
    tenantOptions: SearchOption[];
    roomOptions: SearchOption[];
    periodLabel: string;
    formatRupiah: (val: string) => string;
    processing: boolean;
    onConfirm: () => void;
}) {
    const {
        open,
        onOpenChange,
        data,
        tenantOptions,
        roomOptions,
        periodLabel,
        formatRupiah,
        processing,
        onConfirm,
    } = props;
    const [confirmChecked, setConfirmChecked] = React.useState(false);

    React.useEffect(() => {
        if (open) setConfirmChecked(false);
    }, [open]);

    const tenant = tenantOptions.find((t) => t.value === data.user_id);
    const room = roomOptions.find((r) => r.value === data.room_id);
    const tenantInitial = (tenant?.label || '?').slice(0, 1).toUpperCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Data Kontrak</DialogTitle>
                    <DialogDescription>
                        Tinjau kembali data. Pastikan semua informasi sudah
                        benar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Penyewa */}
                    <div className="flex items-center gap-3 rounded-md border p-3">
                        <Avatar className="size-10">
                            <AvatarFallback className="text-sm font-medium">
                                {tenantInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                                {tenant?.label ?? 'Penyewa belum dipilih'}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {tenant?.description || '-'}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Badge variant="secondary">Pengguna</Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Rincian Kontrak */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">
                            Rincian Kontrak
                        </div>
                        <div className="grid grid-cols-1 items-stretch gap-3 text-sm sm:grid-cols-2">
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Kamar
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={room?.label ?? '-'}
                                >
                                    {room?.label ?? '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Lokasi
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={room?.description || '-'}
                                >
                                    {room?.description || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Periode
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={periodLabel}
                                >
                                    {periodLabel}
                                </span>
                            </div>
                            {/* Payment mode tile */}
                            {(data.billing_period === 'monthly' ||
                                data.billing_period === 'weekly' ||
                                data.billing_period === 'daily') && (
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Pembayaran
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={
                                            data.billing_period === 'monthly'
                                                ? data.monthly_payment_mode ===
                                                  'full'
                                                    ? 'Lunas'
                                                    : 'Per bulan'
                                                : 'Lunas'
                                        }
                                    >
                                        {data.billing_period === 'monthly'
                                            ? data.monthly_payment_mode ===
                                              'full'
                                                ? 'Lunas'
                                                : 'Per bulan'
                                            : 'Lunas'}
                                    </span>
                                </div>
                            )}
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Penagihan
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.billing_day || '-'}
                                >
                                    {data.billing_day || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Mulai
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.start_date || '-'}
                                >
                                    {data.start_date || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Berakhir
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.end_date || '-'}
                                >
                                    {data.end_date || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Biaya Sewa
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={formatRupiah(data.rent_rupiah)}
                                >
                                    {formatRupiah(data.rent_rupiah)}
                                </span>
                            </div>
                            {/* Deposit & Auto-renew row */}
                            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Deposit
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={formatRupiah(
                                            data.deposit_rupiah,
                                        )}
                                    >
                                        {formatRupiah(data.deposit_rupiah)}
                                    </span>
                                </div>
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Auto-renew
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={
                                            data.auto_renew
                                                ? 'Aktif'
                                                : 'Nonaktif'
                                        }
                                    >
                                        {data.auto_renew ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {data.notes ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Catatan</div>
                            <div className="rounded-md border bg-muted/20 p-3 text-sm">
                                {data.notes}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="confirm"
                            checked={confirmChecked}
                            onCheckedChange={(v) =>
                                setConfirmChecked(Boolean(v))
                            }
                        />
                        <Label htmlFor="confirm" className="text-sm">
                            Saya telah memeriksa dan memastikan data di atas
                            sudah benar.
                        </Label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!confirmChecked || processing}
                        >
                            Simpan
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
