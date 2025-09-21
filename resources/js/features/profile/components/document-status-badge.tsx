import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export default function DocumentStatusBadge({
    status,
}: {
    status: 'approved' | 'pending' | 'rejected';
}) {
    if (status === 'approved')
        return (
            <Badge className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Disetujui
            </Badge>
        );
    if (status === 'pending')
        return <Badge variant="secondary">Menunggu</Badge>;
    return <Badge variant="destructive">Ditolak</Badge>;
}
