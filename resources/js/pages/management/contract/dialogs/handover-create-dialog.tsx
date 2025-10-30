import { router, useForm } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import type {
    HandoverCreateErrorKey as ErrorKey,
    HandoverCreateFormState as FormState,
    HandoverMode as Mode,
} from '@/types/management';

export default function HandoverCreate({
    open,
    onOpenChange,
    contractId,
    mode,
    minPhotosCheckin = 0,
    minPhotosCheckout = 0,
    onSaved,
    redo = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contractId?: string | null;
    mode: Mode;
    minPhotosCheckin?: number;
    minPhotosCheckout?: number;
    onSaved?: () => void | Promise<void>;
    redo?: boolean;
}) {
    const { t } = useTranslation('management/contract');
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
    const noteRule = useLengthRule(data.notes ?? '', {
        min: 20,
        required: true,
        trim: true,
    });
    const minPhotosRequired = Math.max(
        0,
        isCheckin ? minPhotosCheckin : minPhotosCheckout,
    );
    const meetsPhotoRequirement =
        minPhotosRequired === 0 || photoCount >= minPhotosRequired;
    const canSubmit =
        !processing && noteRule.valid && !!contractId && meetsPhotoRequirement;

    const formErrors = errors as Record<string, string | undefined>;
    const fileErrors = Object.entries(formErrors)
        .filter(
            ([key]) =>
                key === 'files.general' || key.startsWith('files.general.'),
        )
        .map(([, message]) => message)
        .filter(Boolean) as string[];

    const title = isCheckin
        ? redo
            ? t('handover.submit.redo_checkin')
            : t('handover.submit.checkin')
        : redo
          ? t('handover.submit.redo_checkout')
          : t('handover.submit.checkout');
    const notesLabel = isCheckin
        ? t('handover.notes_label.checkin')
        : t('handover.notes_label.checkout');
    const notesPlaceholder = isCheckin
        ? t('handover.notes_placeholder.checkin')
        : t('handover.notes_placeholder.checkout');
    const photoLabel = `${t('handover.photo_label')}${
        minPhotosRequired > 0
            ? ` (${t('handover.min_photos', { count: minPhotosRequired })})`
            : ` (${t('common.optional')})`
    }`;
    const notesHelper = isCheckin
        ? t('handover.notes_helper.checkin')
        : t('handover.notes_helper.checkout');
    const photoHelper =
        minPhotosRequired > 0
            ? t('handover.photo_helper_min', {
                  count: minPhotosRequired,
              })
            : t('handover.photo_helper');
    const submitText = title;
    const routeName:
        | 'management.contracts.handovers.checkin'
        | 'management.contracts.handovers.checkout' = isCheckin
        ? 'management.contracts.handovers.checkin'
        : 'management.contracts.handovers.checkout';

    return (
        <Dialog open={open} onOpenChange={(o) => (o ? void 0 : close())}>
            <DialogContent className="p-0 sm:max-w-2xl">
                <div className="flex flex-col">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            Catat serah terima secara ringkas dan jelas.
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <div className="space-y-5 px-6 py-5 pr-8">
                        <section className="bg-muted/10 rounded-xl border">
                            <div className="flex flex-col gap-4 p-4 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor={notesId}
                                            className="text-sm font-semibold"
                                        >
                                            {notesLabel}
                                        </Label>
                                        <p className="text-muted-foreground max-w-[48ch] text-sm">
                                            {notesHelper}
                                        </p>
                                    </div>
                                    <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                                        {noteRule.length}/20
                                        {noteRule.length < 20 ? '*' : ''}
                                    </span>
                                </div>
                                <Textarea
                                    id={notesId}
                                    rows={6}
                                    value={data.notes}
                                    onChange={(e) => {
                                        setData('notes', e.target.value);
                                        if (errors.notes) clearErrors('notes');
                                    }}
                                    placeholder={notesPlaceholder}
                                    className="min-h-[160px] resize-y"
                                />
                                <div className="flex flex-col gap-1">
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                        </section>

                        <section className="bg-muted/10 rounded-xl border">
                            <div className="flex flex-col gap-4 p-4 sm:p-5">
                                <div className="space-y-1">
                                    <p className="text-foreground text-sm font-semibold">
                                        {photoLabel}
                                    </p>
                                    <p className="text-muted-foreground max-w-[52ch] text-sm">
                                        {photoHelper}
                                    </p>
                                </div>

                                <ScrollArea className="bg-background/40 max-h-[280px] rounded-lg border border-dashed">
                                    <div className="p-4 pr-6 sm:p-6">
                                        <ImageDropzone
                                            files={filesArr}
                                            onFilesChange={(files: File[]) => {
                                                const next = files.slice(0, 5);
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
                                            errorName="files.general"
                                        />
                                    </div>
                                </ScrollArea>
                                {minPhotosRequired > 0 && (
                                    <div className="text-muted-foreground text-right text-xs">
                                        {t('handover.photos_counter', {
                                            current: photoCount,
                                            min: minPhotosRequired,
                                        })}
                                    </div>
                                )}
                                {fileErrors.length > 0 && (
                                    <div className="text-destructive space-y-1 text-right text-xs">
                                        {fileErrors.map((err, idx) => (
                                            <p key={idx}>{err}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <DialogFooter className="bg-background/95 border-t px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={close}
                            className="w-full sm:w-auto"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Can all={["handover.create"]}>
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
                        </Can>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
