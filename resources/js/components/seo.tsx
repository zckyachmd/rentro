import { Head, usePage } from '@inertiajs/react';

import {
    getAppName,
    getAppUrl,
    getOgDefaultImage,
    getTwitterHandle,
    toAbsoluteUrl,
} from '@/lib/env';
import i18n from '@/lib/i18n';

export type SeoProps = {
    title?: string;
    description?: string;
    keywords?: string | string[];
    canonical?: string;
    image?: string; // absolute or relative; will be absolutized
    type?: string; // og:type, e.g., 'website' | 'article'
    robots?: string; // e.g., 'index,follow'
    twitterCard?: 'summary' | 'summary_large_image';
    author?: string; // optional meta author
    publishedTime?: string; // ISO string for article:published_time
    modifiedTime?: string; // ISO string for article:modified_time
};

export default function Seo(props: SeoProps) {
    const {
        title,
        description,
        keywords,
        canonical,
        image,
        type = 'website',
        robots = 'index,follow',
        twitterCard = 'summary_large_image',
        author,
        publishedTime,
        modifiedTime,
    } = props;

    const siteName = getAppName();
    const baseUrl = getAppUrl('');
    const page = usePage();
    const path =
        (page as unknown as { url?: string })?.url ||
        (typeof window !== 'undefined' ? window.location?.pathname : '/');
    const pageUrl = toAbsoluteUrl(canonical || path) || undefined;
    const ogFallback = getOgDefaultImage('/logo.svg');
    const ogImage = toAbsoluteUrl(image) || toAbsoluteUrl(ogFallback);
    const locale = (
        i18n?.language ||
        (typeof document !== 'undefined' ? document.documentElement.lang : 'id')
    ).toLowerCase();
    const keywordsStr = Array.isArray(keywords)
        ? keywords.join(', ')
        : keywords;
    const twitterSite = getTwitterHandle('');

    return (
        <Head {...(title ? { title } : {})}>
            {description ? (
                <meta key="desc" name="description" content={description} />
            ) : null}
            {keywordsStr ? (
                <meta key="kw" name="keywords" content={keywordsStr} />
            ) : null}
            {(robots ||
                (import.meta?.env?.PROD
                    ? 'index,follow'
                    : 'noindex, nofollow')) && (
                <meta
                    key="robots"
                    name="robots"
                    content={
                        robots ??
                        (import.meta.env?.PROD
                            ? 'index,follow'
                            : 'noindex, nofollow')
                    }
                />
            )}
            {pageUrl ? (
                <link key="canonical" rel="canonical" href={pageUrl} />
            ) : null}

            {/* Open Graph */}
            {title ? (
                <meta key="og:title" property="og:title" content={title} />
            ) : null}
            {description ? (
                <meta
                    key="og:description"
                    property="og:description"
                    content={description}
                />
            ) : null}
            <meta key="og:type" property="og:type" content={type} />
            {siteName ? (
                <meta
                    key="og:site_name"
                    property="og:site_name"
                    content={siteName}
                />
            ) : null}
            {pageUrl ? (
                <meta key="og:url" property="og:url" content={pageUrl} />
            ) : null}
            {ogImage ? (
                <meta key="og:image" property="og:image" content={ogImage} />
            ) : null}
            {locale ? (
                <meta key="og:locale" property="og:locale" content={locale} />
            ) : null}
            {publishedTime ? (
                <meta
                    key="article:published_time"
                    property="article:published_time"
                    content={publishedTime}
                />
            ) : null}
            {modifiedTime ? (
                <meta
                    key="article:modified_time"
                    property="article:modified_time"
                    content={modifiedTime}
                />
            ) : null}

            {/* Twitter */}
            <meta
                key="twitter:card"
                name="twitter:card"
                content={twitterCard}
            />
            {twitterSite ? (
                <meta
                    key="twitter:site"
                    name="twitter:site"
                    content={twitterSite}
                />
            ) : null}
            {title ? (
                <meta
                    key="twitter:title"
                    name="twitter:title"
                    content={title}
                />
            ) : null}
            {description ? (
                <meta
                    key="twitter:description"
                    name="twitter:description"
                    content={description}
                />
            ) : null}
            {ogImage ? (
                <meta
                    key="twitter:image"
                    name="twitter:image"
                    content={ogImage}
                />
            ) : null}
            {author ? (
                <meta key="author" name="author" content={author} />
            ) : null}

            {/* Basic app/site hints */}
            {siteName ? (
                <meta
                    key="application-name"
                    name="application-name"
                    content={siteName}
                />
            ) : null}
            {baseUrl ? (
                <meta
                    key="og:base"
                    property="rentro:base_url"
                    content={baseUrl}
                />
            ) : null}
        </Head>
    );
}
