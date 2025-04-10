import { GhostAPIClient } from '@api/clients/ghost';
import { adaptToResourceWorkers } from '@api/adapters/cloudflare';
import { handleApiError } from '@api/utils/errorHandlers';
import { withCache } from '@api/utils/cache';

interface SiteInformationResponse {
    settings: SiteInformation;
}

export interface SiteInformation {
    title: string;
    description: string;
    logo: URL;
    icon: URL;
    cover_image: URL;
    twitter: string;
    timezone: string;
    navigation?: SiteNavigation[];
}

export interface SiteNavigation {
    label: string;
    url: URL;
}

const DEFAULT_FIELDS =
    'title,description,logo,icon,cover_image,twitter,timezone,navigation';

/**
 * Ghost站点设置服务类
 * 使用高阶函数缓存站点数据
 */
export class SiteService {
    private ghostApiClient: GhostAPIClient;
    
    constructor() {
        this.ghostApiClient = new GhostAPIClient();
    }
    
    /**
     * 获取站点信息的原始方法
     * @param fields 需要获取的字段
     * @returns 站点信息对象
     */
    private async _getSiteInformation(
        fields: string = DEFAULT_FIELDS,
    ): Promise<SiteInformation> {
        try {
            const response = await this.ghostApiClient.get<SiteInformationResponse>({
                endpoint: '/settings/',
                params: { fields },
            });

            return response.settings;
        } catch (error) {
            return handleApiError(error);
        }
    }
    
    /**
     * 获取站点信息
     * 使用缓存包装函数，默认15分钟缓存
     */
    public getSiteInformation = withCache(
        this._getSiteInformation.bind(this),
        'site_information',
        15 * 60 * 1000 // 15分钟缓存
    );
}

// 创建单例实例
const siteService = new SiteService();

// 向后兼容的函数，保持原有API不变
export async function getSiteInformation(
    fields: string = DEFAULT_FIELDS,
): Promise<SiteInformation> {
    return siteService.getSiteInformation(fields);
}

export async function initializeSiteData() {
    try {
        // 使用新的siteService实例，自动享有缓存功能
        const siteInformation = await siteService.getSiteInformation();

        return {
            siteTitle: siteInformation.title,
            siteDescription: siteInformation.description,
            logoUrl: adaptToResourceWorkers(siteInformation.logo).toString(),
            coverImageUrl: adaptToResourceWorkers(siteInformation.cover_image),
        };
    } catch (error) {
        console.error('Failed to initialize site data:', error);
        return {
            siteTitle: 'Error',
            siteDescription: 'Failed to initialize site data',
            logoUrl: '',
            coverImageUrl: new URL('https://example.com/default-cover.jpg'),
        };
    }
}
