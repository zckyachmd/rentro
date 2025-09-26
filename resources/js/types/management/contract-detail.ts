export type ContractDTO = {
    id: string;
    number?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_idr: number;
    deposit_idr: number;
    billing_period: string;
    billing_day?: number | null;
    auto_renew: boolean;
    status: string;
    notes?: string | null;
    paid_in_full_at?: string | null;
    deposit_refund_idr?: number | null;
    deposit_refunded_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type TenantDTO = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
} | null;

export type RoomDTO = {
    id: string;
    number: string;
    name?: string | null;
    billing_period?: string | null;
    price_idr?: number | null;
    type?: {
        id: string;
        name: string;
        deposit_idr?: number | null;
        price_idr?: number | null;
    } | null;
    building?: { id: string; name: string; code?: string | null } | null;
    floor?: { id: string; level: number | string } | null;
} | null;

export type InvoiceItem = {
    id: string;
    number: string;
    status: string;
    due_date?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    amount_idr: number;
    paid_at?: string | null;
};

export type Paginator<T> = {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
};

export type HandoverSummary = {
    id: string;
    type: string;
    status: string;
    recorded_at?: string | null;
    notes?: string | null;
    acknowledged: boolean;
    acknowledged_at?: string | null;
    acknowledge_note?: string | null;
    disputed: boolean;
    disputed_at?: string | null;
    dispute_note?: string | null;
    attachments: string[];
    meta?: {
        redone?: boolean;
        redo?: { checkin?: boolean; checkout?: boolean };
        [key: string]: unknown;
    };
};
