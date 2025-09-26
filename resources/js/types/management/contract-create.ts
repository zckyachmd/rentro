export type PageOptions = {
    tenants?: TenantOption[];
    rooms?: RoomOption[];
    billing_periods?: PeriodOption[];
    today_date?: string;
    contract_settings?: {
        daily_max_days?: number;
        weekly_max_weeks?: number;
        monthly_allowed_terms?: number[];
        prorata?: boolean;
        release_day_of_month?: number;
        due_day_of_month?: number;
        auto_renew_default?: boolean;
    };
};

export type TenantOption = {
    id: number | string;
    name: string;
    email?: string;
};
export type PeriodOption = {
    value: string;
    label: string;
    days?: number | null;
};
export type RoomOption = {
    id: string;
    number: string;
    name?: string | null;
    prices?: Partial<Record<'daily' | 'weekly' | 'monthly', number | null>>;
    deposits?: Partial<Record<'daily' | 'weekly' | 'monthly', number | null>>;
    billing_period?: string | null;
    building_name?: string | null;
    floor_level?: number | null;
    building?: { id: number | string; name?: string | null } | null;
    floor?: { id: number | string; level?: number | null } | null;
    floor_label?: string;
    floor_label_text?: string;
    building_label?: string;
    building_short_name?: string;
    room_name?: string;
};

export type ContractCreateForm = {
    user_id: string;
    room_id: string;
    start_date: string;
    end_date?: string;
    rent_rupiah: string;
    deposit_rupiah: string;
    rent_idr?: number;
    deposit_idr?: number;
    billing_period: string;
    billing_day: string;
    auto_renew: boolean;
    notes?: string;
};

export type ContractCreateLocal = {
    duration_count: string;
    monthly_payment_mode: 'per_month' | 'full';
};
