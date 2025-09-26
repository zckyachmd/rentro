export interface TenantContractItem {
    id: string;
    number?: string | null;
    room?: { id: string; number: string } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_idr: number;
    status: string;
    auto_renew: boolean;
    needs_ack_checkin?: boolean;
    needs_ack_checkout?: boolean;
}

export type TenantHandover = {
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
    meta?: { can_respond?: boolean };
};

export type ColumnFactoryOptions = {
    onStopAutoRenew?: (row: TenantContractItem) => void;
    onViewCheckin?: (row: TenantContractItem) => void;
    onViewCheckout?: (row: TenantContractItem) => void;
};
