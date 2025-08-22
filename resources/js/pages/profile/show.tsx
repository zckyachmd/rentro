import ShowMore from '@/components/show-more';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AuthLayout from '@/layouts/auth-layout';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, ShieldCheck } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import ContactSection, { ContactDTO } from './partials/contact';

type UserDTO = {
    id: number;
    name?: string;
    username?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    gender?: 'male' | 'female' | null;
    dob?: string | null;
    created_at?: string;
    email_verified_at?: string | null;
};

type AddressDTO = {
    id: number;
    label?: string | null;
    address_line: string;
    village?: string | null;
    district?: string | null;
    city: string;
    province: string;
    postal_code?: string | null;
    country: string;
    is_primary: boolean;
};

type DocumentDTO = {
    id: number;
    type: 'KTP' | 'SIM' | 'PASSPORT' | 'NPWP' | 'other';
    number?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    file_path?: string | null;
    verified_at?: string | null;
};

type PageProps = {
    user: UserDTO;
    addresses: AddressDTO[];
    document: DocumentDTO | null;
    contacts: ContactDTO[];
    mustVerifyEmail: boolean;
    status?: string | null;
    preferences: Record<string, unknown>;
    options: {
        documentTypes: string[];
        documentStatuses: string[];
    };
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '-');

export default function ShowProfile() {
    const { props } = usePage<PageProps>();
    const { user, addresses, document, contacts, mustVerifyEmail, options } =
        props;

    const rowCls =
        'flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4';
    const dtCls = 'w-36 md:w-40 shrink-0 font-medium text-muted-foreground';

    const primaryAddress =
        addresses.find((a) => a.is_primary) || addresses[0] || null;

    const joinedAddress = primaryAddress
        ? [
              primaryAddress.address_line,
              primaryAddress.village,
              primaryAddress.district,
              primaryAddress.city,
              primaryAddress.province,
              primaryAddress.postal_code,
          ]
              .filter(Boolean)
              .join(', ')
        : '';

    const [verifyOpen, setVerifyOpen] = React.useState(false);
    const [sending, setSending] = React.useState(false);

    const handleResendVerification = () => {
        setSending(true);
        router.post(
            route('verification.send'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Email verifikasi telah dikirim.');
                    setVerifyOpen(false);
                },
                onError: () => {
                    toast.error('Gagal mengirim email verifikasi. Coba lagi.');
                },
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <AuthLayout
            pageTitle="Profil"
            pageDescription="Ringkasan data akun. Untuk mengubah, gunakan tombol Edit per bagian."
        >
            <div className="space-y-8 md:space-y-8">
                {/* Profile Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-6 md:gap-10 lg:gap-12">
                        <Avatar className="size-20 md:size-28 lg:size-32">
                            <AvatarImage
                                src={user.avatar_url || undefined}
                                alt={user.name}
                            />
                            <AvatarFallback>
                                {user.name
                                    ? user.name
                                          .match(/\b\w/g)
                                          ?.join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                    : 'US'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                                {user.name}
                            </h1>
                            <p className="text-sm text-muted-foreground md:text-base">
                                @{user.username || 'username'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                            <a href={route('profile.edit')}>Edit Profil</a>
                        </Button>
                    </div>
                </div>

                {/* Informasi Akun */}
                <section>
                    <h2 className="text-xl font-semibold">Informasi Akun</h2>
                    <Separator className="mb-6 mt-2" />
                    <dl className="divide-y divide-muted/20">
                        {/* Email */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Email</dt>
                            <dd className="flex items-center gap-2 text-base">
                                <span>{user.email}</span>
                                {mustVerifyEmail ? (
                                    <>
                                        <Badge
                                            variant="secondary"
                                            className="gap-1"
                                        >
                                            <CircleAlert className="h-3 w-3" />{' '}
                                            Belum terverifikasi
                                        </Badge>
                                        <Dialog
                                            open={verifyOpen}
                                            onOpenChange={setVerifyOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7"
                                                >
                                                    Kirim Ulang
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="animate-none">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Kirim ulang email
                                                        verifikasi?
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Kami akan mengirim email
                                                        verifikasi ke{' '}
                                                        <span className="font-medium">
                                                            {user.email}
                                                        </span>
                                                        .
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setVerifyOpen(false)
                                                        }
                                                        disabled={sending}
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        onClick={
                                                            handleResendVerification
                                                        }
                                                        disabled={sending}
                                                    >
                                                        {sending
                                                            ? 'Mengirim…'
                                                            : 'Kirim email verifikasi'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                ) : (
                                    <Badge className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" />{' '}
                                        Terverifikasi
                                    </Badge>
                                )}
                            </dd>
                        </div>

                        {/* Telepon */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Telepon</dt>
                            <dd className="text-base">{user.phone || '-'}</dd>
                        </div>

                        {/* Jenis Kelamin */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Jenis Kelamin</dt>
                            <dd>
                                {user.gender ? (
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {user.gender}
                                    </Badge>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>

                        {/* Tanggal Lahir */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Tanggal Lahir</dt>
                            <dd className="text-base">{fmt(user.dob)}</dd>
                        </div>

                        {/* Alamat */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Alamat</dt>
                            <dd className="text-base leading-relaxed text-muted-foreground">
                                {primaryAddress ? (
                                    <ShowMore
                                        text={joinedAddress}
                                        limit={140}
                                    />
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>

                        {/* Identitas (digabung & berdekatan) */}
                        <div className={rowCls}>
                            <dt className={dtCls}>Identitas</dt>
                            <dd className="text-base">
                                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Jenis
                                        </span>
                                        <span className="capitalize">
                                            {document
                                                ? (options.documentTypes.find(
                                                      (t) =>
                                                          t === document.type,
                                                  ) ?? document.type)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Nomor
                                        </span>
                                        <span className="font-mono text-xs">
                                            {document?.number || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Status
                                        </span>
                                        <span>
                                            {document ? (
                                                document.status ===
                                                'approved' ? (
                                                    <Badge className="gap-1">
                                                        <ShieldCheck className="h-3 w-3" />{' '}
                                                        Disetujui
                                                    </Badge>
                                                ) : document.status ===
                                                  'pending' ? (
                                                    <Badge variant="secondary">
                                                        Menunggu
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Ditolak
                                                    </Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Kontak Darurat */}
                <ContactSection contacts={contacts} />
            </div>
        </AuthLayout>
    );
}
