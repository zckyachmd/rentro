import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import {
    localeEnum,
    saveSectionSchema,
    type SaveSectionInput,
} from '@/lib/validation/pageSection';
import type { PageProps } from '@/types';

type Props = {
    page: string;
    section: string;
    keys: string[];
    activeLocale: string;
    valuesByLocale: Record<'id' | 'en', Record<string, string | null>>;
};

export default function PageSectionEdit() {
    const { t: tPages } = useTranslation('management/pages');
    const { t } = useTranslation();
    const { props } = usePage<PageProps<Props>>();
    const { page, section, keys, valuesByLocale } = props;
    const initialLocale = (props.activeLocale as 'id' | 'en') ?? 'id';

    const [activeLocale, setActiveLocale] = React.useState<'id' | 'en'>(
        initialLocale,
    );
    const [fields, setFields] = React.useState<string[]>(() =>
        Array.from(new Set(keys)),
    );
    const [newKey, setNewKey] = React.useState('');

    const form = useForm<SaveSectionInput>({
        resolver: zodResolver(saveSectionSchema),
        defaultValues: {
            page: page as SaveSectionInput['page'],
            section,
            locale: initialLocale,
            values: Object.fromEntries(
                (fields || []).map((k) => [
                    k,
                    (valuesByLocale[initialLocale] ?? {})[k] ?? '',
                ]),
            ),
        },
    });

    // Reset form values when switching locale
    React.useEffect(() => {
        const base = valuesByLocale[activeLocale] ?? {};
        const merged: Record<string, string | null> = {};
        for (const k of fields) merged[k] = base[k] ?? '';
        form.reset({
            page: page as SaveSectionInput['page'],
            section,
            locale: activeLocale,
            values: merged,
        });
    }, [activeLocale, fields, form, page, section, valuesByLocale]);

    const onSubmit = (data: SaveSectionInput) => {
        router.post(route('management.pages.update', [page, section]), data, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            pageTitle={`${tPages('edit.title')}: ${page}/${section}`}
            pageDescription={tPages('edit.desc')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-3">
                                    <Badge
                                        variant="secondary"
                                        className="uppercase"
                                    >
                                        {page}
                                    </Badge>
                                    <span className="font-mono text-sm">
                                        {section}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {tPages('edit.desc')}
                                </CardDescription>
                            </div>
                            <a
                                href={(() => {
                                    try {
                                        if (page === 'home')
                                            return route('home');
                                        if (page === 'about')
                                            return route('public.about');
                                        if (page === 'privacy')
                                            return route('public.privacy');
                                        return page === 'home'
                                            ? '/'
                                            : `/${page}`;
                                    } catch {
                                        return page === 'home'
                                            ? '/'
                                            : `/${page}`;
                                    }
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground inline-flex items-center gap-2 text-sm hover:underline"
                            >
                                <ExternalLink className="h-4 w-4" />{' '}
                                {tPages('actions.open_public')}
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs
                            value={activeLocale}
                            onValueChange={(v) =>
                                setActiveLocale(localeEnum.parse(v))
                            }
                            className="w-full"
                        >
                            <TabsList>
                                <TabsTrigger value="id">
                                    {tPages('edit.tabs.id')}
                                </TabsTrigger>
                                <TabsTrigger value="en">
                                    {tPages('edit.tabs.en')}
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-4" />

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-5"
                                >
                                    {/* Hidden fields */}
                                    <input
                                        type="hidden"
                                        {...form.register('page')}
                                    />
                                    <input
                                        type="hidden"
                                        {...form.register('section')}
                                    />
                                    <input
                                        type="hidden"
                                        {...form.register('locale')}
                                    />
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <FormItem>
                                                <FormLabel>
                                                    {tPages(
                                                        'edit.fields.key_label',
                                                    )}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        value={newKey}
                                                        onChange={(e) =>
                                                            setNewKey(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={tPages(
                                                            'edit.fields.add_key_placeholder',
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        </div>
                                        <Can all={["page.update"]}>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    const k = newKey.trim();
                                                    if (!k) return;
                                                    if (fields.includes(k)) return;
                                                    setFields((s) => [...s, k]);
                                                    // set default value for the current locale
                                                    form.setValue(
                                                        `values.${k}` as const,
                                                        '',
                                                    );
                                                    setNewKey('');
                                                }}
                                            >
                                                {tPages('edit.actions.add_field')}
                                            </Button>
                                        </Can>
                                    </div>

                                    {fields.map((k, idx) => (
                                        <React.Fragment key={k}>
                                            <FormField
                                                control={form.control}
                                                name={`values.${k}` as const}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span className="text-muted-foreground text-xs">
                                                                {tPages(
                                                                    'edit.fields.key_label',
                                                                )}
                                                            </span>
                                                            <span className="font-mono text-[11px] opacity-70">
                                                                {k}
                                                            </span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            {k === 'body' ? (
                                                                <Textarea
                                                                    {...field}
                                                                    value={
                                                                        field.value ??
                                                                        ''
                                                                    }
                                                                    rows={10}
                                                                    placeholder={tPages(
                                                                        'edit.fields.body_placeholder',
                                                                    )}
                                                                />
                                                            ) : (
                                                                <Input
                                                                    {...field}
                                                                    value={
                                                                        field.value ??
                                                                        ''
                                                                    }
                                                                />
                                                            )}
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="flex items-center gap-2">
                                                <Can all={["page.update"]}>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setFields((s) =>
                                                                s.filter(
                                                                    (x) =>
                                                                        x !==
                                                                        k,
                                                                ),
                                                            );
                                                            form.unregister(
                                                                `values.${k}` as const,
                                                            );
                                                        }}
                                                    >
                                                        {tPages(
                                                            'edit.actions.remove_field',
                                                        )}
                                                    </Button>
                                                </Can>
                                            </div>
                                            {idx < fields.length - 1 ? (
                                                <Separator className="my-2" />
                                            ) : null}
                                        </React.Fragment>
                                    ))}

                                    <div className="flex items-center gap-2 pt-2">
                                        <Can all={["page.update"]}>
                                            <Button type="submit">
                                                {t('common.save')}
                                            </Button>
                                        </Can>
                                    </div>
                                </form>
                            </Form>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
