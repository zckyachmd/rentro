import type { AddressDTO, DocumentDTO, UserDTO } from './common';

export type EditPageProps = {
    user: UserDTO;
    address: AddressDTO | null;
    document?: DocumentDTO | null;
    status?: string | null;
    options: {
        genders: string[];
        documentTypes: string[];
        documentStatuses: string[];
    };
};

export type EditForm = {
    name: string;
    username: string;
    email: string;
    phone: string;
    dob: string;
    gender: '' | 'male' | 'female' | 'other';
    avatar: File | null;
    address: {
        label: string;
        address_line: string;
        village: string;
        district: string;
        city: string;
        province: string;
        postal_code: string;
    };
    document: {
        type: '' | 'ktp' | 'sim' | 'passport' | 'npwp' | 'other';
        number: string;
        file: File | null;
        has_file?: boolean | null;
        issued_at: string;
        expires_at: string;
        status?: 'pending' | 'approved' | 'rejected';
        notes?: string | null;
    };
};
