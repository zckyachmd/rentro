import { router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ContactsTable from '@/features/profile/components/contacts-table';
import ContactDeleteDialog from '@/features/profile/dialogs/contact-delete-dialog';
import ContactDialog from '@/features/profile/dialogs/contact-dialog';
import type {
    ContactDTO,
    ContactFormState,
    ContactProps,
} from '@/types/profile';

export default function ContactSection({ contacts }: ContactProps) {
    const { options } = usePage<{
        errors?: Record<string, string>;
        options: {
            emergencyRelationshipLabel: string[];
            emergencyContactsMax?: number;
        };
    }>().props;
    const MAX_CONTACTS = Number(options.emergencyContactsMax ?? 3);
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
                setDeleteTarget(null);
            },
            onFinish: () => {},
            preserveScroll: true,
            replace: true,
        });
    }, [deleteTarget]);

    const [formState, setFormState] = React.useState<ContactFormState | null>(
        null,
    );

    const resetContactForm = () => {
        setFormState(null);
    };

    const openAddContact = React.useCallback(() => {
        if (!canAdd) return;
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
        router.post(actionRoute, fd, {
            forceFormData: true,
            onStart: () =>
                setFormState((s) => (s ? { ...s, processing: true } : s)),
            onFinish: () =>
                setFormState((s) => (s ? { ...s, processing: false } : s)),
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                resetContactForm();
            },
            onError: () => {
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
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddContact}
                        disabled={!canAdd}
                    >
                        Tambah Kontak
                    </Button>
                    {formState && (
                        <ContactDialog
                            open={formState !== null}
                            mode={formState.mode}
                            values={formState.values}
                            onValuesChange={(next) =>
                                setFormState((s) =>
                                    s
                                        ? {
                                              ...s,
                                              values: {
                                                  ...s.values,
                                                  ...next,
                                                  name:
                                                      next.name ??
                                                      s.values.name ??
                                                      '',
                                                  phone:
                                                      next.phone ??
                                                      s.values.phone ??
                                                      '',
                                                  relationship:
                                                      next.relationship ??
                                                      s.values.relationship ??
                                                      '',
                                                  email:
                                                      next.email ??
                                                      s.values.email ??
                                                      '',
                                                  address_line:
                                                      next.address_line ??
                                                      s.values.address_line ??
                                                      '',
                                              },
                                          }
                                        : s,
                                )
                            }
                            relationshipOptions={
                                options.emergencyRelationshipLabel
                            }
                            showErrors={formState.showErrors}
                            processing={formState.processing}
                            onCancel={resetContactForm}
                            onSubmit={submitContact}
                        />
                    )}
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
                    <ContactsTable
                        contacts={contacts}
                        onEdit={openEditContact}
                        onDelete={askDelete}
                    />
                </>
            )}
            <ContactDeleteDialog
                target={deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </section>
    );
}
