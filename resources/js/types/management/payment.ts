export type PaymentRow = {
    id: string;
    method: string;
    status: string;
    amount_cents: number;
    paid_at?: string | null;
    invoice?: string | null;
    tenant?: string | null;
};

import type { PaginatorMeta } from '@/components/ui/data-table-server';
export type PaymentIndexPageProps = {
    payments?: { data: PaymentRow[] } & PaginatorMeta;
    filters?: { status?: string | null };
    options?: {
        methods: { value: string; label: string }[];
        statuses: string[];
    };
    query?: { status?: string | null; search?: string } & Record<
        string,
        unknown
    >;
    invoiceCandidates?: Array<{
        id: string;
        number: string;
        tenant?: string | null;
        room_number?: string | null;
        status: string;
        amount_cents: number;
        outstanding: number;
    }>;
};

export type ManualPaymentForm = {
    invoice_number: string;
    invoice_id: string;
    amount_cents: number | '';
    method: string;
    paid_at: string;
    note: string;
    provider: string;
    attachment: File | null;
};

export type MethodOption = { value: string; label: string };

export type ManualPaymentDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    methods: MethodOption[];
    initialInvoiceNumber?: string | null;
    invoiceCandidates?: Array<{
        id: string;
        number: string;
        tenant?: string | null;
        room_number?: string | null;
        status: string;
        amount_cents: number;
        outstanding: number;
    }>;
};

export type PaymentDetailTarget = { id: string } | null;
export type ManagementPaymentDetailDTO = {
    payment: {
        id: string;
        method: string;
        status: string;
        amount_cents: number;
        paid_at?: string | null;
        reference?: string | null;
        provider?: string | null;
        note?: string | null;
        recorded_by?: string | null;
        attachment?: string | null;
        attachment_name?: string | null;
        attachment_uploaded_at?: string | null;
        pre_outstanding_cents?: number | null;
    };
    invoice: {
        id: string;
        number: string;
        amount_cents: number;
        due_date?: string | null;
        status: string;
        paid_at?: string | null;
    } | null;
    tenant: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    } | null;
    room: { id: string; number?: string | null; name?: string | null } | null;
};

export type ManagementPaymentShowDTO = {
    payment: {
        id: string;
        method: string;
        status: string;
        amount_cents: number;
        paid_at?: string | null;
        note?: string | null;
        attachment?: string | null;
    };
    invoice?: { number: string } | null;
    tenant?: { name: string } | null;
};
