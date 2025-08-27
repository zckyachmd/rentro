import { Head, useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

import { Crumb } from '@/components/breadcrumbs';
import { DatePickerInput } from '@/components/date-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AuthLayout from '@/layouts/auth-layout';

import AddressSection from './partials/address';
import DocumentSection from './partials/document';

type UserDTO = {
    id: number;
    name: string;
    username: string;
    email: string;
    phone?: string | null;
    dob?: string | null;
    gender?: 'male' | 'female' | null;
    avatar_url?: string | null;
};

type AddressDTO = {
    id?: number;
    label?: string | null;
    address_line: string;
    village?: string | null;
    district?: string | null;
    city: string;
    province: string;
    postal_code?: string | null;
} | null;

type DocumentDTO = {
    id?: number;
    type?: 'KTP' | 'SIM' | 'PASSPORT' | 'NPWP' | 'other' | null;
    number?: string | null;
    has_file?: boolean | null;
    issued_at?: string | null;
    expires_at?: string | null;
    status?: 'pending' | 'approved' | 'rejected' | null;
    notes?: string | null;
} | null;

type PageProps = {
    user: UserDTO;
    address: AddressDTO;
    document?: DocumentDTO;
    status?: string | null;
    options: {
        genders: string[];
        documentTypes: string[];
        documentStatuses: string[];
    };
};

type FormData = {
    name: string;
    username: string;
    email: string;
    phone: string;
    dob: string;
    gender: '' | 'male' | 'female' | 'other';
    avatar: File | null;
    address: {
        label: string;
        address_line: string;
        village: string;
        district: string;
        city: string;
        province: string;
        postal_code: string;
    };
    document: {
        type: '' | 'KTP' | 'SIM' | 'PASSPORT' | 'NPWP' | 'other';
        number: string;
        file: File | null;
        has_file?: boolean | null;
        issued_at: string;
        expires_at: string;
        status?: 'pending' | 'approved' | 'rejected';
        notes?: string | null;
    };
};

const BREADCRUMBS: Crumb[] = [
    { label: 'Profil', href: route('profile.show') },
    { label: 'Edit Profil' },
];

export default function Edit({ user, address, document, options }: PageProps) {
    const initialData: FormData = {
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        dob: user.dob ?? '',
        gender: (user.gender as FormData['gender']) ?? '',
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
        useForm<FormData>(initialData);

    const fileRef = React.useRef<HTMLInputElement | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
        null,
    );

    const onPickAvatar = () => fileRef.current?.click();
    const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] || null;
        setData('avatar', file ?? null);
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatarPreview(url);
        } else {
            setAvatarPreview(null);
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        transform((form) => ({ ...form, _method: 'PATCH' }));
        post(route('profile.update'), {
            onSuccess: () => {
                toast.success('Profil berhasil diperbarui');
                setData((prev) => ({
                    ...prev,
                    avatar: null,
                    document: { ...prev.document, file: null },
                }));
                setAvatarPreview(null);
                if (fileRef.current) fileRef.current.value = '';
            },
            onError: () => toast.error('Gagal memperbarui profil'),
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
                                    <div
                                        className="group relative cursor-pointer"
                                        onClick={onPickAvatar}
                                    >
                                        <Avatar className="size-28 ring-2 ring-transparent transition group-hover:ring-primary md:size-32 lg:size-36">
                                            <AvatarImage
                                                src={
                                                    avatarPreview ??
                                                    user.avatar_url ??
                                                    undefined
                                                }
                                                alt={user.name}
                                            />
                                            <AvatarFallback>
                                                {user.name
                                                    ?.split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                                            <span className="text-xs text-white">
                                                Klik untuk ganti
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        JPG/PNG, maks 2MB. Rasio square
                                        disarankan.
                                    </p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        name="avatar"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onAvatarChange}
                                    />
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
                                        {errors.name && (
                                            <p className="text-xs text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
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
                                        {errors.username && (
                                            <p className="text-xs text-destructive">
                                                {errors.username}
                                            </p>
                                        )}
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
                                        {errors.email && (
                                            <p className="text-xs text-destructive">
                                                {errors.email}
                                            </p>
                                        )}
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
                                        {errors.phone && (
                                            <p className="text-xs text-destructive">
                                                {errors.phone}
                                            </p>
                                        )}
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
                                        />
                                        {errors.dob && (
                                            <p className="text-xs text-destructive">
                                                {errors.dob}
                                            </p>
                                        )}
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
                                                    v as FormData['gender'],
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
                                        {errors.gender && (
                                            <p className="text-xs text-destructive">
                                                {errors.gender}
                                            </p>
                                        )}
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
