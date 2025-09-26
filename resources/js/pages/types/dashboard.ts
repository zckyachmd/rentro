export interface Filters {
    start?: string | null;
    end?: string | null;
}

export interface RoomsMetrics {
    occupancy_rate?: number;
    available?: number;
    occupied?: number;
    reserved?: number;
    vacant?: number;
    total?: number;
}

export interface ContractsMetrics {
    active?: number;
    booked?: number;
    pending_payment?: number;
}

export interface InvoicesSeriesPoint {
    date: string;
    issued?: number;
    paid?: number;
}

export interface InvoicesMetrics {
    pending?: number;
    overdue?: number;
    total_outstanding?: number;
    series?: InvoicesSeriesPoint[];
}

export interface PaymentsSeriesPoint {
    date: string;
    amount: number;
}

export interface PaymentRecent {
    id: number | string;
    tenant?: string | null;
    room?: string | null;
    invoice_no?: string | null;
    amount: number;
    paid_at: string;
}

export interface PaymentsMetrics {
    mtd?: number;
    last7d?: number;
    today?: number;
    range?: number;
    series?: PaymentsSeriesPoint[];
    recent?: PaymentRecent[];
}

export interface UpcomingItem {
    id: number | string;
    tenant?: string | null;
    room?: string | null;
    date: string;
    status?: string | null;
}

export interface UpcomingMetrics {
    checkins?: UpcomingItem[];
    checkouts?: UpcomingItem[];
}

export interface ManagementPayload {
    rooms?: RoomsMetrics;
    contracts?: ContractsMetrics;
    invoices?: InvoicesMetrics;
    payments?: PaymentsMetrics;
    upcoming?: UpcomingMetrics;
}

// Tenant dashboard types
export interface TenantInvoiceListItem {
    id: string | number;
    number: string;
    status?: string | null;
    due_date?: string | null;
    amount_cents: number;
    outstanding_cents: number;
    room_number?: string | null;
}

export interface TenantInvoicesMetrics {
    pending?: number;
    overdue?: number;
    total_outstanding?: number;
    latest?: TenantInvoiceListItem[];
}

export interface TenantPaymentsMetrics {
    recent?: Array<{
        id: string | number;
        invoice_no?: string | null;
        amount: number;
        paid_at?: string | null;
    }>;
}

export interface TenantPayload {
    invoices?: TenantInvoicesMetrics;
    payments?: TenantPaymentsMetrics;
    contracts?: {
        active?: number;
        inactive?: number;
        total?: number;
    };
}

export type DashboardProps = {
    management?: ManagementPayload;
    tenant?: TenantPayload;
    filters?: Filters;
    auth?: { user?: { roles?: string[] } };
};
