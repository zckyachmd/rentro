import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ContactDTO } from '@/types/profile';

export default function ContactsTable({
    contacts,
    onEdit,
    onDelete,
}: {
    contacts: ContactDTO[];
    onEdit?: (c: ContactDTO) => void;
    onDelete?: (c: ContactDTO) => void;
}) {
    const { t } = useTranslation();
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('profile.contact.table.name')}</TableHead>
                        <TableHead>
                            {t('profile.contact.table.relationship')}
                        </TableHead>
                        <TableHead>{t('common.email')}</TableHead>
                        <TableHead>{t('common.phone')}</TableHead>
                        {onEdit || onDelete ? (
                            <TableHead className="text-right">
                                {t('common.actions')}
                            </TableHead>
                        ) : null}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">
                                {c.name}
                            </TableCell>
                            <TableCell>{c.relationship}</TableCell>
                            <TableCell>
                                {c.email ? (
                                    <CopyInline
                                        value={c.email}
                                        variant="link"
                                        className="text-xs sm:text-sm"
                                        successMessage={t(
                                            'profile.email_copied',
                                        )}
                                    >
                                        {c.email}
                                    </CopyInline>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell>
                                {c.phone ? (
                                    <CopyInline
                                        value={c.phone}
                                        variant="link"
                                        className="font-mono text-xs sm:text-sm"
                                        successMessage={t(
                                            'profile.phone_copied',
                                        )}
                                    >
                                        {c.phone}
                                    </CopyInline>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            {onEdit || onDelete ? (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {onEdit ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEdit(c)}
                                            >
                                                {t('profile.contact.edit')}
                                            </Button>
                                        ) : null}
                                        {onDelete ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => onDelete(c)}
                                            >
                                                {t('profile.contact.delete')}
                                            </Button>
                                        ) : null}
                                    </div>
                                </TableCell>
                            ) : null}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
