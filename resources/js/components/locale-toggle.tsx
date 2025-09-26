import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { postJson } from '@/lib/api';

type Props = {
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?:
        | 'ghost'
        | 'secondary'
        | 'default'
        | 'destructive'
        | 'link'
        | 'outline';
    className?: string;
};

export default function LocaleToggle({
    size = 'sm',
    variant = 'ghost',
    className,
}: Props) {
    const { t: tNav, i18n } = useTranslation('nav');
    const { setLocale } = useLocale();

    const label = i18n.language?.toLowerCase().startsWith('id') ? 'ID' : 'EN';

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            className={className}
            aria-label={tNav('language', 'Language')}
            title={tNav('language', 'Language')}
            onClick={async () => {
                const next = i18n.language?.toLowerCase().startsWith('id')
                    ? 'en'
                    : 'id';
                setLocale(next as 'en' | 'id');
                try {
                    await postJson(route('preferences.locale'), {
                        locale: next,
                    });
                } catch {
                    // ignore
                }
                try {
                    router.visit(window.location.href, {
                        only: ['publicMenus', 'publicFooterMenus'],
                        preserveScroll: true,
                        replace: true,
                    });
                } catch {
                    // ignore
                }
            }}
        >
            {label}
        </Button>
    );
}
