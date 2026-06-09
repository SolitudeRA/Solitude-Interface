import { getGhostClient } from '@api/clients/ghost';
import { getCache, setCache } from '@api/utils/cache';
import {
    mergeTagRegistryPages,
    parseTagRegistryPage,
    TAG_REGISTRY_PAGE_SLUGS,
    type TagRegistry,
    type TagRegistryPageSource,
} from '@lib/tagRegistry';

const TAG_REGISTRY_CACHE_KEY = 'tag_registry';

interface GhostPagesResponse {
    pages?: TagRegistryPageSource[];
}

export async function getTagRegistry(): Promise<TagRegistry> {
    const cachedRegistry = getCache<TagRegistry>(TAG_REGISTRY_CACHE_KEY);
    if (cachedRegistry !== undefined) {
        return cachedRegistry;
    }

    const response = await getGhostClient().get<GhostPagesResponse>({
        endpoint: '/pages/',
        params: {
            filter: `slug:[${TAG_REGISTRY_PAGE_SLUGS.join(',')}]`,
            fields: 'slug,html',
            limit: 'all',
        },
    });

    const pages = response.pages ?? [];
    const foundSlugs = new Set(pages.map((page) => page.slug));
    const missingSlugs = TAG_REGISTRY_PAGE_SLUGS.filter((slug) => !foundSlugs.has(slug));

    if (missingSlugs.length > 0) {
        console.warn(`[TagRegistry] Missing Ghost registry pages: ${missingSlugs.join(', ')}`);
    }

    const registry = mergeTagRegistryPages(pages.map(parseTagRegistryPage));
    setCache(TAG_REGISTRY_CACHE_KEY, registry);

    return registry;
}
