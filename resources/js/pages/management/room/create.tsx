import { Link, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, Layers, Tags, Wrench } from 'lucide-react';

import { Crumb } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AuthLayout from '@/layouts/auth-layout';
import RoomUpsertForm, {
    type RoomUpsertOptions,
} from '@/pages/management/room/form';

type CreatePageProps = {
    options?: RoomUpsertOptions;
};

const BREADCRUMBS: Crumb[] = [
    { label: 'Kamar', href: '#' },
    { label: 'Daftar Kamar', href: route('management.rooms.index') },
    { label: 'Tambah Kamar', href: '#' },
];

export default function RoomCreate() {
    const { props } = usePage<CreatePageProps>();
    const opt = props.options ?? {};

    const headerActions = (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                        Kelola Master Data
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.buildings.index')}
                            className="flex items-center gap-2"
                        >
                            <Building2 className="h-4 w-4" /> Gedung
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.floors.index')}
                            className="flex items-center gap-2"
                        >
                            <Layers className="h-4 w-4" /> Lantai
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.room-types.index')}
                            className="flex items-center gap-2"
                        >
                            <Tags className="h-4 w-4" /> Tipe Kamar
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.amenities.index')}
                            className="flex items-center gap-2"
                        >
                            <Wrench className="h-4 w-4" /> Fasilitas
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    return (
        <AuthLayout
            pageTitle="Tambah Kamar"
            pageDescription="Buat kamar baru dan atur foto & fasilitas."
            breadcrumbs={BREADCRUMBS}
            actions={headerActions}
        >
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 pt-6">
                        <RoomUpsertForm mode="create" options={opt} />
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
