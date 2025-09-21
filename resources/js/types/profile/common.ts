export type UserDTO = {
    id: number;
    name?: string;
    username?: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    dob?: string | null;
    created_at?: string;
    email_verified_at?: string | null;
};

export type AddressDTO = {
    id?: number;
    label?: string | null;
    address_line: string;
    village?: string | null;
    district?: string | null;
    city: string;
    province: string;
    postal_code?: string | null;
    country?: string;
    is_primary?: boolean;
};

export type DocumentDTO = {
    id?: number;
    type?: 'KTP' | 'SIM' | 'PASSPORT' | 'NPWP' | 'other' | '' | null;
    number?: string | null;
    status?: 'pending' | 'approved' | 'rejected' | null;
    has_file?: boolean | null;
    issued_at?: string | null;
    expires_at?: string | null;
    verified_at?: string | null;
    notes?: string | null;
};
