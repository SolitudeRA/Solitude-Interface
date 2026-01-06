import { getGhostClient } from '@api/clients/ghost';
import { handleApiError } from '@api/utils/errorHandlers';
import { getCache, setCache } from '@api/utils/cache';
import type { SiteInformation } from '@api/ghost/types';

const DEFAULT_FIELDS =
    'title,description,logo,icon,cover_image,twitter,timezone,navigation';

/**
 * 获取站点信息
 * @param fields 要获取的字段
 */
export async function getSiteInformation(
    fields: string = DEFAULT_FIELDS,
): Promise<SiteInformation> {
    const cacheKey = `site_information:${fields}`;

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
            logoUrl: siteInformation.logo?.toString() || '',
            coverImageUrl: siteInformation.cover_image || null,
        };
    } catch (error) {
        console.error('Failed to initialize site data:', error);
        return {
            siteTitle: 'Solitude',
            siteDescription: 'Failed to initialize site data',
            logoUrl: '',
            coverImageUrl: null,
        };
    }
}
