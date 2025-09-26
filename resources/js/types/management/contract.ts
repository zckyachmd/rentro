export interface ContractItem {
    id: string;
    number?: string | null;
    tenant?: { id: number; name: string; email: string } | null;
    room?: { id: string; number: string } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_idr: number;
    status: string;
    auto_renew: boolean;
    has_checkin?: boolean;
    has_checkout?: boolean;
    latest_checkin_status?: string | null;
    latest_checkout_status?: string | null;
}

export type ColumnFactoryOptions = {
    onCancel?: (c: ContractItem) => void;
    onStopAutoRenew?: (c: ContractItem) => void;
    onStartAutoRenew?: (c: ContractItem) => void;
    onCheckin?: (c: ContractItem) => void;
    onCheckout?: (c: ContractItem) => void;
};
