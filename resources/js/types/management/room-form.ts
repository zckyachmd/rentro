export type RoomPhotoView = {
    id: string;
    url: string;
    is_cover?: boolean;
    ordering?: number;
};

export type Option = { id: number | string; name: string };
export type RoomTypeOption = Option & {
    price_cents?: number | null;
    deposit_cents?: number | null;
    size_m2?: number | null;
};
export type FloorOption = {
    id: number;
    level: number | string;
    building_id: number;
};
export type StatusOption = { value: string; label: string };
export type AmenityOption = { id: number; name: string; icon?: string };
export type GenderPolicyOption = { value: string; label: string };
export type PeriodOption = { value: string; label: string };

export type RoomUpsertOptions = {
    buildings?: Option[];
    floors?: FloorOption[];
    types?: RoomTypeOption[];
    statuses?: StatusOption[];
    amenities?: AmenityOption[];
    gender_policies?: GenderPolicyOption[];
    billing_periods?: PeriodOption[];
};

export type RoomUpsert = {
    id?: string;
    building_id?: string | number | null;
    floor_id?: string | number | null;
    room_type_id?: string | number | null;
    number?: string;
    name?: string | null;
    status?: string;
    max_occupancy?: number | string;
    price_rupiah?: number | string | null;
    deposit_rupiah?: number | string | null;
    size_m2?: number | string | null;
    notes?: string | null;
    photos?: RoomPhotoView[];
    amenities?: number[];
    gender_policy?: string | null;
    billing_period?: string | null;
};

export type RoomEditPageProps = {
    room?: RoomUpsert;
    options?: RoomUpsertOptions;
};

export type RoomCreatePageProps = {
    options?: RoomUpsertOptions;
};

export type StringKeys<T> = {
    [K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T];

export type RoomForm = {
    building_id: string;
    floor_id: string;
    room_type_id: string;
    number: string;
    name: string;
    status: string;
    max_occupancy: string;
    price_rupiah: string;
    deposit_rupiah: string;
    size_m2: string;
    notes: string;
    photos: File[];
    amenities: string[];
    gender_policy: string;
    billing_period: string;
};
