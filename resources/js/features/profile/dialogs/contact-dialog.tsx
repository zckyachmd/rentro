import * as React from 'react';

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
                            ? 'Kontak Referensi Pengelola'
                            : 'Edit Kontak Referensi Pengelola'}
                    </DialogTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Kami tidak akan membagikan informasi sensitif. Data ini
                        hanya dipakai saat diperlukan untuk kenyamanan dan
                        keamanan Anda.
                    </p>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-name">
                                Nama <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="c-name"
                                value={values.name}
                                onChange={(e) =>
                                    setField('name', e.target.value)
                                }
                                required
                                placeholder="Nama lengkap (mis. Siti)"
                            />

                            {showErrors && !values.name ? (
                                <InputError
                                    name="name"
                                    message={
                                        showErrors && !values.name
                                            ? 'Wajib diisi.'
                                            : undefined
                                    }
                                />
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Orang yang bersedia dihubungi bila
                                    diperlukan.
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-phone">
                                No. HP/WhatsApp{' '}
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
                                placeholder="08xxxxxxxxxx"
                                autoComplete="tel"
                            />
                            {showErrors && !values.phone ? (
                                <InputError
                                    name="phone"
                                    message="Wajib diisi."
                                />
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Gunakan nomor aktif. Nomor ini harus berbeda
                                    dengan kontak referensi lainnya.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-rel">
                                Hubungan{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={values.relationship}
                                onValueChange={(v) =>
                                    setField('relationship', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih hubungan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {relationshipOptions.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                name="relationship"
                                message={
                                    showErrors && !values.relationship
                                        ? 'Wajib diisi.'
                                        : undefined
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-email">Email</Label>
                            <Input
                                id="c-email"
                                type="email"
                                value={values.email || ''}
                                onChange={(e) =>
                                    setField('email', e.target.value)
                                }
                                placeholder="opsional@contoh.com"
                            />
                            <InputError name="email" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="c-address">Alamat</Label>
                        <Textarea
                            id="c-address"
                            value={values.address_line || ''}
                            onChange={(e) =>
                                setField('address_line', e.target.value)
                            }
                            rows={3}
                            placeholder="Nama jalan, RT/RW, kota (opsional)"
                        />
                        <p className="text-xs text-muted-foreground">
                            Opsional. Isi bila memudahkan kami mengidentifikasi
                            alamat.
                        </p>
                        <InputError name="address_line" />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {mode === 'create' ? 'Simpan' : 'Update'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
