import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AddressInput from '@/features/profile/components/address-input';
import AddressTextarea from '@/features/profile/components/address-textarea';
import type { AddressProps, AddressValue } from '@/types/profile';

export default function AddressSection({
    value,
    onChange,
    errors = {},
    defaultOpen = true,
    title,
}: AddressProps) {
    const { t: tProfile } = useTranslation('profile');
    const { t: tEnum } = useTranslation('enum');
    const { props } = usePage<
        InertiaPageProps & { options?: { addressLabels: string[] } }
    >();
    const addressLabels: string[] = props.options?.addressLabels ?? [];

    const setField = (key: keyof AddressValue, val: string) => {
        onChange({ ...value, [key]: val });
    };

    return (
        <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpen ? 'address' : undefined}
            className="w-full"
        >
            <AccordionItem value="address">
                <AccordionTrigger className="text-base font-semibold">
                    {title ?? tProfile('address.title')}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <AddressTextarea
                            id="address_line"
                            name="address[address_line]"
                            rows={3}
                            value={value.address_line}
                            onChange={(e) =>
                                setField('address_line', e.target.value)
                            }
                            placeholder={tProfile('address.street_placeholder')}
                            label={
                                <>
                                    {tProfile('address.label')}{' '}
                                    <span className="text-destructive">*</span>
                                </>
                            }
                            errorMessage={errors['address.address_line']}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <AddressInput
                                id="village"
                                name="address[village]"
                                value={value.village}
                                onChange={(e) =>
                                    setField('village', e.target.value)
                                }
                                placeholder={tProfile('address.village_placeholder')}
                                label={
                                    <>
                                        {tProfile('address.village')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </>
                                }
                                errorMessage={errors['address.village']}
                            />
                            <AddressInput
                                id="district"
                                name="address[district]"
                                value={value.district}
                                onChange={(e) =>
                                    setField('district', e.target.value)
                                }
                                placeholder={tProfile('address.district_placeholder')}
                                label={
                                    <>
                                        {tProfile('address.district')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </>
                                }
                                errorMessage={errors['address.district']}
                            />
                            <AddressInput
                                id="postal_code"
                                name="address[postal_code]"
                                value={value.postal_code}
                                onChange={(e) =>
                                    setField('postal_code', e.target.value)
                                }
                                placeholder={tProfile('address.postal_placeholder')}
                                label={
                                    <>
                                        {tProfile('address.postal')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </>
                                }
                                errorMessage={errors['address.postal_code']}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <AddressInput
                                id="city"
                                name="address[city]"
                                value={value.city}
                                onChange={(e) =>
                                    setField('city', e.target.value)
                                }
                                placeholder={tProfile('address.city_placeholder')}
                                label={
                                    <>
                                        {tProfile('address.city')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </>
                                }
                                errorMessage={errors['address.city']}
                            />
                            <AddressInput
                                id="province"
                                name="address[province]"
                                value={value.province}
                                onChange={(e) =>
                                    setField('province', e.target.value)
                                }
                                placeholder={tProfile('address.province_placeholder')}
                                label={
                                    <>
                                        {tProfile('address.province')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </>
                                }
                                errorMessage={errors['address.province']}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="label">
                                    {tProfile('address.address_label')}
                                </Label>
                                <Select
                                    value={value.label}
                                    onValueChange={(v) => setField('label', v)}
                                >
                                    <SelectTrigger id="label">
                                        <SelectValue placeholder={tProfile('address.label_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addressLabels.map((label: string) => (
                                            <SelectItem key={label} value={label}>
                                                {tEnum(`address_label.${label}`, {
                                                    defaultValue: label,
                                                })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors['address.label']} />
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
