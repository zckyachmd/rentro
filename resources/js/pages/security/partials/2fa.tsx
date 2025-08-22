import ConfirmPasswordDialog, {
    useConfirmPasswordModal,
} from '@/components/confirm-password';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { router, useForm } from '@inertiajs/react';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Summary = {
    email_verified?: boolean;
    two_factor_enabled?: boolean;
    last_password_changed_at?: string | null;
};

type TwoFactorTabProps = { summary: Summary };

export default function TwoFactorTab({ summary }: TwoFactorTabProps) {
    const enable2faForm = useForm({});
    const disable2faForm = useForm({});
    const confirm2faForm = useForm<{ code: string }>({ code: '' });

    const [enrolling, setEnrolling] = useState(false);
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [showRecovery, setShowRecovery] = useState(false);
    const [manualSecret, setManualSecret] = useState<string | null>(null);

    const { open, setOpen, openConfirm, handleConfirmed } =
        useConfirmPasswordModal();
    const confirmGuard = openConfirm;

    const onStart2FA = () => {
        setEnrolling(true);
        confirm2faForm.reset('code');
        enable2faForm.post(route('security.2fa.start'), {
            preserveScroll: true,
            onSuccess: async () => {
                try {
                    const res = await fetch(route('security.2fa.qr'));
                    if (res.ok) {
                        const data = await res.json();
                        setQrSvg(data?.svg ?? null);
                        setManualSecret(
                            typeof data?.secret === 'string'
                                ? data.secret
                                : null,
                        );
                    }
                } catch {
                    // ignore fetch error (QR code fetch failure)
                }
                toast.success(
                    'Persiapan 2FA dimulai. Scan QR & konfirmasi OTP.',
                );
            },
            onError: () => {
                setEnrolling(false);
                toast.error('Gagal memulai 2FA.');
            },
        });
    };

    const fetchRecovery = async () => {
        try {
            const res = await fetch(route('security.2fa.recovery.index'));
            if (res.ok) {
                const data = await res.json();
                const codes = JSON.parse(data?.codes ?? '[]');
                setRecoveryCodes(codes);
            }
        } catch {
            // ignore fetch error (recovery codes fetch failure)
        }
    };

    const onConfirm2FA = () => {
        confirm2faForm.post(route('security.2fa.confirm'), {
            preserveScroll: true,
            onSuccess: async () => {
                setEnrolling(false);
                setQrSvg(null);
                setManualSecret(null);
                confirm2faForm.reset('code');

                await fetchRecovery();
                setShowRecovery(true);

                toast.success('2FA berhasil dikonfirmasi.');
            },
            onError: () =>
                toast.error('Kode OTP tidak valid atau kedaluwarsa.'),
        });
    };

    const onDisable2FA = () => {
        disable2faForm.delete(route('security.2fa.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                setRecoveryCodes(null);
                setEnrolling(false);
                setQrSvg(null);
                setManualSecret(null);
                setShowRecovery(false);
                toast.success('2FA dinonaktifkan.');
            },
            onError: () => toast.error('Gagal menonaktifkan 2FA.'),
        });
    };

    const onRegenRecovery = () => {
        router.post(
            route('security.2fa.recovery.regenerate'),
            {},
            {
                preserveScroll: true,
                onSuccess: async () => {
                    await fetchRecovery();
                    setShowRecovery(true);
                    toast.success('Recovery codes diperbarui.');
                },
                onError: () => toast.error('Gagal memperbarui recovery codes.'),
            },
        );
    };

    const onCancelEnrollment = () => {
        router.post(
            route('security.2fa.cancel'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEnrolling(false);
                    setQrSvg(null);
                    setManualSecret(null);
                    confirm2faForm.reset('code');
                    toast.success('Proses 2FA dibatalkan.');
                },
                onError: () => toast.error('Gagal membatalkan proses 2FA.'),
            },
        );
    };

    const onCopyRecovery = async () => {
        if (Array.isArray(recoveryCodes) && recoveryCodes.length) {
            const text = recoveryCodes.join('\n');
            try {
                await navigator.clipboard.writeText(text);
                toast.success('Recovery codes disalin ke clipboard.');
            } catch {
                toast.error('Gagal menyalin recovery codes.');
            }
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Autentikasi 2 Langkah (TOTP)</CardTitle>
                    <CardDescription>
                        Gunakan aplikasi autentikator (Google Authenticator,
                        1Password, dll) untuk menghasilkan kode OTP saat login.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 2FA status & actions */}
                    {!summary.two_factor_enabled && !enrolling && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                2FA belum aktif.
                            </p>
                            <Button
                                onClick={() => confirmGuard(onStart2FA)}
                                disabled={enable2faForm.processing}
                            >
                                Aktifkan 2FA
                            </Button>
                        </div>
                    )}

                    {summary.two_factor_enabled && (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-muted-foreground">
                                2FA saat ini aktif.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={async () => {
                                        if (
                                            !showRecovery &&
                                            recoveryCodes === null
                                        )
                                            await fetchRecovery();
                                        setShowRecovery((v: boolean) => !v);
                                    }}
                                >
                                    {showRecovery
                                        ? 'Sembunyikan Recovery Codes'
                                        : 'Tampilkan Recovery Codes'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => confirmGuard(onDisable2FA)}
                                    disabled={disable2faForm.processing}
                                >
                                    Nonaktifkan 2FA
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Enrollment */}
                    {!summary.two_factor_enabled && enrolling && (
                        <div className="space-y-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Scan QR ini di aplikasi autentikator
                                        Anda:
                                    </p>
                                    {qrSvg ? (
                                        <div
                                            className="flex justify-center rounded-md border p-3"
                                            dangerouslySetInnerHTML={{
                                                __html: qrSvg,
                                            }}
                                        />
                                    ) : (
                                        <p className="text-sm">Memuat QR…</p>
                                    )}
                                    <p className="mt-2 text-center font-mono text-sm">
                                        {manualSecret ?? ''}
                                    </p>
                                </div>

                                <div>
                                    <div className="mb-4 rounded-md bg-muted/40 p-3 text-sm">
                                        <p className="mb-1 font-medium">
                                            Panduan:
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-4">
                                            <li>
                                                Buka aplikasi autentikator
                                                (Google Authenticator,
                                                1Password, dsb.).
                                            </li>
                                            <li>
                                                Pilih tambah akun → scan QR di
                                                atas.
                                            </li>
                                            <li>
                                                Jika kamera tidak tersedia, Anda
                                                bisa memasukkan kode secara
                                                manual dari aplikasi
                                                (otentikator akan membaca QR).
                                            </li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            Setelah berhasil menambahkan,
                                            masukkan 6 digit kode OTP di bawah
                                            lalu klik Konfirmasi.
                                        </p>
                                    </div>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            confirmGuard(onConfirm2FA);
                                        }}
                                        className="space-y-3"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="otp">
                                                Kode OTP
                                            </Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                autoComplete="one-time-code"
                                                value={confirm2faForm.data.code}
                                                onChange={(e) =>
                                                    confirm2faForm.setData(
                                                        'code',
                                                        e.target.value
                                                            .replace(/\D+/g, '')
                                                            .slice(0, 6),
                                                    )
                                                }
                                                placeholder="Masukkan 6 digit kode"
                                                maxLength={6}
                                            />
                                            {confirm2faForm.errors.code && (
                                                <p className="text-sm text-destructive">
                                                    {confirm2faForm.errors.code}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    confirm2faForm.processing
                                                }
                                            >
                                                Konfirmasi
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={onCancelEnrollment}
                                                disabled={
                                                    confirm2faForm.processing
                                                }
                                            >
                                                Batalkan
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enabled */}
                    {summary.two_factor_enabled && (
                        <div className="space-y-4">
                            <Separator />
                            {showRecovery && Array.isArray(recoveryCodes) && (
                                <div className="rounded-md border p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Simpan kode berikut di tempat aman.
                                            Setiap kode hanya dapat digunakan
                                            sekali.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    confirmGuard(
                                                        onRegenRecovery,
                                                    )
                                                }
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                                Regenerate Codes
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={onCopyRecovery}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />{' '}
                                                Copy Codes
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {recoveryCodes.map((c) => (
                                            <code
                                                key={c}
                                                className="rounded bg-muted px-2 py-1 text-sm"
                                            >
                                                {c}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            <ConfirmPasswordDialog
                open={open}
                onOpenChange={setOpen}
                onConfirmed={handleConfirmed}
            />
        </>
    );
}
