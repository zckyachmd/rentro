import { Head, useForm } from '@inertiajs/react';
import React from 'react';

import { Crumb } from '@/components/breadcrumbs';
import { DatePickerInput } from '@/components/date-picker';
import AvatarPicker from '@/components/form/avatar-picker';
import { Button } from '@/components/ui/button';
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
import AuthLayout from '@/layouts/auth-layout';
import { yesterdayISO } from '@/lib/date';
import type { EditForm, EditPageProps } from '@/types/profile';

import AddressSection from './address';
import DocumentSection from './document';

const BREADCRUMBS: Crumb[] = [
    { label: 'Profil', href: route('profile.index') },
    { label: 'Edit Profil' },
];

export default function Edit({
    user,
    address,
    document,
    options,
}: EditPageProps) {
    const initialData: EditForm = {
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        dob: user.dob ?? '',
        gender: (user.gender as EditForm['gender']) ?? '',
        avatar: null,
        address: {
            label: address?.label ?? '',
            address_line: address?.address_line ?? '',
            village: address?.village ?? '',
            district: address?.district ?? '',
            city: address?.city ?? '',
            province: address?.province ?? '',
            postal_code: address?.postal_code ?? '',
        },
        document: {
            type: document?.type ?? '',
            number: document?.number ?? '',
            file: null,
            has_file: document?.has_file ?? null,
            issued_at: document?.issued_at ?? '',
            expires_at: document?.expires_at ?? '',
            status: document?.status ?? undefined,
            notes: document?.notes ?? null,
        },
    };

    const { data, setData, processing, errors, reset, post, transform } =
        useForm<EditForm>(initialData);

    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
        null,
    );
    const onAvatarPicked = (file: File | null) => {
        setData('avatar', file ?? null);
        if (file) setAvatarPreview(URL.createObjectURL(file));
        else setAvatarPreview(null);
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        transform((form) => ({ ...form, _method: 'PATCH' }));
        post(route('profile.update'), {
            onSuccess: () => {
                setData((prev) => ({
                    ...prev,
                    avatar: null,
                    document: { ...prev.document, file: null },
                }));
                setAvatarPreview(null);
            },
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <AuthLayout pageTitle="Edit Profil" breadcrumbs={BREADCRUMBS}>
            <Head title="Edit Profil" />

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Informasi Akun</h2>
                    <p className="text-sm text-muted-foreground">
                        Perbarui data akun dan alamat.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit}>
                <div className="space-y-4">
                    <section className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                            <div className="space-y-3 md:col-span-1 lg:col-span-1 xl:col-span-1">
                                <Label>Foto Profil</Label>
                                <div className="flex flex-col items-center gap-1">
                                    <AvatarPicker
                                        src={avatarPreview ?? user.avatar_url}
                                        alt={user.name}
                                        fallback={user.name
                                            ?.split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        onPick={onAvatarPicked}
                                    />
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        JPG/PNG, maks 2MB. Rasio square
                                        disarankan.
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Nama Lengkap{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Masukkan nama lengkap"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            value={data.username}
                                            onChange={(e) =>
                                                setData(
                                                    'username',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan username"
                                        />
                                        <InputError message={errors.username} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            placeholder="Masukkan alamat email"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">
                                            Telepon{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                            placeholder="Masukkan nomor telepon"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">
                                            Tanggal Lahir
                                        </Label>
                                        <DatePickerInput
                                            id="dob"
                                            name="dob"
                                            value={data.dob}
                                            onChange={(v) =>
                                                setData('dob', v ?? '')
                                            }
                                            placeholder="Pilih tanggal lahir"
                                            max={yesterdayISO()}
                                        />
                                        <InputError message={errors.dob} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>
                                            Jenis Kelamin{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.gender}
                                            onValueChange={(v) =>
                                                setData(
                                                    'gender',
                                                    v as EditForm['gender'],
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.genders.map((g) => (
                                                    <SelectItem
                                                        key={g}
                                                        value={g}
                                                    >
                                                        {g
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            g.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            name="gender"
                                            value={data.gender}
                                        />
                                        <InputError message={errors.gender} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Address */}
                    <AddressSection
                        value={data.address}
                        onChange={(next) => setData('address', next)}
                        errors={errors}
                    />

                    {/* Document */}
                    <DocumentSection
                        value={data.document}
                        onChange={(next) => setData('document', next)}
                        errors={errors}
                        documentTypes={options.documentTypes}
                        documentStatuses={options.documentStatuses}
                    />
                </div>

                <p className="mb-4 mt-2 text-xs text-muted-foreground">
                    Tanda <span className="text-destructive">*</span> menandakan
                    kolom wajib diisi.
                </p>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                    >
                        Reset
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
