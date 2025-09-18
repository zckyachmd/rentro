export type HandoverMode = 'checkin' | 'checkout';

export type ManagementHandover = {
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

export type HandoverCreateFormState = {
    notes: string;
    files: { general?: File[] };
};

export type HandoverCreateErrorKey =
    | keyof HandoverCreateFormState
    | 'files.general'
    | `files.general.${number}`;
