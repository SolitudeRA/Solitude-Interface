import { GhostAPIClient } from '@api/clients/ghost';
import { handleApiError } from '@api/utils/errorHandlers';
import { withCache } from '@api/utils/cache';
import type {SiteInformation} from '@api/ghost/types'

const DEFAULT_FIELDS =
    'title,description,logo,icon,cover_image,twitter,timezone,navigation';

export class SiteService {
    private ghostApiClient: GhostAPIClient;
    
    constructor() {
        this.ghostApiClient = new GhostAPIClient();
    }
    
    private async _getSiteInformation(
        fields: string = DEFAULT_FIELDS,
    ): Promise<SiteInformation> {
        try {
            const response = await this.ghostApiClient.get<{ settings: SiteInformation }>({
                endpoint: '/settings/',
                params: { fields },
            });

            return response.settings;
        } catch (error) {
            return handleApiError(error);
        }
    }
    
    public getSiteInformation = withCache(
        this._getSiteInformation.bind(this),
        'site_information',
        15 * 60 * 1000 
    );
}

const siteService = new SiteService();

export async function getSiteInformation(
    fields: string = DEFAULT_FIELDS,
): Promise<SiteInformation> {
    return siteService.getSiteInformation(fields);
}

export async function initializeSiteData() {
    try {
        const siteInformation = await siteService.getSiteInformation();

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
