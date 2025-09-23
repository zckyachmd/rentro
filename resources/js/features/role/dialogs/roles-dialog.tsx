import { router } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RoleUpsertDialogProps } from '@/types/management';

export default function RoleUpsertDialog({
    open,
    role,
    onOpenChange,
    onSuccess,
    guards = [],
}: RoleUpsertDialogProps & { guards?: string[] }) {
    const { t } = useTranslation();
    const guardOptions = React.useMemo(
        () => Array.from(new Set((guards || []).filter(Boolean))),
        [guards],
    );
    const [name, setName] = React.useState(role?.name ?? '');
    const [guardName, setGuardName] = React.useState<string>('web');
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setName(role?.name ?? '');
    }, [role?.name]);

    React.useEffect(() => {
        if (role?.guard_name) {
            setGuardName(role.guard_name);
        } else if (guardOptions.length > 0) {
            setGuardName(guardOptions[0]);
        } else {
            setGuardName('');
        }
    }, [role?.guard_name, open, guardOptions]);

    const close = React.useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    const isEdit = Boolean(role?.id);
    const canSubmit =
        !saving && name.trim().length > 0 && guardName.trim().length > 0;

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        const payload = new FormData();
        payload.append('name', name);
        payload.append('guard_name', guardName);
        if (isEdit) payload.append('_method', 'PUT');
        const url = isEdit
            ? route('management.roles.update', role?.id)
            : route('management.roles.store');
        router.post(url, payload, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: () => {
                onSuccess?.();
                close();
            },
            forceFormData: true,
        });
    }, [canSubmit, isEdit, name, guardName, role?.id, close, onSuccess]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('role.edit_title') : t('role.create_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? t('role.edit_desc') : t('role.create_desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <div className="min-w-0 space-y-0.5">
                        <Label>{t('common.name')}</Label>
                        <Input
                            disabled={saving}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('role.name_placeholder')}
                            className="h-10 w-full text-sm"
                        />
                        <InputError name="name" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <Label>Guard</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info
                                            className="text-muted-foreground h-4 w-4 shrink-0"
                                            aria-label={t('role.guard_info')}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[240px] text-xs">
                                            {t('role.guard_hint')}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Select
                            disabled={saving || guardOptions.length === 0}
                            value={guardName}
                            onValueChange={(v) => setGuardName(v)}
                        >
                            <SelectTrigger
                                aria-label={t('role.pick_guard')}
                                className="h-10 w-full justify-between text-sm"
                            >
                                <SelectValue placeholder={t('role.pick_guard')} />
                            </SelectTrigger>
                            <SelectContent>
                                {guardOptions.map((g) => (
                                    <SelectItem key={g} value={g}>
                                        {g}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError name="guard_name" />
                    </div>

                    {!isEdit && (
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('role.permissions_hint')}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        {t('common.cancel')}
                    </Button>
                    <Button disabled={!canSubmit} onClick={submit}>
                        {saving ? t('common.processing') : t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
