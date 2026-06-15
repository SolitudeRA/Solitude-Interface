import { getGhostClient } from '@api/clients/ghost';
import { handleApiError } from '@api/utils/errorHandlers';
import { getCache, setCache } from '@api/utils/cache';
import { CACHE_KEYS } from '@api/utils/cacheKeys';
import type { SiteInformation } from '@api/ghost/types';

const DEFAULT_FIELDS = 'title,description,logo,icon,cover_image,twitter,timezone,navigation';

/**
 * 获取站点信息
 * @param fields 要获取的字段
 */
export async function getSiteInformation(
    fields: string = DEFAULT_FIELDS
): Promise<SiteInformation> {
    const cacheKey = CACHE_KEYS.siteInformation(fields);

    const cached = getCache<SiteInformation>(cacheKey);
    if (cached !== undefined) {
        return cached;
    }

    try {
        const response = await getGhostClient().get<{
            settings: SiteInformation;
        }>({
            endpoint: '/settings/',
            params: { fields },
        });

        setCache(cacheKey, response.settings);

        return response.settings;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * 初始化站点数据
 * 用于在页面加载时获取基础站点信息
 */
export async function initializeSiteData() {
    try {
        const siteInformation = await getSiteInformation();

        if (!siteInformation) {
            throw new Error('Site information is undefined');
        }

        return {
            siteTitle: siteInformation.title || 'Solitude',
            siteDescription: siteInformation.description || '',
            logoUrl: siteInformation.logo || '',
            coverImageUrl: siteInformation.cover_image || null,
        };
    } catch (error) {
        // fail loud:生产构建时关键站点数据缺失应中止构建(与 posts.ts 的 fail-fast 一致),
        // 而非静默发布带占位标题的「看似正常」站点,掩盖 Ghost 故障、延误定位。
        // 开发环境则保留降级回退以便本地无 Ghost 时仍可运行。
        const isProdBuild = (() => {
            try {
                return import.meta.env?.PROD ?? false;
            } catch {
                return false;
            }
        })();

        if (isProdBuild) {
            console.error('[settings] 站点数据初始化失败,中止生产构建:', error);
            throw error instanceof Error ? error : new Error('Failed to initialize site data');
        }

        console.error('[settings] 站点数据初始化失败,开发环境降级回退:', error);
        return {
            siteTitle: 'Solitude',
            siteDescription: 'Failed to initialize site data',
            logoUrl: '',
            coverImageUrl: null,
        };
    }
}
