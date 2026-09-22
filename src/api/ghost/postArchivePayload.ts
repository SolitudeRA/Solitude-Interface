import { getImage } from 'astro:assets';
import { listAllPosts } from '@api/ghost/posts';
import { getTagRegistry } from '@api/ghost/tagRegistry';
import { getRemoteImageDimensions } from '@lib/remoteImageDimensions';
import { buildPostSearchKey, extractFacets } from '@lib/postBrowse';
import type {
    ArchiveSeriesMetadataMap,
    PostArchiveItem,
    PostArchivePayload,
} from '@lib/postArchive';
import { filterPostsByLocale, type Locale } from '@lib/i18n';
import { getTagDescription, getTagLabel } from '@lib/tagRegistry';

const ARCHIVE_IMAGE_WIDTHS = [320, 480, 640, 960] as const;

function getArchiveImageWidths(sourceWidth: number): number[] {
    const widths: number[] = ARCHIVE_IMAGE_WIDTHS.filter((width) => width <= sourceWidth);
    if (widths.length === 0) return [sourceWidth];
    if (widths.at(-1) !== sourceWidth && sourceWidth < ARCHIVE_IMAGE_WIDTHS.at(-1)!) {
        widths.push(sourceWidth);
    }
    return widths;
}

export async function buildPostArchivePayload(locale: Locale): Promise<PostArchivePayload> {
    const allPosts = await listAllPosts();
    const posts = filterPostsByLocale(allPosts, locale).map((item) => item.post);
    const tagRegistry = await getTagRegistry();
    const seriesMetadata: ArchiveSeriesMetadataMap = {};

    posts.forEach((post) => {
        const slug = post.post_series_slug?.trim();
        if (!slug || seriesMetadata[slug]) return;
        const registryEntry = tagRegistry[slug];
        const seriesTag = post.tags?.find((tag) => tag.slug === slug);
        const description =
            getTagDescription(slug, locale, tagRegistry) || seriesTag?.description?.trim() || '';

        seriesMetadata[slug] = {
            label: getTagLabel(slug, locale, seriesTag?.name, tagRegistry),
            ...(description ? { description } : {}),
            ...(registryEntry?.order !== undefined ? { order: registryEntry.order } : {}),
            ...(registryEntry?.color ? { color: registryEntry.color } : {}),
        };
    });

    const archivePosts: PostArchiveItem[] = await Promise.all(
        posts.map(async (post) => {
            const featureImageUrl = post.feature_image?.toString() ?? null;
            const featureImageDimensions = featureImageUrl
                ? await getRemoteImageDimensions(featureImageUrl)
                : null;
            const featureImage =
                featureImageUrl && featureImageDimensions
                    ? await getImage({
                          src: featureImageUrl,
                          width: featureImageDimensions.width,
                          height: featureImageDimensions.height,
                          widths: getArchiveImageWidths(featureImageDimensions.width),
                          format: 'webp',
                          quality: 74,
                      })
                    : null;
            const item: PostArchiveItem = {
                id: post.id,
                title: post.title,
                excerpt: post.excerpt,
                url: post.url.pathname,
                feature_image: featureImage?.src ?? featureImageUrl,
                ...(featureImage?.srcSet.attribute
                    ? {
                          feature_image_srcset: featureImage.srcSet.attribute,
                          feature_image_sizes:
                              '(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) 48vw, 35vw',
                      }
                    : {}),
                published_at: post.published_at,
                post_type: post.post_type,
                post_category: post.post_category,
                post_series: post.post_series,
                ...(post.post_series_slug ? { post_series_slug: post.post_series_slug } : {}),
                ...(post.post_series_label ? { post_series_label: post.post_series_label } : {}),
                ...(post.post_series_number ? { post_series_number: post.post_series_number } : {}),
                ...(post.post_type_label ? { post_type_label: post.post_type_label } : {}),
                ...(post.post_category_label
                    ? { post_category_label: post.post_category_label }
                    : {}),
            };
            item.search_key = buildPostSearchKey(item);
            return item;
        })
    );

    return {
        version: 1,
        posts: archivePosts,
        facets: extractFacets(archivePosts),
        seriesMetadata,
    };
}
