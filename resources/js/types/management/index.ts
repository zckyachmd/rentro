// Management barrel: explicit, conflict-free exports

// Audit
export type {
    ActivityItem,
    AuditDetailDialogProps,
    NextShape as AuditNextShape,
    PageProps as AuditPageProps,
    PageQuery as AuditPageQuery,
    SafePayload as AuditSafePayload,
    LogPaginator,
    UserLite,
} from './audit';

// Contract core + table
export type {
    ColumnFactoryOptions as ContractColumnOptions,
    ContractItem,
} from './contract';

// Contract detail DTOs
export type {
    ContractDTO,
    InvoiceItem as ContractInvoiceItem,
    HandoverSummary,
    Paginator as ManagementPaginator,
    RoomDTO,
    TenantDTO,
} from './contract-detail';

// Contract index/query types
export type {
    QueryInit as ContractQueryInit,
    SafePayload as ContractSafePayload,
    ServerQuery as ContractServerQuery,
    ContractsPageProps,
    ContractsPaginator,
    HandoverOptions,
} from './contract-index';

// Contract create
export type {
    ContractCreateForm,
    ContractCreateLocal,
    PeriodOption as ContractPeriodOption,
    PageOptions,
    RoomOption,
    TenantOption,
} from './contract-create';

// Contract Handover
export type {
    HandoverCreateErrorKey,
    HandoverCreateFormState,
    HandoverMode,
    ManagementHandover,
} from './contract-handover';

// Invoice (management)
export type {
    BaseInvoiceRow,
    ContractOption,
    CreateColumnsOpts,
    GenerateInvoiceDialogProps,
    GenerateInvoiceFormState,
    InvoiceRow,
    CancelState as ManagementCancelState,
    ExtendState as ManagementExtendState,
    ManagementInvoiceDetailDTO,
    InvoiceDetailTarget as ManagementInvoiceDetailTarget,
    ManagementInvoicePageProps,
} from './invoice';

// Payment
export type {
    ManagementPaymentDetailDTO,
    PaymentDetailTarget as ManagementPaymentDetailTarget,
    ManagementPaymentShowDTO,
    ManualPaymentDialogProps,
    ManualPaymentForm,
    MethodOption,
    PaymentIndexPageProps,
    PaymentRow,
} from './payment';

// Role
export type {
    Permission,
    PermissionsDialogProps,
    ColumnFactoryOptions as RoleColumnOptions,
    DialogKey as RoleDialogKey,
    RoleDialogs,
    RoleItem,
    RolePageProps,
    RolePaginator,
    RoleUpsertDialogProps,
} from './role';

// Room
export type {
    Building,
    Floor,
    ColumnFactoryOptions as RoomColumnOptions,
    RoomDetail,
    RoomItem,
    RoomType,
} from './room';

// Room Form
export type {
    AmenityOption,
    FloorOption,
    GenderPolicyOption,
    PeriodOption,
    RoomCreatePageProps,
    RoomEditPageProps,
    RoomForm,
    RoomPhotoView,
    RoomTypeOption,
    RoomUpsert,
    RoomUpsertOptions,
    StringKeys,
} from './room-form';

// Room Index
export type {
    Filters as RoomFilters,
    QueryInit as RoomQueryInit,
    SafePayload as RoomSafePayload,
    RoomsPageProps,
    RoomsPaginator,
} from './room-index';

// User
export type {
    CreateUserDialogProps,
    ForceLogoutDialogProps,
    ManageRolesHandler,
    RequestResponse,
    ResetDialogProps,
    ResetPasswordHandler,
    ResetState,
    Role,
    RoleDialogProps,
    TwoFADialogProps,
    ColumnFactoryOptions as UserColumnOptions,
    DialogKind as UserDialogKind,
    DialogState as UserDialogState,
    UserIndexPageProps,
    UserItem,
    UsersPaginator,
} from './user';
