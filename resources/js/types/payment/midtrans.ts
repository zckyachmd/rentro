export type MidtransResultPageProps = {
    variant: 'finish' | 'unfinish' | 'error';
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
    fraud_status?: string;
    gross_amount?: string;
    return_to: string;
};
