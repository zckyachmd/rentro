import { useTranslation } from 'react-i18next';

import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';

export default function TenantRoomSelect({
    userId,
    roomId,
    onUserChange,
    onRoomChange,
    tenantOptions,
    roomOptions,
    errors = {},
}: {
    userId: string;
    roomId: string;
    onUserChange: (v: string) => void;
    onRoomChange: (v: string, opt?: SearchOption) => void;
    tenantOptions: SearchOption[];
    roomOptions: SearchOption[];
    errors?: Partial<Record<'user_id' | 'room_id', string>>;
}) {
    const { t } = useTranslation();
    const { t: tUser } = useTranslation('management/user');
    const { t: tRoom } = useTranslation('management/room');
    return (
        <>
            <div className="space-y-2">
                <Label>
                    {t('common.tenant')}{' '}
                    <span className="text-destructive">*</span>
                </Label>
                <SearchSelect
                    value={userId}
                    onChange={onUserChange}
                    options={tenantOptions}
                    placeholder={tUser('search_placeholder')}
                />
                <InputError message={errors.user_id} />
            </div>

            <div className="space-y-2">
                <Label>
                    {t('common.room')}{' '}
                    <span className="text-destructive">*</span>
                </Label>
                <SearchSelect
                    value={roomId}
                    onChange={onRoomChange}
                    options={roomOptions}
                    placeholder={tRoom('search_placeholder')}
                />
                <InputError message={errors.room_id} />
            </div>
        </>
    );
}
