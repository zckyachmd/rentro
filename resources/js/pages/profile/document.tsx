import type { TFunction } from 'i18next';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { DatePickerInput } from '@/components/date-picker';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DocumentFilePicker from '@/features/profile/components/document-file-picker';
import DocumentStatusBadge from '@/features/profile/components/document-status-badge';
import { todayISO, tomorrowISO } from '@/lib/date';
import type { DocumentFormValue, DocumentSectionProps } from '@/types/profile';

function getAlertText(
    value: DocumentFormValue,
    messages: DocumentSectionProps['messages'] = {},
    t: TFunction,
) {
    const title = messages.infoTitle || t('document.alert.info_title');
    const lines: string[] = [];

    if (value.file) {
        lines.push(messages.filePicked || t('document.alert.file_picked'));
    } else {
        switch (value.status) {
            case 'pending':
                lines.push(messages.pending || t('document.alert.pending'));
                break;
            case 'approved':
                lines.push(messages.approved || t('document.alert.approved'));
                break;
            case 'rejected':
                lines.push(messages.rejected || t('document.alert.rejected'));
                break;
        }
    }

    if (value.notes) {
        lines.push(
            `\n${messages.notesTitle || t('document.alert.notes_title')}:\n${value.notes}`,
        );
    }

    return { title, text: lines.join('\n') };
}

export default function DocumentSection({
    value,
    onChange,
    errors = {},
    defaultOpen = true,
    title,
    messages = {},
    documentTypes = [],
}: DocumentSectionProps) {
    const { t } = useTranslation();
    const { t: tProfile } = useTranslation('profile');
    const { t: tEnum } = useTranslation('enum');
    const setField = React.useCallback(
        <K extends keyof DocumentFormValue>(
            key: K,
            val: DocumentFormValue[K],
        ) => {
            onChange({ ...value, [key]: val });
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
                    {title ?? tProfile('document.title')}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            {/* Jenis Dokumen */}
                            <div className="space-y-2">
                                <Label htmlFor="doc_type">
                                    {tProfile('document.type')}{' '}
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
                                        <SelectValue
                                            placeholder={t(
                                                'form.placeholder.pick_type',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {tEnum(`document.type.${type}`, {
                                                    defaultValue: type,
                                                })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors['document.type']} />
                            </div>

                            {/* Nomor Dokumen */}
                            <div className="space-y-2">
                                <Label htmlFor="doc_number">
                                    {tProfile('document.number')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="doc_number"
                                    name="document[number]"
                                    value={value.number}
                                    onChange={(e) =>
                                        setField('number', e.target.value)
                                    }
                                    placeholder={t('form.placeholder.number')}
                                />
                                <InputError
                                    message={errors['document.number']}
                                />
                            </div>

                            {/* Tanggal Terbit */}
                            <div className="space-y-2">
                                <Label htmlFor="issued_at">
                                    {tProfile('document.issued_at')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <DatePickerInput
                                    id="issued_at"
                                    name="document[issued_at]"
                                    value={value.issued_at}
                                    onChange={(v) =>
                                        setField('issued_at', v ?? '')
                                    }
                                    placeholder={t(
                                        'form.placeholder.pick_date',
                                    )}
                                    max={todayISO()}
                                />
                                <InputError
                                    message={errors['document.issued_at']}
                                />
                            </div>

                            {/* Berlaku Hingga */}
                            <div className="space-y-2">
                                <Label htmlFor="expires_at">
                                    {tProfile('document.expires_at')}
                                </Label>
                                <DatePickerInput
                                    id="expires_at"
                                    name="document[expires_at]"
                                    value={value.expires_at}
                                    onChange={(v) =>
                                        setField('expires_at', v ?? '')
                                    }
                                    placeholder={t(
                                        'form.placeholder.pick_date',
                                    )}
                                    min={tomorrowISO()}
                                />
                                <InputError
                                    message={errors['document.expires_at']}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-4">
                                <Label className="mb-1 block">
                                    {tProfile('document.file')}{' '}
                                    <span className="text-destructive">
                                        {!value.has_file ||
                                        value.status === 'rejected'
                                            ? '*'
                                            : ''}
                                    </span>
                                </Label>
                                <DocumentFilePicker
                                    onPick={(file) =>
                                        onChange({
                                            ...value,
                                            file: file ?? null,
                                            status:
                                                value.status !== 'pending'
                                                    ? 'pending'
                                                    : value.status,
                                        })
                                    }
                                    fileName={value.file?.name ?? null}
                                    errorMessage={errors['document.file']}
                                />
                            </div>

                            {value.status && (
                                <div className="md:col-span-4">
                                    <Label className="mr-2">
                                        {tProfile('document.verify_status')}
                                    </Label>
                                    <span>
                                        <DocumentStatusBadge
                                            status={value.status}
                                        />
                                    </span>
                                </div>
                            )}
                        </div>
                        {shouldShowAlert &&
                            (() => {
                                const { title: alertTitle, text } =
                                    getAlertText(value, messages, tProfile);
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
