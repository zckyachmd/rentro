import type { AddressDTO, DocumentDTO, UserDTO } from './common';
import type { ContactDTO } from './contact';

export type ShowPageProps = {
    user: UserDTO;
    addresses: AddressDTO[];
    document: DocumentDTO | null;
    contacts: ContactDTO[];
    mustVerifyEmail: boolean;
    status?: string | null;
    preferences: Record<string, unknown>;
    options: {
        documentTypes: string[];
        documentStatuses: string[];
    };
};
