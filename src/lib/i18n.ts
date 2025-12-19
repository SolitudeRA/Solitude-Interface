import type { PostTag } from '@api/ghost/types';

/**
 * 支持的语言列表
 */
export const LOCALES = ['zh', 'ja', 'en'] as const;

/**
 * 语言类型
 */
export type Locale = (typeof LOCALES)[number];

/**
 * 默认语言
 */
export const DEFAULT_LOCALE: Locale = 'zh';

/**
 * Ghost internal tag 前缀
 * Ghost Content API 中 internal tag (#xxx) 的 slug 会变成 hash-xxx
 */
const LANG_TAG_PREFIX = 'hash-lang-';
const I18N_TAG_PREFIX = 'hash-i18n-';

/**
 * 语言名称映射（用于 UI 显示）
 */
export const LOCALE_NAMES: Record<Locale, string> = {
    zh: '中文',
    ja: '日本語',
    en: 'English',
};

/**
 * 语言 HTML lang 属性映射
 */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
    zh: 'zh-CN',
    ja: 'ja',
    en: 'en',
};

/**
 * 检查是否为有效的语言代码
 */
export function isLocale(x: unknown): x is Locale {
    return typeof x === 'string' && LOCALES.includes(x as Locale);
}

/**
 * 将语言代码转换为 Ghost tag slug 格式
 * @example localeToLangTag('en') => 'hash-lang-en'
 */
export function localeToLangTag(locale: Locale): string {
    return `${LANG_TAG_PREFIX}${locale}`;
}

/**
 * 将翻译组 key 转换为 Ghost tag slug 格式
 * @example i18nKeyToTag('intro-to-solitude') => 'hash-i18n-intro-to-solitude'
 */
export function i18nKeyToTag(key: string): string {
    return `${I18N_TAG_PREFIX}${key}`;
}

/**
 * 从 Ghost tag slug 中提取语言代码
 * @example extractLocaleFromTagSlug('hash-lang-ja') => 'ja'
 */
export function extractLocaleFromTagSlug(slug: string): Locale | null {
    if (!slug.startsWith(LANG_TAG_PREFIX)) {
        return null;
    }
    const locale = slug.replace(LANG_TAG_PREFIX, '');
    return isLocale(locale) ? locale : null;
}

/**
 * 从 Ghost tag slug 中提取翻译组 key
 * @example extractI18nKeyFromTagSlug('hash-i18n-intro-to-solitude') => 'intro-to-solitude'
 */
export function extractI18nKeyFromTagSlug(slug: string): string | null {
    if (!slug.startsWith(I18N_TAG_PREFIX)) {
        return null;
    }
    return slug.replace(I18N_TAG_PREFIX, '');
}

/**
 * 从文章的 tags 数组中提取语言代码
 */
export function extractLocaleFromTags(tags: PostTag[] | undefined): Locale | null {
    if (!tags?.length) {
        return null;
    }

    for (const tag of tags) {
        const locale = extractLocaleFromTagSlug(tag.slug);
        if (locale) {
            return locale;
        }
    }

    return null;
}

/**
 * 从文章的 tags 数组中提取翻译组 key
 */
export function extractI18nKey(tags: PostTag[] | undefined): string | null {
    if (!tags?.length) {
        return null;
    }

    for (const tag of tags) {
        const key = extractI18nKeyFromTagSlug(tag.slug);
        if (key) {
            return key;
        }
    }

    return null;
}

/**
 * 构建多语言路由路径
 */
export function buildLocalePath(locale: Locale, path: string = ''): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${locale}/${normalizedPath}`.replace(/\/+$/, '') || `/${locale}`;
}

/**
 * 构建文章详情页路径
 */
export function buildPostPath(locale: Locale, key: string): string {
    return `/${locale}/p/${key}`;
}

/**
 * 生成 hreflang alternate links 数据
 */
export interface AlternateLink {
    hreflang: string;
    href: string;
}

export function generateAlternateLinks(
    siteUrl: string,
    path: string,
    availableLocales: readonly Locale[],
): AlternateLink[] {
    const links: AlternateLink[] = [];

    for (const locale of availableLocales) {
        links.push({
            hreflang: LOCALE_HTML_LANG[locale],
            href: `${siteUrl}/${locale}${path}`,
        });
    }

    // 添加 x-default，指向默认语言
    if (availableLocales.includes(DEFAULT_LOCALE)) {
        links.push({
            hreflang: 'x-default',
            href: `${siteUrl}/${DEFAULT_LOCALE}${path}`,
        });
    }

    return links;
}

/**
 * 获取 fallback 提示消息
 */
export function getFallbackMessage(requestedLocale: Locale, displayedLocale: Locale): string {
    const messages: Record<Locale, Record<Locale, string>> = {
        zh: {
            zh: '',
            ja: '该文章暂无日文版本，已显示中文版',
            en: '该文章暂无英文版本，已显示中文版',
        },
        ja: {
            zh: 'この記事の日本語版はまだありません。中国語版を表示しています。',
            ja: '',
            en: 'この記事の日本語版はまだありません。英語版を表示しています。',
        },
        en: {
            zh: 'This article is not yet available in English. Showing Chinese version.',
            ja: 'This article is not yet available in English. Showing Japanese version.',
            en: '',
        },
    };

    // messages[requestedLocale][displayedLocale] 表示用户请求的语言下，显示的是哪个语言的提示
    return messages[requestedLocale]?.[displayedLocale] ?? '';
}
