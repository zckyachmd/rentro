export type AddressValue = {
    label: string;
    address_line: string;
    village: string;
    district: string;
    city: string;
    province: string;
    postal_code: string;
};

export type AddressProps = {
    value: AddressValue;
    onChange: (next: AddressValue) => void;
    errors?: Record<string, string | undefined>;
    defaultOpen?: boolean;
    title?: string;
};
