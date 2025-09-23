import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';

export default function PasswordTab() {
    const { t } = useTranslation();
    const [show, setShow] = useState<{
        current: boolean;
        new: boolean;
        confirm: boolean;
    }>({
        current: false,
        new: false,
        confirm: false,
    });

    const passwordForm = useForm<{
        current_password: string;
        password: string;
        password_confirmation: string;
    }>({ current_password: '', password: '', password_confirmation: '' });

    const onSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.patch(route('security.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset(
                    'current_password',
                    'password',
                    'password_confirmation',
                );
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('security.password.change_title')}</CardTitle>
                <CardDescription>
                    {t('security.password.change_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmitPassword} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="current_password">
                                {t('security.password.current')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type={show.current ? 'text' : 'password'}
                                    placeholder={t(
                                        'security.password.current_placeholder',
                                    )}
                                    value={passwordForm.data.current_password}
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({
                                            ...s,
                                            current: !s.current,
                                        }))
                                    }
                                    className="absolute top-0 right-0 h-full border-0 px-3 hover:bg-transparent focus-visible:ring-0 focus-visible:outline-none"
                                    tabIndex={-1}
                                    aria-label={
                                        show.current
                                            ? t('common.hide_password')
                                            : t('common.show_password')
                                    }
                                >
                                    {show.current ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError
                                message={passwordForm.errors.current_password}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {t('security.password.new')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={show.new ? 'text' : 'password'}
                                    placeholder={t(
                                        'security.password.new_placeholder',
                                    )}
                                    value={passwordForm.data.password}
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({ ...s, new: !s.new }))
                                    }
                                    className="absolute top-0 right-0 h-full border-0 px-3 hover:bg-transparent focus-visible:ring-0 focus-visible:outline-none"
                                    tabIndex={-1}
                                    aria-label={
                                        show.new
                                            ? t('common.hide_password')
                                            : t('common.show_password')
                                    }
                                >
                                    {show.new ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError
                                message={passwordForm.errors.password}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">
                                {t('security.password.confirm')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={show.confirm ? 'text' : 'password'}
                                    placeholder={t(
                                        'security.password.confirm_placeholder',
                                    )}
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({
                                            ...s,
                                            confirm: !s.confirm,
                                        }))
                                    }
                                    className="absolute top-0 right-0 h-full border-0 px-3 hover:bg-transparent focus-visible:ring-0 focus-visible:outline-none"
                                    tabIndex={-1}
                                    aria-label={
                                        show.confirm
                                            ? t('common.hide_password')
                                            : t('common.show_password')
                                    }
                                >
                                    {show.confirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError
                                message={
                                    passwordForm.errors.password_confirmation
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            disabled={passwordForm.processing}
                        >
                            {t('common.save')}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => passwordForm.reset()}
                        >
                            {t('common.reset')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
