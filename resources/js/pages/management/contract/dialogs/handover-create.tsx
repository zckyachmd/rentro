import { router, useForm } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Mode = 'checkin' | 'checkout';

export default function HandoverCreate({
    open,
    onOpenChange,
    contractId,
    mode,
    minPhotosCheckin = 0,
    minPhotosCheckout = 0,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contractId?: string | null;
    mode: Mode;
    minPhotosCheckin?: number;
    minPhotosCheckout?: number;
    onSaved?: () => void | Promise<void>;
}) {
    type FormState = {
        notes: string;
        files: { general?: File[] };
    };

    // Type guard for dynamic error keys coming from backend
    type ErrorKey =
        | keyof FormState
        | 'files.general'
        | `files.general.${number}`;
    const isAllowedErrorKey = (k: string): k is ErrorKey =>
        k === 'notes' ||
        k === 'files.general' ||
        /^files\.general\.\d+$/.test(k);

    const { data, setData, processing, reset, errors, clearErrors, setError } =
        useForm<FormState>({
            notes: '',
            files: {},
        });

    const isCheckin = mode === 'checkin';
    const notesId = React.useId();

    const close = React.useCallback(() => {
        onOpenChange(false);
        reset();
    }, [onOpenChange, reset]);

    // Enforce max 5 photos on UI
    const filesArr = Array.isArray(data.files.general)
        ? data.files.general.slice(0, 5)
        : [];
    const photoCount = filesArr.length;

    const notesLength = data.notes?.trim().length || 0;
    const minPhotosRequired = Math.max(
        0,
        isCheckin ? minPhotosCheckin : minPhotosCheckout,
    );
    const meetsPhotoRequirement =
        minPhotosRequired === 0 || photoCount >= minPhotosRequired;
    const canSubmit =
        !processing &&
        notesLength >= 20 &&
        !!contractId &&
        meetsPhotoRequirement;

    const formErrors = errors as Record<string, string | undefined>;
    const fileErrors = Object.entries(formErrors)
        .filter(
            ([key]) =>
                key === 'files.general' || key.startsWith('files.general.'),
        )
        .map(([, message]) => message)
        .filter(Boolean) as string[];

    const title = isCheckin ? 'Check‑in' : 'Check‑out';
    const notesLabel = isCheckin ? 'Catatan Check‑in' : 'Catatan Check‑out';
    const notesPlaceholder = isCheckin
        ? 'Tulis ringkasan kondisi kamar, meteran listrik/air, lampu, dan kunci yang diserahkan.'
        : 'Tulis ringkasan bahwa kondisi saat serah terima kembali sama seperti saat masuk (kunci, meteran, lampu, dll).';
    const photoLabel = isCheckin
        ? `Foto bukti${minPhotosRequired > 0 ? ` (min ${minPhotosRequired})` : ''}`
        : `Foto bukti${minPhotosRequired > 0 ? ` (min ${minPhotosRequired})` : ' (opsional)'}`;
    const notesHelper = isCheckin
        ? 'Ringkas kondisi awal, perlengkapan, dan angka meter.'
        : 'Ringkas pengembalian perlengkapan & kondisi akhir.';
    const photoHelper =
        minPhotosRequired > 0
            ? `Unggah bukti singkat. Min ${minPhotosRequired}, maks 5 foto.`
            : 'Unggah bukti singkat (maks 5 foto).';
    const submitText = isCheckin ? 'Simpan Check‑in' : 'Simpan Check‑out';
    const routeName:
        | 'management.contracts.handovers.checkin'
        | 'management.contracts.handovers.checkout' = isCheckin
        ? 'management.contracts.handovers.checkin'
        : 'management.contracts.handovers.checkout';

    return (
        <Dialog open={open} onOpenChange={(o) => (o ? void 0 : close())}>
            <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
                <div className="flex max-h-[90vh] flex-col">
                    <DialogHeader className="px-6 pb-4 pt-6">
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            Catat serah terima secara ringkas dan jelas.
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <ScrollArea className="flex-1">
                        <div className="space-y-5 px-6 py-5 pr-8">
                            <section className="rounded-xl border bg-muted/10">
                                <div className="flex flex-col gap-4 p-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={notesId}
                                                className="text-sm font-semibold"
                                            >
                                                {notesLabel}
                                            </Label>
                                            <p className="max-w-[48ch] text-sm text-muted-foreground">
                                                {notesHelper}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                            {notesLength}/20
                                        </span>
                                    </div>
                                    <Textarea
                                        id={notesId}
                                        rows={6}
                                        value={data.notes}
                                        onChange={(e) => {
                                            setData('notes', e.target.value);
                                            if (errors.notes)
                                                clearErrors('notes');
                                        }}
                                        placeholder={notesPlaceholder}
                                        className="min-h-[160px] resize-y"
                                    />
                                    <div className="flex flex-col gap-1">
                                        {notesLength < 20 && (
                                            <p className="text-right text-xs text-muted-foreground">
                                                Minimal 20 karakter.
                                            </p>
                                        )}
                                        {errors.notes && (
                                            <p className="text-right text-xs text-destructive">
                                                {errors.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-xl border bg-muted/10">
                                <div className="flex flex-col gap-4 p-4 sm:p-5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            {photoLabel}
                                        </p>
                                        <p className="max-w-[52ch] text-sm text-muted-foreground">
                                            {photoHelper}
                                        </p>
                                    </div>

                                    <ScrollArea className="max-h-[280px] rounded-lg border border-dashed bg-background/40">
                                        <div className="p-4 pr-6 sm:p-6">
                                            <ImageDropzone
                                                files={filesArr}
                                                onFilesChange={(
                                                    files: File[],
                                                ) => {
                                                    const next = files.slice(
                                                        0,
                                                        5,
                                                    );
                                                    setData('files', {
                                                        ...data.files,
                                                        general: next,
                                                    });
                                                    if (fileErrors.length) {
                                                        clearErrors(
                                                            'files.general',
                                                            'files.general.0',
                                                            'files.general.1',
                                                            'files.general.2',
                                                            'files.general.3',
                                                            'files.general.4',
                                                        );
                                                    }
                                                }}
                                                multiple
                                                accept="image/*"
                                                disabled={processing}
                                                className="bg-transparent"
                                            />
                                        </div>
                                    </ScrollArea>
                                    {minPhotosRequired > 0 && (
                                        <div className="text-right text-xs text-muted-foreground">
                                            {photoCount}/{minPhotosRequired}{' '}
                                            foto
                                        </div>
                                    )}
                                    {fileErrors.length > 0 && (
                                        <div className="space-y-1 text-right text-xs text-destructive">
                                            {fileErrors.map((err, idx) => (
                                                <p key={idx}>{err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="border-t bg-background/95 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={close}
                            className="w-full sm:w-auto"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => {
                                if (!contractId) return;

                                // Build FormData explicitly so Laravel receives nested array: files[general][]
                                const fd = new FormData();
                                fd.append('notes', data.notes ?? '');

                                const files = Array.isArray(data.files?.general)
                                    ? data.files.general.slice(0, 5)
                                    : [];
                                for (const f of files) {
                                    fd.append('files[general][]', f);
                                }

                                // Clear old field-level errors before submit to avoid stale UI
                                if (Object.keys(errors).length) {
                                    clearErrors();
                                }

                                router.post(
                                    route(routeName, { contract: contractId }),
                                    fd,
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                        onError: (
                                            errs: Record<
                                                string,
                                                string | string[]
                                            >,
                                        ) => {
                                            for (const [
                                                key,
                                                val,
                                            ] of Object.entries(errs)) {
                                                const messageStr =
                                                    Array.isArray(val)
                                                        ? val.join(' ')
                                                        : String(val);
                                                if (isAllowedErrorKey(key)) {
                                                    setError(key, messageStr);
                                                } else {
                                                    setError(
                                                        'notes',
                                                        messageStr,
                                                    );
                                                }
                                            }
                                        },
                                        onSuccess: async () => {
                                            try {
                                                await Promise.resolve(
                                                    onSaved?.(),
                                                );
                                            } catch {
                                                // ignore
                                            }
                                            close();
                                        },
                                    },
                                );
                            }}
                            className="w-full sm:w-auto"
                        >
                            {submitText}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
