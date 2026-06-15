import type { PostTag } from '@api/ghost/types';
import {
    type Locale,
    type PostIdentitySource,
    DEFAULT_LOCALE,
    LOCALE_HTML_LANG,
    extractI18nKey,
    extractI18nKeyFromPost,
    extractLocaleFromPost,
    extractLocaleFromTags,
} from './i18nCore';

/**
 * i18n 路由:多语言路径与文章详情页路径构建、hreflang alternate links。
 * 仅依赖 i18nCore(单向),由 i18n.ts 统一再导出。
 */

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
