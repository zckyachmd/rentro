import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DatePickerInput } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import * as React from 'react';

export type DocumentFormValue = {
    type: 'KTP' | 'SIM' | 'PASSPORT' | 'NPWP' | 'other' | '';
    number: string;
    issued_at: string;
    expires_at: string;
    file: File | null;
    file_url?: string | null;
    status?: 'pending' | 'approved' | 'rejected';
    notes?: string | null;
};

interface Props {
    value: DocumentFormValue;
    onChange: (next: DocumentFormValue) => void;
    errors?: Record<string, string | undefined>;
    defaultOpen?: boolean;
    title?: string;
    messages?: Partial<{
        infoTitle: string;
        filePicked: string;
        pending: string;
        approved: string;
        rejected: string;
        notesTitle: string;
    }>;
}

function getAlertText(
    value: DocumentFormValue,
    messages: Props['messages'] = {},
) {
    const title = messages.infoTitle || 'Informasi Dokumen';
    const lines: string[] = [];

    if (value.file) {
        lines.push(
            messages.filePicked ||
                'Anda memilih file dokumen baru. Dokumen akan ditinjau (ulang) oleh admin.',
        );
    } else {
        switch (value.status) {
            case 'pending':
                lines.push(
                    messages.pending ||
                        'Status dokumen saat ini adalah pending. Dokumen Anda sedang menunggu verifikasi admin.',
                );
                break;
            case 'approved':
                lines.push(
                    messages.approved ||
                        'Dokumen Anda sudah disetujui. Jika mengunggah ulang, dokumen akan kembali ditinjau oleh admin.',
                );
                break;
            case 'rejected':
                lines.push(
                    messages.rejected ||
                        'Dokumen Anda ditolak. Anda harus mengunggah ulang dokumen untuk ditinjau kembali oleh admin.',
                );
                break;
        }
    }

    if (value.notes) {
        lines.push(
            `\n${messages.notesTitle || 'Catatan Admin'}:\n${value.notes}`,
        );
    }

    return { title, text: lines.join('\n') };
}

export default function DocumentSection({
    value,
    onChange,
    errors = {},
    defaultOpen = true,
    title = 'Dokumen Identitas',
    messages = {},
}: Props) {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const setField = React.useCallback(
        <K extends keyof DocumentFormValue>(
            key: K,
            val: DocumentFormValue[K],
        ) => {
            onChange({ ...value, [key]: val });
        },
        [onChange, value],
    );

    const onPickFile = React.useCallback(
        () => fileInputRef.current?.click(),
        [],
    );

    const onFileChange: React.ChangeEventHandler<HTMLInputElement> =
        React.useCallback(
            (e) => {
                const input = e.target;
                const file = input.files?.[0] ?? null;

                if (!file) return;

                onChange({
                    ...value,
                    file,
                    status:
                        value.status !== 'pending' ? 'pending' : value.status,
                });
            },
            [onChange, value],
        );

    const shouldShowAlert = Boolean(
        value.file ||
            value.status === 'pending' ||
            value.status === 'approved' ||
            value.status === 'rejected' ||
            value.notes,
    );

    return (
        <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpen ? 'document' : undefined}
            className="w-full"
        >
            <AccordionItem value="document">
                <AccordionTrigger className="text-base font-semibold">
                    {title}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            {/* Jenis Dokumen */}
                            <div className="space-y-2">
                                <Label htmlFor="doc_type">
                                    Jenis Dokumen{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={value.type}
                                    onValueChange={(v) =>
                                        setField(
                                            'type',
                                            v as DocumentFormValue['type'],
                                        )
                                    }
                                >
                                    <SelectTrigger id="doc_type">
                                        <SelectValue placeholder="Pilih jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KTP">KTP</SelectItem>
                                        <SelectItem value="SIM">SIM</SelectItem>
                                        <SelectItem value="PASSPORT">
                                            PASSPORT
                                        </SelectItem>
                                        <SelectItem value="NPWP">
                                            NPWP
                                        </SelectItem>
                                        <SelectItem value="other">
                                            Lainnya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors['document.type'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['document.type']}
                                    </p>
                                )}
                            </div>

                            {/* Nomor Dokumen */}
                            <div className="space-y-2">
                                <Label htmlFor="doc_number">
                                    Nomor Dokumen{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="doc_number"
                                    name="document[number]"
                                    value={value.number}
                                    onChange={(e) =>
                                        setField('number', e.target.value)
                                    }
                                    placeholder="Masukkan nomor"
                                />
                                {errors['document.number'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['document.number']}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal Terbit */}
                            <div className="space-y-2">
                                <Label htmlFor="issued_at">
                                    Tanggal Terbit
                                </Label>
                                <DatePickerInput
                                    id="issued_at"
                                    name="document[issued_at]"
                                    value={value.issued_at}
                                    onChange={(v) =>
                                        setField('issued_at', v ?? '')
                                    }
                                    placeholder="Pilih tanggal"
                                />
                                {errors['document.issued_at'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['document.issued_at']}
                                    </p>
                                )}
                            </div>

                            {/* Berlaku Hingga */}
                            <div className="space-y-2">
                                <Label htmlFor="expires_at">
                                    Berlaku Hingga
                                </Label>
                                <DatePickerInput
                                    id="expires_at"
                                    name="document[expires_at]"
                                    value={value.expires_at}
                                    onChange={(v) =>
                                        setField('expires_at', v ?? '')
                                    }
                                    placeholder="Pilih tanggal"
                                />
                                {errors['document.expires_at'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['document.expires_at']}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-4">
                                <Label className="mb-1 block">
                                    File Dokumen{' '}
                                    <span className="text-destructive">
                                        {!value.file_url ||
                                        value.status === 'rejected'
                                            ? '*'
                                            : ''}
                                    </span>
                                </Label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
                                        onClick={onPickFile}
                                    >
                                        Pilih File
                                    </button>
                                    {value.file?.name && (
                                        <span
                                            className="truncate text-sm text-muted-foreground"
                                            title={value.file.name}
                                        >
                                            {value.file.name}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    name="document[file]"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={onFileChange}
                                />
                                {errors['document.file'] && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors['document.file']}
                                    </p>
                                )}
                            </div>

                            {value.status && (
                                <div className="md:col-span-4">
                                    <Label className="mr-2">
                                        Status Verifikasi
                                    </Label>
                                    <span>
                                        {value.status === 'approved' ? (
                                            <Badge className="gap-1">
                                                <ShieldCheck className="h-3 w-3" />{' '}
                                                Disetujui
                                            </Badge>
                                        ) : value.status === 'pending' ? (
                                            <Badge variant="secondary">
                                                Menunggu
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                Ditolak
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                        {shouldShowAlert &&
                            (() => {
                                const { title: alertTitle, text } =
                                    getAlertText(value, messages);
                                return (
                                    <Alert>
                                        <AlertTitle>{alertTitle}</AlertTitle>
                                        <AlertDescription className="whitespace-pre-line">
                                            {text}
                                        </AlertDescription>
                                    </Alert>
                                );
                            })()}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
