import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, ShieldCheck } from 'lucide-react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import ShowMore from '@/components/ui/show-more';
import { AppLayout } from '@/layouts';
import { formatDate } from '@/lib/format';
import type { ShowPageProps } from '@/types/profile';

import ContactSection from './contact';

const fmt = (d?: string | null) => formatDate(d ?? undefined, false);

export default function ShowProfile() {
    const { t } = useTranslation();
    const { t: tEnum } = useTranslation('enum');
    const { t: tProfile } = useTranslation('profile');
    const { props } = usePage<InertiaPageProps & ShowPageProps>();
    const { user, addresses, document, contacts, mustVerifyEmail } = props;

    const rowCls =
        'flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4';
    const dtCls = 'w-36 md:w-40 shrink-0 font-medium text-muted-foreground';

    const primaryAddress =
        addresses.find((a) => a.is_primary) || addresses[0] || null;

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

    const [verifyOpen, setVerifyOpen] = React.useState(false);
    const [sending, setSending] = React.useState(false);

    const handleResendVerification = () => {
        setSending(true);
        router.post(
            route('verification.send'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setVerifyOpen(false);
                },
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <AppLayout
            pageTitle={tProfile('title')}
            pageDescription={tProfile('desc')}
        >
            <div className="space-y-8 md:space-y-8">
                {/* Profile Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left md:gap-10 lg:gap-12">
                        <Avatar className="size-20 md:size-28 lg:size-32">
                            <AvatarImage
                                src={user.avatar_url || undefined}
                                alt={user.name}
                            />
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
                            <p className="text-muted-foreground text-sm sm:text-base">
                                @{user.username || 'username'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-center sm:self-auto">
                        <Button asChild size="sm" variant="outline">
                            <Link href={route('profile.edit')}>
                                {tProfile('edit')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Account Information */}
                <section>
                    <h2 className="text-xl font-semibold">
                        {tProfile('account_info')}
                    </h2>
                    <Separator className="mt-2 mb-6" />
                    <dl className="divide-muted/20 divide-y">
                        {/* Email */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{t('common.email')}</dt>
                            <dd className="flex items-center gap-2 text-base">
                                {user.email ? (
                                    <CopyInline
                                        value={user.email}
                                        variant="link"
                                        successMessage={tProfile(
                                            'email_copied',
                                        )}
                                    >
                                        {user.email}
                                    </CopyInline>
                                ) : (
                                    <span>-</span>
                                )}
                                {mustVerifyEmail ? (
                                    <>
                                        <Badge
                                            variant="secondary"
                                            className="gap-1"
                                        >
                                            <CircleAlert className="h-3 w-3" />{' '}
                                            {tProfile('unverified')}
                                        </Badge>
                                        <Dialog
                                            open={verifyOpen}
                                            onOpenChange={setVerifyOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7"
                                                >
                                                    {tProfile('resend')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="animate-none">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {tProfile(
                                                            'verify_resend_title',
                                                        )}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        {tProfile(
                                                            'verify_resend_desc',
                                                        )}{' '}
                                                        <span className="font-medium">
                                                            {user.email}
                                                        </span>
                                                        .
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setVerifyOpen(false)
                                                        }
                                                        disabled={sending}
                                                    >
                                                        {t('common.cancel')}
                                                    </Button>
                                                    <Button
                                                        onClick={
                                                            handleResendVerification
                                                        }
                                                        disabled={sending}
                                                    >
                                                        {sending
                                                            ? tProfile(
                                                                  'verifying',
                                                              )
                                                            : tProfile(
                                                                  'verify_send',
                                                              )}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                ) : (
                                    <Badge className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" />{' '}
                                        {tProfile('verified')}
                                    </Badge>
                                )}
                            </dd>
                        </div>

                        {/* Phone */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{tProfile('phone')}</dt>
                            <dd className="text-base">
                                {user.phone ? (
                                    <CopyInline
                                        value={user.phone}
                                        variant="link"
                                        className="font-mono"
                                        successMessage={tProfile(
                                            'phone_copied',
                                        )}
                                    >
                                        {user.phone}
                                    </CopyInline>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>

                        {/* Gender */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{tProfile('gender')}</dt>
                            <dd>
                                {user.gender ? (
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {tEnum(`gender.${user.gender}`, {
                                            defaultValue: user.gender,
                                        })}
                                    </Badge>
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>

                        {/* Date of Birth */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{tProfile('dob')}</dt>
                            <dd className="text-base">{fmt(user.dob)}</dd>
                        </div>

                        {/* Address */}
                        <div className={rowCls}>
                            <dt className={dtCls}>
                                {tProfile('address.title')}
                            </dt>
                            <dd className="text-muted-foreground text-base leading-relaxed">
                                {primaryAddress ? (
                                    <ShowMore
                                        text={joinedAddress}
                                        limit={140}
                                    />
                                ) : (
                                    '-'
                                )}
                            </dd>
                        </div>

                        {/* Identity */}
                        <div className={rowCls}>
                            <dt className={dtCls}>{tProfile('identity')}</dt>
                            <dd className="text-base">
                                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">
                                            {tProfile('identity_type')}
                                        </span>
                                        <span className="capitalize">
                                            {document
                                                ? tEnum(
                                                      `document.type.${document.type}`,
                                                      {
                                                          defaultValue:
                                                              document.type,
                                                      },
                                                  )
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">
                                            {tProfile('identity_number')}
                                        </span>
                                        <span className="font-mono text-xs">
                                            {document?.number || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">
                                            {tProfile('identity_status')}
                                        </span>
                                        <span>
                                            {document ? (
                                                document.status ===
                                                'approved' ? (
                                                    <Badge className="gap-1">
                                                        <ShieldCheck className="h-3 w-3" />{' '}
                                                        {tEnum(
                                                            'document.status.approved',
                                                        )}
                                                    </Badge>
                                                ) : document.status ===
                                                  'pending' ? (
                                                    <Badge variant="secondary">
                                                        {tEnum(
                                                            'document.status.pending',
                                                        )}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        {tEnum(
                                                            'document.status.rejected',
                                                        )}
                                                    </Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Kontak Darurat */}
                <ContactSection contacts={contacts} />
            </div>
        </AppLayout>
    );
}
