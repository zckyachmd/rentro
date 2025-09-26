import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

export default function DocumentStatusBadge({
    status,
}: {
    status: 'approved' | 'pending' | 'rejected';
}) {
    const { t } = useTranslation();
    if (status === 'approved')
        return (
            <Badge className="gap-1">
                <ShieldCheck className="h-3 w-3" /> {t('status.approved')}
            </Badge>
        );
    if (status === 'pending')
        return <Badge variant="secondary">{t('status.pending')}</Badge>;
    return <Badge variant="destructive">{t('status.rejected')}</Badge>;
}
