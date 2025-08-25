import { usePage } from '@inertiajs/react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type AddressValue = {
    label: string;
    address_line: string;
    village: string;
    district: string;
    city: string;
    province: string;
    postal_code: string;
};

interface AddressProps {
    value: AddressValue;
    onChange: (next: AddressValue) => void;
    errors?: Record<string, string | undefined>;
    defaultOpen?: boolean;
    title?: string;
}

export default function AddressSection({
    value,
    onChange,
    errors = {},
    defaultOpen = true,
    title = 'Address',
}: AddressProps) {
    const { props } = usePage<{ options: { addressLabels: string[] } }>();
    const addressLabels = props.options.addressLabels;

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
                    {title}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address_line">
                                Alamat{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="address_line"
                                name="address[address_line]"
                                rows={3}
                                value={value.address_line}
                                onChange={(e) =>
                                    setField('address_line', e.target.value)
                                }
                                placeholder="Nama jalan, nomor rumah, RT/RW"
                            />
                            {errors['address.address_line'] && (
                                <p className="text-xs text-destructive">
                                    {errors['address.address_line']}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="village">
                                    Kelurahan/Desa{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="village"
                                    name="address[village]"
                                    value={value.village}
                                    onChange={(e) =>
                                        setField('village', e.target.value)
                                    }
                                    placeholder="Masukkan kelurahan/desa"
                                />
                                {errors['address.village'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.village']}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="district">
                                    Kecamatan{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="district"
                                    name="address[district]"
                                    value={value.district}
                                    onChange={(e) =>
                                        setField('district', e.target.value)
                                    }
                                    placeholder="Masukkan kecamatan"
                                />
                                {errors['address.district'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.district']}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postal_code">
                                    Kode Pos{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="postal_code"
                                    name="address[postal_code]"
                                    value={value.postal_code}
                                    onChange={(e) =>
                                        setField('postal_code', e.target.value)
                                    }
                                    placeholder="Masukkan kode pos"
                                />
                                {errors['address.postal_code'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.postal_code']}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="city">
                                    Kota{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="city"
                                    name="address[city]"
                                    value={value.city}
                                    onChange={(e) =>
                                        setField('city', e.target.value)
                                    }
                                    placeholder="Masukkan kota/kabupaten"
                                />
                                {errors['address.city'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.city']}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">
                                    Provinsi{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="province"
                                    name="address[province]"
                                    value={value.province}
                                    onChange={(e) =>
                                        setField('province', e.target.value)
                                    }
                                    placeholder="Masukkan provinsi"
                                />
                                {errors['address.province'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.province']}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="label">Label Alamat</Label>
                                <Select
                                    value={value.label}
                                    onValueChange={(v) => setField('label', v)}
                                >
                                    <SelectTrigger id="label">
                                        <SelectValue placeholder="Pilih label alamat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addressLabels.map((label) => (
                                            <SelectItem
                                                key={label}
                                                value={label}
                                            >
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors['address.label'] && (
                                    <p className="text-xs text-destructive">
                                        {errors['address.label']}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
