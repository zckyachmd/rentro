import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, ShieldCheck, FileText } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AttachmentPreviewDialog from '@/components/attachment-preview';
import ShowMore from '@/components/ui/show-more';
import { AppLayout } from '@/layouts';
import { formatDate } from '@/lib/format';
import type { ShowPageProps as ProfileShowPageProps } from '@/types/profile';
import ContactsTable from '@/pages/profile/components/contacts-table';

type PageProps = InertiaPageProps &
    Pick<ProfileShowPageProps, 'user' | 'addresses' | 'document' | 'contacts' | 'options'>;

const fmt = (d?: string | null) => formatDate(d ?? undefined, false);

export default function ManagementUserDetail() {
    const { t } = useTranslation();
    const { t: tEnum } = useTranslation('enum');
    const { props } = usePage<PageProps>();
    const { user, addresses, document, contacts } = props;

    const rowCls = 'flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4';
    const dtCls = 'w-36 md:w-40 shrink-0 font-medium text-muted-foreground';

    const primaryAddress = addresses.find((a) => a.is_primary) || addresses[0] || null;
    const joinedAddress = primaryAddress
        ? [
              primaryAddress.address_line,
              primaryAddress.village,
              primaryAddress.district,
              primaryAddress.city,
              primaryAddress.province,
              primaryAddress.postal_code,
          ]
              .filter(Boolean)
              .join(', ')
        : '';

    // Email verification status only (resend is handled elsewhere)

    // Document verification
    const [note, setNote] = React.useState('');
    const [rejectOpen, setRejectOpen] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const attachmentUrls = React.useMemo(() => {
        const list = document?.attachments || [];
        return list.map((p) =>
            route('management.users.document.attachment', {
                user: user.id,
                path: p,
            }),
        );
    }, [document?.attachments, user.id]);

    const approve = React.useCallback(() => {
        if (!document?.id) return;
        const fd = new FormData();
        if (note.trim()) fd.append('note', note.trim());
        router.post(route('management.users.document.approve', user.id), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setNote(''),
        });
    }, [document?.id, note, user.id]);

    const reject = React.useCallback(() => {
        if (!document?.id) return;
        const fd = new FormData();
        fd.append('reason', note.trim());
        router.post(route('management.users.document.reject', user.id), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setNote('');
                setRejectOpen(false);
            },
        });
    }, [document?.id, note, user.id]);

    const canVerify = document?.status === 'pending';

    return (
        <AppLayout pageTitle={`User: ${user.name}`} pageDescription="User details & verification">
            <div className="space-y-8 md:space-y-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left md:gap-10 lg:gap-12">
                        <Avatar className="size-20 md:size-28 lg:size-32">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                            <AvatarFallback>
                                {user.name
                                    ? user.name
                                          .match(/\b\w/g)
                                          ?.join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                    : 'US'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl md:text-4xl">
                                {user.name}
                            </h1>
                            <div className="text-muted-foreground text-sm sm:text-base">
                                @{user.username || 'username'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-center sm:self-auto">
                        <Button asChild size="sm" variant="outline">
                            <Link href={route('management.users.index')}>{t('common.back')}</Link>
                        </Button>
                    </div>
                </div>

                {/* Account Information */}
                <section>
                    <h2 className="text-xl font-semibold">{t('profile:account_info')}</h2>
                    <Separator className="mt-2 mb-6" />
                    <dl className="divide-muted/20 divide-y">
                        {/* Email */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('common.email')}</dt>
                            <dd className="flex items-center gap-2 text-base">
                                {user.email ? (
                                    <CopyInline value={user.email} variant="link" successMessage={t('profile:email_copied')}>
                                        {user.email}
                                    </CopyInline>
                                ) : (
                                    <span>-</span>
                                )}
                                {user.email_verified_at ? (
                                    <Badge className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> {t('profile:verified')}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1">
                                        <CircleAlert className="h-3 w-3" /> {t('profile:unverified')}
                                    </Badge>
                                )}
                            </dd>
                        </div>
                        {/* Phone */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('profile:phone')}</dt>
                            <dd className="text-base">
                                {user.phone ? (
                                    <CopyInline value={user.phone} variant="link" className="font-mono" successMessage={t('profile:phone_copied')}>
                                        {user.phone}
                                    </CopyInline>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>
                        {/* Gender */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('profile:gender')}</dt>
                            <dd>
                                {user.gender ? (
                                    <Badge variant="secondary" className="capitalize">
                                        {tEnum(`gender.${user.gender}`, { defaultValue: user.gender })}
                                    </Badge>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>
                        {/* Date of Birth */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('profile:dob')}</dt>
                            <dd className="text-base">{fmt(user.dob)}</dd>
                        </div>
                        {/* Address */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('profile:address.title')}</dt>
                            <dd className="text-muted-foreground text-base leading-relaxed">
                                {primaryAddress ? <ShowMore text={joinedAddress} limit={140} /> : '-'}
                            </dd>
                        </div>
                        {/* Identity */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('profile:identity')}</dt>
                            <dd className="text-base">
                                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">{t('profile:identity_type')}</span>
                                        <span className="capitalize">
                                            {document ? tEnum(`document.type.${document.type}`, { defaultValue: document.type || '' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">{t('profile:identity_number')}</span>
                                        <span className="font-mono text-xs">{document?.number || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">{t('profile:identity_status')}</span>
                                        <span>
                                            {document ? (
                                                document.status === 'approved' ? (
                                                    <Badge className="gap-1">
                                                        <ShieldCheck className="h-3 w-3" /> {tEnum('document.status.approved')}
                                                    </Badge>
                                                ) : document.status === 'pending' ? (
                                                    <Badge variant="secondary">{tEnum('document.status.pending')}</Badge>
                                                ) : (
                                                    <Badge variant="destructive">{tEnum('document.status.rejected')}</Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Document Verification */}
                <section>
                    <h2 className="text-xl font-semibold">{t('profile:document.title')}</h2>
                    <Separator className="mt-2 mb-6" />
                    {document ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2">
                                <div className="text-muted-foreground">{t('profile:document.issued_at')}</div>
                                <div>{fmt(document.issued_at)}</div>
                                <div className="text-muted-foreground">{t('profile:document.expires_at')}</div>
                                <div>{fmt(document.expires_at)}</div>
                                <div className="text-muted-foreground">{t('profile:document.verify_status')}</div>
                                <div>
                                    {document.status === 'approved' ? (
                                        <Badge className="gap-1">
                                            <ShieldCheck className="h-3 w-3" /> {tEnum('document.status.approved')}
                                        </Badge>
                                    ) : document.status === 'pending' ? (
                                        <Badge variant="secondary">{tEnum('document.status.pending')}</Badge>
                                    ) : (
                                        <Badge variant="destructive">{tEnum('document.status.rejected')}</Badge>
                                    )}
                                </div>
                                <div className="text-muted-foreground">{t('common.notes')}</div>
                                {canVerify ? (
                                    <div>
                                        <Textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder={t('common.note_placeholder')}
                                            className="min-h-[90px]"
                                        />
                                        <div className="text-muted-foreground mt-1 text-[10px]">
                                            {t('common.note_required_hint')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm whitespace-pre-line">
                                        {document?.notes || '—'}
                                    </div>
                                )}
                            </div>

                            {attachmentUrls.length ? (
                                <div className="rounded-lg border p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-medium">
                                            <FileText className="h-4 w-4" /> {t('common.attachments')}
                                        </div>
                                        <span className="text-muted-foreground text-xs">
                                            {t('common.files', { count: attachmentUrls.length })}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
                                            {t('common.open')}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {canVerify ? (
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" onClick={approve}>
                                        {t('common.approve')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setRejectOpen(true)}
                                    >
                                        {t('common.reject')}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm">{t('profile:document.title')} — {t('common.not_submitted')}</div>
                    )}
                </section>

                {/* Emergency Contacts */}
                <section>
                    <h2 className="text-xl font-semibold">{t('profile:contact.title')}</h2>
                    <Separator className="mt-2 mb-6" />
                    {contacts.length ? (
                        <ContactsTable contacts={contacts} />
                    ) : (
                        <div className="text-muted-foreground text-sm">{t('profile:contact.empty')}</div>
                    )}
                </section>
            </div>

            <AttachmentPreviewDialog
                url={attachmentUrls[0] || ''}
                urls={attachmentUrls}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title={t('common.attachments')}
                description={t('common.preview_files')}
            />

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('common.reject')}</DialogTitle>
                        <DialogDescription>{t('payment.review.check_hint')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="reject_reason">
                                {t('common.notes')} <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="reject_reason"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t('payment.review.note_placeholder_required')}
                                className="min-h-[120px]"
                            />
                            <InputError message={''} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={reject} disabled={note.trim().length < 10}>
                            {t('common.reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
