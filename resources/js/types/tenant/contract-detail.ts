export type TenantContractDetail = {
    id: string;
    number?: string | null;
    updated_at?: string | null;
    room: {
        id: string;
        number: string;
        name?: string | null;
        price_idr?: number | null;
        billing_period?: string | null;
        building?: { id: string; name: string; code?: string | null } | null;
        floor?: { id: string; level: string | number } | null;
        type?: { id: string; name: string; price_idr?: number | null } | null;
    } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_idr: number;
    deposit_idr?: number | null;
    billing_period?: string | null;
    billing_day?: number | null;
    status: string;
    auto_renew: boolean;
    notes?: string;
};

export type InvoiceItem = {
    id: string;
    number: string;
    period_start?: string | null;
    period_end?: string | null;
    due_date?: string | null;
    amount_idr: number;
    status: string;
    paid_at?: string | null;
};

export type Paginator<T> = {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
};

export type TenantContractDetailPageProps = {
    contract: TenantContractDetail;
    invoices: Paginator<InvoiceItem>;
};
