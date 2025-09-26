export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function normStatus(s: string): string {
    return (s || '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function variantForInvoiceStatus(status: string): BadgeVariant {
    switch (normStatus(status)) {
        case 'paid':
            return 'default';
        case 'overdue':
            return 'destructive';
        case 'pending':
            return 'secondary';
        case 'cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}

export function variantForPaymentStatus(status: string): BadgeVariant {
    switch (normStatus(status)) {
        case 'review':
            return 'secondary';
        case 'completed':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'failed':
        case 'rejected':
            return 'destructive';
        case 'cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}

export function variantForContractStatus(status: string): BadgeVariant {
    switch (normStatus(status)) {
        case 'active':
        case 'paid': // alias if ever used as a contract summary
            return 'default';
        case 'booked':
        case 'pending_payment':
        case 'completed':
            return 'secondary';
        case 'overdue':
            return 'destructive';
        case 'cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}
