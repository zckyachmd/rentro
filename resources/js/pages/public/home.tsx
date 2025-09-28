import {
    Building2,
    CalendarCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Mail,
    MessageSquare,
    Quote,
    Search,
    ShieldCheck,
    Star,
    Tag,
} from 'lucide-react';
import React from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PublicLayout } from '@/layouts';

export default function PublicHome() {
    // ----- State & Refs -----
    const roomsScroll = React.useRef<HTMLDivElement | null>(null);
    const testiScroll = React.useRef<HTMLDivElement | null>(null);

    const scrollByRef = (
        ref: React.RefObject<HTMLDivElement | null>,
        dir: 'left' | 'right',
        amount = 320,
    ) => {
        const el = ref.current;
        if (!el) return;
        const delta = dir === 'left' ? -amount : amount;
        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollBy({
            left: delta,
            behavior: prefersReduced ? 'auto' : 'smooth',
        });
    };

    // ----- Data (mock) -----
    type Room = {
        name: string;
        slug: string;
        price: string;
        amenities: string[];
        originalPrice?: string;
        promoPrice?: string;
    };
    type Promo = { title: string; slug: string; until: string };

    const allRooms: Room[] = [
        {
            name: 'Single Hemat',
            slug: 'single-hemat',
            price: 'Rp 1.400.000 / bulan',
            amenities: ['WiFi', 'KM Luar', 'Parkir'],
        },
        {
            name: 'Single KM Dalam',
            slug: 'single-km-dalam',
            price: 'Rp 1.700.000 / bulan',
            amenities: ['AC', 'WiFi', 'KM Dalam'],
        },
        {
            name: 'Deluxe Single',
            slug: 'deluxe-single',
            price: 'Rp 2.100.000 / bulan',
            originalPrice: 'Rp 2.100.000 / bulan',
            promoPrice: 'Rp 1.890.000 / bulan',
            amenities: ['AC', 'WiFi', 'Lemari'],
        },
        {
            name: 'Couple Room',
            slug: 'couple-room',
            price: 'Rp 2.400.000 / bulan',
            originalPrice: 'Rp 2.400.000 / bulan',
            promoPrice: 'Rp 2.250.000 / bulan',
            amenities: ['AC', 'WiFi', 'KM Dalam'],
        },
        {
            name: 'Deluxe View',
            slug: 'deluxe-view',
            price: 'Rp 2.300.000 / bulan',
            amenities: ['AC', 'WiFi', 'Balkon'],
        },
        {
            name: 'Single Compact',
            slug: 'single-compact',
            price: 'Rp 1.550.000 / bulan',
            originalPrice: 'Rp 1.550.000 / bulan',
            promoPrice: 'Rp 1.450.000 / bulan',
            amenities: ['WiFi', 'Meja Belajar'],
        },
        {
            name: 'Single Corner',
            slug: 'single-corner',
            price: 'Rp 1.600.000 / bulan',
            amenities: ['WiFi', 'Jendela Besar'],
        },
        {
            name: 'Deluxe Corner',
            slug: 'deluxe-corner',
            price: 'Rp 2.250.000 / bulan',
            amenities: ['AC', 'WiFi', 'Balkon'],
        },
        {
            name: 'Studio Mini',
            slug: 'studio-mini',
            price: 'Rp 2.700.000 / bulan',
            amenities: ['AC', 'WiFi', 'Pantry'],
        },
        {
            name: 'Economy',
            slug: 'economy',
            price: 'Rp 1.300.000 / bulan',
            amenities: ['WiFi'],
        },
    ];

    const promos: Promo[] = [
        { title: 'Deluxe Hemat 10%', slug: 'deluxe-single', until: '31 Okt' },
        { title: 'Couple Spesial', slug: 'couple-room', until: '15 Nov' },
        {
            title: 'Single Compact Deal',
            slug: 'single-compact',
            until: '30 Sep',
        },
    ];

    const getDiscountPercent = (room: Room): string | null => {
        if (!room.originalPrice || !room.promoPrice) return null;
        const o = parseInt(room.originalPrice.replace(/[^0-9]/g, ''), 10);
        const p = parseInt(room.promoPrice.replace(/[^0-9]/g, ''), 10);
        if (!o || !p || p >= o) return null;
        const pct = Math.round(((o - p) / o) * 100);
        return `-${pct}%`;
    };

    // ----- View -----
    return (
        <PublicLayout
            seo={{
                description:
                    'Rentro membantu kamu menemukan kost nyaman dari brand tepercaya. Proses jelas dari pencarian hingga check‑in, pembayaran aman & transparan.',
                keywords: [
                    'kost',
                    'sewa kamar',
                    'kos-kosan',
                    'kost nyaman',
                    'rentro',
                ],
                canonical: '/',
            }}
        >
            <a
                href="#main-content"
                className="focus:bg-background sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:shadow"
            >
                Lewati ke konten utama
            </a>
            {/* 1) HERO */}
            <section
                id="main-content"
                className="mx-auto flex min-h-[56svh] max-w-6xl flex-col items-center justify-center gap-4 px-4 py-10 text-center md:gap-6 md:py-16"
            >
                <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl md:mb-4 md:text-5xl">
                    Kost Terverifikasi — Aman & Nyaman
                </h1>
                <p className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg">
                    Pembayaran dikelola oleh Rentro dengan perlindungan
                    berlapis. Proses jelas dari pencarian hingga check‑in —
                    tanpa perantara.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg">
                        <a
                            href={route('public.catalog')}
                            className="inline-flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Lihat Kamar
                        </a>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <a
                            href={route('public.promos')}
                            className="inline-flex items-center gap-2"
                        >
                            <Tag className="h-4 w-4" />
                            Cek Promo
                        </a>
                    </Button>
                </div>
            </section>

            {/* 2) KAMAR TERSEDIA */}
            <section
                id="available-rooms"
                className="mt-6"
                aria-labelledby="rooms-heading"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2
                            id="rooms-heading"
                            className="text-xl font-semibold tracking-tight"
                        >
                            Kamar Tersedia
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Geser untuk melihat contoh kamar. Klik “Lihat semua”
                            untuk katalog lengkap.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost">
                            <a href={route('public.catalog')}>Lihat semua</a>
                        </Button>
                        <Button
                            aria-label="Scroll kiri"
                            size="icon"
                            variant="outline"
                            onClick={() => scrollByRef(roomsScroll, 'left')}
                            aria-controls="rooms-scroller"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            aria-label="Scroll kanan"
                            size="icon"
                            variant="outline"
                            onClick={() => scrollByRef(roomsScroll, 'right')}
                            aria-controls="rooms-scroller"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* (Promo strip removed; promos now only as badges on cards) */}

                <div className="w-full">
                    <ScrollArea
                        viewportRef={roomsScroll}
                        className="pb-2"
                        showHorizontal
                    >
                        <div
                            id="rooms-scroller"
                            role="region"
                            aria-roledescription="carousel"
                            aria-label="Daftar kamar tersedia"
                            aria-live="off"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') {
                                    e.preventDefault();
                                    scrollByRef(roomsScroll, 'right');
                                }
                                if (e.key === 'ArrowLeft') {
                                    e.preventDefault();
                                    scrollByRef(roomsScroll, 'left');
                                }
                            }}
                            className="flex snap-x snap-mandatory gap-4"
                        >
                            {allRooms.map((room, idx) => {
                                const promo = promos.find(
                                    (p) => p.slug === room.slug,
                                );
                                return (
                                    <a
                                        key={room.slug}
                                        href={`${route('public.catalog')}?highlight=${room.slug}`}
                                        data-room-slug={room.slug}
                                        role="group"
                                        aria-roledescription="slide"
                                        aria-posinset={idx + 1}
                                        aria-setsize={allRooms.length}
                                        className="focus-visible:ring-primary/50 focus-visible:ring-offset-background min-w-[260px] snap-start rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-w-[280px]"
                                        aria-label={`${room.name} — ${room.promoPrice ? `${room.promoPrice} (harga promo, dari ${room.originalPrice})` : room.price}`}
                                    >
                                        <Card className="focus-visible:ring-primary/50 h-full transition hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none">
                                            <div className="relative h-40 w-full overflow-hidden rounded-b-none">
                                                <div className="bg-muted absolute inset-0" />
                                                <div className="bg-background/80 absolute top-2 left-2 max-w-[calc(100%-1rem)] rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur">
                                                    {room.promoPrice ? (
                                                        <span className="flex items-baseline gap-2">
                                                            <span className="text-muted-foreground text-[10px] line-through">
                                                                {
                                                                    room.originalPrice
                                                                }
                                                            </span>
                                                            <span className="text-xs font-semibold">
                                                                {
                                                                    room.promoPrice
                                                                }
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="whitespace-nowrap">
                                                            {room.price}
                                                        </span>
                                                    )}
                                                </div>
                                                {promo && (
                                                    <div className="bg-background/80 absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                                                        {getDiscountPercent(
                                                            room,
                                                        ) && (
                                                            <span className="mr-1">
                                                                {getDiscountPercent(
                                                                    room,
                                                                )}
                                                            </span>
                                                        )}
                                                        <span>
                                                            {promo.title} · s/d{' '}
                                                            {promo.until}
                                                        </span>
                                                        <span className="sr-only">
                                                            Diskon{' '}
                                                            {getDiscountPercent(
                                                                room,
                                                            ) ?? ''}{' '}
                                                            berlaku sampai{' '}
                                                            {promo.until}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader className="space-y-1">
                                                <CardTitle className="text-base">
                                                    {room.name}
                                                </CardTitle>
                                                <div className="text-muted-foreground text-[11px]">
                                                    Contoh tipe kamar
                                                    {promo
                                                        ? ' • Promo aktif'
                                                        : ''}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {room.amenities.map(
                                                        (a: string) => (
                                                            <Badge
                                                                key={a}
                                                                variant="outline"
                                                            >
                                                                {a}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </a>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </section>

            {/* 4) CARA KERJA (lebih menjual) */}
            <section id="how-it-works" className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">
                    Mulai dalam 4 Langkah
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Semua jelas dari awal—tanpa ribet, tanpa biaya tersembunyi.
                </p>

                <div className="mt-6 md:border-l md:pl-6">
                    {[
                        {
                            num: '1',
                            title: 'Cari',
                            icon: <Search className="h-4 w-4" aria-hidden />,
                            desc: 'Gunakan filter lokasi, tipe kamar, dan budget. Hanya tampilkan listing terverifikasi dari pemilik/mitra.',
                            bullets: [
                                'Hasil real‑time',
                                'Info fasilitas & aturan lengkap',
                            ],
                        },
                        {
                            num: '2',
                            title: 'Cocokkan',
                            icon: <Building2 className="h-4 w-4" aria-hidden />,
                            desc: 'Baca detail & foto nyata. Pastikan cocok — bisa chat langsung untuk hal yang belum jelas.',
                            bullets: ['Tanpa perantara', 'Respons cepat'],
                        },
                        {
                            num: '3',
                            title: 'Booking',
                            icon: (
                                <CalendarCheck
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                            ),
                            desc: 'Atur jadwal visit atau pesan dengan pembayaran yang terproteksi. Semua biaya terlihat jelas sejak awal.',
                            bullets: [
                                'Pembayaran transparan',
                                'Bukti otomatis',
                            ],
                        },
                        {
                            num: '4',
                            title: 'Check‑in',
                            icon: (
                                <ShieldCheck className="h-4 w-4" aria-hidden />
                            ),
                            desc: 'Tandatangani kontrak digital, ambil kunci, dan mulai tinggal. Dukungan tetap tersedia bila dibutuhkan.',
                            bullets: ['Kontrak digital', 'Dukungan cepat'],
                        },
                    ].map((step, idx) => (
                        <div
                            key={step.num}
                            className={`relative rounded-lg px-4 py-5 md:px-6 md:py-6 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}
                        >
                            <div className="grid grid-cols-[2rem_1fr] items-start gap-3 md:gap-4">
                                <div className="bg-muted grid h-9 w-9 place-items-center rounded-full text-sm font-medium shadow-inner">
                                    {step.num}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-medium">
                                        {step.icon}
                                        <span>{step.title}</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {step.desc}
                                    </p>
                                    <ul className="text-muted-foreground list-disc pl-5 text-sm">
                                        {step.bullets.map((b) => (
                                            <li key={b}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4.1) KEUNGGULAN */}
            <section id="advantages" className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">
                    Kenapa memilih Rentro?
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Tiga hal yang kami jaga agar pengalamanmu aman dan nyaman.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-background rounded-lg border p-4">
                        <div className="flex items-center gap-2 font-medium">
                            <CreditCard className="h-4 w-4" /> Pembayaran
                            Terproteksi
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Proses pembayaran ditangani oleh sistem kami dengan
                            perlindungan berlapis dan notifikasi yang jelas.
                        </p>
                    </div>
                    <div className="bg-background rounded-lg border p-4">
                        <div className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Listing
                            Terverifikasi
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Hanya menampilkan data yang telah diverifikasi
                            bersama pemilik/mitra, lengkap dengan aturan &
                            fasilitas.
                        </p>
                    </div>
                    <div className="bg-background rounded-lg border p-4">
                        <div className="flex items-center gap-2 font-medium">
                            <MessageSquare className="h-4 w-4" /> Dukungan Cepat
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Tim kami siap membantu jika ada pertanyaan terkait
                            jadwal visit, kontrak digital, atau hal teknis
                            lainnya.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3) TESTIMONIALS */}
            <section
                id="testimonials"
                className="relative mt-12"
                aria-labelledby="testimonials-heading"
            >
                {/* fade edges */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2
                            id="testimonials-heading"
                            className="text-xl font-semibold tracking-tight"
                        >
                            Testimoni Penghuni
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Cerita singkat dari penghuni yang puas.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            aria-label="Scroll kiri testimoni"
                            size="icon"
                            variant="outline"
                            onClick={() => scrollByRef(testiScroll, 'left')}
                            aria-controls="testimonials-scroller"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            aria-label="Scroll kanan testimoni"
                            size="icon"
                            variant="outline"
                            onClick={() => scrollByRef(testiScroll, 'right')}
                            aria-controls="testimonials-scroller"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="w-full">
                    <ScrollArea
                        viewportRef={testiScroll}
                        className="pb-2"
                        showHorizontal
                    >
                        <div
                            id="testimonials-scroller"
                            role="region"
                            aria-roledescription="carousel"
                            aria-label="Testimoni penghuni"
                            aria-live="off"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') {
                                    e.preventDefault();
                                    scrollByRef(testiScroll, 'right');
                                }
                                if (e.key === 'ArrowLeft') {
                                    e.preventDefault();
                                    scrollByRef(testiScroll, 'left');
                                }
                            }}
                            className="flex snap-x snap-mandatory gap-4"
                        >
                            {[
                                {
                                    name: 'Nadia',
                                    role: 'Mahasiswi',
                                    quote: 'Kamarnya bersih, pemilik ramah, dan responsnya cepat banget. Nyaman belajar!',
                                    rating: 5,
                                },
                                {
                                    name: 'Rizky',
                                    role: 'Karyawan',
                                    quote: 'Lokasi strategis, dekat transportasi. Proses booking dan pembayaran jelas.',
                                    rating: 5,
                                },
                                {
                                    name: 'Sinta',
                                    role: 'Freelancer',
                                    quote: 'Fasilitas sesuai deskripsi. Suasana tenang, cocok untuk kerja dari rumah.',
                                    rating: 4,
                                },
                                {
                                    name: 'Arif',
                                    role: 'Fresh Graduate',
                                    quote: 'Ownernya helpful. Proses pindahan rapi dan cepat.',
                                    rating: 5,
                                },
                                {
                                    name: 'Dina',
                                    role: 'Perawat',
                                    quote: 'Dekat rumah sakit dan lingkungan aman. Tidur jadi lebih tenang.',
                                    rating: 5,
                                },
                                {
                                    name: 'Yoga',
                                    role: 'Desainer',
                                    quote: 'Internet kencang, cocok banget buat WFH dan upload file besar.',
                                    rating: 4,
                                },
                                {
                                    name: 'Maya',
                                    role: 'Akuntan',
                                    quote: 'Kontrak digitalnya simple dan jelas. Pembayaran juga fleksibel.',
                                    rating: 5,
                                },
                                {
                                    name: 'Bima',
                                    role: 'Programmer',
                                    quote: 'Check-in cepat. Support responsif kalau ada kendala kecil.',
                                    rating: 5,
                                },
                                {
                                    name: 'Lala',
                                    role: 'Content Creator',
                                    quote: 'Pencahayaan kamar bagus. Enak buat shooting konten.',
                                    rating: 4,
                                },
                            ].map((t, i, arr) => (
                                <Card
                                    key={t.name}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-posinset={i + 1}
                                    aria-setsize={arr.length}
                                    className="max-w-[300px] min-w-[300px] snap-start"
                                >
                                    <CardContent className="flex h-[180px] flex-col justify-between py-5">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage
                                                        src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(t.name)}`}
                                                        alt={t.name}
                                                        className="grayscale"
                                                    />
                                                    <AvatarFallback>
                                                        {t.name.slice(0, 1)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {t.name}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {t.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-foreground mt-3 text-sm">
                                                <Quote
                                                    className="mr-1 inline h-3 w-3 opacity-60"
                                                    aria-hidden
                                                />
                                                “{t.quote}”
                                            </p>
                                        </div>
                                        <div
                                            className="flex items-center gap-1 text-amber-500"
                                            role="img"
                                            aria-label={`Rating ${t.rating} dari 5`}
                                        >
                                            {Array.from({ length: 5 }).map(
                                                (_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < t.rating ? '' : 'opacity-30'}`}
                                                        aria-hidden
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </section>

            {/* 4.2) FAQ (Accordion + Vertical Scroll Area) */}
            <section id="faq" className="mt-12" aria-labelledby="faq-heading">
                <h2
                    id="faq-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    Pertanyaan Umum
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Jawaban singkat untuk hal yang sering ditanyakan.
                </p>

                <ScrollArea className="mt-4 max-h-80 rounded-lg border">
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full px-0.5"
                    >
                        {[
                            {
                                q: 'Apakah pembayaran aman?',
                                a: 'Ya. Pembayaran dikelola oleh sistem Rentro dengan perlindungan berlapis dan bukti otomatis.',
                            },
                            {
                                q: 'Siapa yang saya hubungi jika ingin visit?',
                                a: 'Kamu dapat mengatur jadwal visit melalui halaman katalog atau menghubungi tim Rentro untuk dibantu.',
                            },
                            {
                                q: 'Apa semua listing milik Rentro?',
                                a: 'Tidak. Kami bekerja sama dengan pemilik/mitra. Sebagian properti dikelola langsung oleh tim kami.',
                            },
                            {
                                q: 'Bagaimana jika ada perubahan jadwal?',
                                a: 'Hubungi tim Rentro atau pemilik/mitra terkait pada detail kamar. Kami bantu atur ulang jika memungkinkan.',
                            },
                            {
                                q: 'Kontraknya seperti apa?',
                                a: 'Kontrak digital sederhana dengan poin-poin penting yang transparan dan mudah dipahami.',
                            },
                        ].map((item, i) => (
                            <AccordionItem key={item.q} value={`item-${i + 1}`}>
                                <AccordionTrigger className="hover:bg-muted/40 px-4 text-left transition">
                                    {item.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground px-4 pb-4 text-sm">
                                    {item.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </section>

            {/* 5) CTA */}
            <section id="contact-cta" className="mt-6">
                <div className="bg-card rounded-lg border p-6">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Butuh bantuan? Kami siap membantu.
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Tim profesional Rentro siap menjawab
                                pertanyaanmu seputar ketersediaan kamar, jadwal
                                visit, dan pembayaran yang aman.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild>
                                <a
                                    href={route('public.contact')}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Mail className="h-4 w-4" />
                                    Hubungi Tim Rentro
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
