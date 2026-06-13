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

export const LOCALE_FLAGS: Record<Locale, string> = {
    zh: '🇨🇳',
    ja: '🇯🇵',
    en: '🇺🇸',
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
 * UI 文本翻译字典
 */
export const UI_TEXTS = {
    home: {
        viewAllPosts: {
            zh: '查看全部文章',
            ja: 'すべての記事を見る',
            en: 'View All Posts',
        },
        exploreMore: {
            zh: '探索更多内容',
            ja: 'もっと探索する',
            en: 'Explore more content',
        },
        noPosts: {
            zh: '暂无文章',
            ja: '記事はまだありません',
            en: 'No posts yet',
        },
    },
    nav: {
        home: {
            zh: '首页',
            ja: 'ホーム',
            en: 'Home',
        },
        posts: {
            zh: '文章',
            ja: '記事',
            en: 'Posts',
        },
        about: {
            zh: '关于',
            ja: 'プロフィール',
            en: 'About',
        },
        aboutMe: {
            zh: '关于我',
            ja: 'プロフィール',
            en: 'About Me',
        },
        contact: {
            zh: '联系',
            ja: '連絡先',
            en: 'Contact',
        },
        privacy: {
            zh: '隐私',
            ja: 'プライバシー',
            en: 'Privacy',
        },
        privacyPolicy: {
            zh: '隐私政策',
            ja: 'プライバシーポリシー',
            en: 'Privacy Policy',
        },
    },
    rss: {
        label: {
            zh: 'RSS',
            ja: 'RSS',
            en: 'RSS',
        },
        allLanguages: {
            zh: '全部语言',
            ja: 'すべての言語',
            en: 'All Languages',
        },
        current: {
            zh: '当前',
            ja: '現在',
            en: 'Current',
        },
    },
} as const;

/**
 * 获取 UI 翻译文本
 * @param section 文本分组 (如 'home')
 * @param key 文本键名
 * @param locale 目标语言
 * @returns 翻译后的文本
 */
export function getUIText<S extends keyof typeof UI_TEXTS>(
    section: S,
    key: keyof (typeof UI_TEXTS)[S],
    locale: Locale
): string {
    const texts = UI_TEXTS[section][key] as Record<Locale, string>;
    return texts[locale] ?? texts[DEFAULT_LOCALE];
}

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

export interface PostIdentitySource {
    slug?: string | null;
    tags?: PostTag[];
}

export interface PostSlugIdentity {
    locale: Locale;
    i18nKey: string;
}

/**
 * 从 Ghost post slug 中提取文章身份。
 * 约定：`{locale}-{key}`，例如 ja-homeserver-8 -> locale=ja, i18nKey=homeserver-8。
 *
 * ⚠️ 取舍（有意设计）：`zh-` / `ja-` / `en-` 是**保留 slug 前缀**。任何以合法语言代码加连字符
 * 开头的 slug 都会被解析为该语言的多语言文章——即使它没有 #lang-* / #i18n-* 标签。因此普通
 * （非多语言）文章不应使用以语言代码开头的 slug，否则会被误并入翻译组、生成错误的
 * /{locale}/p/{key} 路由。该保留命名空间约定见 docs/i18n/README，并由 i18n.test.ts 钉住。
 */
export function extractPostSlugIdentity(slug: string | null | undefined): PostSlugIdentity | null {
    const normalizedSlug = slug?.trim().toLowerCase();
    if (!normalizedSlug) {
        return null;
    }

    const [localeCandidate, ...keyParts] = normalizedSlug.split('-');
    if (!isLocale(localeCandidate) || keyParts.length === 0) {
        return null;
    }

    const i18nKey = keyParts.join('-');
    return i18nKey ? { locale: localeCandidate, i18nKey } : null;
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
 * 从 Ghost post slug 中提取语言代码。
 */
export function extractLocaleFromPostSlug(slug: string | null | undefined): Locale | null {
    return extractPostSlugIdentity(slug)?.locale ?? null;
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
 * 从 Ghost post slug 中提取跨语言文章 key。
 */
export function extractI18nKeyFromPostSlug(slug: string | null | undefined): string | null {
    return extractPostSlugIdentity(slug)?.i18nKey ?? null;
}

/**
 * 获取文章语言。语言 tag 仍是主来源，slug 里的语言只作为 fallback。
 */
export function extractLocaleFromPost(post: PostIdentitySource): Locale | null {
    return extractLocaleFromTags(post.tags) ?? extractLocaleFromPostSlug(post.slug);
}

/**
 * 获取跨语言文章 key。新格式优先从 Ghost slug 解析，旧 #i18n-* tag 作为兼容 fallback。
 */
export function extractI18nKeyFromPost(post: PostIdentitySource): string | null {
    return extractI18nKeyFromPostSlug(post.slug) ?? extractI18nKey(post.tags);
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
 * 根据 Ghost 文章标签构建前端文章路径。
 * 缺少 i18n 分组标签时回退到旧的 /posts/:id 路由，保留兼容性。
 */
export function buildPostPathFromTags(postId: string, tags: PostTag[] | undefined): string {
    const i18nKey = extractI18nKey(tags);
    if (!i18nKey) {
        return `/posts/${postId}`;
    }

    const locale = extractLocaleFromTags(tags) ?? DEFAULT_LOCALE;
    return buildPostPath(locale, i18nKey);
}

/**
 * 根据 Ghost post slug 和标签构建前端文章路径。
 * 新格式优先从 slug 读取跨语言文章 key，旧 #i18n-* tag 作为 fallback。
 */
export function buildPostPathFromPost(post: { id: string } & PostIdentitySource): string {
    const i18nKey = extractI18nKeyFromPost(post);
    if (!i18nKey) {
        return `/posts/${post.id}`;
    }

    const locale = extractLocaleFromPost(post) ?? DEFAULT_LOCALE;
    return buildPostPath(locale, i18nKey);
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
    availableLocales: readonly Locale[]
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
            ja: '该文章暂无中文版本，已显示日文版',
            en: '该文章暂无中文版本，已显示英文版',
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
export interface LocalizedPost<T extends { tags?: PostTag[]; published_at: string }> {
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
    T extends { slug?: string | null; tags?: PostTag[]; published_at: string },
>(posts: T[], currentLocale: Locale): LocalizedPost<T>[] {
    // 按 i18n key 分组文章
    const i18nGroups = new Map<string, T[]>();
    const standalonePostsCurrentLocale: T[] = [];
    const standalonePostsNoLocale: T[] = [];

    for (const post of posts) {
        const i18nKey = extractI18nKeyFromPost(post);
        const postLocale = extractLocaleFromPost(post);

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
            (p) => extractLocaleFromPost(p) === currentLocale
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
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            );
            const fallbackPost = sortedGroupPosts[0];
            if (fallbackPost) {
                result.push({
                    post: fallbackPost,
                    locale: extractLocaleFromPost(fallbackPost),
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
        (a, b) => new Date(b.post.published_at).getTime() - new Date(a.post.published_at).getTime()
    );

    return result;
}
