import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

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

type PageProps = {
    user: UserDTO;
    address: AddressDTO;
    mustVerifyEmail: boolean;
    status?: string | null;
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
};

export default function Edit({ user, address, mustVerifyEmail }: PageProps) {
    const breadcrumbs = React.useMemo(
        () => [
            { label: 'Akun', href: '#' },
            { label: 'Profil', href: route('profile.show') },
            { label: 'Edit Profil' },
        ],
        [],
    );

    const initialData: FormData = {
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        dob: user.dob ?? '',
        gender: (user.gender as any) ?? '',
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
            onSuccess: () => toast.success('Profil berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui profil'),
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <AuthLayout pageTitle="Edit Profil" breadcrumbs={breadcrumbs}>
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
                <div className="space-y-8">
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
                                                <SelectItem value="male">
                                                    Laki-laki
                                                </SelectItem>
                                                <SelectItem value="female">
                                                    Perempuan
                                                </SelectItem>
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
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">Alamat</h3>
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
                                    value={data.address.address_line}
                                    onChange={(e) =>
                                        setData('address', {
                                            ...data.address,
                                            address_line: e.target.value,
                                        })
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
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="village"
                                        name="address[village]"
                                        value={data.address.village}
                                        onChange={(e) =>
                                            setData('address', {
                                                ...data.address,
                                                village: e.target.value,
                                            })
                                        }
                                        placeholder="Masukkan kelurahan/desa"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="district">
                                        Kecamatan{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="district"
                                        name="address[district]"
                                        value={data.address.district}
                                        onChange={(e) =>
                                            setData('address', {
                                                ...data.address,
                                                district: e.target.value,
                                            })
                                        }
                                        placeholder="Masukkan kecamatan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">
                                        Kode Pos{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="postal_code"
                                        name="address[postal_code]"
                                        value={data.address.postal_code}
                                        onChange={(e) =>
                                            setData('address', {
                                                ...data.address,
                                                postal_code: e.target.value,
                                            })
                                        }
                                        placeholder="Masukkan kode pos"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">
                                        Kota{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="city"
                                        name="address[city]"
                                        value={data.address.city}
                                        onChange={(e) =>
                                            setData('address', {
                                                ...data.address,
                                                city: e.target.value,
                                            })
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
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="province"
                                        name="address[province]"
                                        value={data.address.province}
                                        onChange={(e) =>
                                            setData('address', {
                                                ...data.address,
                                                province: e.target.value,
                                            })
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
                                        value={data.address.label}
                                        onValueChange={(v) =>
                                            setData('address', {
                                                ...data.address,
                                                label: v,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="label">
                                            <SelectValue placeholder="Pilih label alamat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Rumah">
                                                Rumah
                                            </SelectItem>
                                            <SelectItem value="Kantor">
                                                Kantor
                                            </SelectItem>
                                            <SelectItem value="Kampus">
                                                Kampus
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="address[label]"
                                        value={data.address.label}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
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
