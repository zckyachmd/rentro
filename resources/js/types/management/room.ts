export interface Building {
    id: number;
    name: string;
}

export interface Floor {
    id: number;
    level: number;
    building_id: number;
}

export interface RoomType {
    id: string;
    name: string;
}

export interface RoomItem {
    id: string;
    number: string;
    name?: string | null;
    status: 'vacant' | 'reserved' | 'occupied' | 'maintenance' | 'inactive';
    max_occupancy: number;
    price_rupiah?: string;
    building?: Building | null;
    floor?: Floor | null;
    type?: RoomType | null;
    amenities_count?: number;
}

export type ColumnFactoryOptions = {
    onDetail?: (room: RoomItem) => void;
    onEdit?: (room: RoomItem) => void;
    onDelete?: (room: RoomItem) => void;
};

export type RoomDetail = {
    id: string;
    number: string;
    name?: string | null;
    status: string;
    max_occupancy: number;
    price_rupiah?: string | null;
    deposit_rupiah?: string | null;
    area_sqm?: number | null;
    gender_policy?: string | null;
    billing_period?: string | null;
    notes?: string | null;
    building?: { id: number; name: string } | null;
    floor?: { id: number; level: number | string; building_id: number } | null;
    type?: { id: string; name: string } | null;
    photos: {
        id: string;
        url: string;
        is_cover?: boolean;
        ordering?: number;
    }[];
    amenities: { id: number; name: string }[];
};
