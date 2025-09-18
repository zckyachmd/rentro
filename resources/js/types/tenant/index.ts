// Tenant barrel: explicit, conflict-free exports

// Invoice
export type {
    InvoiceItemMeta,
    PendingInfo,
    ColumnFactoryOptions as TenantInvoiceColumnOptions,
    TenantInvoiceDTO,
    TenantInvoiceDetailDTO,
    InvoiceDetailTarget as TenantInvoiceDetailTarget,
    InvoiceIndexPageProps as TenantInvoiceIndexPageProps,
    TenantInvoiceItem,
    InvoiceItem as TenantInvoiceItemDTO,
    QueryInit as TenantInvoiceQueryInit,
    SafePayload as TenantInvoiceSafePayload,
    ServerQuery as TenantInvoiceServerQuery,
    InvoicesPaginator as TenantInvoicesPaginator,
} from './invoice';

// Contract (list columns)
export type {
    ColumnFactoryOptions as TenantContractColumnOptions,
    TenantContractItem,
    TenantHandover,
} from './contract';

// Contract detail
export type {
    TenantContractDetail,
    TenantContractDetailPageProps,
    InvoiceItem as TenantContractInvoiceItem,
    Paginator as TenantPaginator,
} from './contract-detail';

// Contract index/query types
export type {
    QueryInit as TenantContractQueryInit,
    SafePayload as TenantContractSafePayload,
    ServerQuery as TenantContractServerQuery,
    ContractsPageProps as TenantContractsPageProps,
    ContractsPaginator as TenantContractsPaginator,
} from './contract-index';
