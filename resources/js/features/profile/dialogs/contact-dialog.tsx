import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';

export type ContactValues = {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
    address_line?: string;
};

export type ContactDialogProps = {
    open: boolean;
    mode: 'create' | 'edit';
    values: ContactValues;
    onValuesChange: (next: ContactValues) => void;
    showErrors?: boolean;
    processing?: boolean;
    relationshipOptions?: string[];
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
};

export default function ContactDialog({
    open,
    mode,
    values,
    onValuesChange,
    relationshipOptions = [],
    showErrors = false,
    processing = false,
    onCancel,
    onSubmit,
}: ContactDialogProps) {
    const { t } = useTranslation();
    const { t: tProfile } = useTranslation('profile');
    const { t: tEnum } = useTranslation('enum');
    const setField = <K extends keyof ContactValues>(
        key: K,
        v: ContactValues[K],
    ) => onValuesChange({ ...values, [key]: v });

    return (
        <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create'
                            ? tProfile('contact.dialog.create_title')
                            : tProfile('contact.dialog.edit_title')}
                    </DialogTitle>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {tProfile('contact.dialog.desc')}
                    </p>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-name">
                                {tProfile('contact.fields.name_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="c-name"
                                value={values.name}
                                onChange={(e) =>
                                    setField('name', e.target.value)
                                }
                                required
                                placeholder={tProfile(
                                    'contact.fields.name_placeholder',
                                )}
                            />

                            {showErrors && !values.name ? (
                                <InputError
                                    name="name"
                                    message={
                                        showErrors && !values.name
                                            ? t('form.required')
                                            : undefined
                                    }
                                />
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    {tProfile('contact.fields.name_hint')}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-phone">
                                {tProfile('contact.fields.phone_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="c-phone"
                                type="tel"
                                value={values.phone}
                                onChange={(e) =>
                                    setField('phone', e.target.value)
                                }
                                required
                                placeholder={tProfile(
                                    'contact.fields.phone_placeholder',
                                )}
                                autoComplete="tel"
                            />
                            {showErrors && !values.phone ? (
                                <InputError
                                    name="phone"
                                    message={t('form.required')}
                                />
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    {tProfile('contact.fields.phone_hint')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-rel">
                                {tProfile('contact.fields.relationship_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={values.relationship}
                                onValueChange={(v) =>
                                    setField('relationship', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={tProfile(
                                            'contact.fields.pick_relationship',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {relationshipOptions.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {tEnum(
                                                `emergency_relationship.${r}`,
                                                { defaultValue: r },
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                name="relationship"
                                message={
                                    showErrors && !values.relationship
                                        ? t('form.required')
                                        : undefined
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-email">{t('common.email')}</Label>
                            <Input
                                id="c-email"
                                type="email"
                                value={values.email || ''}
                                onChange={(e) =>
                                    setField('email', e.target.value)
                                }
                                placeholder={tProfile(
                                    'contact.fields.email_placeholder',
                                )}
                            />
                            <InputError name="email" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="c-address">
                            {tProfile('address.label')}
                        </Label>
                        <Textarea
                            id="c-address"
                            value={values.address_line || ''}
                            onChange={(e) =>
                                setField('address_line', e.target.value)
                            }
                            rows={3}
                            placeholder={tProfile(
                                'contact.fields.address_placeholder',
                            )}
                        />
                        <p className="text-muted-foreground text-xs">
                            {tProfile('contact.fields.address_hint')}
                        </p>
                        <InputError name="address_line" />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
