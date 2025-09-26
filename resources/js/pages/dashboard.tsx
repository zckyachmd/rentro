import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import ManagementSummary from '@/features/dashboard/management-summary';
import TenantSummary from '@/features/dashboard/tenant-summary';
import AppLayout from '@/layouts/app-layout';
import type { DashboardProps } from '@/pages/types/dashboard';
import type { PageProps } from '@/types';

export default function Dashboard() {
    const { t } = useTranslation();
    const { auth, management, tenant, filters } =
        usePage<PageProps<DashboardProps>>().props;

    const roles: string[] = (auth?.user?.roles ?? []) as string[];
    const isMgmt = roles.some((r) =>
        ['Super Admin', 'Owner', 'Manager'].includes(r),
    );
    const isTenant = roles.includes('Tenant');

    return (
        <AppLayout
            pageTitle={t('dashboard.title')}
            pageDescription={t('dashboard.desc')}
        >
            <Head title={t('dashboard.title')} />

            <Can rolesAny={['Super Admin', 'Owner', 'Manager']}>
                {isMgmt && management && (
                    <ManagementSummary
                        management={management}
                        filters={filters}
                    />
                )}
            </Can>

            {isTenant && tenant && (
                <div className="py-8">
                    <TenantSummary tenant={tenant} />
                </div>
            )}
        </AppLayout>
    );
}
