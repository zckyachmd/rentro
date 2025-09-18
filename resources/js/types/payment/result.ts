export type PaymentResultPageProps = {
    variant?: 'finish' | 'unfinish' | 'error';
    return_to?: string;
    provider?: string | null;
};
