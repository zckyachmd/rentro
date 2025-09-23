import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { options } = usePage<
        InertiaPageProps & {
            errors?: Record<string, string>;
            options: {
                emergencyRelationshipLabel: string[];
                emergencyContactsMax?: number;
            };
        }
    >()['props'];
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
                    {t('profile.contact.title')}
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground hidden text-xs sm:inline">
                        {t('profile.contact.max_hint', { count: MAX_CONTACTS })}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddContact}
                        disabled={!canAdd}
                    >
                        {t('profile.contact.add')}
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
            <Separator className="mt-2 mb-6" />
            {contacts.length === 0 ? (
                <>
                    <p className="text-muted-foreground text-sm">
                        {t('profile.contact.empty')}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs sm:hidden">
                        {t('profile.contact.max_hint', { count: MAX_CONTACTS })}
                    </p>
                </>
            ) : (
                <>
                    <p className="text-muted-foreground mb-2 text-xs">
                        {t('profile.contact.count', {
                            total,
                            max: MAX_CONTACTS,
                        })}
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
