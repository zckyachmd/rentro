'use client';

import { router } from '@inertiajs/react';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { RoleDialogProps } from '@/types/management';

export function RoleDialog({
    open,
    onOpenChange,
    user,
    roles,
    autoReload = true,
}: RoleDialogProps) {
    const { t } = useTranslation();
    const [query, setQuery] = React.useState('');
    const [selected, setSelected] = React.useState<Set<number>>(
        () => new Set((user.roles ?? []).map((r) => r.id)),
    );
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) setSelected(new Set((user.roles ?? []).map((r) => r.id)));
    }, [open, user.id, user.roles]);

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [roles, query]);

    const toggle = React.useCallback((id: number, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const handleToggleAll = React.useCallback(() => {
        setSelected((prev) =>
            prev.size === roles.length
                ? new Set()
                : new Set(roles.map((r) => r.id)),
        );
    }, [roles]);

    const handleSubmit = React.useCallback(() => {
        const roleIds = Array.from(selected);
        setSaving(true);
        router.post(
            route('management.users.roles.update', user.id),
            { _method: 'put', role_ids: roleIds },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    if (autoReload) router.reload({ preserveUrl: true });
                    onOpenChange(false);
                },
                onFinish: () => setSaving(false),
            },
        );
    }, [selected, user.id, onOpenChange, autoReload]);

    const countSelected = selected.size;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />{' '}
                        {t('user.actions.manage_roles')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('user.roles.dialog_desc')}
                    </DialogDescription>
                </DialogHeader>

                {/* User info (match Reset Password dialog styling) */}
                <div className="mb-2 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {user.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                            <AvatarFallback>
                                {(user.name?.slice(0, 1) ?? '?').toUpperCase()}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                            {user.email}
                        </div>
                    </div>
                </div>

                <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 opacity-50" />
                        <Input
                            placeholder={t(
                                'management.role.search_placeholder',
                            )}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAll}
                    >
                        {selected.size === roles.length
                            ? t('common.clear_all')
                            : t('datatable.select_all')}
                    </Button>
                </div>

                <div className="max-h-72 rounded-md border">
                    <div className="divide-y">
                        {filtered.length === 0 ? (
                            <div className="text-muted-foreground p-4 text-center text-sm">
                                {t('management.role.empty')}
                            </div>
                        ) : (
                            filtered.map((role) => {
                                const checked = selected.has(role.id);
                                return (
                                    <label
                                        key={role.id}
                                        className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 p-3"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(v) =>
                                                toggle(role.id, Boolean(v))
                                            }
                                        />
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                            <div className="truncate">
                                                {role.name}
                                            </div>
                                            {checked ? (
                                                <Badge variant="outline">
                                                    {t('common.selected')}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <div className="text-muted-foreground flex w-full items-center justify-between text-xs">
                        <span>
                            {t('common.selected')}:{' '}
                            <span className="text-foreground font-medium">
                                {countSelected}
                            </span>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                        {t('common.saving')}
                                    </>
                                ) : (
                                    t('common.save')
                                )}
                            </Button>
                        </div>
                    </div>
                    <InputError name="role_ids" reserveSpace={false} />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
