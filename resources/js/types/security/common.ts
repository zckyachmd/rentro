// Shared security types
export type SessionItem = {
    id: string;
    agent?: string;
    agent_label?: string;
    ip_address?: string;
    last_active?: string;
    current?: boolean;
};

export type Summary = {
    email_verified?: boolean;
    two_factor_enabled?: boolean;
    last_password_changed_at?: string | null;
};
