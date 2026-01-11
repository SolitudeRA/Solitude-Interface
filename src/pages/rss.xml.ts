import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { listAllPosts } from '@api/ghost/posts';
import { getSiteInformation } from '@api/ghost/settings';
import type { Post } from '@api/ghost/types';
import {
    extractI18nKey,
    extractLocaleFromTags,
    DEFAULT_LOCALE,
} from '@lib/i18n';
import { SITE_URL } from 'astro:env/server';

/**
 * 生成聚合 RSS Feed（包含所有语言的文章）
 */
export async function GET(context: APIContext) {
    // 获取站点设置和所有文章
    const [siteInfo, posts] = await Promise.all([
        getSiteInformation(),
        listAllPosts({ limit: 100 }),
    ]);

    // 使用环境变量中的 SITE_URL，或者 context.site
    const siteUrl = (SITE_URL || context.site?.toString() || '').replace(
        /\/$/,
        '',
    );

    if (!siteUrl) {
        return new Response('SITE_URL environment variable is required', {
            status: 500,
        });
    }

    return rss({
        title: `${siteInfo.title} (All Languages)`,
        description:
            siteInfo.description ||
            `${siteInfo.title} RSS Feed - All Languages`,
        site: siteUrl,
        items: posts.map((post: Post) => {
            // 提取文章的语言和 i18n key
            const postLocale =
                extractLocaleFromTags(post.tags) || DEFAULT_LOCALE;
            const i18nKey = extractI18nKey(post.tags);
            // 使用 i18n key 或者从 URL 提取 slug
            const postSlug =
                i18nKey || post.url.toString().split('/').filter(Boolean).pop();
            const postPath = `/${postLocale}/p/${postSlug}`;

            return {
                title: post.title,
                pubDate: new Date(post.published_at),
                description: post.excerpt || '',
                link: `${siteUrl}${postPath}`,
            };
        }),
        customData: `<language>mul</language>`, // mul = multiple languages
    });
}
