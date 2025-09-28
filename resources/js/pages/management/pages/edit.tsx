import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { Crumb } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import type { PageProps as AppPageProps } from '@/types';

type LocaleDraft = {
    title?: string | null;
    description?: string | null;
    fields: Record<string, unknown>;
    seo: Record<string, unknown>;
};

// Minimal Block typing to satisfy unused helpers (will be removed later)
type Block = { type: 'hero' | 'features' | 'cta'; props?: Record<string, unknown> };

function useCsrf() {
    return (
        (
            document.querySelector(
                'meta[name="csrf-token"]',
            ) as HTMLMetaElement | null
        )?.content || ''
    );
}

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

type FieldsPayload = {
    headline?: string;
    tagline?: string;
    body?: string;
} & Record<string, unknown>;
function FieldsEditor({
    value,
    onChange,
}: {
    value: FieldsPayload;
    onChange: (v: FieldsPayload) => void;
}) {
    const v = value || {};
    return (
        <div className="space-y-3">
            <div>
                <label className="mb-1 block text-sm">Headline</label>
                <Input
                    value={v.headline || ''}
                    onChange={(e) =>
                        onChange({ ...v, headline: e.target.value })
                    }
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">Tagline</label>
                <Input
                    value={v.tagline || ''}
                    onChange={(e) =>
                        onChange({ ...v, tagline: e.target.value })
                    }
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">Body (HTML)</label>
                <Textarea
                    className="h-40"
                    value={v.body || ''}
                    onChange={(e) => onChange({ ...v, body: e.target.value })}
                />
            </div>
        </div>
    );
}

type SeoPayload = {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
} & Record<string, unknown>;
function SeoEditor({
    value,
    onChange,
}: {
    value: SeoPayload;
    onChange: (v: SeoPayload) => void;
}) {
    const v = value || {};
    return (
        <div className="space-y-3">
            <div>
                <label className="mb-1 block text-sm">SEO Title</label>
                <input
                    className="w-full rounded border px-3 py-2"
                    value={v.title || ''}
                    onChange={(e) => onChange({ ...v, title: e.target.value })}
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">SEO Description</label>
                <textarea
                    className="w-full rounded border px-3 py-2"
                    value={v.description || ''}
                    onChange={(e) =>
                        onChange({ ...v, description: e.target.value })
                    }
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">Canonical URL</label>
                <input
                    className="w-full rounded border px-3 py-2"
                    value={v.canonical || ''}
                    onChange={(e) =>
                        onChange({ ...v, canonical: e.target.value })
                    }
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">OG Image URL</label>
                <input
                    className="w-full rounded border px-3 py-2"
                    value={v.ogImage || ''}
                    onChange={(e) =>
                        onChange({ ...v, ogImage: e.target.value })
                    }
                />
            </div>
        </div>
    );
}

type FeatureItem = { title?: string; text?: string };

function BlockEditor({
    value,
    onChange,
}: {
    value: Block[];
    onChange: (v: Block[]) => void;
}) {
    const blocks = value || [];
    const add = (t: Block['type']) => {
        const b: Block =
            t === 'hero'
                ? { type: 'hero', props: {} }
                : t === 'features'
                  ? { type: 'features', props: { items: [] } }
                  : { type: 'cta', props: {} };
        onChange([...(blocks || []), b]);
    };
    const remove = (i: number) =>
        onChange(blocks.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => add('hero')}
                >
                    + Hero
                </button>
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => add('features')}
                >
                    + Features
                </button>
                <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() => add('cta')}
                >
                    + CTA
                </button>
            </div>
            <div className="space-y-3">
                {blocks.map((b, i) => (
                    <div key={i} className="rounded border p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-muted-foreground text-sm">
                                {b.type}
                            </div>
                            <button
                                type="button"
                                className="text-sm text-red-600"
                                onClick={() => remove(i)}
                            >
                                remove
                            </button>
                        </div>
                        {b.type === 'hero' && (
                            <div className="grid gap-2">
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Title"
                                    value={b.props?.title || ''}
                                    onChange={(e) =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i && x.type === 'hero'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              ...x.props,
                                                              title: e.target
                                                                  .value,
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Subtitle"
                                    value={b.props?.subtitle || ''}
                                    onChange={(e) =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i && x.type === 'hero'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              ...x.props,
                                                              subtitle:
                                                                  e.target
                                                                      .value,
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Image URL"
                                    value={b.props?.imageUrl || ''}
                                    onChange={(e) =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i && x.type === 'hero'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              ...x.props,
                                                              imageUrl:
                                                                  e.target
                                                                      .value,
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                            </div>
                        )}
                        {b.type === 'features' && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 text-xs"
                                    onClick={() =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i &&
                                                x.type === 'features'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              items: [
                                                                  ...((x.props
                                                                      ?.items as
                                                                      | FeatureItem[]
                                                                      | undefined) ||
                                                                      []),
                                                                  {
                                                                      title: '',
                                                                      text: '',
                                                                  },
                                                              ],
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                >
                                    + Item
                                </button>
                                {(
                                    (b.props?.items as
                                        | FeatureItem[]
                                        | undefined) || []
                                ).map((it, j) => (
                                    <div
                                        key={j}
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        <input
                                            className="rounded border px-3 py-2"
                                            placeholder="Title"
                                            value={it.title || ''}
                                            onChange={(e) =>
                                                onChange(
                                                    blocks.map((x, idx) => {
                                                        if (idx !== i) return x;
                                                        if (
                                                            x.type !==
                                                            'features'
                                                        )
                                                            return x;
                                                        const items =
                                                            (x.props?.items as
                                                                | FeatureItem[]
                                                                | undefined) ??
                                                            [];
                                                        return {
                                                            ...x,
                                                            props: {
                                                                items: items.map(
                                                                    (
                                                                        y: FeatureItem,
                                                                        k: number,
                                                                    ) =>
                                                                        k === j
                                                                            ? {
                                                                                  ...y,
                                                                                  title: e
                                                                                      .target
                                                                                      .value,
                                                                              }
                                                                            : y,
                                                                ),
                                                            },
                                                        };
                                                    }),
                                                )
                                            }
                                        />
                                        <input
                                            className="rounded border px-3 py-2"
                                            placeholder="Text"
                                            value={it.text || ''}
                                            onChange={(e) =>
                                                onChange(
                                                    blocks.map((x, idx) => {
                                                        if (idx !== i) return x;
                                                        if (
                                                            x.type !==
                                                            'features'
                                                        )
                                                            return x;
                                                        const items =
                                                            (x.props?.items as
                                                                | FeatureItem[]
                                                                | undefined) ??
                                                            [];
                                                        return {
                                                            ...x,
                                                            props: {
                                                                items: items.map(
                                                                    (
                                                                        y: FeatureItem,
                                                                        k: number,
                                                                    ) =>
                                                                        k === j
                                                                            ? {
                                                                                  ...y,
                                                                                  text: e
                                                                                      .target
                                                                                      .value,
                                                                              }
                                                                            : y,
                                                                ),
                                                            },
                                                        };
                                                    }),
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {b.type === 'cta' && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Text"
                                    value={b.props?.text || ''}
                                    onChange={(e) =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i && x.type === 'cta'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              ...x.props,
                                                              text: e.target
                                                                  .value,
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Href"
                                    value={b.props?.href || ''}
                                    onChange={(e) =>
                                        onChange(
                                            blocks.map((x, idx) =>
                                                idx === i && x.type === 'cta'
                                                    ? {
                                                          ...x,
                                                          props: {
                                                              ...x.props,
                                                              href: e.target
                                                                  .value,
                                                          },
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScheduleRow({
    value,
    onChange,
}: {
    value: { publish_at?: string | null; unpublish_at?: string | null };
    onChange: (v: {
        publish_at?: string | null;
        unpublish_at?: string | null;
    }) => void;
}) {
    const { t: tPages } = useTranslation('management/pages');
    const v = value || {};
    return (
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="mb-1 block text-sm">
                    {tPages('labels.publish_at')}
                </label>
                <input
                    type="datetime-local"
                    className="w-full rounded border px-3 py-2"
                    value={v.publish_at || ''}
                    onChange={(e) =>
                        onChange({ ...v, publish_at: e.target.value })
                    }
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">
                    {tPages('labels.unpublish_at')}
                </label>
                <input
                    type="datetime-local"
                    className="w-full rounded border px-3 py-2"
                    value={v.unpublish_at || ''}
                    onChange={(e) =>
                        onChange({ ...v, unpublish_at: e.target.value })
                    }
                />
            </div>
        </div>
    );
}

function MediaUploader({
    onUploaded,
}: {
    onUploaded: (res: { url: string; meta?: Record<string, unknown> }) => void;
}) {
    const csrf = useCsrf();
    const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch(route('management.content.upload'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrf },
            body: fd,
        });
        if (res.ok) {
            const d = await res.json();
            onUploaded(d);
        }
    };
    return <input type="file" onChange={onChange} />;
}

export default function PageEdit() {
    const { t } = useTranslation();
    const { t: tPages } = useTranslation('management/pages');
    const { props } = usePage<AppPageProps<{ pageId: number; slug: string; availableLocales: string[]; locales: Record<string, LocaleDraft> }>>();
    const [locale, setLocale] = useState<string>((props.availableLocales?.[0] as string) || 'id');
    const [loading] = useState(false);
    const [title, setTitle] = useState<string>(props.locales?.[locale]?.title || '');
    const [description, setDescription] = useState<string>(props.locales?.[locale]?.description || '');
    const [fields, setFields] = useState<Record<string, unknown>>(props.locales?.[locale]?.fields || {});
    const [seo, setSeo] = useState<Record<string, unknown>>(props.locales?.[locale]?.seo || {});

    const csrf = useCsrf();
    useEffect(() => {
        const d = (props.locales && props.locales[locale]) || ({} as LocaleDraft);
        setTitle(d?.title || '');
        setDescription(d?.description || '');
        setFields(d?.fields || {});
        setSeo(d?.seo || {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale, props.locales]);

    const saveDraft = async () => {
        router.post(
            route('management.pages.upsertDraft', { page: props.pageId, locale }),
            { title, description, fields, seo },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(tPages('toasts.saved')),
                onError: () => toast.error(tPages('toasts.failed_save')),
            },
        );
    };

    // Autosave removed in simplified mode to avoid noisy redirects

    const breadcrumbs: Crumb[] = [
        { label: tPages('title'), href: route('management.pages.view') },
        { label: 'Edit', href: '#' },
    ];

    return (
        <AppLayout
            pageTitle={tPages('title')}
            pageDescription={`Edit: ${props.slug}`}
            breadcrumbs={breadcrumbs}
            actions={<Button onClick={saveDraft}>{tPages('actions.save_draft')}</Button>}
        >
            <div className="space-y-4">
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="text-muted-foreground text-sm">
                                Locale:
                            </div>
                            <Select value={locale} onValueChange={(v) => setLocale(v)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(props.availableLocales || []).map((l) => (
                                        <SelectItem key={l} value={l}>
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <Card>
                        <CardContent className="py-10">Loading...</CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-4">
                            <Tabs defaultValue="content">
                                <TabsList>
                                    <TabsTrigger value="content">Content</TabsTrigger>
                                    <TabsTrigger value="seo">SEO</TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="content"
                                    className="space-y-4"
                                >
                                    <SectionCard title="Basic">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="mb-1 block text-sm">
                                                    Title
                                                </label>
                                                <Input
                                                    value={title}
                                                    onChange={(e) =>
                                                        setTitle(e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm">
                                                    Description
                                                </label>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) =>
                                                        setDescription(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm">Body (HTML)</label>
                                                <Textarea
                                                    className="h-40"
                                                    value={(fields?.body as string) || ''}
                                                    onChange={(e) =>
                                                        setFields({
                                                            ...fields,
                                                            body: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </SectionCard>
                                    {/* Fields and Blocks editors removed for simplified mini CMS */}
                                </TabsContent>
                                <TabsContent value="seo">
                                    <SectionCard title="SEO">
                                        <SeoEditor
                                            value={seo}
                                            onChange={setSeo}
                                        />
                                    </SectionCard>
                                </TabsContent>
                                {/* Schedule & Status tab removed for simplified mini CMS */}
                            </Tabs>
                        </div>
                        {/* Right sidebar removed */}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
