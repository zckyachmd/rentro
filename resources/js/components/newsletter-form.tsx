import React from 'react';
import { useTranslation } from 'react-i18next';

export default function NewsletterForm() {
    const { t } = useTranslation('public/footer');
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await fetch(route('public.newsletter.subscribe'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: 'same-origin',
            });
            setEmail('');
        } catch {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="w-full">
            <input
                type="email"
                required
                placeholder={t('newsletter.placeholder', 'Email kamu')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background placeholder:text-muted-foreground/70 focus:border-foreground/20 h-9 w-full rounded-md border px-3 text-sm ring-0 outline-none focus:outline-none"
                aria-label={t('newsletter.aria_email', 'Email')}
                disabled={loading}
            />
        </form>
    );
}
