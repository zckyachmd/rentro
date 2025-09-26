export type DocumentFormValue = {
    type: 'ktp' | 'sim' | 'passport' | 'npwp' | 'other' | '';
    number: string;
    issued_at: string;
    expires_at: string;
    file: File | null;
    has_file?: boolean | null;
    status?: 'pending' | 'approved' | 'rejected';
    notes?: string | null;
};

export type DocumentSectionProps = {
    value: DocumentFormValue;
    onChange: (next: DocumentFormValue) => void;
    errors?: Record<string, string | undefined>;
    defaultOpen?: boolean;
    title?: string;
    messages?: Partial<{
        infoTitle: string;
        filePicked: string;
        pending: string;
        approved: string;
        rejected: string;
        notesTitle: string;
    }>;
    documentTypes?: string[];
    documentStatuses?: string[];
};
