export type ContactDTO = {
    id: number;
    name: string;
    relationship?: string | null;
    phone: string;
    email?: string | null;
    address_line?: string | null;
    is_primary: boolean;
};

export type ContactProps = {
    contacts: ContactDTO[];
};

export type ContactFormState = null | {
    mode: 'create' | 'edit';
    editingId: number | null;
    values: {
        name: string;
        phone: string;
        relationship: string;
        email: string;
        address_line: string;
    };
    showErrors: boolean;
    processing: boolean;
};
