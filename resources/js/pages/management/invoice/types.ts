export type InvoiceRow = {
    id: string;
    number: string;
    due_date: string;
    amount_cents: number;
    status: 'Pending' | 'Overdue' | 'Paid' | 'Cancelled' | string;
    tenant?: string | null;
    room_number?: string | null;
};

export type ContractOption = {
    id: string;
    name: string;
    period?: 'Monthly' | 'Weekly' | 'Daily' | string;
};

export type DialogState = { open: boolean; saving: boolean };

export type InvoiceDetailTarget = { id: string; number: string } | null;

export type InvoiceItem = {
    code: string;
    label: string;
    amount_cents: number;
    meta?: Record<string, any>;
};

export type InvoiceDetailData = {
    invoice: {
        id: string;
        number: string;
        status: string;
        due_date?: string | null;
        period_start?: string | null;
        period_end?: string | null;
        amount_cents: number;
        items: InvoiceItem[];
        paid_at?: string | null;
    };
    contract: { id: string; start_date?: string | null; end_date?: string | null } | null;
    tenant: { id: string; name: string; email?: string | null; phone?: string | null } | null;
    room: { id: string; number?: string | null; name?: string | null } | null;
};

export type CreateColumnsOpts = {
    onCancel?: (inv: InvoiceRow) => void;
    onShowDetail?: (inv: InvoiceRow) => void;
};
