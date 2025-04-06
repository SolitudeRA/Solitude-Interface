import {ProxyWorkers} from "api/utilities";
import {GhostAPIClient} from "../clients/ghost";
import type {AxiosError} from "axios";

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
}

export interface SiteNavigation {
    label: string;
    url: URL;
}

const ghostApiClient = new GhostAPIClient();

export async function getSiteInformation(fields: string = "title,description,logo,icon,cover_image,twitter,timezone,navigation"): Promise<SiteInformation> {
    try {
        const response = await ghostApiClient
            .get<SiteInformationResponse>({
                                              endpoint: "/settings/",
                                              params: {fields}
                                          });
        return response.settings;
    } catch (error) {
        handleError(error);
    }
}

export async function initializeSiteData() {
    const siteInformation = await getSiteInformation();
    const utilities = new ProxyWorkers();
    return {
        siteTitle: siteInformation.title,
        siteDescription: siteInformation.description,
        logoUrl: utilities.convertToWorkersUrl(siteInformation.logo).toString(),
        coverImageUrl: utilities.convertToWorkersUrl(siteInformation.cover_image),
    }
}

function handleError(error: any): never {
    if (error.isAxiosError) {
        const axiosError = error as AxiosError;
        console.error("API Error:", axiosError.response?.data || axiosError.message);
    } else {
        console.error("Unexpected Error:", error.message);
    }
    throw error;
}