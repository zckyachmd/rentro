import { usePage } from '@inertiajs/react';
import {
    Facebook,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    Phone,
    Twitter,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import NewsletterForm from '@/components/newsletter-form';
import { PublicFooterMenu } from '@/layouts/public/menu';
import type { PublicFooterSection } from '@/types/navigation';
import type { InertiaSharedProps } from '@/types/shared';

type PublicFooterProps = {
    brandLabel?: string;
};

export default function PublicFooter({
    brandLabel = 'Rentro',
}: PublicFooterProps) {
    const { t } = useTranslation('public/footer');
    const page = usePage();
    const serverProps = page.props as unknown as InertiaSharedProps;
    const serverSections = serverProps?.publicFooterMenus as
        | PublicFooterSection[]
        | undefined;
    const sections = React.useMemo<PublicFooterSection[]>(
        () => (serverSections ?? []).slice(0, 2),
        [serverSections],
    );
    const dynamicWidthClass = React.useMemo(() => {
        const n = sections.length;
        if (n <= 1) return 'md:max-w-[220px]'; // 1 parent: sempit
        if (n === 2) return 'md:max-w-[360px]'; // 2 parent: dua kolom pas
        return 'md:max-w-[640px]'; // 3+ parent: lebar
    }, [sections.length]);
    return (
        <>
            {/* Sub-footer (info area) */}
            <footer className="bg-muted/40 border-t">
                <div className="container mx-auto flex flex-col gap-5 px-4 py-10 sm:gap-7 md:grid md:grid-cols-[220px_260px_auto_360px] md:gap-x-2">
                    {/* Brand */}
                    <div className="w-full space-y-2 md:max-w-[220px] md:justify-self-start md:pr-5">
                        <div>
                            <div className="text-2xl leading-snug font-semibold tracking-tight sm:text-2xl md:text-2xl lg:text-3xl">
                                {brandLabel}
                            </div>
                            <p className="text-muted-foreground text-[15px] sm:text-sm">
                                {t(
                                    'brand.description',
                                    'Platform manajemen penyewaan kamar yang modern dan mudah.',
                                )}
                            </p>

                            {/* Social media under brand description */}
                            <div className="mt-3 flex items-center justify-start gap-3">
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t(
                                        'social.instagram',
                                        'Instagram',
                                    )}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t('social.twitter', 'Twitter')}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Twitter className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t(
                                        'social.facebook',
                                        'Facebook',
                                    )}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t(
                                        'social.linkedin',
                                        'LinkedIn',
                                    )}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="bg-border h-px w-full md:hidden" />

                    {/* Kontak */}
                    <div className="w-full space-y-2.5 text-left md:max-w-[240px] md:justify-self-start md:pl-5">
                        <h3 className="text-foreground/80 mb-2 text-xs font-semibold tracking-wider uppercase">
                            {t('contact.title', 'Kontak')}
                        </h3>
                        <ul className="text-muted-foreground space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    aria-hidden
                                />
                                <span>
                                    Jl. Contoh No. 123, Jakarta
                                    <br />
                                    Indonesia 12345
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden
                                />
                                <a
                                    href="tel:+6281234567890"
                                    className="hover:text-foreground"
                                >
                                    +62 812-3456-7890
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden
                                />
                                <a
                                    href="mailto:hello@rentro.app"
                                    className="hover:text-foreground"
                                >
                                    hello@rentro.app
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-border h-px w-full md:hidden" />

                    {/* Dynamic footer sections from server */}
                    <div
                        className={`w-full md:col-span-1 md:col-start-3 md:justify-self-start md:px-0 ${dynamicWidthClass} grid grid-cols-1 gap-x-2 gap-y-2 md:grid-cols-2`}
                    >
                        <PublicFooterMenu sections={sections} />
                    </div>

                    {/* Newsletter */}
                    <div className="w-full space-y-3 md:col-span-1 md:col-start-4 md:max-w-[400px] md:justify-self-end">
                        <h3 className="text-foreground/80 mb-2 text-xs font-semibold tracking-wider uppercase">
                            {t('newsletter.title', 'Newsletter')}
                        </h3>
                        <NewsletterForm />
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {t(
                                'newsletter.help',
                                'Masukkan email untuk menerima kabar terbaru.',
                            )}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Footer baseline (static, not sticky/fixed) */}
            <div className="bg-background border-t">
                <div className="text-muted-foreground container mx-auto flex h-14 items-center justify-between px-4 text-xs">
                    <span>
                        © {new Date().getFullYear()} {brandLabel}.{' '}
                        {t('baseline.copyright_suffix', 'All rights reserved.')}
                    </span>
                    <span>
                        {t('baseline.developed_by', 'Developed by')}{' '}
                        <a
                            href="https://s.id/zckyachmd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground"
                            aria-label={t(
                                'baseline.developer_website',
                                'Developer website',
                            )}
                        >
                            Zacky Achmad
                        </a>
                    </span>
                </div>
            </div>
        </>
    );
}
