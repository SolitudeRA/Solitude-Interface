import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { listPostsByLocale } from '@api/ghost/posts';
import { getSiteInformation } from '@api/ghost/settings';
import type { Post } from '@api/ghost/types';
import { type Locale, LOCALES, isLocale, LOCALE_NAMES } from '@lib/i18n';
import { SITE_URL } from 'astro:env/server';

/**
 * 生成多语言 RSS 静态路径
 */
export function getStaticPaths() {
    return LOCALES.map((lang) => ({
        params: { lang },
    }));
}

/**
 * 生成指定语言的 RSS Feed
 */
export async function GET(context: APIContext) {
    const { lang } = context.params;

    // 验证语言参数
    if (!lang || !isLocale(lang)) {
        return new Response('Invalid language', { status: 400 });
    }

    const locale = lang as Locale;

    // 获取站点设置和文章
    const [siteInfo, posts] = await Promise.all([
        getSiteInformation(),
        listPostsByLocale(locale, { limit: 50 }),
    ]);

    // 使用环境变量中的 SITE_URL，或者 context.site
    const siteUrl = (SITE_URL || context.site?.toString() || '').replace(/\/$/, '');
    const languageName = LOCALE_NAMES[locale];

    if (!siteUrl) {
        return new Response('SITE_URL environment variable is required', {
            status: 500,
        });
    }

    return rss({
        title: `${siteInfo.title} (${languageName})`,
        description: siteInfo.description || `${siteInfo.title} RSS Feed`,
        site: siteUrl,
        // 链接直接复用 adapter 构建的 post.url(单一来源,含 i18nKey→/p/ 或旧帖→/posts/ 的正确路由)
        items: posts.map((post: Post) => ({
            title: post.title,
            pubDate: new Date(post.published_at),
            description: post.excerpt || '',
            link: post.url.toString(),
        })),
        customData: `<language>${locale}</language>`,
    });
}
