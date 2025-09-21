export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export function variantForInvoiceStatus(status: string): BadgeVariant {
    switch (status) {
        case 'Paid':
            return 'default';
        case 'Overdue':
            return 'destructive';
        case 'Pending':
            return 'secondary';
        case 'Cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}

export function variantForPaymentStatus(status: string): BadgeVariant {
    switch (status) {
        case 'Review':
            return 'secondary';
        case 'Completed':
            return 'default';
        case 'Pending':
            return 'secondary';
        case 'Failed':
            return 'destructive';
        case 'Rejected':
            return 'destructive';
        case 'Cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}

export function variantForContractStatus(status: string): BadgeVariant {
    switch (status) {
        case 'Active':
        case 'Paid':
            return 'default';
        case 'Booked':
        case 'Pending Payment':
        case 'Completed':
            return 'secondary';
        case 'Overdue':
            return 'destructive';
        case 'Cancelled':
            return 'outline';
        default:
            return 'outline';
    }
}
