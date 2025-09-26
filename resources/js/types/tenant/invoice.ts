export interface TenantInvoiceItem {
    id: string;
    number: string;
    due_date?: string | null;
    amount_idr: number;
    outstanding_idr: number;
    status: string;
    room_number?: string | null;
}

export type InvoiceItemMeta = {
    qty?: number;
    days?: number;
    free_days?: number;
    unit_price_idr?: number;
    description?: string;
    desc?: string;
    note?: string;
    date_start?: string;
    date_end?: string;
};

export type TenantInvoiceDTO = {
    invoice: {
        id: string;
        number: string;
        status: string;
        due_date?: string | null;
        amount_idr: number;
        items: Array<{
            label: string;
            amount_idr: number;
            meta?: InvoiceItemMeta;
        }>;
    };
    payment_summary?: { outstanding: number };
};

export type PendingInfo = Partial<{
    payment_type: string;
    bank: string | null;
    va_number: string | null;
    expiry_time: string | null;
    pdf_url: string | null;
    payment_code: string | null;
    store: string | null;
}>;

export type InvoiceDetailTarget = { id: string; number: string } | null;
export type InvoiceItem = {
    code?: string;
    label: string;
    amount_idr: number;
    meta?: InvoiceItemMeta;
};

export type TenantInvoiceDetailDTO = {
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
    };
    contract: {
        id: string;
        start_date?: string | null;
        end_date?: string | null;
    } | null;
    tenant: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    } | null;
    room: { id: string; number?: string | null; name?: string | null } | null;
    payments?: {
        id: string;
        method: string;
        status: string;
        amount_idr: number;
        paid_at?: string | null;
        reference?: string | null;
        provider?: string | null;
        note?: string | null;
        reject_reason?: string | null;
        review_by?: string | null;
        review_at?: string | null;
        receiver_bank?: string | null;
        receiver_account?: string | null;
        receiver_holder?: string | null;
    }[];
    payment_summary?: {
        total_invoice: number;
        total_paid: number;
        outstanding: number;
    };
};

export type ColumnFactoryOptions = {
    onPay?: (row: TenantInvoiceItem) => void;
    onView?: (row: TenantInvoiceItem) => void;
    onPrint?: (row: TenantInvoiceItem) => void;
};

// Index page auxiliary types
export type QueryInit = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

export type SafePayload = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

export type ServerQuery = {
    [key: string]: unknown;
    page?: number;
    per_page?: number;
    search?: string | undefined;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
};

export type InvoicesPaginator = { data: TenantInvoiceItem[] } & PaginatorMeta;

export interface InvoiceIndexPageProps {
    invoices?: InvoicesPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: { statuses?: string[] };
}
import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';
