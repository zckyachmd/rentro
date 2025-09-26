import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Link, usePage } from '@inertiajs/react';
import type { TFunction } from 'i18next';
import { Building2, ChevronDown, Layers, Tags, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
import RoomUpsertForm from '@/pages/management/room/form';
import type { RoomEditPageProps as PageProps } from '@/types/management';

const makeBreadcrumbs = (tRoom: TFunction): Crumb[] => [
    { label: tRoom('title', { defaultValue: 'Rooms' }), href: '#' },
    {
        label: tRoom('title', { defaultValue: 'Rooms' }),
        href: route('management.rooms.index'),
    },
    { label: tRoom('edit', { defaultValue: 'Edit Room' }), href: '#' },
];

export default function RoomEdit() {
    const { t: tRoom } = useTranslation('management/room');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const room = props.room;
    const options = props.options;

    const headerActions = (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                        {tRoom('master_data')}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.buildings.index')}
                            className="flex items-center gap-2"
                        >
                            <Building2 className="h-4 w-4" />{' '}
                            {tRoom('master.buildings')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.floors.index')}
                            className="flex items-center gap-2"
                        >
                            <Layers className="h-4 w-4" />{' '}
                            {tRoom('master.floors')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.room-types.index')}
                            className="flex items-center gap-2"
                        >
                            <Tags className="h-4 w-4" />{' '}
                            {tRoom('master.room_types')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={route('management.amenities.index')}
                            className="flex items-center gap-2"
                        >
                            <Wrench className="h-4 w-4" />{' '}
                            {tRoom('master.amenities')}
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    return (
        <AuthLayout
            pageTitle={tRoom('title')}
            pageDescription={tRoom('desc')}
            breadcrumbs={makeBreadcrumbs(tRoom)}
            actions={headerActions}
        >
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 pt-6">
                        <RoomUpsertForm
                            mode="edit"
                            options={options}
                            room={room}
                        />
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
