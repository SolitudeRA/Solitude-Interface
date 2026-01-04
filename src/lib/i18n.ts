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
export function extractLocaleFromTags(
    tags: PostTag[] | undefined,
): Locale | null {
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
export function getFallbackMessage(
    requestedLocale: Locale,
    displayedLocale: Locale,
): string {
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

/**
 * 多语言文章过滤结果
 */
export interface LocalizedPost<
    T extends { tags?: PostTag[]; published_at: string },
> {
    post: T;
    locale: Locale | null;
    i18nKey: string | null;
    isFallback: boolean;
}

/**
 * 过滤多语言文章列表
 *
 * 规则：
 * 1. 优先显示当前语言版本的文章
 * 2. 如果同一组文章（相同 i18n key）没有当前语言版本，显示其他语言版本
 * 3. 没有 i18n key 的文章，如果是当前语言或无语言标记，则显示
 * 4. 按发布日期从最新开始排序
 *
 * @param posts 原始文章列表
 * @param currentLocale 当前语言
 * @returns 过滤后的文章列表（带有 fallback 标记）
 */
export function filterPostsByLocale<
    T extends { tags?: PostTag[]; published_at: string },
>(posts: T[], currentLocale: Locale): LocalizedPost<T>[] {
    // 按 i18n key 分组文章
    const i18nGroups = new Map<string, T[]>();
    const standalonePostsCurrentLocale: T[] = [];
    const standalonePostsNoLocale: T[] = [];

    for (const post of posts) {
        const i18nKey = extractI18nKey(post.tags);
        const postLocale = extractLocaleFromTags(post.tags);

        if (i18nKey) {
            // 有 i18n key 的文章，按 key 分组
            const group = i18nGroups.get(i18nKey) || [];
            group.push(post);
            i18nGroups.set(i18nKey, group);
        } else {
            // 没有 i18n key 的独立文章
            if (postLocale === currentLocale) {
                standalonePostsCurrentLocale.push(post);
            } else if (postLocale === null) {
                // 没有语言标记的文章也显示
                standalonePostsNoLocale.push(post);
            }
            // 其他语言的独立文章不显示（因为没有 i18n key，无法确定是同一篇文章）
        }
    }

    const result: LocalizedPost<T>[] = [];

    // 处理有 i18n key 的文章组
    for (const [i18nKey, groupPosts] of i18nGroups) {
        // 先找当前语言版本
        const currentLocalePost = groupPosts.find(
            (p) => extractLocaleFromTags(p.tags) === currentLocale,
        );

        if (currentLocalePost) {
            result.push({
                post: currentLocalePost,
                locale: currentLocale,
                i18nKey,
                isFallback: false,
            });
        } else {
            // 没有当前语言版本，选择第一个可用的版本（按发布日期最新的）
            const sortedGroupPosts = [...groupPosts].sort(
                (a, b) =>
                    new Date(b.published_at).getTime() -
                    new Date(a.published_at).getTime(),
            );
            const fallbackPost = sortedGroupPosts[0];
            if (fallbackPost) {
                result.push({
                    post: fallbackPost,
                    locale: extractLocaleFromTags(fallbackPost.tags),
                    i18nKey,
                    isFallback: true,
                });
            }
        }
    }

    // 添加当前语言的独立文章
    for (const post of standalonePostsCurrentLocale) {
        result.push({
            post,
            locale: currentLocale,
            i18nKey: null,
            isFallback: false,
        });
    }

    // 添加没有语言标记的独立文章
    for (const post of standalonePostsNoLocale) {
        result.push({
            post,
            locale: null,
            i18nKey: null,
            isFallback: false,
        });
    }

    // 按发布日期排序（最新的在前）
    result.sort(
        (a, b) =>
            new Date(b.post.published_at).getTime() -
            new Date(a.post.published_at).getTime(),
    );

    return result;
}
