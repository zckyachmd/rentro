import ShowMore from '@/components/show-more';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import { Phone, Users } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

export type ContactDTO = {
    id: number;
    name: string;
    relationship?: string | null;
    phone: string;
    email?: string | null;
    address_line?: string | null;
    is_primary: boolean;
};

type Props = {
    contacts: ContactDTO[];
};

type ContactFormState = null | {
    mode: 'create' | 'edit';
    editingId: number | null;
    values: {
        name: string;
        phone: string;
        relationship: string;
        email: string;
        address_line: string;
    };
    showErrors: boolean;
    processing: boolean;
};

const MAX_CONTACTS = 3;

export default function ContactSection({ contacts }: Props) {
    const { errors, options } = usePage<{
        errors?: Record<string, string>;
        options: { emergencyRelationshipLabel: string[] };
    }>().props;
    const total = contacts.length;
    const canAdd = total < MAX_CONTACTS;

    const [deleteTarget, setDeleteTarget] = React.useState<ContactDTO | null>(
        null,
    );

    const askDelete = React.useCallback((c: ContactDTO) => {
        setDeleteTarget(c);
    }, []);

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget) return;
        router.delete(route('profile.contacts.destroy', deleteTarget.id), {
            onStart: () => {},
            onSuccess: () => {
                toast.success('Kontak darurat dihapus');
                setDeleteTarget(null);
            },
            onError: () => toast.error('Gagal menghapus kontak'),
            onFinish: () => {},
            preserveScroll: true,
            replace: true,
        });
    }, [deleteTarget]);

    const [formState, setFormState] = React.useState<ContactFormState>(null);

    const resetContactForm = () => {
        setFormState(null);
    };

    const openAddContact = React.useCallback(() => {
        if (!canAdd) {
            toast.error(`Maksimal ${MAX_CONTACTS} kontak darurat.`);
            return;
        }
        setFormState({
            mode: 'create',
            editingId: null,
            values: {
                name: '',
                phone: '',
                relationship: '',
                email: '',
                address_line: '',
            },
            showErrors: false,
            processing: false,
        });
    }, [canAdd]);

    const openEditContact = React.useCallback((c: ContactDTO) => {
        setFormState({
            mode: 'edit',
            editingId: c.id,
            values: {
                name: c.name || '',
                phone: c.phone || '',
                relationship: c.relationship || '',
                email: c.email || '',
                address_line: c.address_line || '',
            },
            showErrors: false,
            processing: false,
        });
    }, []);

    const submitContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState) return;
        const fd = new FormData();
        if (formState.mode === 'edit' && formState.editingId) {
            fd.append('_method', 'put');
        }
        fd.append('name', formState.values.name);
        fd.append('phone', formState.values.phone);
        fd.append('relationship', formState.values.relationship ?? '');
        fd.append('email', formState.values.email ?? '');
        fd.append('address_line', formState.values.address_line ?? '');

        const isEdit = formState.mode === 'edit' && !!formState.editingId;
        const actionRoute = isEdit
            ? route('profile.contacts.update', formState.editingId as number)
            : route('profile.contacts.store');
        const successMsg = isEdit
            ? 'Kontak darurat diperbarui'
            : 'Kontak darurat ditambahkan';
        router.post(actionRoute, fd, {
            forceFormData: true,
            onStart: () =>
                setFormState((s) => (s ? { ...s, processing: true } : s)),
            onFinish: () =>
                setFormState((s) => (s ? { ...s, processing: false } : s)),
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                toast.success(successMsg);
                resetContactForm();
            },
            onError: (errs: Record<string, string>) => {
                if (!errs || Object.keys(errs || {}).length === 0) {
                    toast.error(
                        isEdit
                            ? 'Gagal memperbarui kontak'
                            : 'Gagal menambahkan kontak',
                    );
                }
                setFormState((s) => (s ? { ...s, showErrors: true } : s));
            },
        });
    };

    return (
        <section>
            <div className="mt-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5" />
                    Kontak Darurat
                </h2>
                <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                        Maksimal {MAX_CONTACTS} kontak darurat.
                    </span>
                    <Dialog
                        open={formState !== null}
                        onOpenChange={(open) => {
                            if (!open) resetContactForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={openAddContact}
                                disabled={!canAdd}
                            >
                                Tambah Kontak
                            </Button>
                        </DialogTrigger>
                        {formState && (
                            <DialogContent className="animate-none sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {formState.mode === 'create'
                                            ? 'Tambah Kontak Darurat'
                                            : 'Edit Kontak Darurat'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Isi data kontak darurat dengan benar.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submitContact}
                                    className="space-y-3"
                                >
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="c-name">
                                                Nama{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="c-name"
                                                placeholder="Nama lengkap"
                                                value={formState.values.name}
                                                onChange={(e) =>
                                                    setFormState(
                                                        (s) =>
                                                            s && {
                                                                ...s,
                                                                values: {
                                                                    ...s.values,
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            },
                                                    )
                                                }
                                                autoComplete="name"
                                                aria-invalid={
                                                    !!(
                                                        formState.showErrors &&
                                                        errors?.name
                                                    )
                                                }
                                            />
                                            {formState.showErrors &&
                                                errors?.name && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {errors.name}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="c-relationship">
                                                Hubungan{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                value={
                                                    formState.values
                                                        .relationship
                                                }
                                                onValueChange={(v) =>
                                                    setFormState(
                                                        (s) =>
                                                            s && {
                                                                ...s,
                                                                values: {
                                                                    ...s.values,
                                                                    relationship:
                                                                        v,
                                                                },
                                                            },
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="c-relationship"
                                                    aria-invalid={
                                                        !!(
                                                            formState.showErrors &&
                                                            errors?.relationship
                                                        )
                                                    }
                                                >
                                                    <SelectValue placeholder="Pilih hubungan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.emergencyRelationshipLabel.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {formState.showErrors &&
                                                errors?.relationship && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {errors.relationship}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="c-phone">
                                                No. Telepon{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="c-phone"
                                                placeholder="08xxxxxxxxxx"
                                                value={formState.values.phone}
                                                onChange={(e) =>
                                                    setFormState(
                                                        (s) =>
                                                            s && {
                                                                ...s,
                                                                values: {
                                                                    ...s.values,
                                                                    phone: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            },
                                                    )
                                                }
                                                autoComplete="tel"
                                                aria-invalid={
                                                    !!(
                                                        formState.showErrors &&
                                                        errors?.phone
                                                    )
                                                }
                                            />
                                            {formState.showErrors &&
                                                errors?.phone && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {errors.phone}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="c-email">
                                                Email
                                            </Label>
                                            <Input
                                                id="c-email"
                                                type="email"
                                                placeholder="email@contoh.com"
                                                value={formState.values.email}
                                                onChange={(e) =>
                                                    setFormState(
                                                        (s) =>
                                                            s && {
                                                                ...s,
                                                                values: {
                                                                    ...s.values,
                                                                    email: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            },
                                                    )
                                                }
                                                autoComplete="email"
                                                aria-invalid={
                                                    !!(
                                                        formState.showErrors &&
                                                        errors?.email
                                                    )
                                                }
                                            />
                                            {formState.showErrors &&
                                                errors?.email && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {errors.email}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="c-address">
                                                Alamat
                                            </Label>
                                            <Textarea
                                                id="c-address"
                                                placeholder="Nama jalan, RT/RW, kelurahan/kecamatan, kota/kabupaten"
                                                value={
                                                    formState.values
                                                        .address_line
                                                }
                                                onChange={(e) =>
                                                    setFormState(
                                                        (s) =>
                                                            s && {
                                                                ...s,
                                                                values: {
                                                                    ...s.values,
                                                                    address_line:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            },
                                                    )
                                                }
                                                aria-invalid={
                                                    !!(
                                                        formState.showErrors &&
                                                        errors?.address_line
                                                    )
                                                }
                                            />
                                            {formState.showErrors &&
                                                errors?.address_line && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {errors.address_line}
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetContactForm}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={formState.processing}
                                        >
                                            {formState.processing
                                                ? 'Menyimpan...'
                                                : formState.mode === 'create'
                                                  ? 'Simpan'
                                                  : 'Update'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        )}
                    </Dialog>
                </div>
            </div>
            <Separator className="mb-6 mt-2" />
            {contacts.length === 0 ? (
                <>
                    <p className="text-sm text-muted-foreground">
                        Belum ada kontak darurat.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground sm:hidden">
                        Maksimal {MAX_CONTACTS} kontak darurat.
                    </p>
                </>
            ) : (
                <>
                    <p className="mb-2 text-xs text-muted-foreground">
                        {total}/{MAX_CONTACTS} kontak terdaftar.
                    </p>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-3 md:py-4">
                                        Nama
                                    </TableHead>
                                    <TableHead className="py-3 md:py-4">
                                        Telepon
                                    </TableHead>
                                    <TableHead className="py-3 md:py-4">
                                        Email
                                    </TableHead>
                                    <TableHead className="py-3 md:py-4">
                                        Alamat
                                    </TableHead>
                                    <TableHead className="py-3 text-right md:py-4">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="py-3 md:py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {c.name}
                                                </span>
                                                {c.relationship && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({c.relationship})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap py-3 md:py-4">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" />
                                                <span className="truncate">
                                                    {c.phone}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[220px] truncate py-3 md:py-4">
                                            {c.email || '-'}
                                        </TableCell>
                                        <TableCell className="max-w-[320px] truncate py-3 md:py-4">
                                            {c.address_line ? (
                                                <ShowMore
                                                    text={c.address_line}
                                                    limit={60}
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap py-3 text-right md:py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditContact(c)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => askDelete(c)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
            {/* Dialog konfirmasi hapus */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Kontak Darurat</DialogTitle>
                        <DialogDescription>
                            {deleteTarget ? (
                                <>
                                    Anda akan menghapus kontak{' '}
                                    <b>{deleteTarget.name}</b>. Tindakan ini
                                    tidak dapat dibatalkan.
                                </>
                            ) : (
                                'Anda akan menghapus kontak ini. Tindakan ini tidak dapat dibatalkan.'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
