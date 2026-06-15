import type { PostTag } from '@api/ghost/types';
import { type Locale, extractI18nKeyFromPost, extractLocaleFromPost } from './i18nCore';

/**
 * i18n 过滤:fallback 提示文案、多语言文章列表去重/降级。
 * 仅依赖 i18nCore(单向),由 i18n.ts 统一再导出。
 */

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
