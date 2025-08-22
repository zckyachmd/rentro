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

const MAX_CONTACTS = 3;

export default function ContactSection({ contacts }: Props) {
    const { errors, options } = usePage<{
        errors?: Record<string, string>;
        options: { emergencyRelationshipLabel: string[] };
    }>().props;
    const total = contacts.length;
    const canAdd = total < MAX_CONTACTS;

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<{
        id: number;
        name: string;
    } | null>(null);

    const askDelete = React.useCallback((c: ContactDTO) => {
        setDeleteTarget({ id: c.id, name: c.name });
        setDeleteDialogOpen(true);
    }, []);

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget) return;
        router.delete(route('profile.contacts.destroy', deleteTarget.id), {
            onStart: () => {},
            onSuccess: () => {
                toast.success('Kontak darurat dihapus');
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
            },
            onError: () => toast.error('Gagal menghapus kontak'),
            onFinish: () => {},
            preserveScroll: true,
            replace: true,
        });
    }, [deleteTarget]);

    const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
    const [contactMode, setContactMode] = React.useState<'create' | 'edit'>(
        'create',
    );

    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [contactForm, setContactForm] = React.useState({
        name: '',
        phone: '',
        relationship: '',
        email: '',
        address_line: '',
    });

    const resetContactForm = () => {
        setEditingId(null);
        setContactMode('create');
        setContactForm({
            name: '',
            phone: '',
            relationship: '',
            email: '',
            address_line: '',
        });
    };

    const openAddContact = React.useCallback(() => {
        if (!canAdd) {
            toast.error(`Maksimal ${MAX_CONTACTS} kontak darurat.`);
            return;
        }
        resetContactForm();
        setContactMode('create');
        setContactDialogOpen(true);
    }, [canAdd]);

    const openEditContact = React.useCallback((c: ContactDTO) => {
        setEditingId(c.id);
        setContactMode('edit');
        setContactForm({
            name: c.name || '',
            phone: c.phone || '',
            relationship: c.relationship || '',
            email: c.email || '',
            address_line: c.address_line || '',
        });
        setContactDialogOpen(true);
    }, []);

    const [submitting, setSubmitting] = React.useState(false);

    const submitContact = (e: React.FormEvent) => {
        e.preventDefault();

        const fd = new FormData();
        if (contactMode === 'edit' && editingId) {
            fd.append('_method', 'put');
        }
        fd.append('name', contactForm.name);
        fd.append('phone', contactForm.phone);
        fd.append('relationship', contactForm.relationship ?? '');
        fd.append('email', contactForm.email ?? '');
        fd.append('address_line', contactForm.address_line ?? '');

        const common = {
            forceFormData: true,
            onStart: () => setSubmitting(true),
            onFinish: () => setSubmitting(false),
            preserveScroll: true,
            replace: true,
        } as const;

        const isEdit = contactMode === 'edit' && !!editingId;
        const actionRoute = isEdit
            ? route('profile.contacts.update', editingId)
            : route('profile.contacts.store');

        const successMsg = isEdit
            ? 'Kontak darurat diperbarui'
            : 'Kontak darurat ditambahkan';

        router.post(actionRoute, fd, {
            ...common,
            onSuccess: () => {
                toast.success(successMsg);
                setContactDialogOpen(false);
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
                        open={contactDialogOpen}
                        onOpenChange={setContactDialogOpen}
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
                        <DialogContent className="animate-none sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {contactMode === 'create'
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
                                            value={contactForm.name}
                                            onChange={(e) =>
                                                setContactForm((v) => ({
                                                    ...v,
                                                    name: e.target.value,
                                                }))
                                            }
                                            autoComplete="name"
                                            aria-invalid={!!errors?.name}
                                        />
                                        {errors?.name && (
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
                                            value={contactForm.relationship}
                                            onValueChange={(v) =>
                                                setContactForm((s) => ({
                                                    ...s,
                                                    relationship: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger
                                                id="c-relationship"
                                                aria-invalid={
                                                    !!errors?.relationship
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
                                        {errors?.relationship && (
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
                                            value={contactForm.phone}
                                            onChange={(e) =>
                                                setContactForm((v) => ({
                                                    ...v,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            autoComplete="tel"
                                            aria-invalid={!!errors?.phone}
                                        />
                                        {errors?.phone && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="c-email">Email</Label>
                                        <Input
                                            id="c-email"
                                            type="email"
                                            placeholder="email@contoh.com"
                                            value={contactForm.email}
                                            onChange={(e) =>
                                                setContactForm((v) => ({
                                                    ...v,
                                                    email: e.target.value,
                                                }))
                                            }
                                            autoComplete="email"
                                            aria-invalid={!!errors?.email}
                                        />
                                        {errors?.email && (
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
                                            value={contactForm.address_line}
                                            onChange={(e) =>
                                                setContactForm((v) => ({
                                                    ...v,
                                                    address_line:
                                                        e.target.value,
                                                }))
                                            }
                                            aria-invalid={
                                                !!errors?.address_line
                                            }
                                        />
                                        {errors?.address_line && (
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
                                        onClick={() => {
                                            setContactDialogOpen(false);
                                            resetContactForm();
                                        }}
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting
                                            ? 'Menyimpan...'
                                            : contactMode === 'create'
                                              ? 'Simpan'
                                              : 'Update'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
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
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                            onClick={() => setDeleteDialogOpen(false)}
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
