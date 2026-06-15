import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { listAllPosts } from '@api/ghost/posts';
import { getSiteInformation } from '@api/ghost/settings';
import type { Post } from '@api/ghost/types';
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
    const siteUrl = (SITE_URL || context.site?.toString() || '').replace(/\/$/, '');

    if (!siteUrl) {
        return new Response('SITE_URL environment variable is required', {
            status: 500,
        });
    }

    return rss({
        title: `${siteInfo.title} (All Languages)`,
        description: siteInfo.description || `${siteInfo.title} RSS Feed - All Languages`,
        site: siteUrl,
        // 链接直接复用 adapter 构建的 post.url(单一来源,含正确的 /p/ 或 /posts/ 路由)
        items: posts.map((post: Post) => ({
            title: post.title,
            pubDate: new Date(post.published_at),
            description: post.excerpt || '',
            link: post.url.toString(),
        })),
        customData: `<language>mul</language>`, // mul = multiple languages
    });
}
