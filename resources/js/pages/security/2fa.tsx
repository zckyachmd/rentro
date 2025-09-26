import { router, useForm } from '@inertiajs/react';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { CopyInline } from '@/components/ui/copy-inline';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import OtpInput from '@/components/ui/otp-input';
import { Separator } from '@/components/ui/separator';
import { createAbort, getJson } from '@/lib/api';
import type { RecoveryResponse, TwoFactorTabProps } from '@/types/security';

export default function TwoFactorTab({ summary }: TwoFactorTabProps) {
    const { t } = useTranslation();
    const { t: tSecurity } = useTranslation('security');
    const forms = {
        enable: useForm({}),
        disable: useForm({}),
        confirm: useForm<{ code: string }>({ code: '' }),
    };

    const [state, setState] = useState<{
        enrolling: boolean;
        qrSvg: string | null;
        recoveryCodes: string[] | null;
        showRecovery: boolean;
        manualSecret: string | null;
    }>({
        enrolling: false,
        qrSvg: null,
        recoveryCodes: null,
        showRecovery: false,
        manualSecret: null,
    });

    const { open, setOpen, openConfirm, handleConfirmed } =
        useConfirmPasswordModal();
    const confirmGuard = openConfirm;

    const onStart2FA = () => {
        setState((s) => ({ ...s, enrolling: true }));
        forms.confirm.reset('code');
        forms.enable.post(route('security.2fa.start'), {
            preserveScroll: true,
            onSuccess: async () => {
                const ctrl = createAbort();
                try {
                    const data = await getJson<{
                        svg?: string;
                        secret?: string;
                    }>(route('security.2fa.qr'), { signal: ctrl.signal });
                    setState((s) => ({ ...s, qrSvg: data?.svg ?? null }));
                    setState((s) => ({
                        ...s,
                        manualSecret:
                            typeof data?.secret === 'string'
                                ? data.secret
                                : null,
                    }));
                } catch {
                    // ignore fetch error (QR code fetch failure)
                }
            },
            onError: () => {
                setState((s) => ({ ...s, enrolling: false }));
            },
        });
    };

    const fetchRecovery = async () => {
        const ctrl = createAbort();
        try {
            const data = await getJson<RecoveryResponse>(
                route('security.2fa.recovery.index'),
                { signal: ctrl.signal },
            );

            const first = Array.isArray(data.codes) ? data.codes[0] : '[]';

            let codes: string[] = [];
            try {
                const parsed = JSON.parse(first ?? '[]');
                codes = Array.isArray(parsed) ? parsed.map(String) : [];
            } catch {
                codes = [];
            }

            setState((s) => ({ ...s, recoveryCodes: codes }));
        } catch {
            // ignore fetch error
        }
    };

    const onConfirm2FA = () => {
        forms.confirm.post(route('security.2fa.confirm'), {
            preserveScroll: true,
            onSuccess: async () => {
                setState((s) => ({
                    ...s,
                    enrolling: false,
                    qrSvg: null,
                    manualSecret: null,
                }));
                forms.confirm.reset('code');

                await fetchRecovery();
                setState((s) => ({ ...s, showRecovery: true }));
            },
        });
    };

    const onDisable2FA = () => {
        forms.disable.delete(route('security.2fa.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                setState({
                    enrolling: false,
                    qrSvg: null,
                    recoveryCodes: null,
                    showRecovery: false,
                    manualSecret: null,
                });
            },
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
                    setState((s) => ({ ...s, showRecovery: true }));
                },
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
                    setState((s) => ({
                        ...s,
                        enrolling: false,
                        qrSvg: null,
                        manualSecret: null,
                    }));
                    forms.confirm.reset('code');
                },
            },
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{tSecurity('2fa.title_with_totp')}</CardTitle>
                    <CardDescription>
                        {tSecurity('2fa.long_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 2FA status & actions */}
                    {!summary.two_factor_enabled && !state.enrolling && (
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm">
                                {tSecurity('2fa.not_enabled')}
                            </p>
                            <Button
                                onClick={() => confirmGuard(onStart2FA)}
                                disabled={forms.enable.processing}
                            >
                                {tSecurity('2fa.enable')}
                            </Button>
                        </div>
                    )}

                    {summary.two_factor_enabled && (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-muted-foreground text-sm">
                                {tSecurity('2fa.enabled_now')}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={async () => {
                                        if (
                                            !state.showRecovery &&
                                            state.recoveryCodes === null
                                        ) {
                                            await fetchRecovery();
                                        }
                                        setState((s) => ({
                                            ...s,
                                            showRecovery: !s.showRecovery,
                                        }));
                                    }}
                                >
                                    {state.showRecovery
                                        ? tSecurity('2fa.hide_codes')
                                        : tSecurity('2fa.show_codes')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => confirmGuard(onDisable2FA)}
                                    disabled={forms.disable.processing}
                                >
                                    {tSecurity('2fa.disable')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Enrollment */}
                    {!summary.two_factor_enabled && state.enrolling && (
                        <div className="space-y-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                    <p className="text-muted-foreground text-sm">
                                        {tSecurity('2fa.scan_qr')}
                                    </p>
                                    {state.qrSvg ? (
                                        <div
                                            className="flex justify-center rounded-md border p-3"
                                            dangerouslySetInnerHTML={{
                                                __html: state.qrSvg,
                                            }}
                                        />
                                    ) : (
                                        <p className="text-sm">
                                            {tSecurity('2fa.loading_qr')}
                                        </p>
                                    )}
                                    <p className="mt-2 text-center font-mono text-sm">
                                        {state.manualSecret ?? ''}
                                    </p>
                                </div>

                                <div>
                                    <div className="bg-muted/40 mb-4 rounded-md p-3 text-sm">
                                        <p className="mb-1 font-medium">
                                            {tSecurity('2fa.guide')}
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-4">
                                            <li>{tSecurity('2fa.step1')}</li>
                                            <li>{tSecurity('2fa.step2')}</li>
                                            <li>{tSecurity('2fa.step3')}</li>
                                        </ol>
                                        <p className="text-muted-foreground mt-2">
                                            {tSecurity('2fa.after_add')}
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
                                                {tSecurity('2fa.otp')}
                                            </Label>
                                            <OtpInput
                                                id="otp"
                                                value={forms.confirm.data.code}
                                                onChange={(v) =>
                                                    forms.confirm.setData(
                                                        'code',
                                                        v,
                                                    )
                                                }
                                                placeholder={tSecurity(
                                                    '2fa.placeholder_otp',
                                                )}
                                            />
                                            <InputError
                                                message={
                                                    forms.confirm.errors.code
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    forms.confirm.processing
                                                }
                                            >
                                                {tSecurity('2fa.confirm')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={onCancelEnrollment}
                                                disabled={
                                                    forms.confirm.processing
                                                }
                                            >
                                                {t('common.cancel')}
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
                            {state.showRecovery &&
                                Array.isArray(state.recoveryCodes) && (
                                    <div className="rounded-md border p-3">
                                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-muted-foreground text-sm">
                                                {tSecurity('2fa.recovery.note')}
                                            </p>
                                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        confirmGuard(
                                                            onRegenRecovery,
                                                        )
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                                    {t(
                                                        'security.2fa.recovery.regen',
                                                    )}
                                                </Button>
                                                <CopyInline
                                                    as="button"
                                                    value={
                                                        Array.isArray(
                                                            state.recoveryCodes,
                                                        )
                                                            ? state.recoveryCodes.join(
                                                                  '\n',
                                                              )
                                                            : ''
                                                    }
                                                    successMessage={t(
                                                        'security.2fa.recovery.copied',
                                                    )}
                                                    aria-disabled={
                                                        !Array.isArray(
                                                            state.recoveryCodes,
                                                        ) ||
                                                        state.recoveryCodes
                                                            .length === 0
                                                    }
                                                    className={
                                                        `bg-background hover:bg-accent hover:text-accent-foreground inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm sm:w-auto ` +
                                                        (!Array.isArray(
                                                            state.recoveryCodes,
                                                        ) ||
                                                        state.recoveryCodes
                                                            .length === 0
                                                            ? 'pointer-events-none opacity-50'
                                                            : '')
                                                    }
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />{' '}
                                                    {t(
                                                        'security.2fa.recovery.copy',
                                                    )}
                                                </CopyInline>
                                            </div>
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {state.recoveryCodes.map((c) => (
                                                <code
                                                    key={c}
                                                    className="bg-muted rounded px-2 py-1 text-sm"
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
