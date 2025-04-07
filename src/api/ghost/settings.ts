import { GhostAPIClient } from '@api/clients/ghost';
import { adaptToResourceWorkers } from '@api/adapters/cloudflare';
import { handleApiError } from '@api/utils/errorHandlers';

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

const ghostApiClient = new GhostAPIClient();

export async function getSiteInformation(
    fields: string = DEFAULT_FIELDS,
): Promise<SiteInformation> {
    try {
        const response = await ghostApiClient.get<SiteInformationResponse>({
            endpoint: '/settings/',
            params: { fields },
        });

        return response.settings;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function initializeSiteData() {
    try {
        const siteInformation = await getSiteInformation();

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
