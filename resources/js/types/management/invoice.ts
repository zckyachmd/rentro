export type BaseInvoiceRow = {
    id: string;
    number: string;
    due_date: string;
    amount_idr: number;
    outstanding?: number;
    ticket_url?: string | null;
    status: string; // e.g., 'pending' | 'overdue' | 'paid' | 'cancelled'
    tenant?: string | null;
    room_number?: string | null;
};

export type CreateColumnsOpts<T extends BaseInvoiceRow> = {
    onCancel?: (inv: T) => void;
    onShowDetail?: (inv: T) => void;
    onExtendDue?: (inv: T) => void;
    onPrint?: (inv: T) => void;
};

export type InvoiceRow = BaseInvoiceRow;

export type ContractOption = {
    id: string;
    name: string;
    period?: 'monthly' | 'weekly' | 'daily' | string;
    start_date?: string | null;
    end_date?: string | null;
};

import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';

export type ManagementInvoicePageProps = {
    invoices?: { data: InvoiceRow[] } & PaginatorMeta;
    options?: { statuses: string[]; contracts: ContractOption[] };
    filters?: { status?: string | null };
    query?: QueryBag & Record<string, unknown>;
    summary?: {
        count: number;
        count_pending: number;
        count_overdue: number;
        count_paid: number;
        sum_amount: number;
        sum_outstanding: number;
    };
};

export type InvoiceDetailTarget = { id: string; number: string } | null;
export type InvoiceItem = {
    code: string;
    label: string;
    amount_idr: number;
    meta?: Record<string, string | number | boolean | null | undefined>;
};

export type ManagementInvoiceDetailDTO = {
    invoice: {
        id: string;
        number: string;
        status: string;
        due_date?: string | null;
        period_start?: string | null;
        period_end?: string | null;
        amount_idr: number;
        items: InvoiceItem[];
        paid_at?: string | null;
        created_at?: string | null;
        release_day?: number;
    };
    contract?: {
        id: string;
        number?: string | null;
        billing_period?: string | null;
        start_date?: string | null;
        end_date?: string | null;
    } | null;
    tenant?: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    } | null;
    room?: { id: string; number?: string | null; name?: string | null } | null;
    payments?: {
        id: string;
        method: string;
        status: string;
        amount_idr: number;
        paid_at?: string | null;
        reference?: string | null;
        provider?: string | null;
    }[];
    payment_summary?: {
        total_invoice: number;
        total_paid: number;
        outstanding: number;
    };
};

export type CancelState = { target: InvoiceRow | null; reason: string };
export type ExtendState = {
    target: InvoiceRow | null;
    dueDate: string;
    reason: string;
};

export type GenerateInvoiceDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    contracts: ContractOption[];
};

export type GenerateInvoiceFormState = {
    contractId: string | null;
    mode: 'per_month' | 'full';
    periodMonth: string;
    reason: string;
    rangeFrom: string;
    rangeTo: string;
};
